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
exports.IngestionPipeline = void 0;
const schemas_1 = require("./schemas");
class IngestionPipeline {
    constructor(prisma) {
        this.prisma = prisma;
    }
    processEvent(tenantId, rawEvent) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Validation
            const validationResult = schemas_1.TelecomEventValidator.safeParse(rawEvent);
            if (!validationResult.success) {
                yield this.sendToDeadLetterQueue(tenantId, rawEvent, `Validation failed: ${validationResult.error.message}`);
                return { success: false, reason: 'Validation failed' };
            }
            const event = validationResult.data;
            // 2. Deduplication & Idempotency
            const isDuplicate = yield this.prisma.ingestionEvent.findUnique({
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
                const savedEvent = yield this.prisma.ingestionEvent.create({
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
                yield this.routeEvent(tenantId, savedEvent);
                return { success: true, duplicated: false };
            }
            catch (e) {
                yield this.sendToDeadLetterQueue(tenantId, rawEvent, `Storage/Routing error: ${e.message}`);
                return { success: false, reason: e.message };
            }
        });
    }
    routeEvent(tenantId, event) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simulate routing logic (e.g., creating Alarm records)
            if (event.eventType === 'Alarm') {
                const payload = event.payload;
                yield this.prisma.alarm.create({
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
            yield this.prisma.ingestionEvent.update({
                where: { id: event.id },
                data: { processingStatus: 'PROCESSED' }
            });
        });
    }
    sendToDeadLetterQueue(tenantId, rawEvent, errorReason) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.deadLetterQueue.create({
                data: {
                    tenantId,
                    source: rawEvent.source || 'UNKNOWN',
                    sourceEventId: rawEvent.sourceEventId || null,
                    eventType: rawEvent.eventType || null,
                    payload: rawEvent || {},
                    errorReason
                }
            });
        });
    }
}
exports.IngestionPipeline = IngestionPipeline;
