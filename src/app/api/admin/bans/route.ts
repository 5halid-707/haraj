import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET: list banned users
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const bannedUsers = await db.user.findMany({
    where: { isBanned: true },
    orderBy: { bannedAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      city: true,
      banReason: true,
      bannedAt: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  });

  return NextResponse.json({ users: bannedUsers });
}

// PATCH: ban or unban a user
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, action, reason } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: "userId و action مطلوبان" }, { status: 400 });
  }

  // Don't allow banning yourself
  if (userId === admin.id) {
    return NextResponse.json({ error: "لا يمكنك حظر حسابك" }, { status: 400 });
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  // Don't allow banning other admins
  if (targetUser.isAdmin && action === "ban") {
    return NextResponse.json({ error: "لا يمكنك حظر أدمن آخر" }, { status: 400 });
  }

  if (action === "ban") {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: reason || "مخالفة قوانين الموقع",
        bannedAt: new Date(),
        bannedById: admin.id,
      },
    });

    await logActivity({
      userId: admin.id,
      action: "user_ban",
      description: `حظر المستخدم: ${targetUser.username} - السبب: ${reason || "مخالفة"}`,
      metadata: { bannedUserId: userId, reason },
    });

    return NextResponse.json({ user: updated, message: "تم حظر المستخدم" });
  } else if (action === "unban") {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banReason: null,
        bannedAt: null,
        bannedById: null,
      },
    });

    await logActivity({
      userId: admin.id,
      action: "user_unban",
      description: `إلغاء حظر المستخدم: ${targetUser.username}`,
      metadata: { unbannedUserId: userId },
    });

    return NextResponse.json({ user: updated, message: "تم إلغاء الحظر" });
  }

  return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 });
}
