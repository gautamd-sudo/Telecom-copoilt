export const KAFKA_TOPICS = {
  NETWORK_METRICS: 'network.metrics',
  NETWORK_EVENTS: 'network.events',
  NETWORK_ALARMS: 'network.alarms',
  NETWORK_INCIDENTS: 'network.incidents',
  CUSTOMER_EVENTS: 'customer.events',
  AI_PREDICTIONS: 'ai.predictions',
  AI_RECOMMENDATIONS: 'ai.recommendations',
  NOTIFICATIONS: 'notifications'
} as const;

export type TopicName = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];
