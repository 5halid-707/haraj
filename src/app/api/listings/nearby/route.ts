import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: find listings near a GPS location
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "50"); // km
  const limit = parseInt(searchParams.get("limit") || "30");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat و lng مطلوبان" },
      { status: 400 }
    );
  }

  // Get all listings with GPS coordinates
  const allListings = await db.listing.findMany({
    where: {
      status: "active",
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      category: true,
      user: true,
    },
    take: 500, // limit to avoid heavy computation
  });

  // Calculate distance using Haversine formula
  const R = 6371; // Earth radius in km
  const nearby = allListings
    .map((listing) => {
      const dLat = ((listing.latitude || 0) - lat) * Math.PI / 180;
      const dLng = ((listing.longitude || 0) - lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) *
          Math.cos((listing.latitude || 0) * Math.PI / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return { ...listing, distance: Math.round(distance * 10) / 10 };
    })
    .filter((l) => l.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return NextResponse.json({
    listings: nearby,
    count: nearby.length,
    center: { lat, lng },
    radius,
  });
}
