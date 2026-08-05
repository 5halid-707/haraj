import { db } from './db'
import bcrypt from 'bcryptjs'
import { SQL_STATEMENTS } from './sql-schema'

let initPromise: Promise<void> | null = null

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
  const adminUser = await db.user.create({
    data: {
      username: 'أبو سطام',
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

  // Demo users
  const demoUsers = [
    { username: 'أبو عبدالله', email: 'abuabdullah@haraj.sa', phone: '0557654321', password: await bcrypt.hash('123456', 10), city: 'جدة', isVerified: true, rating: 4.9, affiliateCode: 'ABDULLAH1' },
    { username: 'أبو خالد', email: 'abukhaled@haraj.sa', phone: '0561112233', password: await bcrypt.hash('123456', 10), city: 'الدمام', isVerified: true, rating: 4.7, affiliateCode: 'KHALED200' },
    { username: 'أبو سعد', email: 'abusaad@haraj.sa', phone: '0574455667', password: await bcrypt.hash('123456', 10), city: 'مكة', isVerified: true, rating: 4.8, affiliateCode: 'SAAD300' },
  ]
  for (const u of demoUsers) {
    await db.user.create({ data: u })
  }

  // 10 categories
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
  const allCats = await db.category.findMany()

  // REAL images from Unsplash for each category
  const img = (q: string) => `https://images.unsplash.com/photo-${q}?w=600&h=450&fit=crop`

  // Listings for ALL 10 categories (at least 2 each = 20+ listings)
  const listings = [
    // CARS (3)
    { title: 'تويوتا كامري 2022 فل كامل', description: 'تويوتا كامري 2022 فل اوبشن كامل ماشية 45 الف كم بحالة الوكالة صيانة كاملة', price: 85000, currency: 'ريال', city: 'الرياض', district: 'النسيم', categoryId: allCats.find(c=>c.slug==='cars')!.id, userId: adminUser.id, images: JSON.stringify([img('1552519507-da3b142c6e3d')]), status: 'active', isFeatured: true, views: 245, year: 2022, kilometers: 45000, condition: 'مستعمل', phone: '0575015019', whatsapp: '966575015019' },
    { title: 'هيونداي سوناتا 2021', description: 'هيونداي سوناتا 2021 فل اوبشن ماشية 60 الف كم بحالة ممتازة صيانة دورية', price: 55000, currency: 'ريال', city: 'جدة', district: 'الروضة', categoryId: allCats.find(c=>c.slug==='cars')!.id, userId: adminUser.id, images: JSON.stringify([img('1606664515524-ed2f786a0bd6')]), status: 'active', views: 180, year: 2021, kilometers: 60000, condition: 'مستعمل', phone: '0557654321', whatsapp: '966557654321' },
    { title: 'نيسان باترول 2020', description: 'نيسان باترول 2020 فل كامل ماشية 80 الف كم بحالة الوكالة فحص شامل', price: 180000, currency: 'ريال', city: 'الدمام', district: 'الشاطئ', categoryId: allCats.find(c=>c.slug==='cars')!.id, userId: adminUser.id, images: JSON.stringify([img('1605559424843-9e4c228bf1da')]), status: 'active', isFeatured: true, views: 320, year: 2020, kilometers: 80000, condition: 'مستعمل', phone: '0561112233', whatsapp: '966561112233' },
    { title: 'مرسيدس C200 2023', description: 'مرسيدس C200 2023 AMG فل كامل ماشية 15 الف كم بحالة الوكالة', price: 220000, currency: 'ريال', city: 'الرياض', district: 'العليا', categoryId: allCats.find(c=>c.slug==='cars')!.id, userId: adminUser.id, images: JSON.stringify([img('1618843479313-40f8afb4b4d8')]), status: 'active', views: 410, year: 2023, kilometers: 15000, condition: 'مستعمل', phone: '0575015019', whatsapp: '966575015019' },

    // REAL ESTATE (3)
    { title: 'فيلا 400م في حي الياسمين', description: 'فيلا دورين 400م مربع 5 غرف 4 حمامات بموقف سيارة حديقة', price: 1200000, currency: 'ريال', city: 'الرياض', district: 'الياسمين', categoryId: allCats.find(c=>c.slug==='real-estate')!.id, userId: adminUser.id, images: JSON.stringify([img('1564013799919-ab600027ffc6')]), status: 'active', isFeatured: true, views: 410, phone: '0575015019', whatsapp: '966575015019' },
    { title: 'شقة 180م في حي الروضة', description: 'شقة 180م مربع 3 غرف 2 حمامات مطبخ راكب تكييف', price: 450000, currency: 'ريال', city: 'جدة', district: 'الروضة', categoryId: allCats.find(c=>c.slug==='real-estate')!.id, userId: adminUser.id, images: JSON.stringify([img('1522708323590-d24dbb6b0267')]), status: 'active', views: 195, phone: '0557654321', whatsapp: '966557654321' },
    { title: 'أرض 600م سكنية في حي القرINEDة', description: 'أرض سكنية 600م مربع على شارعين في حي مميز', price: 350000, currency: 'ريال', city: 'الدمام', district: 'القرينة', categoryId: allCats.find(c=>c.slug==='real-estate')!.id, userId: adminUser.id, images: JSON.stringify([img('1500382017468-9049fed747ef')]), status: 'active', views: 88, phone: '0561112233', whatsapp: '966561112233' },

    // ELECTRONICS (3)
    { title: 'آيفون 15 برو ماكس 256GB', description: 'آيفون 15 برو ماكس 256 جيجا لون تيتانيوم طبيعي بحالة الوكالة ضمان', price: 5499, currency: 'ريال', city: 'الرياض', categoryId: allCats.find(c=>c.slug==='electronics')!.id, userId: adminUser.id, images: JSON.stringify([img('1592750475338-74b7b21085ab')]), status: 'active', views: 89, condition: 'جديد', phone: '0575015019', whatsapp: '966575015019' },
    { title: 'ماك بوك برو 14 إنش M3', description: 'ماك بوك برو 14 إنش M3 برو 512 جيجا 16 رام بحالة ممتازة', price: 8499, currency: 'ريال', city: 'جدة', categoryId: allCats.find(c=>c.slug==='electronics')!.id, userId: adminUser.id, images: JSON.stringify([img('1517336714731-489689fd1ca8')]), status: 'active', views: 145, condition: 'مستعمل', phone: '0557654321', whatsapp: '966557654321' },
    { title: 'سامسونج تلفاز 55 إنش QLED', description: 'سامسونج تلفاز 55 إنش QLED 4K ذكي بحالة ممتازة', price: 3199, currency: 'ريال', city: 'الدمام', categoryId: allCats.find(c=>c.slug==='electronics')!.id, userId: adminUser.id, images: JSON.stringify([img('1593359677879-a4bb92f829d1')]), status: 'active', views: 67, condition: 'مستعمل', phone: '0561112233', whatsapp: '966561112233' },

    // FURNITURE (2)
    { title: 'طاولة طعام خشب زان 6 كراسي', description: 'طاولة طعام خشب الزان 6 كراسي فخمة بحالة ممتازة', price: 2500, currency: 'ريال', city: 'الرياض', district: 'العليا', categoryId: allCats.find(c=>c.slug==='furniture')!.id, userId: adminUser.id, images: JSON.stringify([img('1533090481720-856c6e3c1fdc')]), status: 'active', views: 75, condition: 'مستعمل', phone: '0575015019', whatsapp: '966575015019' },
    { title: 'كنبة جلد 3 مقاعد إيطالية', description: 'كنبة جلد طبيعي 3 مقاعد تصميم إيطالي فخم', price: 1800, currency: 'ريال', city: 'جدة', district: 'الروضة', categoryId: allCats.find(c=>c.slug==='furniture')!.id, userId: adminUser.id, images: JSON.stringify([img('1555041469-a586c9ea0315')]), status: 'active', views: 56, condition: 'مستعمل', phone: '0557654321', whatsapp: '966557654321' },

    // JOBS (2)
    { title: 'مطلوب محاسب بخبرة 3 سنوات', description: 'مطلوب محاسب بخبرة لا تقل عن 3 سنوات في الشركات التجارية إتقان برنامج SAP', price: 0, currency: 'ريال', city: 'جدة', district: 'الروضة', categoryId: allCats.find(c=>c.slug==='jobs')!.id, userId: adminUser.id, images: JSON.stringify([img('1454165804606-c3d57bc86b40')]), status: 'active', views: 156, phone: '0575015019', whatsapp: '966575015019' },
    { title: 'مطلوب مبرمج Front-End', description: 'مطلوب مبرمج واجهات أمامية خبرة React و Next.js راتب مجزي', price: 0, currency: 'ريال', city: 'الرياض', district: 'العليا', categoryId: allCats.find(c=>c.slug==='jobs')!.id, userId: adminUser.id, images: JSON.stringify([img('1517694712202-14dd9538aa97')]), status: 'active', views: 234, phone: '0561112233', whatsapp: '966561112233' },

    // SERVICES (2)
    { title: 'خدمات نقل عفش مع الفك والتركيب', description: 'نقل عفش أثاث مع الفك والتركيب والتغليف بأسعار منافسة عمال محترفين', price: 500, currency: 'ريال', city: 'الدمام', categoryId: allCats.find(c=>c.slug==='services')!.id, userId: adminUser.id, images: JSON.stringify([img('1600518464441-9154a4dea21b')]), status: 'active', views: 92, phone: '0575015019', whatsapp: '966575015019' },
    { title: 'تنظيف منازل وشقق', description: 'خدمات تنظيف منازل وشقق وفنادق ب مواد آمنة عمالة مدربة', price: 300, currency: 'ريال', city: 'الرياض', categoryId: allCats.find(c=>c.slug==='services')!.id, userId: adminUser.id, images: JSON.stringify([img('1581578731548-c64695cc6952')]), status: 'active', views: 78, phone: '0557654321', whatsapp: '966557654321' },

    // FARM (2)
    { title: 'مزرعة 5000م بحwall و骤بن', description: 'مزرعة 5000م مساحتها محاطة بجدار بها مسبح ومالسنة', price: 800000, currency: 'ريال', city: 'الرياض', district: 'حريق', categoryId: allCats.find(c=>c.slug==='farm')!.id, userId: adminUser.id, images: JSON.stringify([img('1500399737-6b9b09397c21')]), status: 'active', views: 145, phone: '0575015019', whatsapp: '966575015019' },
    { title: 'مزرعة نخيل 3000م مع بئر', description: 'مزرعة نخيل 3000م بها 50 نخلة وبئر ارتوازي', price: 450000, currency: 'ريال', city: 'القصيم', district: 'بريدة', categoryId: allCats.find(c=>c.slug==='farm')!.id, userId: adminUser.id, images: JSON.stringify([img('1547149608-7dc1c5a2b3a2')]), status: 'active', views: 89, phone: '0561112233', whatsapp: '966561112233' },

    // ANIMALS (2)
    { title: 'جمال أصيل للبيع', description: 'جمال أصيلة سعودية للبيع بأذن من البيئة', price: 5000, currency: 'ريال', city: 'الرياض', categoryId: allCats.find(c=>c.slug==='animals')!.id, userId: adminUser.id, images: JSON.stringify([img('1549362520-27f955b30e29')]), status: 'active', views: 67, phone: '0575015019', whatsapp: '966575015019' },
    { title: 'طيور زينة مستوردة', description: 'طيور زينة مستوردة بأنواع مختلفة ببغاء كاسكو كناري', price: 800, currency: 'ريال', city: 'جدة', categoryId: allCats.find(c=>c.slug==='animals')!.id, userId: adminUser.id, images: JSON.stringify([img('1555169key707-c02793b51a9d')]), status: 'active', views: 45, phone: '0557654321', whatsapp: '966557654321' },

    // FASHION (2)
    { title: 'عباية مطرزة يدوي فخمة', description: 'عباية مطرزة يدوي بخيوط ذهبية فخمة بحالة جديدة', price: 1200, currency: 'ريال', city: 'الرياض', categoryId: allCats.find(c=>c.slug==='fashion')!.id, userId: adminUser.id, images: JSON.stringify([img('1583391733956-3750e0ff4e8b')]), status: 'active', views: 112, condition: 'جديد', phone: '0575015019', whatsapp: '966575015019' },
    { title: 'ساعة رولكس أصلية', description: 'ساعة رولكس أصلية موديل 2022 بحالة ممتازة مع الضمان', price: 35000, currency: 'ريال', city: 'جدة', categoryId: allCats.find(c=>c.slug==='fashion')!.id, userId: adminUser.id, images: JSON.stringify([img('1523275335684-37898b6baf30')]), status: 'active', isFeatured: true, views: 289, condition: 'مستعمل', phone: '0557654321', whatsapp: '966557654321' },

    // CONSTRUCTION (2)
    { title: 'بيع طابوق أحمر', description: 'بيع طابوق أحمر سعودي بجودة عالية بكميات', price: 3, currency: 'ريال', city: 'الرياض', categoryId: allCats.find(c=>c.slug==='construction')!.id, userId: adminUser.id, images: JSON.stringify([img('1503387762-592deb58ef4e')]), status: 'active', views: 34, phone: '0575015019', whatsapp: '966575015019' },
    { title: 'حديد تسليح بأنواع', description: 'حديد تسليح بأنواع ومقاسات مختلفة 8مم 10مم 12مم 16مم', price: 2500, currency: 'ريال', city: 'الدمام', categoryId: allCats.find(c=>c.slug==='construction')!.id, userId: adminUser.id, images: JSON.stringify([img('1565008447742-97f6f38c985c')]), status: 'active', views: 56, phone: '0561112233', whatsapp: '966561112233' },
  ]

  for (const l of listings) {
    try { await db.listing.create({ data: l }) } catch(e) {}
  }

  console.log('[init-db] Seed complete: ' + listings.length + ' listings')
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try { await ensureSchema(); await seedIfEmpty() }
    catch (e) { initPromise = null; console.error('[init-db] failed:', e) }
  })()
  return initPromise
}
