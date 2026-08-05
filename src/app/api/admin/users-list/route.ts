import { initDb } from "@/lib/init-db";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try { await initDb(); } catch(e) {}
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = search ? {
    OR: [
      { username: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ]
  } : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true, username: true, email: true, phone: true, city: true,
        isVerified: true, isAdmin: true, rating: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}
