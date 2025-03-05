import { LoggerService } from '@/logger';
import { InternalServerErrorException } from '@nestjs/common';

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
