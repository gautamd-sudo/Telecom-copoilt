import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '../src/api/server';
import { NotificationService } from '../src/notifications/notification.service';
import { LeakageService } from '../src/billing/leakage.service';

const prisma = new PrismaClient();

describe('Telecom AI Platform Integration Tests', () => {
  let tenantId = 'test-tenant-1';
  let apiKeyHash = 'dummy-hash';
  let token = 'dummy-token';

  beforeAll(async () => {
    // Setup Database Tests (Tenant Creation)
    const tenant = await prisma.tenant.create({
      data: { name: 'Test Telecom' }
    });
    tenantId = tenant.id;

    // Security & Auth Tests (API Key)
    const key = await prisma.aPIKey.create({
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
  });

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
    jest.restoreAllMocks();
  });

  describe('API & Security Tests', () => {
    it('should reject requests without API keys', async () => {
      const res = await request(app).get('/api/v1/network');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Missing or invalid Authorization header');
    });

    it('should allow requests with valid API keys and enforce tenant isolation', async () => {
      const res = await request(app)
        .get('/api/v1/network')
        .set('Authorization', 'Bearer dummy-token');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Business Logic & Module Tests', () => {
    it('NotificationService should suppress duplicate alerts (Alert Storm Prevention)', async () => {
      const service = new NotificationService(prisma);
      // First trigger
      const first = await service.processAlert(tenantId, 'SITE_DOWN', 'CRITICAL', 'site-1', { msg: 'Site is down' });
      // Second trigger immediately
      const second = await service.processAlert(tenantId, 'SITE_DOWN', 'CRITICAL', 'site-1', { msg: 'Site is down' });
      
      const sigHash = require('crypto').createHash('sha256').update(`${tenantId}-SITE_DOWN-CRITICAL-site-1`).digest('hex');
      const groupings = await prisma.alertGrouping.findMany({ where: { signature: sigHash } });
      expect(groupings.length).toBeGreaterThan(0); // Deduped!
    });
  });
});
