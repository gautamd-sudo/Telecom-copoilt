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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const client_1 = require("@prisma/client");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const observability_1 = require("./observability");
const app = (0, express_1.default)();
exports.app = app;
const prisma = new client_1.PrismaClient();
// Add Prisma middleware for metrics
prisma.$use((params, next) => __awaiter(void 0, void 0, void 0, function* () {
    const start = Date.now();
    const result = yield next(params);
    const duration = Date.now() - start;
    const { dbQueryDuration } = require('./observability');
    dbQueryDuration.observe({ model: params.model, operation: params.action }, duration);
    return result;
}));
app.use(express_1.default.json());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002')
    .split(',')
    .map(s => s.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));
app.use(observability_1.correlationIdMiddleware);
app.use(observability_1.requestLogger);
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        var _a;
        const duration = Date.now() - start;
        const { httpRequestDurationMicroseconds } = require('./observability');
        httpRequestDurationMicroseconds.observe({ method: req.method, route: ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.path, status_code: res.statusCode }, duration);
    });
    next();
});
// Health Checks
app.get('/health/live', (req, res) => res.status(200).json({ status: 'UP' }));
app.get('/health/ready', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'READY' });
    }
    catch (e) {
        res.status(503).json({ status: 'NOT_READY' });
    }
}));
app.get('/metrics', observability_1.metricsEndpoint);
// Global Rate Limiter
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests', status: 429 }
});
app.use(globalLimiter);
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("../auth/auth.service");
const authService = new auth_service_1.AuthService(prisma);
// Authentication Middleware (supports API Keys and JWT Session Tokens)
const authenticateApiKey = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    // 1. Try verifying as JWT session token
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            if (decoded && decoded.tenantId) {
                req.user = { tenantId: decoded.tenantId, userId: decoded.userId, apiKeyId: 'jwt-session', scopes: [] };
                return next();
            }
        }
    }
    catch (_a) {
        // Token is not a valid JWT; fall through to API Key validation
    }
    // 2. Fall back to API Key verification
    const keyHash = crypto.createHash('sha256').update(token).digest('hex');
    const apiKey = yield prisma.aPIKey.findUnique({
        where: { keyHash },
        include: { tenant: true }
    });
    if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
        return res.status(401).json({ error: 'Invalid or expired API Key' });
    }
    // Update last used asynchronously
    prisma.aPIKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch((err) => { const { logger } = require("./observability"); logger.error({ err: err.message }, "Background task failed"); });
    req.user = { tenantId: apiKey.tenantId, apiKeyId: apiKey.id, scopes: [] };
    next();
});
// Usage Tracking Middleware
const trackUsage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.user) {
            prisma.aPIUsageLog.create({
                data: {
                    tenantId: req.user.tenantId,
                    apiKeyId: req.user.apiKeyId === 'jwt-session' ? null : req.user.apiKeyId,
                    endpoint: req.route ? req.route.path : req.path,
                    method: req.method,
                    statusCode: res.statusCode,
                    durationMs: duration,
                    ipAddress: req.ip
                }
            }).catch((err) => { const { logger } = require("./observability"); logger.error({ err: err.message }, "Background task failed"); });
        }
    });
    next();
});
const v1Router = express_1.default.Router();
v1Router.use(authenticateApiKey);
v1Router.use(trackUsage);
// Pagination & Response Helpers
const paginate = (req) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    return { skip: (page - 1) * limit, take: limit };
};
const sendSuccess = (res, data, meta) => {
    res.status(200).json({ status: 'success', data, meta });
};
// --- Endpoints ---
// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => fn(req, res).catch(next);
v1Router.get('/network', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, take } = paginate(req);
    const networks = yield prisma.network.findMany({
        where: { tenantId: req.user.tenantId },
        skip, take
    });
    sendSuccess(res, networks);
})));
v1Router.get('/sites', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, take } = paginate(req);
    const sites = yield prisma.site.findMany({
        where: { tenantId: req.user.tenantId },
        skip, take
    });
    sendSuccess(res, sites);
})));
v1Router.get('/cells', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, take } = paginate(req);
    const cells = yield prisma.cell.findMany({
        where: { site: { tenantId: req.user.tenantId } },
        skip, take
    });
    sendSuccess(res, cells);
})));
v1Router.get('/incidents', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, take } = paginate(req);
    const { status } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status)
        where.status = status;
    const incidents = yield prisma.incident.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' }
    });
    sendSuccess(res, incidents);
})));
v1Router.post('/incidents', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, source, severity, priority, assignedTo } = req.body;
    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }
    const incident = yield prisma.incident.create({
        data: {
            tenantId: req.user.tenantId,
            title: title.trim(),
            description: description ? description.trim() : title.trim(),
            source: source || 'MANUAL',
            status: 'OPEN',
            severity: severity || 'MAJOR',
            priority: priority || 'P2',
            assignedTo: assignedTo || null,
        }
    });
    res.status(201).json({ status: 'success', data: incident });
})));
// --- Authentication Endpoints ---
const authRouter = express_1.default.Router();
authRouter.post('/login', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, tenantId } = req.body || {};
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    let targetTenantId = tenantId;
    const userMatch = yield prisma.user.findFirst({
        where: { email: email.trim().toLowerCase() }
    });
    if (userMatch) {
        // If tenantId was not provided, or user is not found in requested tenant, fall back to user's registered tenant
        if (!targetTenantId) {
            targetTenantId = userMatch.tenantId;
        }
        else {
            const existsInRequested = yield prisma.user.findUnique({
                where: { tenantId_email: { tenantId: targetTenantId, email: email.trim().toLowerCase() } }
            });
            if (!existsInRequested) {
                targetTenantId = userMatch.tenantId;
            }
        }
    }
    else if (!targetTenantId) {
        const defaultTenant = yield prisma.tenant.findFirst();
        targetTenantId = (defaultTenant === null || defaultTenant === void 0 ? void 0 : defaultTenant.id) || 'demo-tenant-001';
    }
    try {
        const userAgent = req.headers['user-agent'];
        const loginResult = yield authService.login(targetTenantId, email.trim().toLowerCase(), password, req.ip, userAgent);
        const tenant = yield prisma.tenant.findUnique({
            where: { id: targetTenantId }
        });
        sendSuccess(res, {
            accessToken: loginResult.accessToken,
            refreshToken: loginResult.refreshToken,
            permissions: loginResult.permissions,
            user: loginResult.user,
            tenant: tenant ? { id: tenant.id, name: tenant.name } : { id: targetTenantId, name: 'Acme Telecom' }
        });
    }
    catch (err) {
        const message = err.message || 'Authentication failed';
        if (message.includes('locked out')) {
            res.status(423).json({ error: message });
            return;
        }
        res.status(401).json({ error: message });
    }
})));
authRouter.post('/logout', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    const { refreshToken } = req.body || {};
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (jwtSecret) {
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                if (decoded && decoded.tenantId && decoded.userId) {
                    if (refreshToken) {
                        yield authService.logout(decoded.tenantId, decoded.userId, refreshToken);
                    }
                    else {
                        yield prisma.session.deleteMany({
                            where: { tenantId: decoded.tenantId, userId: decoded.userId }
                        });
                        yield authService.logAudit(decoded.tenantId, decoded.userId, 'AUTH_LOGOUT', 'User', decoded.userId, 'User logged out all sessions', req.ip);
                    }
                }
            }
        }
        catch (_a) {
            if (refreshToken) {
                yield prisma.session.deleteMany({ where: { refreshToken } });
            }
        }
    }
    else if (refreshToken) {
        yield prisma.session.deleteMany({ where: { refreshToken } });
    }
    sendSuccess(res, { message: 'Logged out successfully' });
})));
authRouter.post('/refresh', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
        res.status(400).json({ error: 'refreshToken is required' });
        return;
    }
    try {
        const tokens = yield authService.refreshTokens(refreshToken, req.ip);
        sendSuccess(res, tokens);
    }
    catch (err) {
        res.status(401).json({ error: err.message || 'Invalid or expired refresh token' });
    }
})));
authRouter.get('/me', authenticateApiKey, asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const tenantId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.tenantId;
    if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const tenant = yield prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!userId) {
        sendSuccess(res, {
            user: { id: 'api-service-account', name: 'Service Account', email: 'service@telecom.ai' },
            tenant: tenant ? { id: tenant.id, name: tenant.name } : { id: tenantId, name: 'Acme Telecom' },
            permissions: ['*']
        });
        return;
    }
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        include: {
            tenant: true,
            roles: {
                include: {
                    role: {
                        include: { permissions: true }
                    }
                }
            }
        }
    });
    if (!user || user.deletedAt) {
        res.status(401).json({ error: 'User not found or disabled' });
        return;
    }
    const permissions = [...new Set(user.roles.flatMap(ur => ur.role.permissions.map(p => p.action)))];
    sendSuccess(res, {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId
        },
        tenant: {
            id: user.tenant.id,
            name: user.tenant.name
        },
        permissions
    });
})));
app.use('/api/v1/auth', authRouter);
app.use('/api/auth', authRouter);
app.use('/api/v1', v1Router);
// Swagger Documentation
const yamljs_1 = __importDefault(require("yamljs"));
const swaggerDocument = yamljs_1.default.load(path.join(__dirname, 'openapi.yaml'));
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
// Catch-all Error Handler
app.use((err, req, res, next) => {
    const { logger } = require('./observability');
    logger.error({ err: err.message, stack: err.stack }, 'Unhandled API Error');
    res.status(500).json({ error: 'Internal Server Error' });
});
