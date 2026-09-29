import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

export class AuthzGuard {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtSecret: string = (() => {
      const s = process.env.JWT_SECRET;
      if (!s || s.length < 32) throw new Error('[FATAL] JWT_SECRET not set or too short');
      return s;
    })()
  ) {}

  async authorize(token: string, requiredPermissions: string[]): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; tenantId: string };
      
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
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

      if (!user || user.deletedAt || user.tenantId !== decoded.tenantId) {
        return false; // Unauthorized or tenant mismatch
      }

      const userPermissions = new Set(
        user.roles.flatMap(ur => ur.role.permissions.map(p => p.action))
      );

      // Super Admin has all permissions implicitly or explicitly
      if (userPermissions.has('*')) {
        return true;
      }

      // Check if user has ALL required permissions
      for (const required of requiredPermissions) {
        if (!userPermissions.has(required)) {
          // Audit log unauthorized access attempt
          await this.prisma.auditLog.create({
            data: {
              tenantId: decoded.tenantId,
              userId: user.id,
              action: 'AUTHZ_DENIED',
              resource: 'Endpoint',
              details: `Denied access. Missing permission: ${required}`
            }
          });
          return false;
        }
      }

      return true;
    } catch (e) {
      return false; // Invalid token or expired
    }
  }
}
