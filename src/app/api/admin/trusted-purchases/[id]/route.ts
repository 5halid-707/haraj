import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// Admin resolves a dispute
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { resolution, action } = body;

  // action: "refund_buyer" (return money to buyer) or "pay_seller" (give money to seller)
  if (!resolution || !action) {
    return NextResponse.json({ error: "resolution و action مطلوبان" }, { status: 400 });
  }

  const tp = await db.trustedPurchase.findUnique({
    where: { id },
    include: { listing: true, buyer: true, seller: true },
  });

  if (!tp) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  if (tp.status !== "disputed") {
    return NextResponse.json({ error: "الطلب ليس في حالة نزاع" }, { status: 400 });
  }

  // Resolve: either refund buyer or pay seller
  const targetUserId = action === "refund_buyer" ? tp.buyerId : tp.sellerId;
  await db.transaction.create({
    data: {
      userId: targetUserId,
      type: action === "refund_buyer" ? "deposit" : "deposit",
      amount: tp.amount,
      status: "completed",
      description: `حل نزاع شراء موثوق (${action === "refund_buyer" ? "استرداد للمشتري" : "دفع للبائع"}): ${tp.listing.title}`,
      reference: `DISPUTE-${tp.id}`,
      processedAt: new Date(),
    },
  });

  const updated = await db.trustedPurchase.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
      disputeResolution: resolution,
      disputeResolvedAt: new Date(),
      adminNote: resolution,
    },
  });

  await logActivity({
    userId: admin.id,
    action: "trusted_purchase_resolve",
    description: `حل نزاع شراء موثوق: ${tp.listing.title} - ${action === "refund_buyer" ? "استرداد للمشتري" : "دفع للبائع"}`,
    metadata: { trustedPurchaseId: tp.id, action, resolution },
  });

  return NextResponse.json({ trustedPurchase: updated });
}
