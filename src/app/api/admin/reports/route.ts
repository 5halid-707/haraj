import { initDb } from "@/lib/init-db";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try { await initDb(); } catch(e) {}
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  try {
    const [users, listings, categories] = await Promise.all([
      db.user.count(),
      db.listing.count(),
      db.category.count(),
    ]);
    return NextResponse.json({ users, listings, categories });
  } catch (error) {
    return NextResponse.json({ users: 0, listings: 0, categories: 0 });
  }
}
