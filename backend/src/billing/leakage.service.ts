import { PrismaClient } from '@prisma/client';

export class LeakageService {
  constructor(private readonly prisma: PrismaClient) {}

  async processLeakageCases(tenantId: string, casesPayload: any[]) {
    // In production, the python script returns this payload.
    // We ingest it into our RevenueLeakageCase table.
    
    const cases = [];
    
    for (const c of casesPayload) {
      const created = await this.prisma.revenueLeakageCase.create({
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
  }

  async getLeakageDashboard(tenantId: string) {
    const cases = await this.prisma.revenueLeakageCase.findMany({
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
  }

  async updateCaseStatus(tenantId: string, caseId: string, status: string, notes: string) {
    return this.prisma.revenueLeakageCase.update({
      where: { id: caseId, tenantId },
      data: { status, notes }
    });
  }
}
