import { PrismaClient } from '@prisma/client';
import { NetworkRepository } from '../src/repository/network.repository';

describe('Tenant Isolation Test', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Clean up
    await prisma.network.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.$disconnect();
  });

  it('should prevent Tenant B from accessing Tenant A records', async () => {
    // 1. Create two tenants
    const tenantA = await prisma.tenant.create({ data: { name: 'Tenant A' } });
    const tenantB = await prisma.tenant.create({ data: { name: 'Tenant B' } });

    // 2. Create an organization for Tenant A
    const orgA = await prisma.organization.create({
      data: { name: 'Org A', tenantId: tenantA.id }
    });

    // 3. Create a network belonging to Tenant A
    const networkA = await prisma.network.create({
      data: {
        name: 'Network A',
        type: '5G',
        organizationId: orgA.id,
        tenantId: tenantA.id
      }
    });

    // 4. Initialize repositories for Tenant A and Tenant B
    const repoA = new NetworkRepository(prisma, tenantA.id);
    const repoB = new NetworkRepository(prisma, tenantB.id);

    // 5. Assert Tenant A can see its network
    const networksA = await repoA.findMany();
    expect(networksA).toHaveLength(1);
    expect(networksA[0].id).toBe(networkA.id);

    // 6. Assert Tenant B cannot see Tenant A's network
    const networksB = await repoB.findMany();
    expect(networksB).toHaveLength(0);

    // 7. Assert Tenant B cannot update Tenant A's network
    await expect(repoB.update({
      where: { id: networkA.id },
      data: { name: 'Hacked Network' }
    })).rejects.toThrow('Record not found or access denied');
  });
});
