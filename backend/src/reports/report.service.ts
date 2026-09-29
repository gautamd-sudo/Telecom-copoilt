import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export class ReportService {
  constructor(private readonly prisma: PrismaClient) {}

  async requestReport(tenantId: string, templateId: string, requestedBy: string, userRole: string) {
    const template = await this.prisma.reportTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Template not found');

    const allowedRoles = template.rolesAllowed as string[];
    if (!allowedRoles.includes(userRole) && userRole !== 'PLATFORM_SUPER_ADMIN' && userRole !== 'TENANT_ADMIN') {
      throw new Error(`Unauthorized: Role ${userRole} cannot access this report.`);
    }

    const execution = await this.prisma.reportExecution.create({
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
    this.generateReportContent(execution.id, template).catch((err: Error) => {
      const { logger } = require('../api/observability');
      logger.error({ err: err.message }, 'Report generation failed');
    });

    return execution;
  }

  private async generateReportContent(executionId: string, template: any) {
    await this.prisma.reportExecution.update({
      where: { id: executionId },
      data: { status: 'GENERATING' }
    });

    try {
      let dataString = '';

      // Pull actual tenant data based on report type
      if (template.type === 'INCIDENT') {
        const incidents = await this.prisma.incident.findMany({ where: { tenantId: template.tenantId } });
        dataString = incidents.map(i => `${i.id},${i.status},${i.severity}`).join('\n');
      } else if (template.type === 'CHURN') {
        const intel = await this.prisma.customerIntelligence.findMany({ where: { tenantId: template.tenantId } });
        dataString = intel.map(i => `${i.customerId},${i.churnRisk},${i.sentiment}`).join('\n');
      } else if (template.type === 'REVENUE_LEAKAGE') {
        const cases = await this.prisma.revenueLeakageCase.findMany({ where: { tenantId: template.tenantId } });
        dataString = cases.map(c => `${c.id},${c.type},${c.estimatedImpact},${c.status}`).join('\n');
      } else {
        dataString = `Generic data for ${template.type}`;
      }

      // Simulate document creation
      const dir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      
      const fileName = `${template.type}_${executionId}.${template.format.toLowerCase()}`;
      const filePath = path.join(dir, fileName);
      
      fs.writeFileSync(filePath, `--- TELECOM REPORT: ${template.name} ---\n\n${dataString}`);

      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: { 
          status: 'COMPLETED', 
          artifactUrl: `/api/reports/download/${fileName}`,
          completedAt: new Date()
        }
      });
      
      // Abstract Email Delivery
      if (template.emailRecipients && Array.isArray(template.emailRecipients) && template.emailRecipients.length > 0) {
        const { logger } = require('../api/observability'); logger.info(`Report delivered to: ${template.emailRecipients.join(', ')}`);
      }

    } catch (e: any) {
      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: { status: 'FAILED', error: e.message, completedAt: new Date() }
      });
    }
  }
}
