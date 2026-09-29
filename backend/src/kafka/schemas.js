"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkAlarmEventSchema = exports.NetworkMetricEventSchema = exports.BaseKafkaEventSchema = void 0;
const zod_1 = require("zod");
exports.BaseKafkaEventSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(), // Unique correlation ID
    tenantId: zod_1.z.string().uuid(),
    timestamp: zod_1.z.string().datetime(),
    version: zod_1.z.string().default('v1'),
    source: zod_1.z.string(),
});
exports.NetworkMetricEventSchema = exports.BaseKafkaEventSchema.extend({
    type: zod_1.z.literal('metric'),
    payload: zod_1.z.object({
        metricName: zod_1.z.string(),
        value: zod_1.z.number(),
        unit: zod_1.z.string(),
        tags: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional()
    })
});
exports.NetworkAlarmEventSchema = exports.BaseKafkaEventSchema.extend({
    type: zod_1.z.literal('alarm'),
    payload: zod_1.z.object({
        alarmId: zod_1.z.string(),
        severity: zod_1.z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INFO']),
        status: zod_1.z.enum(['ACTIVE', 'CLEARED']),
        description: zod_1.z.string()
    })
});
