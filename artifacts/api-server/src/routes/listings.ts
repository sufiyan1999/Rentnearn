import { Router } from "express";
import { eq, and, ilike, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { db, listingsTable, usersTable, favouritesTable } from "@workspace/db";
import { requireAuth, optionalAuth } from "../middlewares/authMiddleware";
import { sendListingSubmittedEmail } from "../lib/email";
import multer from "multer";
import { processAndSaveImage, validateImageBuffer } from "../lib/images";
import QRCode from "qrcode";
import { getListingLimit, countActiveListings } from "../lib/membership";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /listings
router.get("/listings", optionalAuth, async (req, res): Promise<void> => {
  const {
    q, category, city, state, minPrice, maxPrice, condition,
    page = "1", limit = "20", sortBy,
    featuredOnly, businessOnly, availableToday,
  } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(listingsTable.status, "approved")];
  if (q) conditions.push(ilike(listingsTable.title, `%${q}%`));
  if (category) conditions.push(eq(listingsTable.category, category));
  if (city) conditions.push(ilike(listingsTable.city, `%${city}%`));
  if (state) conditions.push(eq(listingsTable.state, state));
  if (condition) conditions.push(eq(listingsTable.condition, condition as typeof listingsTable.$inferSelect.condition));
  if (minPrice) conditions.push(gte(listingsTable.dailyPrice, minPrice));
  if (maxPrice) conditions.push(lte(listingsTable.dailyPrice, maxPrice));
  if (featuredOnly === "true") conditions.push(eq(listingsTable.isFeatured, true));
  // availableToday: approved + not expired (already filtered by status=approved above; also exclude expired)
  if (availableToday === "true") conditions.push(sql`(${listingsTable.expiresAt} IS NULL OR ${listingsTable.expiresAt} > now())`);
  // businessOnly: join with users to filter by userType='business'
  // handled below via subquery

  let orderBy;
  switch (sortBy) {
    case "price_asc": orderBy = asc(listingsTable.dailyPrice); break;
    case "price_desc": orderBy = desc(listingsTable.dailyPrice); break;
    default: orderBy = desc(listingsTable.createdAt);
  }

  if (businessOnly === "true") {
    // Join with users to filter business-type owners
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(listingsTable)
      .innerJoin(usersTable, and(eq(listingsTable.ownerId, usersTable.id), eq(usersTable.userType, "business")))
      .where(and(...conditions));

    const rows = await db
      .select({ listing: listingsTable, owner: { id: usersTable.id, name: usersTable.name, profilePhoto: usersTable.profilePhoto, userType: usersTable.userType, isVerified: usersTable.isVerified, phone: usersTable.phone, createdAt: usersTable.createdAt } })
      .from(listingsTable)
      .innerJoin(usersTable, and(eq(listingsTable.ownerId, usersTable.id), eq(usersTable.userType, "business")))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: rows.map(r => formatListing(r.listing, r.owner)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
    return;
  }

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(listingsTable).where(and(...conditions));
  const rows = await db.select().from(listingsTable).where(and(...conditions)).orderBy(orderBy).limit(limitNum).offset(offset);

  const ownerIds = [...new Set(rows.map(r => r.ownerId))];
  const owners = ownerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, profilePhoto: usersTable.profilePhoto, userType: usersTable.userType, isVerified: usersTable.isVerified, phone: usersTable.phone, createdAt: usersTable.createdAt }).from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];
  const ownerMap = new Map(owners.map(o => [o.id, o]));

  res.json({
    data: rows.map(r => formatListing(r, ownerMap.get(r.ownerId))),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// POST /listings
router.post("/listings", requireAuth, async (req, res): Promise<void> => {
  const { title, description, category, customCategory, brand, condition, dailyPrice, weeklyPrice, monthlyPrice, city, state, area, pincode, latitude, longitude } = req.body;

  if (!title || !category || !city || !state) {
    res.status(400).json({ error: "title, category, city, state are required" });
    return;
  }

  // Membership listing limit check
  const [limit, used] = await Promise.all([
    getListingLimit(req.user!.id),
    countActiveListings(req.user!.id),
  ]);
  if (limit === 0) {
    res.status(403).json({
      error: "No active membership",
      message: "Your free trial has expired or no membership is active. Please subscribe to a plan to create listings.",
      code: "MEMBERSHIP_REQUIRED",
    });
    return;
  }
  if (used >= limit) {
    res.status(403).json({
      error: "Listing limit reached",
      message: `Your current plan allows up to ${limit} active listing${limit === 1 ? "" : "s"}. You have ${used}. Upgrade your plan to add more.`,
      code: "LISTING_LIMIT_REACHED",
      limit,
      used,
    });
    return;
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [listing] = await db.insert(listingsTable).values({
    ownerId: req.user!.id,
    title, description: description ?? null,
    category, customCategory: customCategory ?? null,
    brand: brand ?? null,
    condition: (condition ?? "good") as typeof listingsTable.$inferSelect.condition,
    dailyPrice: dailyPrice ? String(dailyPrice) : null,
    weeklyPrice: weeklyPrice ? String(weeklyPrice) : null,
    monthlyPrice: monthlyPrice ? String(monthlyPrice) : null,
    city, state, area: area ?? null, pincode: pincode ?? null,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    expiresAt,
  }).returning();

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  await sendListingSubmittedEmail(owner.email, owner.name, title);

  res.status(201).json(formatListing(listing, owner));
});

// GET /listings/featured
router.get("/listings/featured", async (req, res): Promise<void> => {
  const limit = Math.min(20, parseInt(String(req.query.limit ?? "10"), 10));
  const rows = await db.select().from(listingsTable)
    .where(and(eq(listingsTable.status, "approved"), eq(listingsTable.isFeatured, true)))
    .orderBy(desc(listingsTable.createdAt)).limit(limit);

  const ownerIds = [...new Set(rows.map(r => r.ownerId))];
  const owners = ownerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, profilePhoto: usersTable.profilePhoto, userType: usersTable.userType, isVerified: usersTable.isVerified, phone: usersTable.phone, createdAt: usersTable.createdAt }).from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];
  const ownerMap = new Map(owners.map(o => [o.id, o]));

  res.json(rows.map(r => formatListing(r, ownerMap.get(r.ownerId))));
});

