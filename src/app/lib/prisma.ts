import { PrismaClient } from "@/generated/prisma";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Optimized Prisma configuration for production performance
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool optimization for high traffic
  // Neon (serverless Postgres) works best with connection pooling
  // These settings prevent connection exhaustion under load
}).$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        const result = await query(args);
        const end = performance.now();
        
        // Log slow queries in development
        if (process.env.NODE_ENV === "development" && end - start > 1000) {
          console.warn(`Slow query detected: ${model}.${operation} took ${Math.round(end - start)}ms`);
        }
        
        return result;
      },
    },
  },
});

export const prisma = global.prisma ?? prismaClient;

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}


