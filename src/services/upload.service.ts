import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '@/database';

@Injectable()
export class UploadService {
  constructor(private readonly databaseService: DatabaseService) {}
}
