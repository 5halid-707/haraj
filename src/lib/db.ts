import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is set for SQLite
const dbUrl = process.env.DATABASE_URL || 'file:/tmp/haraj.db'
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl
}

function createClient() {
  try {
    return new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    })
  } catch (e) {
    console.error('[db] Failed to create PrismaClient:', e)
    return null as any
  }
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
