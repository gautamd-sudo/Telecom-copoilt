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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const customer_service_1 = require("../src/customers/customer.service");
describe('Customer Intelligence Module', () => {
    let prisma;
    let service;
    let tenantId;
    let customerId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        prisma = new client_1.PrismaClient();
        service = new customer_service_1.CustomerService(prisma);
        const tenant = yield prisma.tenant.create({ data: { name: 'Customer Test Tenant' } });
        tenantId = tenant.id;
        const customer = yield prisma.customer.create({
            data: {
                tenantId,
                name: 'John Doe',
                email: 'john@example.com',
                phone: '555-0199',
                type: 'B2C'
            }
        });
        customerId = customer.id;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.customer.deleteMany();
        yield prisma.tenant.deleteMany();
        yield prisma.$disconnect();
    }));
    it('should mask PII for non-support roles', () => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield service.getCustomer360(tenantId, customerId, 'VIEWER');
        expect(data.email).toBe('***@***.com');
        expect(data.phone).toBe('***-***-****');
    }));
    it('should reveal PII for support roles', () => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield service.getCustomer360(tenantId, customerId, 'CUSTOMER_SUPPORT');
        expect(data.email).toBe('john@example.com');
        expect(data.phone).toBe('555-0199');
    }));
    it('should calculate and increase churn risk upon complaints', () => __awaiter(void 0, void 0, void 0, function* () {
        yield service.recordEvent(tenantId, customerId, 'COMPLAINT', 'Network dropped during important call.');
        yield service.recordEvent(tenantId, customerId, 'NETWORK_EXP', 'Poor signal reported.', { quality: 'POOR' });
        const intel = yield prisma.customerIntelligence.findUnique({ where: { customerId } });
        expect(intel).toBeDefined();
        expect(intel.churnRisk).toBeGreaterThan(0.3); // Base 0.1 + Complaint 0.2 + Poor Exp 0.1
        expect(intel.sentiment).toBeLessThan(0.1); // Base 0.5 - 0.3 - 0.15 = 0.05
    }));
    it('should process interactions, extract sentiment, and trigger churn risks', () => __awaiter(void 0, void 0, void 0, function* () {
        const analysis = yield service.processInteraction(tenantId, customerId, 'CHAT', 'I am very angry and want to cancel my plan.');
        expect(analysis.sentiment).toBe('NEGATIVE');
        expect(analysis.intent).toBe('CANCELLATION');
        // Churn risk should be updated because a COMPLAINT event was recorded
        const intel = yield prisma.customerIntelligence.findUnique({ where: { customerId } });
        expect(intel.churnRisk).toBeGreaterThan(0.5);
    }));
});
