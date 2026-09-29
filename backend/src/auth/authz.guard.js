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
exports.AuthzGuard = void 0;
const jwt = __importStar(require("jsonwebtoken"));
class AuthzGuard {
    constructor(prisma, jwtSecret = (() => {
        const s = process.env.JWT_SECRET;
        if (!s || s.length < 32)
            throw new Error('[FATAL] JWT_SECRET not set or too short');
        return s;
    })()) {
        this.prisma = prisma;
        this.jwtSecret = jwtSecret;
    }
    authorize(token, requiredPermissions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                const user = yield this.prisma.user.findUnique({
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
                const userPermissions = new Set(user.roles.flatMap(ur => ur.role.permissions.map(p => p.action)));
                // Super Admin has all permissions implicitly or explicitly
                if (userPermissions.has('*')) {
                    return true;
                }
                // Check if user has ALL required permissions
                for (const required of requiredPermissions) {
                    if (!userPermissions.has(required)) {
                        // Audit log unauthorized access attempt
                        yield this.prisma.auditLog.create({
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
            }
            catch (e) {
                return false; // Invalid token or expired
            }
        });
    }
}
exports.AuthzGuard = AuthzGuard;
