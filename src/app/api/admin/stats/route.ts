import { initDb } from "@/lib/init-db";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try { await initDb(); } catch(e) {}
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  try {
    const [totalUsers, totalListings, activeListings, totalCategories, featuredListings, totalViews] = await Promise.all([
      db.user.count(),
      db.listing.count(),
      db.listing.count({ where: { status: "active" } }),
      db.category.count(),
      db.listing.count({ where: { isFeatured: true } }),
      db.listing.aggregate({ _sum: { views: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalListings,
      activeListings,
      totalCategories,
      featuredListings,
      totalViews: totalViews._sum.views || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats", detail: String(error).substring(0, 200) }, { status: 500 });
  }
}
