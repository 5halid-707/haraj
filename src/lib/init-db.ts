import { db } from './db'
import bcrypt from 'bcryptjs'

let initPromise: Promise<void> | null = null

async function ensureSchema() {
  try {
    await db.user.count()
  } catch (e) {
    console.log('[init-db] Tables missing, pushing schema...')
    // On Vercel, we can't run prisma db push, so the tables must exist
    // via the build step. If they don't, we skip seeding.
    throw e
  }
}

async function seedIfEmpty() {
  const userCount = await db.user.count()
  if (userCount > 0) return

  console.log('[init-db] Seeding initial data...')

  // Create admin user
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

  // Create categories
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

  // Create demo users
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
