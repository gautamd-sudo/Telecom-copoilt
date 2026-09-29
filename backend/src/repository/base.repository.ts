import { PrismaClient } from '@prisma/client';

export class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: any, // The specific Prisma model delegate (e.g., prisma.network)
    protected readonly tenantId: string
  ) {}

  async findMany(args: any = {}): Promise<T[]> {
    return this.model.findMany({
      ...args,
      where: {
        ...args.where,
        tenantId: this.tenantId,
        deletedAt: null // Soft delete
      }
    });
  }

  async findUnique(args: any): Promise<T | null> {
    const record = await this.model.findUnique(args);
    if (!record || record.tenantId !== this.tenantId || record.deletedAt !== null) {
      return null;
    }
    return record;
  }

  async create(args: any): Promise<T> {
    return this.model.create({
      ...args,
      data: {
        ...args.data,
        tenantId: this.tenantId
      }
    });
  }

  async update(args: any): Promise<T> {
    // Ensure the record belongs to the tenant before updating
    const existing = await this.findUnique({ where: args.where });
    if (!existing) {
      throw new Error("Record not found or access denied");
    }

    return this.model.update(args);
  }

  async softDelete(args: any): Promise<T> {
    const existing = await this.findUnique({ where: args.where });
    if (!existing) {
      throw new Error("Record not found or access denied");
    }

    return this.model.update({
      where: args.where,
      data: { deletedAt: new Date() }
    });
  }
}
