import { BadRequestException, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { LoggerService } from '../logger';

@Injectable()
export class PasswordService {
  constructor() {}

  async hashPassword(password: string): Promise<string> {
    try {
      LoggerService.log('ℹ️ Hashing password', PasswordService.name);
      return await bcrypt.hash(password, 10);
    } catch (error) {
      LoggerService.error('❌ Error hashing password', PasswordService.name);
      if (!(error instanceof BadRequestException)) {
        throw new BadRequestException('Error hashing password');
      }
      throw error;
    }
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      LoggerService.log('ℹ️ Comparing password', PasswordService.name);
      return await bcrypt.compare(password, hash);
    } catch (error) {
      LoggerService.error('❌ Error comparing password', PasswordService.name);
      if (!(error instanceof BadRequestException)) {
        throw new BadRequestException('Error comparing password');
      }
      throw error;
    }
  }
}
