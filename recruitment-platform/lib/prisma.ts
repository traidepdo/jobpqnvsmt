import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;
  
  if (typeof window === 'undefined') {
    neonConfig.webSocketConstructor = ws;
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const basePrisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = basePrisma;
}

export const prisma = new Proxy(basePrisma, {
  get(target, prop) {
    let currentPrisma = global.__prisma ?? createPrismaClient();
    if (prop === 'quiz' && (currentPrisma as any).quiz === undefined) {
      currentPrisma = createPrismaClient();
      global.__prisma = currentPrisma;
    }
    return (currentPrisma as any)[prop];
  }
});