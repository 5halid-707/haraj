import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { initDb } from "@/lib/init-db";

export async function PATCH(request: NextRequest) {
  try { await initDb(); } catch(e) {}
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const { username, phone, city, avatar } = body;

  const data: Record<string, unknown> = {};
  if (username) data.username = username;
  if (phone) data.phone = phone;
  if (city) data.city = city;
  if (avatar) data.avatar = avatar;

  const updated = await db.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true, username: true, email: true, phone: true,
      city: true, avatar: true, isAdmin: true, isVerified: true,
      rating: true, affiliateCode: true,
    },
  });

  return NextResponse.json({ user: updated });
}
