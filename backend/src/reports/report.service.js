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
exports.ReportService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ReportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    requestReport(tenantId, templateId, requestedBy, userRole) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.prisma.reportTemplate.findUnique({ where: { id: templateId } });
            if (!template)
                throw new Error('Template not found');
            const allowedRoles = template.rolesAllowed;
            if (!allowedRoles.includes(userRole) && userRole !== 'PLATFORM_SUPER_ADMIN' && userRole !== 'TENANT_ADMIN') {
                throw new Error(`Unauthorized: Role ${userRole} cannot access this report.`);
            }
            const execution = yield this.prisma.reportExecution.create({
                data: {
                    tenantId,
                    templateId,
                    status: 'PENDING',
                    format: template.format,
                    requestedBy
                }
            });
            // In a real system, this goes to a Queue (Kafka/SQS) for background processing.
            // For now, we fire and forget the generation asynchronously.
            this.generateReportContent(execution.id, template).catch((err) => {
                const { logger } = require('../api/observability');
                logger.error({ err: err.message }, 'Report generation failed');
            });
            return execution;
        });
    }
    generateReportContent(executionId, template) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.reportExecution.update({
                where: { id: executionId },
                data: { status: 'GENERATING' }
            });
            try {
                let dataString = '';
                // Pull actual tenant data based on report type
                if (template.type === 'INCIDENT') {
                    const incidents = yield this.prisma.incident.findMany({ where: { tenantId: template.tenantId } });
                    dataString = incidents.map(i => `${i.id},${i.status},${i.severity}`).join('\n');
                }
                else if (template.type === 'CHURN') {
                    const intel = yield this.prisma.customerIntelligence.findMany({ where: { tenantId: template.tenantId } });
                    dataString = intel.map(i => `${i.customerId},${i.churnRisk},${i.sentiment}`).join('\n');
                }
                else if (template.type === 'REVENUE_LEAKAGE') {
                    const cases = yield this.prisma.revenueLeakageCase.findMany({ where: { tenantId: template.tenantId } });
                    dataString = cases.map(c => `${c.id},${c.type},${c.estimatedImpact},${c.status}`).join('\n');
                }
                else {
                    dataString = `Generic data for ${template.type}`;
                }
                // Simulate document creation
                const dir = path_1.default.join(process.cwd(), 'reports');
                if (!fs_1.default.existsSync(dir))
                    fs_1.default.mkdirSync(dir);
                const fileName = `${template.type}_${executionId}.${template.format.toLowerCase()}`;
                const filePath = path_1.default.join(dir, fileName);
                fs_1.default.writeFileSync(filePath, `--- TELECOM REPORT: ${template.name} ---\n\n${dataString}`);
                yield this.prisma.reportExecution.update({
                    where: { id: executionId },
                    data: {
                        status: 'COMPLETED',
                        artifactUrl: `/api/reports/download/${fileName}`,
                        completedAt: new Date()
                    }
                });
                // Abstract Email Delivery
                if (template.emailRecipients && Array.isArray(template.emailRecipients) && template.emailRecipients.length > 0) {
                    const { logger } = require('../api/observability');
                    logger.info(`Report delivered to: ${template.emailRecipients.join(', ')}`);
                }
            }
            catch (e) {
                yield this.prisma.reportExecution.update({
                    where: { id: executionId },
                    data: { status: 'FAILED', error: e.message, completedAt: new Date() }
                });
            }
        });
    }
}
exports.ReportService = ReportService;
