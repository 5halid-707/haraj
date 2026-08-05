import { db } from './db'
import bcrypt from 'bcryptjs'

let initPromise: Promise<void> | null = null

async function ensureSchema() {
  try {
    await db.user.count()
  } catch (e) {
    console.log('[init-db] Creating tables via SQL...')
    const statements = [
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "phone" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "city" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "isAdmin" BOOLEAN NOT NULL DEFAULT false,
        "rating" REAL NOT NULL DEFAULT 0,
        "tripsCount" INTEGER NOT NULL DEFAULT 0,
        "walletBalance" REAL NOT NULL DEFAULT 0,
        "affiliateCode" TEXT,
        "isBlocked" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "icon" TEXT,
        "parentId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "Listing" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "price" REAL NOT NULL DEFAULT 0,
        "city" TEXT,
        "images" TEXT,
        "categoryId" TEXT,
        "userId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "views" INTEGER NOT NULL DEFAULT 0,
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Comment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "userId" TEXT,
        "listingId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "ActivityLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "entity" TEXT,
        "entityId" TEXT,
        "description" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    ]
    for (const sql of statements) {
      try { await db.$executeRawUnsafe(sql) } catch (e) { /* table may exist */ }
    }
    console.log('[init-db] Tables created')
  }
}

async function seedIfEmpty() {
  const userCount = await db.user.count()
  if (userCount > 0) return

  console.log('[init-db] Seeding...')

  const adminPass = await bcrypt.hash('Admin@2026', 10)
  await db.user.create({
    data: {
      name: 'أبو سطام',
      email: 'khalid-alharbi@zohomail.sa',
      phone: '0575015019',
      password: adminPass,
      city: 'جدة',
      isVerified: true,
      isAdmin: true,
      rating: 5.0,
      affiliateCode: 'SATTAM100',
    },
  })

  const categories = [
    { name: 'سيارات', slug: 'cars', icon: '🚗' },
    { name: 'عقارات', slug: 'real-estate', icon: '🏠' },
    { name: 'أجهزة', slug: 'electronics', icon: '📱' },
    { name: 'أثاث', slug: 'furniture', icon: '🛋️' },
    { name: 'وظائف', slug: 'jobs', icon: '💼' },
    { name: 'خدمات', slug: 'services', icon: '🔧' },
    { name: 'مزرعة', slug: 'farm', icon: '🌾' },
    { name: 'حيوانات', slug: 'animals', icon: '🐾' },
    { name: 'أزياء', slug: 'fashion', icon: '👗' },
    { name: 'مواد بناء', slug: 'construction', icon: '🧱' },
  ]
  for (const cat of categories) {
    await db.category.create({ data: cat })
  }

  // Demo users
  const demoUsers = [
    { name: 'أبو عبدالله', email: 'abuabdullah@haraj.sa', phone: '0557654321', password: await bcrypt.hash('123456', 10), city: 'جدة', isVerified: true, rating: 4.9, affiliateCode: 'ABDULLAH1' },
    { name: 'أبو خالد', email: 'abukhaled@haraj.sa', phone: '0561112233', password: await bcrypt.hash('123456', 10), city: 'الدمام', isVerified: false, rating: 4.3, affiliateCode: 'KHALED200' },
    { name: 'أبو سعد', email: 'abusaad@haraj.sa', phone: '0574455667', password: await bcrypt.hash('123456', 10), city: 'مكة', isVerified: true, rating: 4.7, affiliateCode: 'SAAD300' },
  ]
  for (const u of demoUsers) {
    await db.user.create({ data: u })
  }

  console.log('[init-db] Seed complete')
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      await ensureSchema()
      await seedIfEmpty()
    } catch (e) {
      initPromise = null
      console.error('[init-db] failed:', e)
    }
  })()
  return initPromise
}
