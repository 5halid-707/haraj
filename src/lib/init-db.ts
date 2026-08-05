import { db } from './db'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'

let initPromise: Promise<void> | null = null

async function ensureSchema() {
  try {
    await db.user.count()
  } catch (e) {
    console.log('[init-db] Tables missing, running prisma db push...')
    try {
      execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'file:/tmp/haraj.db' },
        timeout: 30000,
      })
      console.log('[init-db] prisma db push completed')
    } catch (e) {
      console.error('[init-db] prisma db push failed:', e)
      throw e
    }
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
