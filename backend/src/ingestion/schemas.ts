import { z } from 'zod';

export const BaseEventSchema = z.object({
  source: z.string(),
  sourceEventId: z.string(),
  eventTime: z.string().datetime(),
  eventType: z.enum([
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

export const NetworkKPIEventSchema = BaseEventSchema.extend({
  eventType: z.literal('NetworkKPI'),
  payload: z.object({
    cellId: z.string(),
    throughputGbps: z.number().min(0),
    latencyMs: z.number().min(0),
    packetLossRatio: z.number().min(0).max(1)
  })
});

export const AlarmEventSchema = BaseEventSchema.extend({
  eventType: z.literal('Alarm'),
  payload: z.object({
    sourceId: z.string(),
    sourceType: z.string(),
    name: z.string(),
    severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INFO']),
    status: z.enum(['ACTIVE', 'CLEARED'])
  })
});

// A catch-all validator that routes to the correct schema
export const TelecomEventValidator = z.union([
  NetworkKPIEventSchema,
  AlarmEventSchema,
  // Others would be mapped here
]).or(BaseEventSchema.extend({ payload: z.any() })); // Fallback for basic validation
