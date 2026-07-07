import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/drivers/active-trip?driverId=xxx
// driverId here is the Driver.id (not userId)
// Returns: { activeTrip, availableTrips }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "driverId مطلوب" }, { status: 400 });
    }

    const driver = await db.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }

    // Active trip = any trip assigned to this driver that's not completed/cancelled
    const activeTrip = await db.trip.findFirst({
      where: {
        driverId,
        status: { in: ["accepted", "driver_arrived", "ongoing"] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            rating: true,
            currentLat: true,
            currentLng: true,
          },
        },
      },
      orderBy: { acceptedAt: "desc" },
    });

    // Available trips = pending trips not yet accepted
    let availableTrips: Awaited<ReturnType<typeof db.trip.findMany>> = [];
    if (!activeTrip && driver.isApproved && driver.isOnline) {
      availableTrips = await db.trip.findMany({
        where: { status: "pending", driverId: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
              rating: true,
              currentLat: true,
              currentLng: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });
    }

    return NextResponse.json({
      activeTrip,
      availableTrips,
      isOnline: driver.isOnline,
      isApproved: driver.isApproved,
    });
  } catch (error) {
    console.error("GET /api/drivers/active-trip error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الرحلة النشطة" }, { status: 500 });
  }
}
