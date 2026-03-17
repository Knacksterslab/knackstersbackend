/**
 * Prisma Client Singleton
 * Ensures only one instance of Prisma Client is created
 * Prevents connection pool exhaustion in development
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaLogConfig: Array<'error' | 'warn' | { emit: 'event'; level: 'error' | 'warn' | 'query' }> = [
  { emit: 'event', level: 'error' },
  { emit: 'event', level: 'warn' },
];

if (process.env.PRISMA_DEBUG_QUERIES === 'true') {
  prismaLogConfig.push({ emit: 'event', level: 'query' });
}

export const prisma = globalForPrisma.prisma || new PrismaClient({ log: prismaLogConfig });

type PrismaClientWithEventLogging = PrismaClient & {
  $on(eventType: 'error' | 'warn' | 'query', callback: (event: any) => void): void;
};

const prismaWithEvents = prisma as PrismaClientWithEventLogging;

prismaWithEvents.$on('error', (event) => {
  logger.error('Prisma error event', {
    message: event.message,
    target: event.target,
    timestamp: event.timestamp,
  });
});

prismaWithEvents.$on('warn', (event) => {
  logger.warn('Prisma warning event', {
    message: event.message,
    target: event.target,
    timestamp: event.timestamp,
  });
});

if (process.env.PRISMA_DEBUG_QUERIES === 'true') {
  prismaWithEvents.$on('query', (event) => {
    logger.debug('Prisma query event', {
      durationMs: event.duration,
      query: event.query,
      params: event.params,
      target: event.target,
      timestamp: event.timestamp,
    });
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
