import pino from 'pino';
import pinoHttp from 'pino-http';

import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Prometheus Metrics Registry
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: 'telecom_api_' });

// Custom Metrics
export const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 300, 500, 1000, 3000]
});
register.registerMetric(httpRequestDurationMicroseconds);

export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of Database queries in ms',
  labelNames: ['model', 'operation'],
  buckets: [1, 5, 10, 50, 100, 500]
});
register.registerMetric(dbQueryDuration);

export const kafkaLagGauge = new promClient.Gauge({
  name: 'kafka_consumer_lag',
  help: 'Kafka consumer lag per topic',
  labelNames: ['topic', 'partition']
});
register.registerMetric(kafkaLagGauge);

export const notificationErrorsTotal = new promClient.Counter({
  name: 'notification_errors_total',
  help: 'Total failed notifications',
  labelNames: ['channel']
});
register.registerMetric(notificationErrorsTotal);

// Structured Logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => { return { level: label }; },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Correlation ID Middleware
import * as crypto from 'crypto';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  req.headers['x-correlation-id'] = reqId;
  res.setHeader('X-Correlation-ID', reqId);
  req.id = reqId; // Attach to request
  next();
};

// Pino Request Logging Middleware (Injects Correlation ID)
export const requestLogger = pinoHttp({
  logger,
  genReqId: function (req) { return (req.headers['x-correlation-id'] as string) || 'system' },
  customProps: (req, res) => {
    return {
      correlation_id: req.headers['x-correlation-id']
    };
  }
});

export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
