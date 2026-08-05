import { initDb } from "@/lib/init-db";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try { await initDb(); } catch(e) {}
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  try {
    const logs = await db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ logs: [] });
  }
}
