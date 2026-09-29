import { z } from 'zod';

export const BaseKafkaEventSchema = z.object({
  eventId: z.string().uuid(),         // Unique correlation ID
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  version: z.string().default('v1'),
  source: z.string(),
});

export const NetworkMetricEventSchema = BaseKafkaEventSchema.extend({
  type: z.literal('metric'),
  payload: z.object({
    metricName: z.string(),
    value: z.number(),
    unit: z.string(),
    tags: z.record(z.string(), z.string()).optional()
  })
});

export const NetworkAlarmEventSchema = BaseKafkaEventSchema.extend({
  type: z.literal('alarm'),
  payload: z.object({
    alarmId: z.string(),
    severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INFO']),
    status: z.enum(['ACTIVE', 'CLEARED']),
    description: z.string()
  })
});

export type BaseKafkaEvent = z.infer<typeof BaseKafkaEventSchema>;
export type NetworkMetricEvent = z.infer<typeof NetworkMetricEventSchema>;
export type NetworkAlarmEvent = z.infer<typeof NetworkAlarmEventSchema>;
