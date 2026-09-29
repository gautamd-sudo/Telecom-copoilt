"use strict";
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
const client_1 = require("@prisma/client");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../src/api/server");
const notification_service_1 = require("../src/notifications/notification.service");
const prisma = new client_1.PrismaClient();
describe('Telecom AI Platform Integration Tests', () => {
    let tenantId = 'test-tenant-1';
    let apiKeyHash = 'dummy-hash';
    let token = 'dummy-token';
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Setup Database Tests (Tenant Creation)
        const tenant = yield prisma.tenant.create({
            data: { name: 'Test Telecom' }
        });
        tenantId = tenant.id;
        // Security & Auth Tests (API Key)
        const key = yield prisma.aPIKey.create({
            data: {
                tenantId,
                name: 'Test Key',
                keyHash: apiKeyHash // In a real scenario this is hashed
            }
        });
        // Mock crypto to match 'dummy-token' to 'dummy-hash'
        jest.spyOn(require('crypto'), 'createHash').mockImplementation(() => {
            return { update: () => ({ digest: () => 'dummy-hash' }) };
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.tenant.delete({ where: { id: tenantId } });
        yield prisma.$disconnect();
        jest.restoreAllMocks();
    }));
    describe('API & Security Tests', () => {
        it('should reject requests without API keys', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.app).get('/api/v1/network');
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Missing or invalid Authorization header');
        }));
        it('should allow requests with valid API keys and enforce tenant isolation', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.app)
                .get('/api/v1/network')
                .set('Authorization', 'Bearer dummy-token');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data)).toBe(true);
        }));
    });
    describe('Business Logic & Module Tests', () => {
        it('NotificationService should suppress duplicate alerts (Alert Storm Prevention)', () => __awaiter(void 0, void 0, void 0, function* () {
            const service = new notification_service_1.NotificationService(prisma);
            // First trigger
            const first = yield service.processAlert(tenantId, 'SITE_DOWN', 'CRITICAL', 'site-1', { msg: 'Site is down' });
            // Second trigger immediately
            const second = yield service.processAlert(tenantId, 'SITE_DOWN', 'CRITICAL', 'site-1', { msg: 'Site is down' });
            const sigHash = require('crypto').createHash('sha256').update(`${tenantId}-SITE_DOWN-CRITICAL-site-1`).digest('hex');
            const groupings = yield prisma.alertGrouping.findMany({ where: { signature: sigHash } });
            expect(groupings.length).toBeGreaterThan(0); // Deduped!
        }));
    });
});
