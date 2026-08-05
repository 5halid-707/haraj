import { db } from './db'
import bcrypt from 'bcryptjs'

let initPromise: Promise<void> | null = null

const SQL_STATEMENTS: string[] = [
]

async function ensureSchema() {
  try {
    await db.user.count()
  } catch (e) {
    console.log('[init-db] Creating', SQL_STATEMENTS.length, 'tables...')
    for (const sql of SQL_STATEMENTS) {
      try { await db.$executeRawUnsafe(sql) } catch (e: any) {}
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
      username: '\u0623\u0628\u0648 \u0633\u0637\u0627\u0645',
      email: 'khalid-alharbi@zohomail.sa',
      phone: '0575015019',
      password: adminPass,
      city: '\u062c\u062f\u0629',
      isVerified: true,
      isAdmin: true,
      rating: 5.0,
      affiliateCode: 'SATTAM100',
    },
  })
  const categories = [
    { name: '\u0633\u064a\u0627\u0631\u0627\u062a', slug: 'cars', icon: '\ud83d\ude97' },
    { name: '\u0639\u0642\u0627\u0631\u0627\u062a', slug: 'real-estate', icon: '\ud83c\udfe0' },
    { name: '\u0623\u062c\u0647\u0632\u0629', slug: 'electronics', icon: '\ud83d\udcf1' },
    { name: '\u0623\u062b\u0627\u062b', slug: 'furniture', icon: '\ud83d\udecb\ufe0f' },
    { name: '\u0648\u0638\u0627\u0626\u0641', slug: 'jobs', icon: '\ud83d\udcbc' },
    { name: '\u062e\u062f\u0645\u0627\u062a', slug: 'services', icon: '\ud83d\udd27' },
    { name: '\u0645\u0632\u0631\u0639\u0629', slug: 'farm', icon: '\ud83c\udf3e' },
    { name: '\u062d\u064a\u0648\u0627\u0646\u0627\u062a', slug: 'animals', icon: '\ud83d\udc3e' },
    { name: '\u0623\u0632\u064a\u0627\u0621', slug: 'fashion', icon: '\ud83d\udc57' },
    { name: '\u0645\u0648\u0627\u062f \u0628\u0646\u0627\u0621', slug: 'construction', icon: '\ud83e\uddf1' },
  ]
  for (const cat of categories) {
    await db.category.create({ data: cat })
  }
  console.log('[init-db] Seed complete')
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try { await ensureSchema(); await seedIfEmpty() }
    catch (e) { initPromise = null; console.error('[init-db] failed:', e) }
  })()
  return initPromise
}
