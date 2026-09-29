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
exports.IncidentService = void 0;
class IncidentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    createIncident(tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Create incident
            const incident = yield this.prisma.incident.create({
                data: {
                    tenantId,
                    title: data.title,
                    description: data.description,
                    source: data.source,
                    severity: data.severity,
                    priority: data.priority,
                    status: 'OPEN',
                }
            });
            // 2. Add Timeline Event
            yield this.prisma.incidentEvent.create({
                data: {
                    tenantId,
                    incidentId: incident.id,
                    type: 'STATUS_CHANGE',
                    content: JSON.stringify({ from: null, to: 'OPEN', reason: 'Incident created' })
                }
            });
            // 3. Link Entities (Alarms, Anomalies)
            if (data.linkedEntities && data.linkedEntities.length > 0) {
                yield this.prisma.incidentEntityLink.createMany({
                    data: data.linkedEntities.map(e => ({
                        tenantId,
                        incidentId: incident.id,
                        entityType: e.type,
                        entityId: e.id
                    }))
                });
                // Log linkage in timeline
                yield this.prisma.incidentEvent.create({
                    data: {
                        tenantId,
                        incidentId: incident.id,
                        type: 'COMMENT',
                        content: `Linked ${data.linkedEntities.length} entities to this incident.`
                    }
                });
            }
            // 4. Create SLAs based on Priority
            const now = new Date();
            let responseHours = 4;
            let resolutionHours = 24;
            if (data.priority === 'P1') {
                responseHours = 1;
                resolutionHours = 4;
            }
            if (data.priority === 'P2') {
                responseHours = 2;
                resolutionHours = 8;
            }
            yield this.prisma.sLA.create({
                data: {
                    tenantId,
                    incidentId: incident.id,
                    type: 'RESOLUTION',
                    targetTime: new Date(now.getTime() + resolutionHours * 60 * 60 * 1000)
                }
            });
            return incident;
        });
    }
    updateStatus(tenantId, incidentId, status, userId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const incident = yield this.prisma.incident.findFirst({ where: { id: incidentId, tenantId } });
            if (!incident)
                throw new Error("Incident not found");
            const updateData = { status };
            if (status === 'ACKNOWLEDGED' && !incident.acknowledgedAt)
                updateData.acknowledgedAt = new Date();
            if (status === 'RESOLVED')
                updateData.resolvedAt = new Date();
            if (status === 'CLOSED')
                updateData.closedAt = new Date();
            const updated = yield this.prisma.incident.update({
                where: { id: incidentId },
                data: updateData
            });
            // Add Timeline Event
            yield this.prisma.incidentEvent.create({
                data: {
                    tenantId,
                    incidentId,
                    userId,
                    type: 'STATUS_CHANGE',
                    content: JSON.stringify({ from: incident.status, to: status, reason: reason || 'Status updated manually' })
                }
            });
            // Handle SLA closure if resolved
            if (status === 'RESOLVED' || status === 'CLOSED') {
                yield this.prisma.sLA.updateMany({
                    where: { incidentId, tenantId, type: 'RESOLUTION' },
                    data: { actualTime: new Date() }
                });
            }
            // Audit Log
            yield this.prisma.auditLog.create({
                data: {
                    tenantId,
                    userId,
                    action: 'UPDATE_INCIDENT_STATUS',
                    resource: 'Incident',
                    resourceId: incidentId,
                    details: JSON.stringify({ status })
                }
            });
            return updated;
        });
    }
    addComment(tenantId_1, incidentId_1, userId_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (tenantId, incidentId, userId, content, type = 'COMMENT') {
            return this.prisma.incidentEvent.create({
                data: {
                    tenantId,
                    incidentId,
                    userId,
                    type, // Can be 'COMMENT', 'AI_ANALYSIS', 'RECOMMENDATION', 'ACTION'
                    content
                }
            });
        });
    }
    getIncidentTimeline(tenantId, incidentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.incidentEvent.findMany({
                where: { tenantId, incidentId },
                orderBy: { createdAt: 'asc' }
            });
        });
    }
}
exports.IncidentService = IncidentService;
