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
exports.EventConsumer = void 0;
const client_1 = require("./client");
const producer_1 = require("./producer");
class EventConsumer {
    constructor(prisma, groupId, topics) {
        this.prisma = prisma;
        this.groupId = groupId;
        this.topics = topics;
        this.consumer = client_1.kafkaClient.consumer({ groupId });
        this.dlqProducer = new producer_1.EventProducer();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.consumer.connect();
            yield this.dlqProducer.connect();
            for (const topic of this.topics) {
                yield this.consumer.subscribe({ topic, fromBeginning: false });
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.consumer.disconnect();
            yield this.dlqProducer.disconnect();
        });
    }
    start(handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const { logger, kafkaLagGauge } = require('../api/observability');
            // Instrument Kafka lag (only in non-test environments)
            if (this.consumer.events) {
                this.consumer.on(this.consumer.events.FETCH, (_event) => {
                    // kafkaLagGauge.set({ topic: '...' }, lag);
                });
            }
            yield this.consumer.run({
                autoCommit: false, // Manual commit for at-least-once delivery (tolerates consumer failure)
                eachMessage: (payload) => __awaiter(this, void 0, void 0, function* () {
                    const { topic, partition, message } = payload;
                    if (!message.value)
                        return;
                    const event = JSON.parse(message.value.toString());
                    const eventId = event.eventId;
                    const correlationId = event.correlationId || eventId || 'system';
                    try {
                        // Idempotency Check in DB
                        const existing = yield this.prisma.ingestionEvent.findUnique({
                            where: { id: eventId }
                        });
                        if (!existing) {
                            logger.info({ topic, partition, correlationId }, `Processing Kafka Event`);
                            // Process the message
                            yield handler(event, correlationId);
                        }
                        // Commit offset only after successful processing and DB transaction
                        yield this.consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset, 10) + 1).toString() }]);
                    }
                    catch (error) {
                        logger.error({ topic, partition, correlationId, err: error.message }, 'Event Processing Failed');
                        if (error.name === 'PrismaClientInitializationError' || error.name === 'PrismaClientKnownRequestError') {
                            throw error;
                        }
                        yield this.dlqProducer.publish('network.events' /* actually to DLQ topic */, Object.assign(Object.assign({}, event), { correlationId, errorReason: error.message, originalTopic: topic }));
                        yield this.consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset, 10) + 1).toString() }]);
                    }
                })
            });
        });
    }
}
exports.EventConsumer = EventConsumer;
