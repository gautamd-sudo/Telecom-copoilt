import { PrismaClient, Network } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class NetworkRepository extends BaseRepository<Network> {
  constructor(prisma: PrismaClient, tenantId: string) {
    super(prisma, prisma.network, tenantId);
  }

  async findActiveNetworks() {
    return this.findMany({
      where: {
        deletedAt: null
      }
    });
  }
}
