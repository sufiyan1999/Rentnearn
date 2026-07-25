import { Router } from "express";
import { eq, desc, count, and, ilike, sql, inArray, isNull } from "drizzle-orm";
import { db, listingsTable, usersTable, favouritesTable, categoriesTable, businessProfilesTable, membershipPlansTable, userMembershipsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware";
import { sendListingApprovedEmail, sendListingRejectedEmail } from "../lib/email";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /admin/listings
router.get("/admin/listings", async (req, res): Promise<void> => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(listingsTable.status, status as typeof listingsTable.$inferSelect.status));
  }

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(listingsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const rows = await db.select().from(listingsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(listingsTable.createdAt)).limit(limitNum).offset(offset);

  res.json({ data: rows.map(formatListing), total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// PATCH /admin/listings/:id/approve
router.patch("/admin/listings/:id/approve", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [listing] = await db.update(listingsTable).set({ status: "approved", rejectionReason: null }).where(eq(listingsTable.id, id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, listing.ownerId)).limit(1);
  if (owner) await sendListingApprovedEmail(owner.email, owner.name, listing.title, listing.id);

  res.json(formatListing(listing));
});

// PATCH /admin/listings/:id/reject
router.patch("/admin/listings/:id/reject", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reason } = req.body;
  if (!reason) { res.status(400).json({ error: "reason is required" }); return; }

  const [listing] = await db.update(listingsTable).set({ status: "rejected", rejectionReason: reason }).where(eq(listingsTable.id, id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, listing.ownerId)).limit(1);
  if (owner) await sendListingRejectedEmail(owner.email, owner.name, listing.title, reason);

  res.json(formatListing(listing));
});

// PATCH /admin/listings/:id/feature
router.patch("/admin/listings/:id/feature", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { featured } = req.body;
  const [listing] = await db.update(listingsTable).set({ isFeatured: featured }).where(eq(listingsTable.id, id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  res.json(formatListing(listing));
});

// GET /admin/users
router.get("/admin/users", async (req, res): Promise<void> => {
  const { page = "1", limit = "20", q } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = q ? [ilike(usersTable.name, `%${q}%`)] : [];

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined);
  const rows = await db.select().from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.createdAt)).limit(limitNum).offset(offset);

  res.json({ data: rows.map(sanitizeUser), total, page: pageNum, limit: limitNum });
});

// PATCH /admin/users/:userId/verify
router.patch("/admin/users/:userId/verify", async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  const [user] = await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(sanitizeUser(user));
});

// GET /admin/stats
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [totalUsers], [totalListings], [pending], [active], [expired], [featured],
    [totalFavs], [newUsers], [newListings],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "pending")),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "approved")),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "expired")),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.isFeatured, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(favouritesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(sql`${usersTable.createdAt} >= ${monthStart}`),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(sql`${listingsTable.createdAt} >= ${monthStart}`),
  ]);

  const topCats = await db.select({ category: listingsTable.category, count: count() })
    .from(listingsTable).where(eq(listingsTable.status, "approved"))
    .groupBy(listingsTable.category).orderBy(desc(count())).limit(5);

  // Top favourited listings with counts
  const topFavRows = await db
    .select({ listingId: favouritesTable.listingId, favouriteCount: sql<number>`count(*)::int` })
    .from(favouritesTable)
    .groupBy(favouritesTable.listingId)
    .orderBy(desc(sql`count(*)`))
    .limit(8);

  const topListingIds = topFavRows.map(r => r.listingId);
  const topListings = topListingIds.length > 0
    ? await db.select({
        id: listingsTable.id, title: listingsTable.title,
        category: listingsTable.category, city: listingsTable.city,
        isFeatured: listingsTable.isFeatured, status: listingsTable.status,
      }).from(listingsTable).where(inArray(listingsTable.id, topListingIds))
    : [];

  const listingMap = new Map(topListings.map(l => [l.id, l]));
  const topFavourites = topFavRows
    .filter(r => listingMap.has(r.listingId))
    .map(r => ({ ...listingMap.get(r.listingId)!, favouriteCount: r.favouriteCount }));

  res.json({
    totalUsers: totalUsers.count,
    totalListings: totalListings.count,
    pendingApprovals: pending.count,
    activeListings: active.count,
    expiredListings: expired.count,
    featuredListings: featured.count,
    totalFavourites: totalFavs.count,
    newUsersThisMonth: newUsers.count,
    newListingsThisMonth: newListings.count,
    topCategories: topCats.map(c => ({ category: c.category, count: Number(c.count) })),
    topFavourites,
  });
});

// ─── Business Profiles ────────────────────────────────────────────────────────

// GET /admin/business-profiles
router.get("/admin/business-profiles", async (req, res): Promise<void> => {
  const { verified } = req.query as Record<string, string>;

  const conditions = [eq(usersTable.userType, "business")];
  if (verified === "true")  conditions.push(eq(usersTable.isVerified, true));
  if (verified === "false") conditions.push(eq(usersTable.isVerified, false));

  const rows = await db
    .select({
      user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, isVerified: usersTable.isVerified, createdAt: usersTable.createdAt },
      profile: businessProfilesTable,
    })
    .from(usersTable)
    .leftJoin(businessProfilesTable, eq(businessProfilesTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(usersTable.isVerified, desc(usersTable.createdAt));

  res.json(rows);
});

// PATCH /admin/business-profiles/:userId/approve
router.patch("/admin/business-profiles/:userId/approve", async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  const [user] = await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ success: true, userId });
});

