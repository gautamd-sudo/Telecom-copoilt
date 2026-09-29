import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  private generateSignature(tenantId: string, alertType: string, severity: string, entityId: string): string {
    return crypto.createHash('sha256').update(`${tenantId}:${alertType}:${severity}:${entityId}`).digest('hex');
  }

  async processAlert(tenantId: string, alertType: string, severity: string, entityId: string, payload: any, correlationId?: string) {
    const signature = this.generateSignature(tenantId, alertType, severity, entityId);

    // 1. Grouping and Cooldown Check
    let grouping = await this.prisma.alertGrouping.findUnique({ where: { signature } });
    const now = new Date();

    if (!grouping) {
      grouping = await this.prisma.alertGrouping.create({
        data: { tenantId, signature, count: 1, lastSeen: now }
      });
    } else {
      grouping = await this.prisma.alertGrouping.update({
        where: { id: grouping.id },
        data: { count: grouping.count + 1, lastSeen: now }
      });
    }

    if (grouping.status === 'SUPPRESSED') {
      return { status: 'SUPPRESSED', message: 'Alert storm prevented via manual suppression.' };
    }

    // Check rules for cooldown
    const rules = await this.prisma.notificationRule.findMany({
      where: { tenantId, alertType, isActive: true }
    });

    // Filter rules by severity
    const matchingRules = rules.filter(r => (r.severities as string[]).includes(severity));

    if (matchingRules.length === 0) {
      return { status: 'IGNORED', message: 'No matching rules for this alert type and severity.' };
    }

    // Determine min cooldown
    const minCooldown = Math.min(...matchingRules.map(r => r.cooldownMinutes));

    if (grouping.lastNotified && (now.getTime() - grouping.lastNotified.getTime()) < minCooldown * 60000) {
      return { status: 'COOLDOWN', message: `Alert grouping active. Suppressed until cooldown of ${minCooldown}m expires.` };
    }

    // 2. Dispatch Channels (Mocked abstract dispatch)
    const channelsToDispatch = new Set<string>();
    for (const rule of matchingRules) {
      for (const channel of rule.channels as string[]) {
        channelsToDispatch.add(channel);
      }
    }

    const dispatched = Array.from(channelsToDispatch);
    this.dispatchToChannels(dispatched, payload, correlationId);

    // 3. Update Last Notified
    await this.prisma.alertGrouping.update({
      where: { id: grouping.id },
      data: { lastNotified: now }
    });

    return { status: 'DISPATCHED', channels: dispatched, eventCount: grouping.count };
  }

  private dispatchToChannels(channels: string[], payload: any, correlationId?: string) {
    const { notificationErrorsTotal, logger } = require('../api/observability');
    channels.forEach(channel => {
      try {
        if (Math.random() < 0.05) throw new Error("Mock Dispatch Failure");
        logger.info({ channel, correlationId }, `[Notification Dispatcher] Sending payload to ${channel}`);
      } catch (err: any) {
        notificationErrorsTotal.inc({ channel });
        logger.error({ channel, correlationId, err: err.message }, `Failed to send notification`);
      }
    });
  }

  async suppressGrouping(signature: string) {
    return this.prisma.alertGrouping.update({
      where: { signature },
      data: { status: 'SUPPRESSED' }
    });
  }
}
