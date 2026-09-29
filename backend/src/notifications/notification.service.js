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
exports.NotificationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class NotificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateSignature(tenantId, alertType, severity, entityId) {
        return crypto_1.default.createHash('sha256').update(`${tenantId}:${alertType}:${severity}:${entityId}`).digest('hex');
    }
    processAlert(tenantId, alertType, severity, entityId, payload, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const signature = this.generateSignature(tenantId, alertType, severity, entityId);
            // 1. Grouping and Cooldown Check
            let grouping = yield this.prisma.alertGrouping.findUnique({ where: { signature } });
            const now = new Date();
            if (!grouping) {
                grouping = yield this.prisma.alertGrouping.create({
                    data: { tenantId, signature, count: 1, lastSeen: now }
                });
            }
            else {
                grouping = yield this.prisma.alertGrouping.update({
                    where: { id: grouping.id },
                    data: { count: grouping.count + 1, lastSeen: now }
                });
            }
            if (grouping.status === 'SUPPRESSED') {
                return { status: 'SUPPRESSED', message: 'Alert storm prevented via manual suppression.' };
            }
            // Check rules for cooldown
            const rules = yield this.prisma.notificationRule.findMany({
                where: { tenantId, alertType, isActive: true }
            });
            // Filter rules by severity
            const matchingRules = rules.filter(r => r.severities.includes(severity));
            if (matchingRules.length === 0) {
                return { status: 'IGNORED', message: 'No matching rules for this alert type and severity.' };
            }
            // Determine min cooldown
            const minCooldown = Math.min(...matchingRules.map(r => r.cooldownMinutes));
            if (grouping.lastNotified && (now.getTime() - grouping.lastNotified.getTime()) < minCooldown * 60000) {
                return { status: 'COOLDOWN', message: `Alert grouping active. Suppressed until cooldown of ${minCooldown}m expires.` };
            }
            // 2. Dispatch Channels (Mocked abstract dispatch)
            const channelsToDispatch = new Set();
            for (const rule of matchingRules) {
                for (const channel of rule.channels) {
                    channelsToDispatch.add(channel);
                }
            }
            const dispatched = Array.from(channelsToDispatch);
            this.dispatchToChannels(dispatched, payload, correlationId);
            // 3. Update Last Notified
            yield this.prisma.alertGrouping.update({
                where: { id: grouping.id },
                data: { lastNotified: now }
            });
            return { status: 'DISPATCHED', channels: dispatched, eventCount: grouping.count };
        });
    }
    dispatchToChannels(channels, payload, correlationId) {
        const { notificationErrorsTotal, logger } = require('../api/observability');
        channels.forEach(channel => {
            try {
                if (Math.random() < 0.05)
                    throw new Error("Mock Dispatch Failure");
                logger.info({ channel, correlationId }, `[Notification Dispatcher] Sending payload to ${channel}`);
            }
            catch (err) {
                notificationErrorsTotal.inc({ channel });
                logger.error({ channel, correlationId, err: err.message }, `Failed to send notification`);
            }
        });
    }
    suppressGrouping(signature) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.alertGrouping.update({
                where: { signature },
                data: { status: 'SUPPRESSED' }
            });
        });
    }
}
exports.NotificationService = NotificationService;