// PATCH /admin/business-profiles/:userId/reject
router.patch("/admin/business-profiles/:userId/reject", async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  const [user] = await db.update(usersTable).set({ isVerified: false }).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ success: true, userId });
});

// ─── Categories ───────────────────────────────────────────────────────────────

// GET /admin/categories
router.get("/admin/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.parentId, categoriesTable.id);

  const listingCounts = await db
    .select({ category: listingsTable.category, count: sql<number>`count(*)::int` })
    .from(listingsTable)
    .where(eq(listingsTable.status, "approved"))
    .groupBy(listingsTable.category);

  const countMap = new Map(listingCounts.map(r => [r.category, r.count]));

  const topLevel = cats.filter(c => !c.parentId).map(c => ({
    ...c,
    listingCount: countMap.get(c.name) ?? 0,
    subcategories: cats.filter(s => s.parentId === c.id),
  }));

  res.json(topLevel);
});

// POST /admin/categories
router.post("/admin/categories", async (req, res): Promise<void> => {
  const { name, slug, icon, description } = req.body;
  if (!name || !slug || !icon) { res.status(400).json({ error: "name, slug, and icon are required" }); return; }

  const [cat] = await db.insert(categoriesTable).values({ name, slug, icon, description: description ?? null }).returning();
  res.status(201).json({ ...cat, listingCount: 0, subcategories: [] });
});

// PATCH /admin/categories/:id
router.patch("/admin/categories/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { isActive, name, description } = req.body;

  const updates: Partial<typeof categoriesTable.$inferInsert> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;

  const [cat] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
  res.json(cat);
});

// ─── Reports ──────────────────────────────────────────────────────────────────

// GET /admin/reports
router.get("/admin/reports", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenueByPlan, listingsPerDay, topCities, userGrowth, membershipBreakdown] = await Promise.all([
    // Revenue by plan (sum amountPaise from paid memberships, grouped by plan)
    db
      .select({
        planName: membershipPlansTable.name,
        planSlug: membershipPlansTable.slug,
        totalPaise: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(userMembershipsTable)
      .innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
      .where(sql`${userMembershipsTable.amountPaise} > 0`)
      .groupBy(membershipPlansTable.id, membershipPlansTable.name, membershipPlansTable.slug)
      .orderBy(desc(sql`sum(${userMembershipsTable.amountPaise})`)),

    // Listings created per day (last 30 days)
    db
      .select({
        day: sql<string>`date_trunc('day', ${listingsTable.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(listingsTable)
      .where(sql`${listingsTable.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`date_trunc('day', ${listingsTable.createdAt})`)
      .orderBy(sql`date_trunc('day', ${listingsTable.createdAt})`),

    // Top 10 cities by approved listing count
    db
      .select({
        city: listingsTable.city,
        count: sql<number>`count(*)::int`,
      })
      .from(listingsTable)
      .where(eq(listingsTable.status, "approved"))
      .groupBy(listingsTable.city)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    // New users per day (last 30 days)
    db
      .select({
        day: sql<string>`date_trunc('day', ${usersTable.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(usersTable)
      .where(sql`${usersTable.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`date_trunc('day', ${usersTable.createdAt})`)
      .orderBy(sql`date_trunc('day', ${usersTable.createdAt})`),

    // Active membership breakdown by plan
    db
      .select({
        planName: membershipPlansTable.name,
        planSlug: membershipPlansTable.slug,
        count: sql<number>`count(*)::int`,
      })
      .from(userMembershipsTable)
      .innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
      .where(eq(userMembershipsTable.status, "active"))
      .groupBy(membershipPlansTable.id, membershipPlansTable.name, membershipPlansTable.slug)
      .orderBy(membershipPlansTable.sortOrder),
  ]);

  const totalRevenuePaise = revenueByPlan.reduce((sum, r) => sum + r.totalPaise, 0);

  res.json({
    totalRevenuePaise,
    revenueByPlan: revenueByPlan.map(r => ({ ...r, totalRupees: Math.round(r.totalPaise / 100) })),
    listingsPerDay: listingsPerDay.map(r => ({ day: r.day, count: r.count })),
    topCities,
    userGrowth: userGrowth.map(r => ({ day: r.day, count: r.count })),
    membershipBreakdown,
  });
});

function formatListing(listing: typeof listingsTable.$inferSelect) {
  return {
    id: listing.id, ownerId: listing.ownerId, title: listing.title, description: listing.description,
    category: listing.category, brand: listing.brand, condition: listing.condition,
    rentalPrice: { daily: listing.dailyPrice ? Number(listing.dailyPrice) : null, weekly: listing.weeklyPrice ? Number(listing.weeklyPrice) : null, monthly: listing.monthlyPrice ? Number(listing.monthlyPrice) : null },
    city: listing.city, state: listing.state, pincode: listing.pincode,
    images: listing.images ?? [], thumbnails: listing.thumbnails ?? [],
    status: listing.status, isFeatured: listing.isFeatured, rejectionReason: listing.rejectionReason,
    expiresAt: listing.expiresAt, createdAt: listing.createdAt, owner: null,
  };
}

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, profilePhoto: user.profilePhoto, userType: user.userType, isVerified: user.isVerified, emailVerified: user.emailVerified, createdAt: user.createdAt };
}

export default router;
