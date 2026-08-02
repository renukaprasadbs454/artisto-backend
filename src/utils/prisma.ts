import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient instance to avoid multiple connections in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Supabase's direct database endpoint currently fails the Windows Prisma TLS
// handshake used by this local development setup. Keep the workaround strictly
// local: production continues to use the configured secure connection.
const configuredUrl = process.env.DATABASE_URL;
const datasourceUrl = process.env.NODE_ENV !== 'production' && configuredUrl?.includes('.supabase.co') && !configuredUrl.includes('sslmode=')
  ? `${configuredUrl}${configuredUrl.includes('?') ? '&' : '?'}sslmode=disable`
  : configuredUrl;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  ...(datasourceUrl ? { datasourceUrl } : {}),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
