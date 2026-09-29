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
const notification_service_1 = require("../src/notifications/notification.service");
describe('Notification & Alert Storm Prevention', () => {
    let prisma;
    let service;
    let tenantId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        prisma = new client_1.PrismaClient();
        service = new notification_service_1.NotificationService(prisma);
        const tenant = yield prisma.tenant.create({ data: { name: 'Notification Test Tenant' } });
        tenantId = tenant.id;
        // Create a rule with 60 minute cooldown
        yield prisma.notificationRule.create({
            data: {
                tenantId,
                name: 'Critical Network Outage Rule',
                alertType: 'NETWORK_OUTAGE',
                severities: ['CRITICAL'],
                channels: ['SLACK', 'SMS', 'WEBHOOK'],
                cooldownMinutes: 60
            }
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.alertGrouping.deleteMany();
        yield prisma.notificationRule.deleteMany();
        yield prisma.tenant.deleteMany();
        yield prisma.$disconnect();
    }));
    it('should dispatch the first alert', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield service.processAlert(tenantId, 'NETWORK_OUTAGE', 'CRITICAL', 'SITE_NYC_01', { reason: 'Power fail' });
        expect(res.status).toBe('DISPATCHED');
        expect(res.channels).toContain('SLACK');
    }));
    it('should suppress identical subsequent alerts within cooldown (prevent storm)', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield service.processAlert(tenantId, 'NETWORK_OUTAGE', 'CRITICAL', 'SITE_NYC_01', { reason: 'Power fail still offline' });
        expect(res.status).toBe('COOLDOWN');
    }));
    it('should still dispatch if the entity ID is different (not the same outage)', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield service.processAlert(tenantId, 'NETWORK_OUTAGE', 'CRITICAL', 'SITE_LON_02', { reason: 'Link down' });
        expect(res.status).toBe('DISPATCHED');
    }));
});
