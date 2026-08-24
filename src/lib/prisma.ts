import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import path from 'path';

const getDatabaseUrl = () => {
  // Running on Vercel or AWS Lambda serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join(path.sep === '/' ? '/tmp' : os.tmpdir(), 'dev.db');
    if (!fs.existsSync(tmpDbPath)) {
      const possibleSources = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.resolve('./prisma/dev.db'),
        path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
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
    return `file:${tmpDbPath.replace(/\\/g, '/')}`;
  }

  // Local development
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith('file:') && !envUrl.includes('./')) {
    return envUrl;
  }

  const localDbPath = path.join(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  return `file:${localDbPath}`;
};

const resolvedDbUrl = getDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
