import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const purchases = await db.trustedPurchase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, price: true } },
      buyer: { select: { id: true, username: true, email: true, phone: true } },
      seller: { select: { id: true, username: true, email: true, phone: true } },
    },
  });

  return NextResponse.json({ purchases });
}
