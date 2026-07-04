import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET: current user's store or all stores (if admin)
export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // Get user's store
  const store = await db.store.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: { id: true, username: true, email: true, phone: true },
      },
    },
  });

  return NextResponse.json({ store });
}

// POST: create a store (apply for merchant account)
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // Check if user already has a store
  const existing = await db.store.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json(
      { error: "لديك متجر بالفعل" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, description, logoUrl, phone, email, city, address, licenseNumber, licenseImage } = body;

  if (!name?.trim() || !phone?.trim() || !city?.trim()) {
    return NextResponse.json(
      { error: "الاسم والجوال والمدينة مطلوبة" },
      { status: 400 }
    );
  }

  // Create store with free subscription (needs admin approval for paid)
  const store = await db.store.create({
    data: {
      userId: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
      phone: phone.trim(),
      email: email?.trim() || null,
      city: city.trim(),
      address: address?.trim() || null,
      licenseNumber: licenseNumber?.trim() || null,
      licenseImage: licenseImage?.trim() || null,
      subscriptionType: "free",
      isActive: true,
    },
  });

  await logActivity({
    userId: user.id,
    action: "store_create",
    description: `إنشاء متجر جديد: ${name.trim()}`,
    metadata: { storeId: store.id },
  });

  return NextResponse.json({ store, message: "تم إنشاء متجرك بنجاح! سيتم مراجعته من الإدارة." });
}
