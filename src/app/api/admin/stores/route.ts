import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const stores = await db.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, username: true, email: true, phone: true },
      },
      _count: {
        select: { user: { select: { listings: true } } },
      },
    },
  });

  return NextResponse.json({ stores });
}

// PATCH: verify a store / update subscription
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const body = await request.json();
  const { id, action, data } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "الـ ID والإجراء مطلوبان" }, { status: 400 });
  }

  const store = await db.store.findUnique({ where: { id } });
  if (!store) {
    return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
  }

  let updateData: Record<string, unknown> = {};

  if (action === "verify") {
    updateData.isVerified = true;
    updateData.verifiedAt = new Date();
    await logActivity({
      userId: admin.id,
      action: "user_verify",
      description: `توثيق المتجر: ${store.name}`,
      metadata: { storeId: store.id },
    });
  } else if (action === "unverify") {
    updateData.isVerified = false;
    updateData.verifiedAt = null;
  } else if (action === "activate") {
    updateData.isActive = true;
  } else if (action === "deactivate") {
    updateData.isActive = false;
  } else if (action === "subscribe") {
    // Subscribe store (basic/premium/vip) for 1 year
    const type = data?.type || "basic";
    const now = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    updateData.subscriptionType = type;
    updateData.subscriptionStart = now;
    updateData.subscriptionEnd = end;
    await logActivity({
      userId: admin.id,
      action: "store_subscribe",
      description: `اشتراك ${type} للمتجر: ${store.name}`,
      metadata: { storeId: store.id, type },
    });
  }

  const updated = await db.store.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ store: updated });
}
