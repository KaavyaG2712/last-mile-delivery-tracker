import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith('file:')) {
    return envUrl;
  }

  // Running on Vercel or serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const possibleSources = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.resolve('./prisma/dev.db'),
      ];

      for (const source of possibleSources) {
        if (fs.existsSync(source)) {
          try {
            fs.copyFileSync(source, tmpDbPath);
            break;
          } catch (err) {
            console.error(`Failed to copy database from ${source} to ${tmpDbPath}:`, err);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  // Local development fallback
  if (envUrl && envUrl.startsWith('file:') && !envUrl.includes('./')) {
    return envUrl;
  }

  const localDbPath = path.join(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  return `file:${localDbPath}`;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