// GET /listings/nearby
router.get("/listings/nearby", async (req, res): Promise<void> => {
  const {
    lat, lng, radiusKm = "25", limit = "20",
    category, q, city, state, condition, minPrice, maxPrice,
    featuredOnly, businessOnly, availableToday,
  } = req.query as Record<string, string>;
  if (!lat || !lng) { res.status(400).json({ error: "lat and lng are required" }); return; }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const radius = parseFloat(radiusKm);
  const limitNum = Math.min(50, parseInt(limit, 10));

  const conditions = [
    eq(listingsTable.status, "approved"),
    sql`${listingsTable.latitude} IS NOT NULL`,
    sql`${listingsTable.longitude} IS NOT NULL`,
    sql`(
      6371 * acos(
        cos(radians(${latNum})) * cos(radians(${listingsTable.latitude}::float)) *
        cos(radians(${listingsTable.longitude}::float) - radians(${lngNum})) +
        sin(radians(${latNum})) * sin(radians(${listingsTable.latitude}::float))
      )
    ) <= ${radius}`,
  ];
  if (category)  conditions.push(eq(listingsTable.category, category));
  if (q)         conditions.push(ilike(listingsTable.title, `%${q}%`));
  if (city)      conditions.push(ilike(listingsTable.city, `%${city}%`));
  if (state)     conditions.push(eq(listingsTable.state, state));
  if (condition) conditions.push(eq(listingsTable.condition, condition as typeof listingsTable.$inferSelect.condition));
  if (minPrice)  conditions.push(gte(listingsTable.dailyPrice, minPrice));
  if (maxPrice)  conditions.push(lte(listingsTable.dailyPrice, maxPrice));
  if (featuredOnly === "true")   conditions.push(eq(listingsTable.isFeatured, true));
  if (availableToday === "true") conditions.push(sql`(${listingsTable.expiresAt} IS NULL OR ${listingsTable.expiresAt} > now())`);
  // businessOnly: use subquery — no join, no type complications
  if (businessOnly === "true") {
    conditions.push(inArray(
      listingsTable.ownerId,
      db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.userType, "business")),
    ));
  }

  const rows = await db.select({
    listing: listingsTable,
    distanceKm: sql<number>`
      6371 * acos(
        cos(radians(${latNum})) * cos(radians(${listingsTable.latitude}::float)) *
        cos(radians(${listingsTable.longitude}::float) - radians(${lngNum})) +
        sin(radians(${latNum})) * sin(radians(${listingsTable.latitude}::float))
      )
    `.as("distance_km"),
  }).from(listingsTable).where(and(...conditions))
    .orderBy(sql`distance_km`).limit(limitNum);

  const ownerIds = [...new Set(rows.map(r => r.listing.ownerId))];
  const owners = ownerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, profilePhoto: usersTable.profilePhoto, userType: usersTable.userType, isVerified: usersTable.isVerified, phone: usersTable.phone, createdAt: usersTable.createdAt }).from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];
  const ownerMap = new Map(owners.map(o => [o.id, o]));

  res.json(rows.map(r => ({ ...formatListing(r.listing, ownerMap.get(r.listing.ownerId)), distanceKm: Math.round(r.distanceKm * 10) / 10 })));
});

