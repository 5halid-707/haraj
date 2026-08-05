import { db } from './db'
import bcrypt from 'bcryptjs'

let initPromise: Promise<void> | null = null

const SQL_STATEMENTS: string[] = [
  `CREATE TABLE "User" ( "id" TEXT NOT NULL PRIMARY KEY, "username" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT, "password" TEXT, "city" TEXT, "avatar" TEXT, "isVerified" BOOLEAN NOT NULL DEFAULT false, "isAdmin" BOOLEAN NOT NULL DEFAULT false, "rating" REAL NOT NULL DEFAULT 5.0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "affiliateCode" TEXT, "referredById" TEXT, CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE )`,
  `CREATE TABLE "Category" ( "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "icon" TEXT, "parentId" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE )`,
  `CREATE TABLE "Listing" ( "id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "price" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'ريال', "city" TEXT NOT NULL, "district" TEXT, "categoryId" TEXT NOT NULL, "userId" TEXT NOT NULL, "images" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "isFeatured" BOOLEAN NOT NULL DEFAULT false, "isVerified" BOOLEAN NOT NULL DEFAULT false, "views" INTEGER NOT NULL DEFAULT 0, "year" INTEGER, "kilometers" INTEGER, "condition" TEXT, "phone" TEXT NOT NULL, "whatsapp" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE )`,
  `CREATE TABLE "Comment" ( "id" TEXT NOT NULL PRIMARY KEY, "listingId" TEXT NOT NULL, "userId" TEXT, "username" TEXT NOT NULL, "content" TEXT NOT NULL, "phone" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Comment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE )`,
  `CREATE TABLE "Favorite" ( "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "listingId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE )`,
  `CREATE TABLE "Session" ( "id" TEXT NOT NULL PRIMARY KEY, "sessionToken" TEXT NOT NULL, "userId" TEXT NOT NULL, "expires" DATETIME NOT NULL, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE )`,
  `CREATE TABLE "Account" ( "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "provider" TEXT NOT NULL, "providerAccountId" TEXT NOT NULL, "refresh_token" TEXT, "access_token" TEXT, "expires_at" INTEGER, "token_type" TEXT, "scope" TEXT, "id_token" TEXT, "session_state" TEXT, CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE )`,
  `CREATE TABLE "BankAccount" ( "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "bankName" TEXT NOT NULL, "accountName" TEXT NOT NULL, "iban" TEXT NOT NULL, "accountNumber" TEXT NOT NULL, "swiftCode" TEXT, "isDefault" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE )`,
  `CREATE TABLE "Transaction" ( "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "amount" REAL NOT NULL, "currency" TEXT NOT NULL DEFAULT 'ريال', "status" TEXT NOT NULL DEFAULT 'pending', "description" TEXT, "bankAccountId" TEXT, "processedById" TEXT, "processedAt" DATETIME, "adminNote" TEXT, "reference" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Transaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "Transaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE )`,
  `CREATE TABLE "SiteSettings" ( "id" TEXT NOT NULL PRIMARY KEY, "siteName" TEXT NOT NULL DEFAULT 'حراج', "adminPhone" TEXT NOT NULL DEFAULT '0575015019', "adminWhatsApp" TEXT NOT NULL DEFAULT '0575015019', "adminEmail" TEXT, "adminCity" TEXT NOT NULL DEFAULT 'جدة', "adminBankName" TEXT, "adminAccountName" TEXT, "adminIBAN" TEXT, "adminAccountNumber" TEXT, "featuredPrice" REAL NOT NULL DEFAULT 50, "withdrawalFee" REAL NOT NULL DEFAULT 0, "minWithdrawal" REAL NOT NULL DEFAULT 100, "welcomeMessage" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL )`,
  `CREATE TABLE "Notification" ( "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "link" TEXT, "isRead" BOOLEAN NOT NULL DEFAULT false, "relatedId" TEXT, "relatedType" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE )`,
  `CREATE TABLE "Payment" ( "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "purpose" TEXT NOT NULL, "listingId" TEXT, "amount" REAL NOT NULL, "currency" TEXT NOT NULL DEFAULT 'ريال', "method" TEXT NOT NULL, "cardLast4" TEXT, "cardBrand" TEXT, "reference" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "failureReason" TEXT, "processedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE )`,
  `CREATE TABLE "Coupon" ( "id" TEXT NOT NULL PRIMARY KEY, "code" TEXT NOT NULL, "description" TEXT, "type" TEXT NOT NULL, "value" REAL NOT NULL, "maxRedemptions" INTEGER, "usedCount" INTEGER NOT NULL DEFAULT 0, "minAmount" REAL NOT NULL DEFAULT 0, "maxDiscount" REAL, "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "validUntil" DATETIME, "isActive" BOOLEAN NOT NULL DEFAULT true, "appliesTo" TEXT NOT NULL DEFAULT 'all', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL )`,
  `CREATE TABLE "CouponRedemption" ( "id" TEXT NOT NULL PRIMARY KEY, "couponId" TEXT NOT NULL, "userId" TEXT NOT NULL, "paymentId" TEXT, "discountAmount" REAL NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "CouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE )`,
  `CREATE TABLE "AffiliateEarning" ( "id" TEXT NOT NULL PRIMARY KEY, "affiliateId" TEXT NOT NULL, "referredId" TEXT NOT NULL, "commissionRate" REAL NOT NULL, "amount" REAL NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "transactionId" TEXT, "paidAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "AffiliateEarning_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "AffiliateEarning_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE )`,
  `CREATE TABLE "ActivityLog" ( "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "action" TEXT NOT NULL, "description" TEXT NOT NULL, "ipAddress" TEXT, "userAgent" TEXT, "metadata" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE )`,
  `CREATE TABLE "Banner" ( "id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "imageUrl" TEXT NOT NULL, "linkUrl" TEXT, "position" TEXT NOT NULL DEFAULT 'home_top', "isActive" BOOLEAN NOT NULL DEFAULT true, "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "endDate" DATETIME, "order" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL )`,
  `CREATE UNIQUE INDEX "User_username_key" ON "User"("username")`,
  `CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone")`,
  `CREATE UNIQUE INDEX "User_affiliateCode_key" ON "User"("affiliateCode")`,
  `CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug")`,
  `CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId")`,
  `CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken")`,
  `CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,
  `CREATE UNIQUE INDEX "BankAccount_iban_key" ON "BankAccount"("iban")`,
  `CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference")`,
  `CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code")`,
  `CREATE UNIQUE INDEX "CouponRedemption_couponId_userId_key" ON "CouponRedemption"("couponId", "userId")`,
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
    try { await ensureSchema(); await seedIfEmpty() }
    catch (e) { initPromise = null; console.error('[init-db] failed:', e) }
  })()
  return initPromise
}
