/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '@/database';
import { PaginationResponseDto, buildWhereClause, getModelDelegate } from '@/shared';
import { LoggerService } from '.';

@Injectable()
export class PaginationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async paginate<T extends keyof PrismaClient>(
    modelName: T,
    filters: object,
    page: number,
    pageRecords: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) {
    const model = getModelDelegate(modelName, this.databaseService);
    if (!model) {
      LoggerService.warn(`🚨 Model ${String(modelName)} not found`, PaginationService.name);
      throw new NotFoundException(`Model ${String(modelName)} not found`);
    }
    const where = buildWhereClause(filters);
    const skip = (page - 1) * pageRecords;
    const take = pageRecords;
    if (modelName in this.databaseService) {
      const [data, totalRecord] = await Promise.all([
        model.findMany({
          where: Object.keys(where).length ? where : undefined,
          skip,
          take,
          orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
        }),
        model.count({
          where: Object.keys(where).length ? where : undefined,
        }),
      ]);

      LoggerService.log(`✅ Found ${data.length} ${String(modelName)}`, PaginationService.name);
      return new PaginationResponseDto(data, totalRecord, page, pageRecords);
    }
  }
}
