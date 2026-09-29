"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafkaClient = void 0;
const kafkajs_1 = require("kafkajs");
exports.kafkaClient = new kafkajs_1.Kafka({
    clientId: 'telecom-ai-command-center',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    logLevel: kafkajs_1.logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 8, // Temporary Kafka failure tolerance
    }
});
