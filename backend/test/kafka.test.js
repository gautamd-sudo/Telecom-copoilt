"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const producer_1 = require("../src/kafka/producer");
const consumer_1 = require("../src/kafka/consumer");
const topics_1 = require("../src/kafka/topics");
const client_1 = require("@prisma/client");
const schemas_1 = require("../src/kafka/schemas");
// Mock KafkaJS
jest.mock('kafkajs', () => {
    const mProducer = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn().mockResolvedValue([{ topicName: 'test', partition: 0, errorCode: 0 }])
    };
    const mConsumer = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        subscribe: jest.fn(),
        run: jest.fn(),
        commitOffsets: jest.fn()
    };
    return {
        Kafka: jest.fn(() => ({
            producer: jest.fn(() => mProducer),
            consumer: jest.fn(() => mConsumer)
        })),
        logLevel: { ERROR: 1 }
    };
});
describe('Kafka Event Pipeline', () => {
    let prisma;
    let producer;
    let consumer;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        prisma = new client_1.PrismaClient();
        producer = new producer_1.EventProducer();
        consumer = new consumer_1.EventConsumer(prisma, 'test-group', [topics_1.KAFKA_TOPICS.NETWORK_METRICS]);
        // Setup test tenant
        yield prisma.tenant.deleteMany();
        yield prisma.tenant.create({ data: { id: '11111111-1111-1111-1111-111111111111', name: 'Test Tenant' } });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.$disconnect();
    }));
    describe('Schemas and Versioning', () => {
        it('should validate and parse versioned Network Metric schema', () => {
            const validEvent = {
                eventId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                tenantId: '550e8400-e29b-41d4-a716-446655440000',
                timestamp: new Date().toISOString(),
                version: 'v2',
                source: 'NOKIA_OSS',
                type: 'metric',
                payload: {
                    metricName: 'latency',
                    value: 45.2,
                    unit: 'ms'
                }
            };
            const result = schemas_1.NetworkMetricEventSchema.safeParse(validEvent);
            if (!result.success)
                console.error(result.error);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.version).toBe('v2'); // Preserves version
            }
        });
        it('should reject invalid schema', () => {
            const invalidEvent = {
                tenantId: '123', // Not a UUID
                type: 'metric',
                payload: { value: 'high' } // String instead of number
            };
            const result = schemas_1.NetworkMetricEventSchema.safeParse(invalidEvent);
            expect(result.success).toBe(false);
        });
    });
    describe('Producer', () => {
        it('should connect and publish events with correlation IDs', () => __awaiter(void 0, void 0, void 0, function* () {
            yield producer.connect();
            const payload = {
                tenantId: '11111111-1111-1111-1111-111111111111',
                source: 'TEST',
                type: 'metric',
                payload: { metricName: 'throughput', value: 1.5, unit: 'Gbps' }
            };
            yield producer.publish(topics_1.KAFKA_TOPICS.NETWORK_METRICS, payload);
            const { Kafka } = require('kafkajs');
            const mockKafkaInstance = new Kafka();
            const mockProducerInstance = mockKafkaInstance.producer();
            expect(mockProducerInstance.connect).toHaveBeenCalled();
            expect(mockProducerInstance.send).toHaveBeenCalled();
            const sendArgs = mockProducerInstance.send.mock.calls[0][0];
            expect(sendArgs.topic).toBe(topics_1.KAFKA_TOPICS.NETWORK_METRICS);
            expect(sendArgs.messages[0].key).toBe(payload.tenantId);
            const sentMessage = JSON.parse(sendArgs.messages[0].value);
            expect(sentMessage.eventId).toBeDefined(); // Automatically added correlation ID
            expect(sentMessage.timestamp).toBeDefined();
        }));
    });
    describe('Consumer', () => {
        it('should connect, subscribe, and setup idempotent manual commits', () => __awaiter(void 0, void 0, void 0, function* () {
            yield consumer.connect();
            const { Kafka } = require('kafkajs');
            const mockKafkaInstance = new Kafka();
            const mockConsumerInstance = mockKafkaInstance.consumer();
            expect(mockConsumerInstance.connect).toHaveBeenCalled();
            expect(mockConsumerInstance.subscribe).toHaveBeenCalledWith({
                topic: topics_1.KAFKA_TOPICS.NETWORK_METRICS,
                fromBeginning: false
            });
            // Simulate calling start
            yield consumer.start((payload) => __awaiter(void 0, void 0, void 0, function* () {
                // mock handler
            }));
            expect(mockConsumerInstance.run).toHaveBeenCalled();
            const runArgs = mockConsumerInstance.run.mock.calls[0][0];
            expect(runArgs.autoCommit).toBe(false); // Validates manual commit configuration
        }));
    });
});
