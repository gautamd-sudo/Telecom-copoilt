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
exports.CustomerService = void 0;
class CustomerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getCustomer360(tenantId, customerId, requesterRole) {
        return __awaiter(this, void 0, void 0, function* () {
            // Permission check inside logic (e.g., Data Masking for PII)
            const isSupport = requesterRole === 'CUSTOMER_SUPPORT' || requesterRole === 'TENANT_ADMIN';
            const customer = yield this.prisma.customer.findFirst({
                where: { id: customerId, tenantId },
                include: {
                    subscriptions: {
                        include: { servicePlan: true, devices: true }
                    },
                    events: {
                        orderBy: { createdAt: 'desc' },
                        take: 20
                    },
                    intelligence: true
                }
            });
            if (!customer)
                throw new Error("Customer not found");
            // Data Masking
            if (!isSupport) {
                customer.email = customer.email ? '***@***.com' : null;
                customer.phone = customer.phone ? '***-***-****' : null;
            }
            return customer;
        });
    }
    calculateChurnRisk(tenantId, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Heuristic calculation (mock AI logic)
            const events = yield this.prisma.customerEvent.findMany({
                where: { tenantId, customerId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
            });
            let risk = 0.1; // Base risk
            let sentiment = 0.5;
            const complaints = events.filter(e => e.type === 'COMPLAINT');
            const netExpDrops = events.filter(e => { var _a; return e.type === 'NETWORK_EXP' && ((_a = e.metadata) === null || _a === void 0 ? void 0 : _a.quality) === 'POOR'; });
            if (complaints.length > 0) {
                risk += complaints.length * 0.2;
                sentiment -= complaints.length * 0.3;
            }
            if (netExpDrops.length > 0) {
                risk += netExpDrops.length * 0.1;
                sentiment -= netExpDrops.length * 0.15;
            }
            risk = Math.min(Math.max(risk, 0), 1.0);
            sentiment = Math.min(Math.max(sentiment, -1.0), 1.0);
            return this.prisma.customerIntelligence.upsert({
                where: { customerId },
                create: {
                    tenantId,
                    customerId,
                    churnRisk: risk,
                    sentiment: sentiment,
                },
                update: {
                    churnRisk: risk,
                    sentiment: sentiment,
                    lastCalculated: new Date()
                }
            });
        });
    }
    recordEvent(tenantId_1, customerId_1, type_1, description_1) {
        return __awaiter(this, arguments, void 0, function* (tenantId, customerId, type, description, metadata = {}) {
            const event = yield this.prisma.customerEvent.create({
                data: {
                    tenantId,
                    customerId,
                    type,
                    description,
                    metadata
                }
            });
            // Auto trigger recalcs on negative events
            if (['COMPLAINT', 'NETWORK_EXP'].includes(type)) {
                yield this.calculateChurnRisk(tenantId, customerId);
            }
            return event;
        });
    }
    processInteraction(tenantId, customerId, type, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const interaction = yield this.prisma.customerInteraction.create({
                data: { tenantId, customerId, type, content }
            });
            // In production, this would call the Python AI via HTTP
            // Here we'll mock the classification logic directly or assume it returns this struct:
            const isNegative = content.toLowerCase().includes('angry') || content.toLowerCase().includes('terrible');
            const isCancel = content.toLowerCase().includes('cancel');
            const sentiment = isNegative ? 'NEGATIVE' : 'NEUTRAL';
            let intent = isCancel ? 'CANCELLATION' : 'TECHNICAL_SUPPORT';
            if (content.toLowerCase().includes('bill'))
                intent = 'BILLING';
            const analysis = yield this.prisma.interactionAnalysis.create({
                data: {
                    interactionId: interaction.id,
                    sentiment,
                    intent,
                    frustration: isNegative ? 0.8 : 0.1,
                    urgency: isNegative ? 0.8 : 0.1,
                    severity: isNegative ? 'HIGH' : 'LOW',
                    confidence: 0.85,
                    modelVersion: 'v1.0-sentiment-classifier',
                    explanation: 'Mock integration response based on keywords'
                }
            });
            if (sentiment === 'NEGATIVE' || intent === 'CANCELLATION') {
                yield this.recordEvent(tenantId, customerId, 'COMPLAINT', `Customer interaction flagged as ${intent}`);
            }
            return analysis;
        });
    }
}
exports.CustomerService = CustomerService;
