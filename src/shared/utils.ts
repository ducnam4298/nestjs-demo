import { InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '@/logger';

export const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  return local && domain ? `${local[0]}***@${domain}` : email;
};

export const retryTransaction = async <T>(
  transactionFn: () => Promise<T>,
  context?: string,
  maxRetries = 3
): Promise<T> => {
  let attempt = 0;
  let lastError: string = '';
  while (attempt < maxRetries) {
    try {
      return await transactionFn();
    } catch (error) {
      attempt++;
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      lastError = errorMessage;
      LoggerService.warn(`🚨 Transaction attempt ${attempt} failed`, context);
    }
  }
  LoggerService.error(`Transaction failed after ${maxRetries} retries`, lastError);
  throw new InternalServerErrorException('Transaction failed after maximum retries');
};

export function sanitizeFilters<T extends Record<string, any>>(filters: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([_, value]) => value !== '' && value !== '""' && value !== "''")
      .map(([key, value]) => [
        key,
        typeof value === 'string'
          ? { contains: value.replace(/^"(.*)"$/, '$1'), mode: 'insensitive' }
          : value,
      ])
  ) as Partial<T>;
}

export const getAllowedSortFields = async (
  prisma: PrismaClient,
  tableName: string
): Promise<string[]> => {
  const formattedTableName = tableName.charAt(0).toUpperCase() + tableName.slice(1).toLowerCase();
  const result: { column_name: string }[] = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = ${formattedTableName}
  `;
  console.log('Columns Name:', result);

  return result.map(row => row.column_name);
};

type SortOrder = 'asc' | 'desc';

export const getValidSortField = async <T extends keyof PrismaClient>(
  modelName: string,
  sortBy: string | undefined,
  sortOrder: string | undefined,
  hasUpdatedAt: boolean
): Promise<{ sortBy: string; sortOrder: SortOrder }> => {
  const prisma = new PrismaClient();

  const allowedSortFields = await getAllowedSortFields(prisma, modelName);

  const cleanValue = (value?: string) =>
    value ? value.trim().replace(/^['"](.*)['"]$/, '$1') : undefined;

  const cleanedSortBy = cleanValue(sortBy);
  const cleanedSortOrder = cleanValue(sortOrder);

  const validSortOrders: SortOrder[] = ['asc', 'desc'];
  const finalSortOrder: SortOrder = validSortOrders.includes(cleanedSortOrder as SortOrder)
    ? (cleanedSortOrder as SortOrder)
    : 'desc';

  const finalSortBy =
    cleanedSortBy && allowedSortFields.includes(cleanedSortBy)
      ? cleanedSortBy
      : hasUpdatedAt
        ? 'updatedAt'
        : 'createdAt';

  return { sortBy: finalSortBy, sortOrder: finalSortOrder };
};
