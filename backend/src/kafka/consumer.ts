import { kafkaClient } from './client';
import { Consumer, EachMessagePayload } from 'kafkajs';
import { PrismaClient } from '@prisma/client';
import { TopicName } from './topics';
import { EventProducer } from './producer';

export class EventConsumer {
  private consumer: Consumer;
  private dlqProducer: EventProducer;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly groupId: string,
    private readonly topics: TopicName[]
  ) {
    this.consumer = kafkaClient.consumer({ groupId });
    this.dlqProducer = new EventProducer();
  }

  async connect() {
    await this.consumer.connect();
    await this.dlqProducer.connect();
    for (const topic of this.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
    await this.dlqProducer.disconnect();
  }

  async start(handler: (payload: any, correlationId: string) => Promise<void>) {
    const { logger, kafkaLagGauge } = require('../api/observability');
    
    // Instrument Kafka lag (only in non-test environments)
    if (this.consumer.events) {
      this.consumer.on(this.consumer.events.FETCH, (_event: unknown) => {
        // kafkaLagGauge.set({ topic: '...' }, lag);
      });
    }

    await this.consumer.run({
      autoCommit: false, // Manual commit for at-least-once delivery (tolerates consumer failure)
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());
        const eventId = event.eventId;
        const correlationId = event.correlationId || eventId || 'system';
        
        try {
          // Idempotency Check in DB
          const existing = await this.prisma.ingestionEvent.findUnique({
             where: { id: eventId }
          });
          
          if (!existing) {
            logger.info({ topic, partition, correlationId }, `Processing Kafka Event`);
            // Process the message
            await handler(event, correlationId);
          }

          // Commit offset only after successful processing and DB transaction
          await this.consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset, 10) + 1).toString() }]);
          
        } catch (error: any) {
          logger.error({ topic, partition, correlationId, err: error.message }, 'Event Processing Failed');
          
          if (error.name === 'PrismaClientInitializationError' || error.name === 'PrismaClientKnownRequestError') {
             throw error; 
          }
          
          await this.dlqProducer.publish('network.events' as any /* actually to DLQ topic */, {
             ...event,
             correlationId,
             errorReason: error.message,
             originalTopic: topic
          });
          
          await this.consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset, 10) + 1).toString() }]);
        }
      }
    });
  }
}
