"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const auth_service_1 = require("../src/auth/auth.service");
const authz_guard_1 = require("../src/auth/authz.guard");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
describe('Enterprise Authentication & Authorization', () => {
    let prisma;
    let authService;
    let authzGuard;
    let tenantA;
    let tenantB;
    let userA; // Network Admin in Tenant A
    let userB; // Viewer in Tenant B
    let superAdminA;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        prisma = new client_1.PrismaClient();
        authService = new auth_service_1.AuthService(prisma);
        authzGuard = new authz_guard_1.AuthzGuard(prisma);
        // Clean up
        yield prisma.session.deleteMany();
        yield prisma.userRole.deleteMany();
        yield prisma.permission.deleteMany();
        yield prisma.role.deleteMany();
        yield prisma.user.deleteMany();
        yield prisma.tenant.deleteMany();
        yield prisma.auditLog.deleteMany();
        // 1. Create Tenants
        tenantA = yield prisma.tenant.create({ data: { name: 'Tenant A' } });
        tenantB = yield prisma.tenant.create({ data: { name: 'Tenant B' } });
        // 2. Create Roles and Permissions for Tenant A
        const adminRoleA = yield prisma.role.create({ data: { name: 'Network Administrator', tenantId: tenantA.id } });
        yield prisma.permission.createMany({
            data: [
                { action: 'network.read', resource: 'Network', roleId: adminRoleA.id, tenantId: tenantA.id },
                { action: 'network.write', resource: 'Network', roleId: adminRoleA.id, tenantId: tenantA.id }
            ]
        });
        const superAdminRoleA = yield prisma.role.create({ data: { name: 'Platform Super Admin', tenantId: tenantA.id } });
        yield prisma.permission.create({
            data: { action: '*', resource: 'All', roleId: superAdminRoleA.id, tenantId: tenantA.id }
        });
        // 3. Create Roles for Tenant B
        const viewerRoleB = yield prisma.role.create({ data: { name: 'Viewer', tenantId: tenantB.id } });
        yield prisma.permission.create({
            data: { action: 'network.read', resource: 'Network', roleId: viewerRoleB.id, tenantId: tenantB.id }
        });
        // 4. Create Users
        const passwordHash = yield bcrypt.hash('SecurePassword123!', 10);
        userA = yield prisma.user.create({
            data: { email: 'admin@tenanta.com', name: 'Admin A', passwordHash, tenantId: tenantA.id }
        });
        yield prisma.userRole.create({ data: { userId: userA.id, roleId: adminRoleA.id } });
        superAdminA = yield prisma.user.create({
            data: { email: 'super@tenanta.com', name: 'Super Admin', passwordHash, tenantId: tenantA.id }
        });
        yield prisma.userRole.create({ data: { userId: superAdminA.id, roleId: superAdminRoleA.id } });
        userB = yield prisma.user.create({
            data: { email: 'viewer@tenantb.com', name: 'Viewer B', passwordHash, tenantId: tenantB.id }
        });
        yield prisma.userRole.create({ data: { userId: userB.id, roleId: viewerRoleB.id } });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.$disconnect();
    }));
    describe('Authentication', () => {
        it('should successfully login with correct credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.permissions).toContain('network.write');
        }));
        it('should fail login with incorrect password and increment attempts', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(authService.login(tenantA.id, 'admin@tenanta.com', 'WrongPass')).rejects.toThrow('Invalid credentials');
            const user = yield prisma.user.findUnique({ where: { id: userA.id } });
            expect(user === null || user === void 0 ? void 0 : user.loginAttempts).toBeGreaterThan(0);
        }));
        it('should lock out user after 5 failed attempts (brute force protection)', () => __awaiter(void 0, void 0, void 0, function* () {
            for (let i = 0; i < 4; i++) { // Already failed once above
                yield expect(authService.login(tenantA.id, 'admin@tenanta.com', 'WrongPass')).rejects.toThrow('Invalid credentials');
            }
            // 6th attempt should return lockout message
            yield expect(authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!')).rejects.toThrow('Account temporarily locked out due to too many failed attempts');
            // Reset lockout for further tests
            yield prisma.user.update({ where: { id: userA.id }, data: { loginAttempts: 0, lockoutUntil: null } });
        }));
        it('should isolate tenants during login (Tenant B user cannot login to Tenant A)', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(authService.login(tenantA.id, 'viewer@tenantb.com', 'SecurePassword123!')).rejects.toThrow('Invalid credentials');
        }));
    });
    describe('Session Management & Refresh', () => {
        it('should refresh token successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const login = yield authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
            const newTokens = yield authService.refreshTokens(login.refreshToken);
            expect(newTokens.accessToken).toBeDefined();
            expect(newTokens.refreshToken).toBeDefined();
            expect(newTokens.refreshToken).not.toEqual(login.refreshToken);
        }));
        it('should fail to refresh with invalid or logged-out refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
            const login = yield authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
            yield authService.logout(tenantA.id, userA.id, login.refreshToken);
            yield expect(authService.refreshTokens(login.refreshToken)).rejects.toThrow('Invalid or expired refresh token');
        }));
    });
    describe('Authorization & RBAC', () => {
        let tokenA;
        let tokenB;
        let tokenSuperA;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            const loginA = yield authService.login(tenantA.id, 'admin@tenanta.com', 'SecurePassword123!');
            tokenA = loginA.accessToken;
            const loginB = yield authService.login(tenantB.id, 'viewer@tenantb.com', 'SecurePassword123!');
            tokenB = loginB.accessToken;
            const loginSuperA = yield authService.login(tenantA.id, 'super@tenanta.com', 'SecurePassword123!');
            tokenSuperA = loginSuperA.accessToken;
        }));
        it('should grant access to Network Admin for network.read and network.write', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(yield authzGuard.authorize(tokenA, ['network.read'])).toBe(true);
            expect(yield authzGuard.authorize(tokenA, ['network.write'])).toBe(true);
        }));
        it('should deny access to Network Admin for missing permissions', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(yield authzGuard.authorize(tokenA, ['tenant.manage'])).toBe(false);
        }));
        it('should restrict Viewer role (role restrictions)', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(yield authzGuard.authorize(tokenB, ['network.read'])).toBe(true);
            expect(yield authzGuard.authorize(tokenB, ['network.write'])).toBe(false);
        }));
        it('should grant all access to Platform Super Admin', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(yield authzGuard.authorize(tokenSuperA, ['tenant.manage', 'users.manage', 'integrations.manage'])).toBe(true);
        }));
        it('should deny access if token is invalid or expired', () => __awaiter(void 0, void 0, void 0, function* () {
            const expiredToken = jwt.sign({ userId: userA.id, tenantId: tenantA.id }, process.env.JWT_SECRET, { expiresIn: '-1h' });
            expect(yield authzGuard.authorize(expiredToken, ['network.read'])).toBe(false);
            expect(yield authzGuard.authorize('invalid.jwt.token', ['network.read'])).toBe(false);
        }));
        it('should generate audit logs for denied authorization', () => __awaiter(void 0, void 0, void 0, function* () {
            // Clear logs first
            yield prisma.auditLog.deleteMany();
            // Trigger a denial
            yield authzGuard.authorize(tokenA, ['incident.manage']);
            // Check log
            const log = yield prisma.auditLog.findFirst({ where: { action: 'AUTHZ_DENIED' } });
            expect(log).toBeDefined();
            expect(log === null || log === void 0 ? void 0 : log.details).toContain('Missing permission: incident.manage');
        }));
    });
});
