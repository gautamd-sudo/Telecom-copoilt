import { PrismaClient } from '@prisma/client';
import { TelecomEventValidator } from './schemas';

export class IngestionPipeline {
  constructor(private readonly prisma: PrismaClient) {}

  async processEvent(tenantId: string, rawEvent: any) {
    // 1. Validation
    const validationResult = TelecomEventValidator.safeParse(rawEvent);
    
    if (!validationResult.success) {
      await this.sendToDeadLetterQueue(tenantId, rawEvent, `Validation failed: ${validationResult.error.message}`);
      return { success: false, reason: 'Validation failed' };
    }

    const event = validationResult.data;

    // 2. Deduplication & Idempotency
    const isDuplicate = await this.prisma.ingestionEvent.findUnique({
      where: {
        tenantId_source_sourceEventId: {
          tenantId,
          source: event.source,
          sourceEventId: event.sourceEventId
        }
      }
    });

    if (isDuplicate) {
      // If it's a duplicate, we treat it as successfully processed (Idempotency)
      return { success: true, duplicated: true };
    }

    // 3. Storage in Event Pipeline
    try {
      const savedEvent = await this.prisma.ingestionEvent.create({
        data: {
          tenantId,
          source: event.source,
          sourceEventId: event.sourceEventId,
          eventTime: new Date(event.eventTime),
          eventType: event.eventType,
          payload: event.payload,
          processingStatus: 'PENDING'
        }
      });

      // 4. Downstream processing (e.g. updating relational tables, sending to AI, etc.)
      await this.routeEvent(tenantId, savedEvent);
      
      return { success: true, duplicated: false };
    } catch (e: any) {
      await this.sendToDeadLetterQueue(tenantId, rawEvent, `Storage/Routing error: ${e.message}`);
      return { success: false, reason: e.message };
    }
  }

  private async routeEvent(tenantId: string, event: any) {
    // Simulate routing logic (e.g., creating Alarm records)
    if (event.eventType === 'Alarm') {
      const payload = event.payload as any;
      await this.prisma.alarm.create({
        data: {
          tenantId,
          sourceId: payload.sourceId,
          sourceType: payload.sourceType,
          name: payload.name,
          severity: payload.severity,
          status: payload.status,
          timestamp: event.eventTime
        }
      });
    }

    // Mark as processed
    await this.prisma.ingestionEvent.update({
      where: { id: event.id },
      data: { processingStatus: 'PROCESSED' }
    });
  }

  private async sendToDeadLetterQueue(tenantId: string, rawEvent: any, errorReason: string) {
    await this.prisma.deadLetterQueue.create({
      data: {
        tenantId,
        source: rawEvent.source || 'UNKNOWN',
        sourceEventId: rawEvent.sourceEventId || null,
        eventType: rawEvent.eventType || null,
        payload: rawEvent || {},
        errorReason
      }
    });
  }
}
