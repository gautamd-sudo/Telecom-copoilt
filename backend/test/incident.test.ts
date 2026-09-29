import { PrismaClient } from '@prisma/client';
import { IncidentService } from '../src/incidents/incident.service';

describe('Telecom Incident Management System', () => {
  let prisma: PrismaClient;
  let service: IncidentService;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    service = new IncidentService(prisma);
    
    await prisma.incident.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    
    const tenant = await prisma.tenant.create({ data: { id: '77777777-7777-7777-7777-777777777777', name: 'Inc Tenant' }});
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: 'engineer@test.com',
        passwordHash: 'dummy',
        name: 'Eng Test',
        emailVerified: true
      }
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create an incident from an AI Anomaly, setup SLAs, and create timeline events', async () => {
    const incident = await service.createIncident(tenantId, {
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
    const slas = await prisma.sLA.findMany({ where: { incidentId: incident.id } });
    expect(slas.length).toBe(1);
    expect(slas[0].type).toBe('RESOLUTION');

    // Check Timeline
    const timeline = await service.getIncidentTimeline(tenantId, incident.id);
    expect(timeline.length).toBe(2); // Creation event + linkage comment
    expect(timeline[0].type).toBe('STATUS_CHANGE');
    expect(timeline[1].type).toBe('COMMENT');
  });

  it('should track status changes and log audit trails', async () => {
    const incident = await service.createIncident(tenantId, {
      title: 'Power Failure',
      description: 'Site offline',
      source: 'ALARM',
      severity: 'CRITICAL',
      priority: 'P1'
    });

    // Engineer acknowledges
    await service.updateStatus(tenantId, incident.id, 'ACKNOWLEDGED', userId, 'Investigating power supply');
    
    // AI adds analysis
    await service.addComment(tenantId, incident.id, userId, 'AI Analysis: Root cause highly likely to be generator fuel depletion.', 'AI_ANALYSIS');

    // Engineer resolves
    const resolved = await service.updateStatus(tenantId, incident.id, 'RESOLVED', userId, 'Refueled generator');

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.acknowledgedAt).not.toBeNull();
    expect(resolved.resolvedAt).not.toBeNull();

    // Verify SLA actual time is set
    const sla = await prisma.sLA.findFirst({ where: { incidentId: incident.id } });
    expect(sla?.actualTime).not.toBeNull();

    // Verify Timeline
    const timeline = await service.getIncidentTimeline(tenantId, incident.id);
    const types = timeline.map(t => t.type);
    expect(types).toContain('STATUS_CHANGE');
    expect(types).toContain('AI_ANALYSIS');

    // Verify Audit Log
    const audit = await prisma.auditLog.findFirst({ where: { resourceId: incident.id, action: 'UPDATE_INCIDENT_STATUS' } });
    expect(audit).toBeDefined();
  });
});
