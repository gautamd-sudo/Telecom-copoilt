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
exports.AuthService = void 0;
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins
class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.jwtSecret = (() => {
            const secret = process.env.JWT_SECRET;
            if (!secret || secret.length < 32) {
                throw new Error('[FATAL] JWT_SECRET env var must be set and at least 32 characters long. Refusing to start.');
            }
            return secret;
        })();
        this.jwtExpiration = '15m'; // Access token
        this.refreshExpirationDays = 7; // Refresh token
    }
    login(tenantId, email, password, ipAddress, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.prisma.user.findUnique({
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
            const isValid = yield bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                // Increment login attempts
                const attempts = user.loginAttempts + 1;
                let lockoutUntil = null;
                if (attempts >= MAX_LOGIN_ATTEMPTS) {
                    lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                }
                yield this.prisma.user.update({
                    where: { id: user.id },
                    data: { loginAttempts: attempts, lockoutUntil }
                });
                // Audit Log
                yield this.logAudit(tenantId, user.id, 'AUTH_LOGIN_FAILED', 'User', user.id, 'Failed login attempt', ipAddress);
                throw new Error('Invalid credentials');
            }
            // Reset attempts on success
            yield this.prisma.user.update({
                where: { id: user.id },
                data: { loginAttempts: 0, lockoutUntil: null }
            });
            const { accessToken, refreshToken } = yield this.generateTokens(tenantId, user.id, ipAddress, deviceInfo);
            // Collect permissions for the JWT payload to avoid DB trips on every request
            const permissions = user.roles.flatMap(ur => ur.role.permissions.map(p => p.action));
            const uniquePermissions = [...new Set(permissions)];
            // Audit Log
            yield this.logAudit(tenantId, user.id, 'AUTH_LOGIN_SUCCESS', 'User', user.id, 'Successful login', ipAddress);
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
        });
    }
    logout(tenantId, userId, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.session.deleteMany({
                where: { tenantId, userId, refreshToken }
            });
            yield this.logAudit(tenantId, userId, 'AUTH_LOGOUT', 'User', userId, 'User logged out', null);
        });
    }
    refreshTokens(refreshToken, ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.prisma.session.findUnique({
                where: { refreshToken }
            });
            if (!session || session.expiresAt < new Date()) {
                throw new Error('Invalid or expired refresh token');
            }
            // Generate new tokens
            const tokens = yield this.generateTokens(session.tenantId, session.userId, ipAddress, session.deviceInfo || undefined);
            // Invalidate old session
            yield this.prisma.session.delete({ where: { id: session.id } });
            return tokens;
        });
    }
    generateTokens(tenantId, userId, ipAddress, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessToken = jwt.sign({ userId, tenantId }, this.jwtSecret, { expiresIn: '15m' });
            const refreshToken = crypto.randomBytes(40).toString('hex');
            const expiresAt = new Date(Date.now() + this.refreshExpirationDays * 24 * 60 * 60 * 1000);
            yield this.prisma.session.create({
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
        });
    }
    // Simple Audit Logger
    logAudit(tenantId, userId, action, resource, resourceId, details, ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.auditLog.create({
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
        });
    }
}
exports.AuthService = AuthService;
