import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../src/notifications/notification.service';

describe('Notification & Alert Storm Prevention', () => {
  let prisma: PrismaClient;
  let service: NotificationService;
  let tenantId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    service = new NotificationService(prisma);

    const tenant = await prisma.tenant.create({ data: { name: 'Notification Test Tenant' } });
    tenantId = tenant.id;

    // Create a rule with 60 minute cooldown
    await prisma.notificationRule.create({
      data: {
        tenantId,
        name: 'Critical Network Outage Rule',
        alertType: 'NETWORK_OUTAGE',
        severities: ['CRITICAL'],
        channels: ['SLACK', 'SMS', 'WEBHOOK'],
        cooldownMinutes: 60
      }
    });
  });

  afterAll(async () => {
    await prisma.alertGrouping.deleteMany();
    await prisma.notificationRule.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.$disconnect();
  });

  it('should dispatch the first alert', async () => {
    const res = await service.processAlert(tenantId, 'NETWORK_OUTAGE', 'CRITICAL', 'SITE_NYC_01', { reason: 'Power fail' });
    expect(res.status).toBe('DISPATCHED');
    expect(res.channels).toContain('SLACK');
  });

  it('should suppress identical subsequent alerts within cooldown (prevent storm)', async () => {
    const res = await service.processAlert(tenantId, 'NETWORK_OUTAGE', 'CRITICAL', 'SITE_NYC_01', { reason: 'Power fail still offline' });
    expect(res.status).toBe('COOLDOWN');
  });

  it('should still dispatch if the entity ID is different (not the same outage)', async () => {
    const res = await service.processAlert(tenantId, 'NETWORK_OUTAGE', 'CRITICAL', 'SITE_LON_02', { reason: 'Link down' });
    expect(res.status).toBe('DISPATCHED');
  });
});
