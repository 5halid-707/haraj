#!/usr/bin/env node
/**
 * سكريبت التبديل من SQLite إلى PostgreSQL للإنتاج
 * يستخدم قبل النشر على Vercel/Netlify
 *
 * الاستخدام:
 *   1. تأكد من ضبط DATABASE_URL على رابط PostgreSQL في .env
 *   2. شغّل: node scripts/switch-to-postgres.js
 *   3. شغّل: bunx prisma db push
 *   4. شغّل: bunx tsx scripts/seed.ts (لإضافة البيانات التجريبية)
 */

const fs = require("fs");
const path = require("path");

const SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.prisma");
const POSTGRES_SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.postgres.prisma");

console.log("🔄 التبديل من SQLite إلى PostgreSQL...\n");

// Read current schema
const currentSchema = fs.readFileSync(SCHEMA_PATH, "utf-8");

// Check if already on postgresql
if (currentSchema.includes('provider = "postgresql"')) {
  console.log("✅ Prisma schema already uses PostgreSQL. No changes needed.");
  process.exit(0);
}

// Read the postgres schema
if (!fs.existsSync(POSTGRES_SCHEMA_PATH)) {
  console.error("❌ prisma/schema.postgres.prisma not found!");
  process.exit(1);
}

const postgresSchema = fs.readFileSync(POSTGRES_SCHEMA_PATH, "utf-8");

// Backup current schema
const backupPath = SCHEMA_PATH + ".sqlite.backup";
fs.writeFileSync(backupPath, currentSchema);
console.log(`✅ Backed up SQLite schema to: prisma/schema.prisma.sqlite.backup`);

// Write postgres schema
fs.writeFileSync(SCHEMA_PATH, postgresSchema);
console.log(`✅ Switched prisma/schema.prisma to PostgreSQL`);

console.log("\n📋 الخطوات التالية:");
console.log("1. تأكد من ضبط DATABASE_URL في .env على رابط PostgreSQL:");
console.log('   DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"');
console.log("");
console.log("2. شغّل الأوامر التالية:");
console.log("   bunx prisma generate");
console.log("   bunx prisma db push");
console.log("   bunx tsx scripts/seed.ts  (لإضافة البيانات التجريبية)");
console.log("");
console.log("3. للرجوع لـ SQLite (للمعاينة المحلية):");
console.log("   cp prisma/schema.prisma.sqlite.backup prisma/schema.prisma");
console.log("   bunx prisma generate");
