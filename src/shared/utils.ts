import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { isValidNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { LoggerService } from '@/services';
import { DatabaseService } from '@/database';
import { ModelDelegates } from '.';

export const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  return local && domain ? `${local[0]}***@${domain}` : email;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function isValidPhoneNumber(phone: string): boolean {
  try {
    if (!phone.startsWith('+')) {
      LoggerService.error(`❌ Phone number missing country code: ${phone}`, 'PhoneValidation');
      throw new BadRequestException(
        'Phone number must include country code (e.g., +84 for Vietnam)'
      );
    }

    const phoneNumber = parsePhoneNumberWithError(phone);

    if (!isValidNumber(phoneNumber.number, phoneNumber.country)) {
      LoggerService.error(`❌ Invalid phone number: ${phone}`, 'PhoneValidation');
      throw new BadRequestException('Invalid phone number');
    }

    LoggerService.debug(
      `✅ Valid phone number: ${phoneNumber.number} (Country: ${phoneNumber.country})`,
      'PhoneValidation'
    );
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    LoggerService.error(
      `❌ Error validating phone number (${phone}): ${errorMessage}`,
      'PhoneValidation'
    );
    throw new BadRequestException(`Invalid phone number: ${errorMessage}`);
  }
}

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
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      if (error instanceof NotFoundException) {
        LoggerService.error(
          `❌ Transaction failed due to NotFoundException: ${errorMessage}`,
          context
        );
        throw error;
      }
      attempt++;
      lastError = errorMessage;
      LoggerService.warn(`🚨 Transaction attempt ${attempt + 1} failed: ${lastError}`, context);
    }
  }

  LoggerService.error(`❌ Transaction failed after ${maxRetries} retries: ${lastError}`, context);
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

export const getAllowedSortFields = async <T extends keyof ModelDelegates>(
  model: T,
  dbService: DatabaseService
): Promise<string[]> => {
  const formattedTableName =
    String(model).charAt(0).toUpperCase() + String(model).slice(1).toLowerCase();
  const result: { column_name: string }[] = await dbService.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = ${formattedTableName}
  `;
  return result.map(row => row.column_name);
};

export const getModelDelegate = <T extends keyof ModelDelegates>(
  model: T,
  dbService: ModelDelegates
): ModelDelegates[T] => {
  return dbService[model];
};

export const buildWhereClause = (filters: Record<string, any>) => {
  const where: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string') {
      where[key] = { contains: value, mode: 'insensitive' };
    } else if (typeof value === 'number') {
      where[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      where[key] = value;
    }
  });

  return where;
};

export const buildAppLink = (path: string) => {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  let baseUrl: string;

  switch (env) {
    case 'production':
      baseUrl = `https://nestjsbase.vercel.app`;
      break;
    case 'preview':
      baseUrl = `https://nestjsbase-preview.vercel.app`;
      break;
    default:
      baseUrl = `http://localhost:3000`;
      break;
  }
  const urlLink = `${baseUrl}/${path}`;
  LoggerService.log(`ℹ️ Email link generated: ${urlLink}`, 'Utils');
  return urlLink;
};

export const validateIdsExistence = (existingIds: string[], ids: string[], allowPartial = true) => {
  if (!ids?.length) return [];

  const invalidIds: string[] = ids.filter(id => !existingIds.includes(id));

  if (invalidIds.length > 0) {
    const warningMessage = `🚨 These Ids are invalid: ${invalidIds.join(', ')}`;
    if (allowPartial) {
      LoggerService.warn(warningMessage);
    } else {
      throw new BadRequestException(warningMessage);
    }
  }
  return existingIds;
};
