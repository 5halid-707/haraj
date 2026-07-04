import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

// GET: user's trusted purchases (as buyer or seller)
export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const [asBuyer, asSeller] = await Promise.all([
    db.trustedPurchase.findMany({
      where: { buyerId: user.id },
      include: {
        listing: { select: { id: true, title: true, images: true, price: true } },
        seller: { select: { id: true, username: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.trustedPurchase.findMany({
      where: { sellerId: user.id },
      include: {
        listing: { select: { id: true, title: true, images: true, price: true } },
        buyer: { select: { id: true, username: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ asBuyer, asSeller });
}

// POST: create a trusted purchase request (buyer initiates)
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const { listingId, buyerNote } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId مطلوب" }, { status: 400 });
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { user: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
  }

  if (listing.userId === user.id) {
    return NextResponse.json({ error: "لا يمكنك شراء إعلانك الخاص" }, { status: 400 });
  }

  if (!listing.isTrustedPurchase) {
    return NextResponse.json(
      { error: "هذا الإعلان غير متاح للشراء الموثوق" },
      { status: 400 }
    );
  }

  // Check for existing pending request
  const existing = await db.trustedPurchase.findFirst({
    where: {
      listingId,
      buyerId: user.id,
      status: { in: ["pending", "paid", "shipped"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "لديك طلب شراء موثوق قائم على هذا الإعلان" },
      { status: 400 }
    );
  }

  // Create trusted purchase
  const trustedPurchase = await db.trustedPurchase.create({
    data: {
      listingId,
      sellerId: listing.userId,
      buyerId: user.id,
      amount: listing.price,
      status: "pending",
      buyerNote: buyerNote || null,
    },
  });

  // Notify seller
  await createNotification({
    userId: listing.userId,
    type: "system",
    title: "طلب شراء موثوق جديد 🛡️",
    message: `${user.username} طلب شراء موثوق لإعلانك "${listing.title}" بقيمة ${listing.price} ريال. المبلغ سيُحجز حتى تأكيد الاستلام.`,
    link: listingId,
    relatedId: trustedPurchase.id,
    relatedType: "trusted_purchase",
  });

  await logActivity({
    userId: user.id,
    action: "trusted_purchase_create",
    description: `طلب شراء موثوق لإعلان: ${listing.title}`,
    metadata: { trustedPurchaseId: trustedPurchase.id, listingId, amount: listing.price },
  });

  return NextResponse.json({
    trustedPurchase,
    message: "تم إنشاء طلب الشراء الموثوق. سيتم إشعار البائع.",
  });
}

// PATCH: update trusted purchase status (buyer/seller actions)
export async function PATCH(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const { id, action, trackingNumber, shippingCompany, note } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "id و action مطلوبان" }, { status: 400 });
  }

  const tp = await db.trustedPurchase.findUnique({
    where: { id },
    include: { listing: true, buyer: true, seller: true },
  });

  if (!tp) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  const isBuyer = tp.buyerId === user.id;
  const isSeller = tp.sellerId === user.id;

  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let updateData: Record<string, unknown> = {};
  let notifyUserId: string | null = null;
  let notifyTitle = "";
  let notifyMessage = "";

  switch (action) {
    case "cancel":
      if (!isBuyer || tp.status !== "pending") {
        return NextResponse.json({ error: "لا يمكن الإلغاء" }, { status: 400 });
      }
      updateData = { status: "cancelled", cancelledAt: new Date() };
      notifyUserId = tp.sellerId;
      notifyTitle = "تم إلغاء طلب الشراء الموثوق ❌";
      notifyMessage = `${tp.buyer.username} ألغى طلب الشراء الموثوق لإعلان "${tp.listing.title}".`;
      break;

    case "ship":
      if (!isSeller || tp.status !== "paid") {
        return NextResponse.json({ error: "لا يمكن الشحن" }, { status: 400 });
      }
      updateData = {
        status: "shipped",
        shippedAt: new Date(),
        trackingNumber: trackingNumber || null,
        shippingCompany: shippingCompany || null,
        sellerNote: note || null,
      };
      notifyUserId = tp.buyerId;
      notifyTitle = "تم شحن طلبك الموثوق 📦";
      notifyMessage = `قام ${tp.seller.username} بشحن طلبك لإعلان "${tp.listing.title}".${trackingNumber ? ` رقم التتبع: ${trackingNumber}` : ""}`;
      break;

    case "deliver":
      if (!isBuyer || tp.status !== "shipped") {
        return NextResponse.json({ error: "لا يمكن التأكيد" }, { status: 400 });
      }
      updateData = { status: "delivered", deliveredAt: new Date() };
      notifyUserId = tp.sellerId;
      notifyTitle = "تأكيد استلام الطلب ✅";
      notifyMessage = `${tp.buyer.username} أكد استلام الطلب لإعلان "${tp.listing.title}". سيتم تحويل المبلغ لحسابك خلال 24 ساعة.`;
      break;

    case "complete":
      // Auto-complete after delivery (release funds to seller)
      if (tp.status !== "delivered") {
        return NextResponse.json({ error: "لا يمكن الإكمال" }, { status: 400 });
      }
      updateData = { status: "completed", completedAt: new Date() };
      // Add funds to seller's wallet
      await db.transaction.create({
        data: {
          userId: tp.sellerId,
          type: "deposit",
          amount: tp.amount,
          status: "completed",
          description: `تحويل من شراء موثوق: ${tp.listing.title}`,
          reference: `TRUSTED-${tp.id}`,
          processedAt: new Date(),
        },
      });
      notifyUserId = tp.sellerId;
      notifyTitle = "تم تحويل المبلغ لحسابك 💰";
      notifyMessage = `تم إضافة ${tp.amount} ريال لرصيدك من الشراء الموثوق لإعلان "${tp.listing.title}".`;
      break;

    case "dispute":
      if ((!isBuyer && !isSeller) || !["paid", "shipped", "delivered"].includes(tp.status)) {
        return NextResponse.json({ error: "لا يمكن فتح نزاع" }, { status: 400 });
      }
      updateData = {
        status: "disputed",
        disputedAt: new Date(),
        disputeReason: note || "نزاع من المستخدم",
      };
      // Notify admin
      const admin = await db.user.findFirst({ where: { isAdmin: true } });
      if (admin) {
        await createNotification({
          userId: admin.id,
          type: "system",
          title: "نزاع في شراء موثوق ⚠️",
          message: `تم فتح نزاع في طلب شراء موثوق لإعلان "${tp.listing.title}". الرجاء المراجعة.`,
          relatedId: tp.id,
          relatedType: "trusted_purchase",
        });
      }
      break;

    default:
      return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 });
  }

  const updated = await db.trustedPurchase.update({
    where: { id },
    data: updateData,
  });

  if (notifyUserId && notifyTitle) {
    await createNotification({
      userId: notifyUserId,
      type: "system",
      title: notifyTitle,
      message: notifyMessage,
      relatedId: tp.id,
      relatedType: "trusted_purchase",
    });
  }

  return NextResponse.json({ trustedPurchase: updated });
}
