import { PrismaClient } from '@prisma/client';
import { IngestionPipeline } from '../src/ingestion/pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('Telecom Data Ingestion Framework', () => {
  let prisma: PrismaClient;
  let pipeline: IngestionPipeline;
  let tenantId: string;
  let fixtures: any[];

  beforeAll(async () => {
    prisma = new PrismaClient();
    pipeline = new IngestionPipeline(prisma);

    // Load fixtures
    const fixturePath = path.join(__dirname, 'fixtures', 'telecom-events.json');
    fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    // Setup Tenant
    await prisma.ingestionEvent.deleteMany();
    await prisma.deadLetterQueue.deleteMany();
    await prisma.alarm.deleteMany();
    
    const tenant = await prisma.tenant.create({ data: { name: 'Ingestion Test Tenant' } });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully ingest and route a valid NetworkKPI event', async () => {
    const event = fixtures[0];
    const result = await pipeline.processEvent(tenantId, event);

    expect(result.success).toBe(true);
    expect(result.duplicated).toBe(false);

    const storedEvent = await prisma.ingestionEvent.findUnique({
      where: {
        tenantId_source_sourceEventId: {
          tenantId,
          source: event.source,
          sourceEventId: event.sourceEventId
        }
      }
    });

    expect(storedEvent).toBeDefined();
    expect(storedEvent?.processingStatus).toBe('PROCESSED');
    expect(storedEvent?.eventType).toBe('NetworkKPI');
  });

  it('should successfully ingest, route, and create downstream records for an Alarm event', async () => {
    const event = fixtures[1];
    const result = await pipeline.processEvent(tenantId, event);

    expect(result.success).toBe(true);

    const alarm = await prisma.alarm.findFirst({
      where: { sourceId: event.payload.sourceId, tenantId }
    });

    expect(alarm).toBeDefined();
    expect(alarm?.name).toBe('BGP Session Down');
    expect(alarm?.severity).toBe('CRITICAL');
  });

  it('should handle duplicates idempotently', async () => {
    const event = fixtures[0]; // Already ingested in first test
    const result = await pipeline.processEvent(tenantId, event);

    expect(result.success).toBe(true);
    expect(result.duplicated).toBe(true); // Should identify as dup

    // Count should still be 1
    const count = await prisma.ingestionEvent.count({
      where: { sourceEventId: event.sourceEventId }
    });
    expect(count).toBe(1);
  });

  it('should route invalid events to the Dead Letter Queue', async () => {
    const invalidEvent = fixtures[2];
    const result = await pipeline.processEvent(tenantId, invalidEvent);

    expect(result.success).toBe(false);

    const dlq = await prisma.deadLetterQueue.findFirst({
      where: { source: invalidEvent.source, tenantId }
    });

    expect(dlq).toBeDefined();
    expect(dlq?.errorReason).toContain('Validation failed');
  });
});
