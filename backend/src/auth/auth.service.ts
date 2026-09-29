import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins

export class AuthService {
  private jwtSecret = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('[FATAL] JWT_SECRET env var must be set and at least 32 characters long. Refusing to start.');
    }
    return secret;
  })();
  private jwtExpiration = '15m'; // Access token
  private refreshExpirationDays = 7; // Refresh token

  constructor(private readonly prisma: PrismaClient) {}

  async login(tenantId: string, email: string, password: string, ipAddress?: string, deviceInfo?: string) {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      }
    });

    if (!user) {
      // Return a generic error to prevent email enumeration
      throw new Error('Invalid credentials');
    }

    if (user.deletedAt) {
      throw new Error('Account disabled');
    }

    // Check lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new Error('Account temporarily locked out due to too many failed attempts');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Increment login attempts
      const attempts = user.loginAttempts + 1;
      let lockoutUntil = null;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockoutUntil }
      });

      // Audit Log
      await this.logAudit(tenantId, user.id, 'AUTH_LOGIN_FAILED', 'User', user.id, 'Failed login attempt', ipAddress);

      throw new Error('Invalid credentials');
    }

    // Reset attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockoutUntil: null }
    });

    const { accessToken, refreshToken } = await this.generateTokens(tenantId, user.id, ipAddress, deviceInfo);

    // Collect permissions for the JWT payload to avoid DB trips on every request
    const permissions = user.roles.flatMap(ur => ur.role.permissions.map(p => p.action));
    const uniquePermissions = [...new Set(permissions)];

    // Audit Log
    await this.logAudit(tenantId, user.id, 'AUTH_LOGIN_SUCCESS', 'User', user.id, 'Successful login', ipAddress);

    return {
      accessToken,
      refreshToken,
      permissions: uniquePermissions,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  async logout(tenantId: string, userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { tenantId, userId, refreshToken }
    });
    await this.logAudit(tenantId, userId, 'AUTH_LOGOUT', 'User', userId, 'User logged out', null);
  }

  async refreshTokens(refreshToken: string, ipAddress?: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken }
    });

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(session.tenantId, session.userId, ipAddress, session.deviceInfo || undefined);
    
    // Invalidate old session
    await this.prisma.session.delete({ where: { id: session.id } });

    return tokens;
  }

  private async generateTokens(tenantId: string, userId: string, ipAddress?: string, deviceInfo?: string) {
    const accessToken = jwt.sign(
      { userId, tenantId },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + this.refreshExpirationDays * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        tenantId,
        userId,
        refreshToken,
        expiresAt,
        ipAddress,
        deviceInfo
      }
    });

    return { accessToken, refreshToken };
  }

  // Simple Audit Logger
  async logAudit(tenantId: string, userId: string | null, action: string, resource: string, resourceId: string | null, details: string, ipAddress?: string | null) {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: ipAddress || null
      }
    });
  }
}
