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
const incident_service_1 = require("../src/incidents/incident.service");
describe('Telecom Incident Management System', () => {
    let prisma;
    let service;
    let tenantId;
    let userId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        prisma = new client_1.PrismaClient();
        service = new incident_service_1.IncidentService(prisma);
        yield prisma.incident.deleteMany();
        yield prisma.user.deleteMany();
        yield prisma.tenant.deleteMany();
        const tenant = yield prisma.tenant.create({ data: { id: '77777777-7777-7777-7777-777777777777', name: 'Inc Tenant' } });
        tenantId = tenant.id;
        const user = yield prisma.user.create({
            data: {
                tenantId,
                email: 'engineer@test.com',
                passwordHash: 'dummy',
                name: 'Eng Test',
                emailVerified: true
            }
        });
        userId = user.id;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.$disconnect();
    }));
    it('should create an incident from an AI Anomaly, setup SLAs, and create timeline events', () => __awaiter(void 0, void 0, void 0, function* () {
        const incident = yield service.createIncident(tenantId, {
            title: 'High Latency detected on CELL_101',
            description: 'Isolation Forest detected a major structural anomaly.',
            source: 'AI',
            severity: 'MAJOR',
            priority: 'P2',
            linkedEntities: [{ type: 'ANOMALY', id: 'ANOM-123' }]
        });
        expect(incident.id).toBeDefined();
        expect(incident.status).toBe('OPEN');
        // Check SLA
        const slas = yield prisma.sLA.findMany({ where: { incidentId: incident.id } });
        expect(slas.length).toBe(1);
        expect(slas[0].type).toBe('RESOLUTION');
        // Check Timeline
        const timeline = yield service.getIncidentTimeline(tenantId, incident.id);
        expect(timeline.length).toBe(2); // Creation event + linkage comment
        expect(timeline[0].type).toBe('STATUS_CHANGE');
        expect(timeline[1].type).toBe('COMMENT');
    }));
    it('should track status changes and log audit trails', () => __awaiter(void 0, void 0, void 0, function* () {
        const incident = yield service.createIncident(tenantId, {
            title: 'Power Failure',
            description: 'Site offline',
            source: 'ALARM',
            severity: 'CRITICAL',
            priority: 'P1'
        });
        // Engineer acknowledges
        yield service.updateStatus(tenantId, incident.id, 'ACKNOWLEDGED', userId, 'Investigating power supply');
        // AI adds analysis
        yield service.addComment(tenantId, incident.id, userId, 'AI Analysis: Root cause highly likely to be generator fuel depletion.', 'AI_ANALYSIS');
        // Engineer resolves
        const resolved = yield service.updateStatus(tenantId, incident.id, 'RESOLVED', userId, 'Refueled generator');
        expect(resolved.status).toBe('RESOLVED');
        expect(resolved.acknowledgedAt).not.toBeNull();
        expect(resolved.resolvedAt).not.toBeNull();
        // Verify SLA actual time is set
        const sla = yield prisma.sLA.findFirst({ where: { incidentId: incident.id } });
        expect(sla === null || sla === void 0 ? void 0 : sla.actualTime).not.toBeNull();
        // Verify Timeline
        const timeline = yield service.getIncidentTimeline(tenantId, incident.id);
        const types = timeline.map(t => t.type);
        expect(types).toContain('STATUS_CHANGE');
        expect(types).toContain('AI_ANALYSIS');
        // Verify Audit Log
        const audit = yield prisma.auditLog.findFirst({ where: { resourceId: incident.id, action: 'UPDATE_INCIDENT_STATUS' } });
        expect(audit).toBeDefined();
    }));
});
