import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Telecom AI database...');

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant-001' },
    update: {},
    create: { id: 'demo-tenant-001', name: 'Acme Telecom' }
  });

  // 2. Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-001' },
    update: {},
    create: { id: 'org-001', name: 'Acme Corp', tenantId: tenant.id }
  });

  // 3. Role + Permission
  const adminRole = await prisma.role.upsert({
    where: { id: 'role-admin-001' },
    update: {},
    create: { id: 'role-admin-001', name: 'Administrator', tenantId: tenant.id }
  });
  await prisma.permission.upsert({
    where: { id: 'perm-all-001' },
    update: {},
    create: { id: 'perm-all-001', action: '*', resource: 'All', roleId: adminRole.id, tenantId: tenant.id }
  });

  // 4. Admin User
  const hashedPassword = await bcrypt.hash('admin123!', 12);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@acme.com' } },
    update: {},
    create: { email: 'admin@acme.com', name: 'Admin User', passwordHash: hashedPassword, tenantId: tenant.id }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id }
  });

  // 5. Network
  const network = await prisma.network.upsert({
    where: { id: 'net-001' },
    update: {},
    create: { id: 'net-001', name: '5G-SA Core', type: '5G', tenantId: tenant.id, organizationId: org.id }
  });

  // 6. Region
  const region = await prisma.region.upsert({
    where: { id: 'reg-001' },
    update: {},
    create: { id: 'reg-001', name: 'North America East', tenantId: tenant.id, networkId: network.id }
  });

  // 7. Sites + Cells
  const siteConfigs = [
    { id: 'site-nyc-01', name: 'NYC-01', lat: 40.7128, lon: -74.0060 },
    { id: 'site-nyc-02', name: 'NYC-02', lat: 40.7580, lon: -73.9855 },
    { id: 'site-bos-01', name: 'BOS-01', lat: 42.3601, lon: -71.0589 },
  ];
  for (const s of siteConfigs) {
    const site = await prisma.site.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, name: s.name, latitude: s.lat, longitude: s.lon, tenantId: tenant.id, regionId: region.id }
    });
    for (let i = 1; i <= 3; i++) {
      await prisma.cell.upsert({
        where: { id: `cell-${s.name.toLowerCase()}-${i}` },
        update: {},
        create: { id: `cell-${s.name.toLowerCase()}-${i}`, name: `CELL_${s.name}_${i}`, frequency: '3500MHz', siteId: site.id, tenantId: tenant.id }
      });
    }
  }

  // 8. Incidents
  const incidents = [
    { id: 'inc-high-latency', title: 'High Latency on NYC-01', severity: 'CRITICAL', priority: 'P1', source: 'AI', status: 'INVESTIGATING' },
    { id: 'inc-power-warning', title: 'Power Supply Warning - BOS-01', severity: 'MAJOR', priority: 'P2', source: 'ALARM', status: 'ACKNOWLEDGED' },
    { id: 'inc-router-upgrade', title: 'Core Router Upgrade Verification', severity: 'INFO', priority: 'P4', source: 'MANUAL', status: 'RESOLVED' },
  ];
  for (const inc of incidents) {
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: {},
      create: { id: inc.id, title: inc.title, description: `${inc.title} - auto-seeded`, source: inc.source, severity: inc.severity, priority: inc.priority, status: inc.status, tenantId: tenant.id }
    });
  }

  // 9. Alarms
  const alarms = [
    { id: 'alarm-1', name: 'LINK_DOWN', severity: 'CRITICAL', sourceId: 'cell-nyc-01-1', sourceType: 'Cell', status: 'ACTIVE' },
    { id: 'alarm-2', name: 'HIGH_CPU', severity: 'MAJOR', sourceId: 'cell-nyc-01-2', sourceType: 'Cell', status: 'ACTIVE' },
    { id: 'alarm-3', name: 'TEMPERATURE_HIGH', severity: 'MINOR', sourceId: 'cell-bos-01-1', sourceType: 'Cell', status: 'CLEARED' },
  ];
  for (const a of alarms) {
    await prisma.alarm.upsert({
      where: { id: a.id },
      update: {},
      create: { id: a.id, name: a.name, severity: a.severity, sourceId: a.sourceId, sourceType: a.sourceType, status: a.status, tenantId: tenant.id }
    });
  }

  // 10. Platform Master API Key
  const crypto = require('crypto');
  const token = 'telecom_live_api_key_2026';
  const keyHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.aPIKey.upsert({
    where: { keyHash },
    update: { tenantId: tenant.id, name: 'Platform Master Key' },
    create: {
      tenantId: tenant.id,
      name: 'Platform Master Key',
      keyHash
    }
  });

  console.log(`
✅ Seed complete!
   Tenant:   Acme Telecom
   Network:  5G-SA Core (3 sites, 9 cells)
   Incidents: 3
   Alarms:    3
   Login:     admin@acme.com / admin123!
`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
