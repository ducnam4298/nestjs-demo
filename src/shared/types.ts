import { PrismaClient } from '@prisma/client';

export type SortOrder = 'asc' | 'desc';

export type ModelDelegates = {
  [T in keyof PrismaClient]: PrismaClient[T] extends { findMany: any; count: any; findFirst: any }
    ? PrismaClient[T]
    : never;
};
