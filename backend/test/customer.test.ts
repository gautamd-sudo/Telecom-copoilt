import { PrismaClient } from '@prisma/client';
import { CustomerService } from '../src/customers/customer.service';

describe('Customer Intelligence Module', () => {
  let prisma: PrismaClient;
  let service: CustomerService;
  let tenantId: string;
  let customerId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    service = new CustomerService(prisma);

    const tenant = await prisma.tenant.create({ data: { name: 'Customer Test Tenant' } });
    tenantId = tenant.id;

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0199',
        type: 'B2C'
      }
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    await prisma.customer.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.$disconnect();
  });

  it('should mask PII for non-support roles', async () => {
    const data = await service.getCustomer360(tenantId, customerId, 'VIEWER');
    expect(data.email).toBe('***@***.com');
    expect(data.phone).toBe('***-***-****');
  });

  it('should reveal PII for support roles', async () => {
    const data = await service.getCustomer360(tenantId, customerId, 'CUSTOMER_SUPPORT');
    expect(data.email).toBe('john@example.com');
    expect(data.phone).toBe('555-0199');
  });

  it('should calculate and increase churn risk upon complaints', async () => {
    await service.recordEvent(tenantId, customerId, 'COMPLAINT', 'Network dropped during important call.');
    await service.recordEvent(tenantId, customerId, 'NETWORK_EXP', 'Poor signal reported.', { quality: 'POOR' });
    
    const intel = await prisma.customerIntelligence.findUnique({ where: { customerId } });
    expect(intel).toBeDefined();
    expect(intel!.churnRisk).toBeGreaterThan(0.3); // Base 0.1 + Complaint 0.2 + Poor Exp 0.1
    expect(intel!.sentiment).toBeLessThan(0.1); // Base 0.5 - 0.3 - 0.15 = 0.05
  });

  it('should process interactions, extract sentiment, and trigger churn risks', async () => {
    const analysis = await service.processInteraction(tenantId, customerId, 'CHAT', 'I am very angry and want to cancel my plan.');
    expect(analysis.sentiment).toBe('NEGATIVE');
    expect(analysis.intent).toBe('CANCELLATION');

    // Churn risk should be updated because a COMPLAINT event was recorded
    const intel = await prisma.customerIntelligence.findUnique({ where: { customerId } });
    expect(intel!.churnRisk).toBeGreaterThan(0.5); 
  });
});
