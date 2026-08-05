import { initDb } from "@/lib/init-db";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try { await initDb(); } catch(e) {}
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { userId, blocked } = await request.json();
  const updated = await db.user.update({
    where: { id: userId },
    data: { isVerified: !blocked },
  });
  return NextResponse.json({ user: updated });
}
