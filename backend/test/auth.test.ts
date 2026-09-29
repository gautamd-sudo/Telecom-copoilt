import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { AuthzGuard } from '../src/auth/authz.guard';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

describe('Enterprise Authentication & Authorization', () => {
  let prisma: PrismaClient;
  let authService: AuthService;
  let authzGuard: AuthzGuard;
  let tenantA: any;
  let tenantB: any;
  let userA: any; // Network Admin in Tenant A
  let userB: any; // Viewer in Tenant B
  let superAdminA: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    authService = new AuthService(prisma);
    authzGuard = new AuthzGuard(prisma);

    // Clean up
    await prisma.session.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.auditLog.deleteMany();

    // 1. Create Tenants
    tenantA = await prisma.tenant.create({ data: { name: 'Tenant A' } });
    tenantB = await prisma.tenant.create({ data: { name: 'Tenant B' } });

    // 2. Create Roles and Permissions for Tenant A
    const adminRoleA = await prisma.role.create({ data: { name: 'Network Administrator', tenantId: tenantA.id } });
    await prisma.permission.createMany({
      data: [
        { action: 'network.read', resource: 'Network', roleId: adminRoleA.id, tenantId: tenantA.id },
        { action: 'network.write', resource: 'Network', roleId: adminRoleA.id, tenantId: tenantA.id }
      ]
    });

    const superAdminRoleA = await prisma.role.create({ data: { name: 'Platform Super Admin', tenantId: tenantA.id } });
    await prisma.permission.create({
      data: { action: '*', resource: 'All', roleId: superAdminRoleA.id, tenantId: tenantA.id }
    });

    // 3. Create Roles for Tenant B
    const viewerRoleB = await prisma.role.create({ data: { name: 'Viewer', tenantId: tenantB.id } });
    await prisma.permission.create({
      data: { action: 'network.read', resource: 'Network', roleId: viewerRoleB.id, tenantId: tenantB.id }
    });

    // 4. Create Users
    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);
    
    userA = await prisma.user.create({
      data: { email: 'admin@tenanta.com', name: 'Admin A', passwordHash, tenantId: tenantA.id }
    });
    await prisma.userRole.create({ data: { userId: userA.id, roleId: adminRoleA.id } });

    superAdminA = await prisma.user.create({
      data: { email: 'super@tenanta.com', name: 'Super Admin', passwordHash, tenantId: tenantA.id }
    });
    await prisma.userRole.create({ data: { userId: superAdminA.id, roleId: superAdminRoleA.id } });

    userB = await prisma.user.create({
      data: { email: 'viewer@tenantb.com', name: 'Viewer B', passwordHash, tenantId: tenantB.id }
    });
    await prisma.userRole.create({ data: { userId: userB.id, roleId: viewerRoleB.id } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    it('should successfully login with correct credentials', async () => {
      const result = await authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.permissions).toContain('network.write');
    });

    it('should fail login with incorrect password and increment attempts', async () => {
      await expect(authService.login(tenantA.id, 'admin@tenanta.com', 'WrongPass')).rejects.toThrow('Invalid credentials');
      
      const user = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(user?.loginAttempts).toBeGreaterThan(0);
    });

    it('should lock out user after 5 failed attempts (brute force protection)', async () => {
      for (let i = 0; i < 4; i++) { // Already failed once above
        await expect(authService.login(tenantA.id, 'admin@tenanta.com', 'WrongPass')).rejects.toThrow('Invalid credentials');
      }
      
      // 6th attempt should return lockout message
      await expect(authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!')).rejects.toThrow('Account temporarily locked out due to too many failed attempts');
      
      // Reset lockout for further tests
      await prisma.user.update({ where: { id: userA.id }, data: { loginAttempts: 0, lockoutUntil: null } });
    });

    it('should isolate tenants during login (Tenant B user cannot login to Tenant A)', async () => {
      await expect(authService.login(tenantA.id, 'viewer@tenantb.com', 'SecurePassword123!')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Session Management & Refresh', () => {
    it('should refresh token successfully', async () => {
      const login = await authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
      const newTokens = await authService.refreshTokens(login.refreshToken);
      
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.refreshToken).not.toEqual(login.refreshToken);
    });

    it('should fail to refresh with invalid or logged-out refresh token', async () => {
      const login = await authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
      await authService.logout(tenantA.id, userA.id, login.refreshToken);
      
      await expect(authService.refreshTokens(login.refreshToken)).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('Authorization & RBAC', () => {
    let tokenA: string;
    let tokenB: string;
    let tokenSuperA: string;

    beforeAll(async () => {
      const loginA = await authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
      tokenA = loginA.accessToken;

      const loginB = await authService.login(tenantB.id, 'viewer@tenantb.com', 'SecurePassword123!');
      tokenB = loginB.accessToken;

      const loginSuperA = await authService.login(tenantA.id, 'super@tenanta.com', 'SecurePassword123!');
      tokenSuperA = loginSuperA.accessToken;
    });

    it('should grant access to Network Admin for network.read and network.write', async () => {
      expect(await authzGuard.authorize(tokenA, ['network.read'])).toBe(true);
      expect(await authzGuard.authorize(tokenA, ['network.write'])).toBe(true);
    });

    it('should deny access to Network Admin for missing permissions', async () => {
      expect(await authzGuard.authorize(tokenA, ['tenant.manage'])).toBe(false);
    });

    it('should restrict Viewer role (role restrictions)', async () => {
      expect(await authzGuard.authorize(tokenB, ['network.read'])).toBe(true);
      expect(await authzGuard.authorize(tokenB, ['network.write'])).toBe(false);
    });

    it('should grant all access to Platform Super Admin', async () => {
      expect(await authzGuard.authorize(tokenSuperA, ['tenant.manage', 'users.manage', 'integrations.manage'])).toBe(true);
    });

    it('should deny access if token is invalid or expired', async () => {
      const expiredToken = jwt.sign({ userId: userA.id, tenantId: tenantA.id }, process.env.JWT_SECRET!, { expiresIn: '-1h' });
      expect(await authzGuard.authorize(expiredToken, ['network.read'])).toBe(false);
      
      expect(await authzGuard.authorize('invalid.jwt.token', ['network.read'])).toBe(false);
    });

    it('should generate audit logs for denied authorization', async () => {
      // Clear logs first
      await prisma.auditLog.deleteMany();

      // Trigger a denial
      await authzGuard.authorize(tokenA, ['incident.manage']);

      // Check log
      const log = await prisma.auditLog.findFirst({ where: { action: 'AUTHZ_DENIED' } });
      expect(log).toBeDefined();
      expect(log?.details).toContain('Missing permission: incident.manage');
    });
  });
});
