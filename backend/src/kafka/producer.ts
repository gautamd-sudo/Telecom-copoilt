import { kafkaClient } from './client';
import { Producer, RecordMetadata } from 'kafkajs';
import * as crypto from 'crypto';
import { TopicName } from './topics';
import { BaseKafkaEvent } from './schemas';

export class EventProducer {
  private producer: Producer;

  constructor() {
    this.producer = kafkaClient.producer({
      idempotent: true, // Guarantees exactly-once on producer side if broker supports it
      maxInFlightRequests: 1, // Strict ordering (prevents out-of-order on retry)
    });
  }

  async connect() {
    await this.producer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  async publish(topic: TopicName, event: Omit<BaseKafkaEvent, 'eventId' | 'timestamp'> & any): Promise<RecordMetadata[]> {
    const enrichedEvent: BaseKafkaEvent = {
      ...event,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: event.version || 'v1'
    };

    return this.producer.send({
      topic,
      messages: [
        {
          key: enrichedEvent.tenantId, // Partition by tenant ensures ordering per tenant
          value: JSON.stringify(enrichedEvent),
          headers: {
            correlationId: enrichedEvent.eventId,
            version: enrichedEvent.version
          }
        }
      ]
    });
  }
}
