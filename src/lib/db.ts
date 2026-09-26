import { PrismaClient } from '@prisma/client'

// Bump this version whenever the Prisma schema changes — forces the dev
// server to rebuild the PrismaClient singleton in-memory (without a full
// restart), picking up new models/fields added by `bun run db:push`.
const SCHEMA_VERSION = 'lenora-2026-09-v3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaVersion?: string
}

// Detecta schema desatualizado em memória e reconstrói o client.
const needsRebuild =
  !globalForPrisma.prisma ||
  globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION

if (needsRebuild) {
  if (globalForPrisma.prisma) {
    try {
      void globalForPrisma.prisma.$disconnect()
    } catch {
      /* ignore */
    }
  }
  globalForPrisma.prisma = new PrismaClient({
    log: ['query'],
  })
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION
}

export const db = globalForPrisma.prisma!
