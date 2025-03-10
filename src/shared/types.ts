import { PrismaClient } from '@prisma/client';

export type SortOrder = 'asc' | 'desc';

export type ModelDelegates = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { findMany: any; count: any; findFirst: any }
    ? PrismaClient[K]
    : never;
};
