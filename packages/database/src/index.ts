// ============================================
// @brunch/database — Entry point
// ============================================
// Re-exports PrismaClient for use across the monorepo

export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';

// Singleton pattern to avoid multiple PrismaClient instances in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
