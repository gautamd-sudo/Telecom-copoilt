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
exports.LeakageService = void 0;
class LeakageService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    processLeakageCases(tenantId, casesPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            // In production, the python script returns this payload.
            // We ingest it into our RevenueLeakageCase table.
            const cases = [];
            for (const c of casesPayload) {
                const created = yield this.prisma.revenueLeakageCase.create({
                    data: {
                        tenantId,
                        type: c.type,
                        estimatedImpact: c.estimated_impact,
                        currency: 'USD',
                        evidence: c.evidence,
                        affectedRecords: c.affected_records,
                        detectionMethod: c.detection_method,
                        confidence: c.confidence,
                        status: 'OPEN'
                    }
                });
                cases.push(created);
            }
            return cases;
        });
    }
    getLeakageDashboard(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cases = yield this.prisma.revenueLeakageCase.findMany({
                where: { tenantId },
                orderBy: { estimatedImpact: 'desc' }
            });
            const openCases = cases.filter(c => c.status === 'OPEN' || c.status === 'INVESTIGATING');
            const totalImpact = openCases.reduce((acc, c) => acc + c.estimatedImpact, 0);
            return {
                totalImpact,
                openCaseCount: openCases.length,
                cases: openCases
            };
        });
    }
    updateCaseStatus(tenantId, caseId, status, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.revenueLeakageCase.update({
                where: { id: caseId, tenantId },
                data: { status, notes }
            });
        });
    }
}
exports.LeakageService = LeakageService;
