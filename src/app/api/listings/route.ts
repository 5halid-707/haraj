import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "50");

     
    const where: any = { status: "active" };

    if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } });
      if (cat) {
        const children = await db.category.findMany({ where: { parentId: cat.id } });
        const allIds = [cat.id, ...children.map((c) => c.id)];
        where.categoryId = { in: allIds };
      }
    }

    if (city && city !== "all") {
      where.city = city;
    }

    if (search) {
      where.title = { contains: search };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

     
    const orderBy: any =
      sort === "price_low"
        ? { price: "asc" }
        : sort === "price_high"
          ? { price: "desc" }
          : sort === "popular"
            ? { views: "desc" }
            : { createdAt: "desc" };

    const listings = await db.listing.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        category: true,
        user: true,
      },
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      price,
      city,
      district,
      categoryId,
      images,
      year,
      kilometers,
      condition,
      phone,
      whatsapp,
      username,
    } = body;

    // Find or create user
    let user = await db.user.findFirst({
      where: { phone },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          username: username || `user_${Date.now()}`,
          phone,
          city,
        },
      });
    }

    const listing = await db.listing.create({
      data: {
        title,
        description,
        price: parseInt(price),
        city,
        district,
        categoryId,
        userId: user.id,
        images: JSON.stringify(images || []),
        year: year ? parseInt(year) : null,
        kilometers: kilometers ? parseInt(kilometers) : null,
        condition: condition || null,
        phone,
        whatsapp,
      },
      include: {
        category: true,
        user: true,
      },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
