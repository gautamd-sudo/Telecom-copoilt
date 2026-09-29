import { Kafka, logLevel } from 'kafkajs';

export const kafkaClient = new Kafka({
  clientId: 'telecom-ai-command-center',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 100,
    retries: 8, // Temporary Kafka failure tolerance
  }
});
