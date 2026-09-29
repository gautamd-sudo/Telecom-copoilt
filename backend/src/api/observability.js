"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsEndpoint = exports.requestLogger = exports.correlationIdMiddleware = exports.logger = exports.notificationErrorsTotal = exports.kafkaLagGauge = exports.dbQueryDuration = exports.httpRequestDurationMicroseconds = void 0;
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const prom_client_1 = __importDefault(require("prom-client"));
// Prometheus Metrics Registry
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register, prefix: 'telecom_api_' });
// Custom Metrics
exports.httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [10, 50, 100, 300, 500, 1000, 3000]
});
register.registerMetric(exports.httpRequestDurationMicroseconds);
exports.dbQueryDuration = new prom_client_1.default.Histogram({
    name: 'db_query_duration_ms',
    help: 'Duration of Database queries in ms',
    labelNames: ['model', 'operation'],
    buckets: [1, 5, 10, 50, 100, 500]
});
register.registerMetric(exports.dbQueryDuration);
exports.kafkaLagGauge = new prom_client_1.default.Gauge({
    name: 'kafka_consumer_lag',
    help: 'Kafka consumer lag per topic',
    labelNames: ['topic', 'partition']
});
register.registerMetric(exports.kafkaLagGauge);
exports.notificationErrorsTotal = new prom_client_1.default.Counter({
    name: 'notification_errors_total',
    help: 'Total failed notifications',
    labelNames: ['channel']
});
register.registerMetric(exports.notificationErrorsTotal);
// Structured Logger
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => { return { level: label }; },
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
});
// Correlation ID Middleware
const crypto = __importStar(require("crypto"));
const correlationIdMiddleware = (req, res, next) => {
    const reqId = req.headers['x-correlation-id'] || crypto.randomUUID();
    req.headers['x-correlation-id'] = reqId;
    res.setHeader('X-Correlation-ID', reqId);
    req.id = reqId; // Attach to request
    next();
};
exports.correlationIdMiddleware = correlationIdMiddleware;
// Pino Request Logging Middleware (Injects Correlation ID)
exports.requestLogger = (0, pino_http_1.default)({
    logger: exports.logger,
    genReqId: function (req) { return req.headers['x-correlation-id'] || 'system'; },
    customProps: (req, res) => {
        return {
            correlation_id: req.headers['x-correlation-id']
        };
    }
});
const metricsEndpoint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.set('Content-Type', register.contentType);
    res.end(yield register.metrics());
});
exports.metricsEndpoint = metricsEndpoint;
