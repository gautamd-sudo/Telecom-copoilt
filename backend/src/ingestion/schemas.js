"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelecomEventValidator = exports.AlarmEventSchema = exports.NetworkKPIEventSchema = exports.BaseEventSchema = void 0;
const zod_1 = require("zod");
exports.BaseEventSchema = zod_1.z.object({
    source: zod_1.z.string(),
    sourceEventId: zod_1.z.string(),
    eventTime: zod_1.z.string().datetime(),
    eventType: zod_1.z.enum([
        'NetworkKPI',
        'CellStatus',
        'EquipmentStatus',
        'Alarm',
        'NetworkEvent',
        'CustomerEvent',
        'UsageEvent',
        'MaintenanceEvent'
    ]),
});
exports.NetworkKPIEventSchema = exports.BaseEventSchema.extend({
    eventType: zod_1.z.literal('NetworkKPI'),
    payload: zod_1.z.object({
        cellId: zod_1.z.string(),
        throughputGbps: zod_1.z.number().min(0),
        latencyMs: zod_1.z.number().min(0),
        packetLossRatio: zod_1.z.number().min(0).max(1)
    })
});
exports.AlarmEventSchema = exports.BaseEventSchema.extend({
    eventType: zod_1.z.literal('Alarm'),
    payload: zod_1.z.object({
        sourceId: zod_1.z.string(),
        sourceType: zod_1.z.string(),
        name: zod_1.z.string(),
        severity: zod_1.z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INFO']),
        status: zod_1.z.enum(['ACTIVE', 'CLEARED'])
    })
});
// A catch-all validator that routes to the correct schema
exports.TelecomEventValidator = zod_1.z.union([
    exports.NetworkKPIEventSchema,
    exports.AlarmEventSchema,
    // Others would be mapped here
]).or(exports.BaseEventSchema.extend({ payload: zod_1.z.any() })); // Fallback for basic validation
