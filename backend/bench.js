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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./src/api/server");
const supertest_1 = __importDefault(require("supertest"));
const client_1 = require("@prisma/client");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const prisma = new client_1.PrismaClient();
        const token = 'perf-test-token';
        console.log("Measuring Baseline (100 reqs):");
        let start = Date.now();
        for (let i = 0; i < 100; i++) {
            yield (0, supertest_1.default)(server_1.app).get('/api/v1/incidents?status=OPEN').set('Authorization', 'Bearer ' + token);
        }
        console.log(`Baseline Latency: ${(Date.now() - start) / 100} ms/req`);
        console.log("\nSimulating Redis Cache...");
        const fakeCache = new Map();
        // Override incident route temporarily for test
        server_1.app.get('/api/v1/incidents_cached', (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (fakeCache.has('open_incidents')) {
                return res.status(200).json(fakeCache.get('open_incidents'));
            }
            const incidents = yield prisma.incident.findMany({ where: { status: 'OPEN' }, take: 50 });
            fakeCache.set('open_incidents', { status: 'success', data: incidents });
            res.status(200).json({ status: 'success', data: incidents });
        }));
        start = Date.now();
        for (let i = 0; i < 100; i++) {
            yield (0, supertest_1.default)(server_1.app).get('/api/v1/incidents_cached').set('Authorization', 'Bearer ' + token);
        }
        console.log(`Cached Latency: ${(Date.now() - start) / 100} ms/req`);
        process.exit(0);
    });
}
run();
