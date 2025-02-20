import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { LoggerService } from '../logger';

@Injectable()
export class PasswordService {
  constructor() {}

  async hashPassword(password: string): Promise<string> {
    LoggerService.log('Hashing password', PasswordService.name);
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    LoggerService.log('Comparing password', PasswordService.name);
    return bcrypt.compare(password, hash);
  }
}
