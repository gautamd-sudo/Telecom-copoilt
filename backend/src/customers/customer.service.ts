import { PrismaClient } from '@prisma/client';

export class CustomerService {
  constructor(private readonly prisma: PrismaClient) {}

  async getCustomer360(tenantId: string, customerId: string, requesterRole: string) {
    // Permission check inside logic (e.g., Data Masking for PII)
    const isSupport = requesterRole === 'CUSTOMER_SUPPORT' || requesterRole === 'TENANT_ADMIN';
    
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        subscriptions: {
          include: { servicePlan: true, devices: true }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        intelligence: true
      }
    });

    if (!customer) throw new Error("Customer not found");

    // Data Masking
    if (!isSupport) {
      customer.email = customer.email ? '***@***.com' : null;
      customer.phone = customer.phone ? '***-***-****' : null;
    }

    return customer;
  }

  async calculateChurnRisk(tenantId: string, customerId: string) {
    // Heuristic calculation (mock AI logic)
    const events = await this.prisma.customerEvent.findMany({
      where: { tenantId, customerId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });

    let risk = 0.1; // Base risk
    let sentiment = 0.5;

    const complaints = events.filter(e => e.type === 'COMPLAINT');
    const netExpDrops = events.filter(e => e.type === 'NETWORK_EXP' && (e.metadata as any)?.quality === 'POOR');
    
    if (complaints.length > 0) {
      risk += complaints.length * 0.2;
      sentiment -= complaints.length * 0.3;
    }

    if (netExpDrops.length > 0) {
      risk += netExpDrops.length * 0.1;
      sentiment -= netExpDrops.length * 0.15;
    }

    risk = Math.min(Math.max(risk, 0), 1.0);
    sentiment = Math.min(Math.max(sentiment, -1.0), 1.0);

    return this.prisma.customerIntelligence.upsert({
      where: { customerId },
      create: {
        tenantId,
        customerId,
        churnRisk: risk,
        sentiment: sentiment,
      },
      update: {
        churnRisk: risk,
        sentiment: sentiment,
        lastCalculated: new Date()
      }
    });
  }

  async recordEvent(tenantId: string, customerId: string, type: string, description: string, metadata: any = {}) {
    const event = await this.prisma.customerEvent.create({
      data: {
        tenantId,
        customerId,
        type,
        description,
        metadata
      }
    });

    // Auto trigger recalcs on negative events
    if (['COMPLAINT', 'NETWORK_EXP'].includes(type)) {
      await this.calculateChurnRisk(tenantId, customerId);
    }

    return event;
  }

  async processInteraction(tenantId: string, customerId: string, type: string, content: string) {
    const interaction = await this.prisma.customerInteraction.create({
      data: { tenantId, customerId, type, content }
    });
    
    // In production, this would call the Python AI via HTTP
    // Here we'll mock the classification logic directly or assume it returns this struct:
    const isNegative = content.toLowerCase().includes('angry') || content.toLowerCase().includes('terrible');
    const isCancel = content.toLowerCase().includes('cancel');
    
    const sentiment = isNegative ? 'NEGATIVE' : 'NEUTRAL';
    let intent = isCancel ? 'CANCELLATION' : 'TECHNICAL_SUPPORT';
    if (content.toLowerCase().includes('bill')) intent = 'BILLING';
    
    const analysis = await this.prisma.interactionAnalysis.create({
      data: {
        interactionId: interaction.id,
        sentiment,
        intent,
        frustration: isNegative ? 0.8 : 0.1,
        urgency: isNegative ? 0.8 : 0.1,
        severity: isNegative ? 'HIGH' : 'LOW',
        confidence: 0.85,
        modelVersion: 'v1.0-sentiment-classifier',
        explanation: 'Mock integration response based on keywords'
      }
    });

    if (sentiment === 'NEGATIVE' || intent === 'CANCELLATION') {
      await this.recordEvent(tenantId, customerId, 'COMPLAINT', `Customer interaction flagged as ${intent}`);
    }

    return analysis;
  }
}
