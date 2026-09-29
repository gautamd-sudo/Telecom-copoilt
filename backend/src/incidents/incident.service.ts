import { PrismaClient } from '@prisma/client';

export class IncidentService {
  constructor(private readonly prisma: PrismaClient) {}

  async createIncident(tenantId: string, data: { title: string; description: string; source: string; severity: string; priority: string; linkedEntities?: {type: string, id: string}[] }) {
    // 1. Create incident
    const incident = await this.prisma.incident.create({
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
    await this.prisma.incidentEvent.create({
      data: {
        tenantId,
        incidentId: incident.id,
        type: 'STATUS_CHANGE',
        content: JSON.stringify({ from: null, to: 'OPEN', reason: 'Incident created' })
      }
    });

    // 3. Link Entities (Alarms, Anomalies)
    if (data.linkedEntities && data.linkedEntities.length > 0) {
      await this.prisma.incidentEntityLink.createMany({
        data: data.linkedEntities.map(e => ({
          tenantId,
          incidentId: incident.id,
          entityType: e.type,
          entityId: e.id
        }))
      });
      
      // Log linkage in timeline
      await this.prisma.incidentEvent.create({
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
    
    if (data.priority === 'P1') { responseHours = 1; resolutionHours = 4; }
    if (data.priority === 'P2') { responseHours = 2; resolutionHours = 8; }

    await this.prisma.sLA.create({
      data: {
        tenantId,
        incidentId: incident.id,
        type: 'RESOLUTION',
        targetTime: new Date(now.getTime() + resolutionHours * 60 * 60 * 1000)
      }
    });

    return incident;
  }

  async updateStatus(tenantId: string, incidentId: string, status: string, userId: string, reason?: string) {
    const incident = await this.prisma.incident.findFirst({ where: { id: incidentId, tenantId } });
    if (!incident) throw new Error("Incident not found");

    const updateData: any = { status };
    if (status === 'ACKNOWLEDGED' && !incident.acknowledgedAt) updateData.acknowledgedAt = new Date();
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();
    if (status === 'CLOSED') updateData.closedAt = new Date();

    const updated = await this.prisma.incident.update({
      where: { id: incidentId },
      data: updateData
    });

    // Add Timeline Event
    await this.prisma.incidentEvent.create({
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
      await this.prisma.sLA.updateMany({
        where: { incidentId, tenantId, type: 'RESOLUTION' },
        data: { actualTime: new Date() }
      });
    }

    // Audit Log
    await this.prisma.auditLog.create({
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
  }

  async addComment(tenantId: string, incidentId: string, userId: string, content: string, type: string = 'COMMENT') {
    return this.prisma.incidentEvent.create({
      data: {
        tenantId,
        incidentId,
        userId,
        type, // Can be 'COMMENT', 'AI_ANALYSIS', 'RECOMMENDATION', 'ACTION'
        content
      }
    });
  }

  async getIncidentTimeline(tenantId: string, incidentId: string) {
    return this.prisma.incidentEvent.findMany({
      where: { tenantId, incidentId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
