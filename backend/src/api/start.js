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
const server_1 = require("./server");
const client_1 = require("@prisma/client");
const PORT = parseInt(process.env.PORT || '3001', 10);
const server = server_1.app.listen(PORT, () => {
    console.log(`Backend API server listening on http://localhost:${PORT}`);
});
// Production graceful shutdown
const gracefulShutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Received ${signal}. Gracefully stopping backend server...`);
    server.close(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const prisma = new client_1.PrismaClient();
            yield prisma.$disconnect();
        }
        catch (_a) { }
        process.exit(0);
    }));
    setTimeout(() => process.exit(1), 10000).unref();
});
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
