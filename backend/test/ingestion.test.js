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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pipeline_1 = require("../src/ingestion/pipeline");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('Telecom Data Ingestion Framework', () => {
    let prisma;
    let pipeline;
    let tenantId;
    let fixtures;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        prisma = new client_1.PrismaClient();
        pipeline = new pipeline_1.IngestionPipeline(prisma);
        // Load fixtures
        const fixturePath = path.join(__dirname, 'fixtures', 'telecom-events.json');
        fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        // Setup Tenant
        yield prisma.ingestionEvent.deleteMany();
        yield prisma.deadLetterQueue.deleteMany();
        yield prisma.alarm.deleteMany();
        const tenant = yield prisma.tenant.create({ data: { name: 'Ingestion Test Tenant' } });
        tenantId = tenant.id;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.$disconnect();
    }));
    it('should successfully ingest and route a valid NetworkKPI event', () => __awaiter(void 0, void 0, void 0, function* () {
        const event = fixtures[0];
        const result = yield pipeline.processEvent(tenantId, event);
        expect(result.success).toBe(true);
        expect(result.duplicated).toBe(false);
        const storedEvent = yield prisma.ingestionEvent.findUnique({
            where: {
                tenantId_source_sourceEventId: {
                    tenantId,
                    source: event.source,
                    sourceEventId: event.sourceEventId
                }
            }
        });
        expect(storedEvent).toBeDefined();
        expect(storedEvent === null || storedEvent === void 0 ? void 0 : storedEvent.processingStatus).toBe('PROCESSED');
        expect(storedEvent === null || storedEvent === void 0 ? void 0 : storedEvent.eventType).toBe('NetworkKPI');
    }));
    it('should successfully ingest, route, and create downstream records for an Alarm event', () => __awaiter(void 0, void 0, void 0, function* () {
        const event = fixtures[1];
        const result = yield pipeline.processEvent(tenantId, event);
        expect(result.success).toBe(true);
        const alarm = yield prisma.alarm.findFirst({
            where: { sourceId: event.payload.sourceId, tenantId }
        });
        expect(alarm).toBeDefined();
        expect(alarm === null || alarm === void 0 ? void 0 : alarm.name).toBe('BGP Session Down');
        expect(alarm === null || alarm === void 0 ? void 0 : alarm.severity).toBe('CRITICAL');
    }));
    it('should handle duplicates idempotently', () => __awaiter(void 0, void 0, void 0, function* () {
        const event = fixtures[0]; // Already ingested in first test
        const result = yield pipeline.processEvent(tenantId, event);
        expect(result.success).toBe(true);
        expect(result.duplicated).toBe(true); // Should identify as dup
        // Count should still be 1
        const count = yield prisma.ingestionEvent.count({
            where: { sourceEventId: event.sourceEventId }
        });
        expect(count).toBe(1);
    }));
    it('should route invalid events to the Dead Letter Queue', () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidEvent = fixtures[2];
        const result = yield pipeline.processEvent(tenantId, invalidEvent);
        expect(result.success).toBe(false);
        const dlq = yield prisma.deadLetterQueue.findFirst({
            where: { source: invalidEvent.source, tenantId }
        });
        expect(dlq).toBeDefined();
        expect(dlq === null || dlq === void 0 ? void 0 : dlq.errorReason).toContain('Validation failed');
    }));
});
