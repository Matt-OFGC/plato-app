import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client instance
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.DEBUG_PRISMA ? ['query', 'error', 'warn'] : ['error'],
});

// Debug: Verify models are available
if (process.env.NODE_ENV !== 'production') {
  if (!prisma.trainingModule) {
    console.error('[PRISMA] trainingModule is undefined!');
    console.error('[PRISMA] Available models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
  }
  if (!prisma.trainingContent) {
    console.error('[PRISMA] trainingContent is undefined!');
  }
}

if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };

