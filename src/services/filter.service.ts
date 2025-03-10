/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '@/database';
import { getAllowedSortFields, getModelDelegate, ModelDelegates, SortOrder } from '@/shared';

@Injectable()
export class FilterService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getValidSortField<T extends keyof PrismaClient>(
    modelName: T,
    sortBy: string | undefined,
    sortOrder: string | undefined
  ): Promise<{ sortBy: string; sortOrder: SortOrder }> {
    const model = getModelDelegate(modelName, this.databaseService);
    const allowedSortFields = await getAllowedSortFields(modelName, this.databaseService);

    const cleanValue = (value?: string) =>
      value ? value.trim().replace(/^['"](.*)['"]$/, '$1') : undefined;

    const cleanedSortBy = cleanValue(sortBy);
    const cleanedSortOrder = cleanValue(sortOrder);

    const validSortOrders: SortOrder[] = ['asc', 'desc'];
    const finalSortOrder: SortOrder = validSortOrders.includes(cleanedSortOrder as SortOrder)
      ? (cleanedSortOrder as SortOrder)
      : 'desc';
    const hasUpdated = await model.findFirst({
      where: { updatedAt: { not: null } },
      select: { updatedAt: true },
    });
    const finalSortBy =
      cleanedSortBy && allowedSortFields.includes(cleanedSortBy)
        ? cleanedSortBy
        : hasUpdated
          ? 'updatedAt'
          : 'createdAt';

    return { sortBy: finalSortBy, sortOrder: finalSortOrder };
  }
}