// GET /listings/me
router.get("/listings/me", requireAuth, async (req, res): Promise<void> => {
  const { status } = req.query as { status?: string };
  const conditions = [eq(listingsTable.ownerId, req.user!.id)];
  if (status && status !== "all") {
    conditions.push(eq(listingsTable.status, status as typeof listingsTable.$inferSelect.status));
  }
  const rows = await db.select().from(listingsTable).where(and(...conditions)).orderBy(desc(listingsTable.createdAt));
  res.json(rows.map(r => formatListing(r, undefined)));
});

// GET /listings/:id
router.get("/listings/:id", optionalAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!row || row.status !== "approved") { res.status(404).json({ error: "Listing not found" }); return; }

  const [owner] = await db.select({ id: usersTable.id, name: usersTable.name, profilePhoto: usersTable.profilePhoto, userType: usersTable.userType, isVerified: usersTable.isVerified, phone: usersTable.phone, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, row.ownerId)).limit(1);

  const APP_URL = process.env.APP_URL ?? "http://localhost:80";
  const listingUrl = `${APP_URL}/listings/${id}`;
  const qrDataUrl = await QRCode.toDataURL(listingUrl);

  let isFavourited = false;
  if (req.user) {
    const [fav] = await db.select().from(favouritesTable)
      .where(and(eq(favouritesTable.userId, req.user.id), eq(favouritesTable.listingId, id))).limit(1);
    isFavourited = !!fav;
  }

  const whatsappUrl = owner?.phone ? `https://wa.me/91${owner.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I saw your listing for "${row.title}" on RentNEarn. Is it available for rent?`)}` : null;

  res.json({ ...formatListing(row, owner), qrCode: qrDataUrl, isFavourited, whatsappUrl, listingUrl });
});

// PATCH /listings/:id
router.patch("/listings/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (existing.ownerId !== req.user!.id) { res.status(403).json({ error: "Not authorized" }); return; }

  const { title, description, category, brand, condition, dailyPrice, weeklyPrice, monthlyPrice, city, state, area, pincode, latitude, longitude } = req.body;
  const updates: Partial<typeof listingsTable.$inferInsert> = {};
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category) updates.category = category;
  if (brand !== undefined) updates.brand = brand;
  if (condition) updates.condition = condition;
  if (dailyPrice !== undefined) updates.dailyPrice = dailyPrice ? String(dailyPrice) : null;
  if (weeklyPrice !== undefined) updates.weeklyPrice = weeklyPrice ? String(weeklyPrice) : null;
  if (monthlyPrice !== undefined) updates.monthlyPrice = monthlyPrice ? String(monthlyPrice) : null;
  if (city) updates.city = city;
  if (state) updates.state = state;
  if (area !== undefined) updates.area = area ?? null;
  if (pincode !== undefined) updates.pincode = pincode;
  if (latitude !== undefined) updates.latitude = latitude ? String(latitude) : null;
  if (longitude !== undefined) updates.longitude = longitude ? String(longitude) : null;

  // Reset to pending when edited
  updates.status = "pending";

  const [updated] = await db.update(listingsTable).set(updates).where(eq(listingsTable.id, id)).returning();
  res.json(formatListing(updated, undefined));
});

// DELETE /listings/:id
router.delete("/listings/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (existing.ownerId !== req.user!.id && req.user!.userType !== "admin") {
    res.status(403).json({ error: "Not authorized" }); return;
  }

  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  res.json({ message: "Listing deleted" });
});

// POST /listings/:id/images (multipart, outside OpenAPI spec)
router.post("/listings/:id/images", requireAuth, upload.array("images", 5), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (existing.ownerId !== req.user!.id) { res.status(403).json({ error: "Not authorized" }); return; }

  const files = req.files as Express.Multer.File[];
  if (!files?.length) { res.status(400).json({ error: "No images uploaded" }); return; }

  const results = await Promise.all(files.map(f => {
    validateImageBuffer(f.buffer, f.mimetype);
    return processAndSaveImage(f.buffer, "listings", f.originalname);
  }));

  const images = [...(existing.images ?? []), ...results.map(r => r.imageUrl)];
  const thumbnails = [...(existing.thumbnails ?? []), ...results.map(r => r.thumbnailUrl)];

  await db.update(listingsTable).set({ images, thumbnails }).where(eq(listingsTable.id, id));
  res.json({ images, thumbnails });
});

// POST /listings/:id/renew
router.post("/listings/:id/renew", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (existing.ownerId !== req.user!.id) { res.status(403).json({ error: "Not authorized" }); return; }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [updated] = await db.update(listingsTable).set({ expiresAt, status: "pending" }).where(eq(listingsTable.id, id)).returning();
  res.json(formatListing(updated, undefined));
});

// GET /listings/:id/qr
router.get("/listings/:id/qr", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const APP_URL = process.env.APP_URL ?? "http://localhost:80";
  const listingUrl = `${APP_URL}/listings/${id}`;
  const qrDataUrl = await QRCode.toDataURL(listingUrl);
  res.json({ qrDataUrl, listingUrl });
});

function formatListing(listing: typeof listingsTable.$inferSelect, owner?: { id: number; name: string; profilePhoto: string | null; userType: string; isVerified: boolean; phone: string | null; createdAt: Date } | undefined) {
  return {
    id: listing.id,
    ownerId: listing.ownerId,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    brand: listing.brand,
    condition: listing.condition,
    rentalPrice: {
      daily: listing.dailyPrice ? Number(listing.dailyPrice) : null,
      weekly: listing.weeklyPrice ? Number(listing.weeklyPrice) : null,
      monthly: listing.monthlyPrice ? Number(listing.monthlyPrice) : null,
    },
    city: listing.city,
    state: listing.state,
    area: listing.area,
    pincode: listing.pincode,
    latitude: listing.latitude ? Number(listing.latitude) : null,
    longitude: listing.longitude ? Number(listing.longitude) : null,
    images: listing.images ?? [],
    thumbnails: listing.thumbnails ?? [],
    status: listing.status,
    isFeatured: listing.isFeatured,
    rejectionReason: listing.rejectionReason,
    expiresAt: listing.expiresAt,
    createdAt: listing.createdAt,
    owner: owner ? { ...owner, listingCount: 0 } : null,
  };
}

export default router;
