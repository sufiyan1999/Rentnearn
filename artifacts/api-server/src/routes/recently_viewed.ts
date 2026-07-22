import { Router } from "express";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db, recentlyViewedTable, listingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

// GET /recently-viewed
router.get("/recently-viewed", requireAuth, async (req, res): Promise<void> => {
  const limit = Math.min(20, parseInt(String(req.query.limit ?? "10"), 10));

  const views = await db.select().from(recentlyViewedTable)
    .where(eq(recentlyViewedTable.userId, req.user!.id))
    .orderBy(desc(recentlyViewedTable.viewedAt)).limit(limit);

  if (!views.length) { res.json([]); return; }

  const listingIds = [...new Set(views.map(v => v.listingId))];
  const listings = await db.select().from(listingsTable)
    .where(and(inArray(listingsTable.id, listingIds), eq(listingsTable.status, "approved")));

  const ownerIds = [...new Set(listings.map(l => l.ownerId))];
  const owners = ownerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, profilePhoto: usersTable.profilePhoto, userType: usersTable.userType, isVerified: usersTable.isVerified, phone: usersTable.phone, createdAt: usersTable.createdAt }).from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];
  const ownerMap = new Map(owners.map(o => [o.id, o]));
  const listingMap = new Map(listings.map(l => [l.id, l]));

  // Return in view order, deduped
  const seen = new Set<number>();
  const result = [];
  for (const v of views) {
    if (!seen.has(v.listingId) && listingMap.has(v.listingId)) {
      seen.add(v.listingId);
      const l = listingMap.get(v.listingId)!;
      result.push(formatListing(l, ownerMap.get(l.ownerId)));
    }
  }
  res.json(result);
});

// POST /recently-viewed
router.post("/recently-viewed", requireAuth, async (req, res): Promise<void> => {
  const { listingId } = req.body;
  if (!listingId) { res.status(400).json({ error: "listingId is required" }); return; }

  // Upsert: insert new view (keep last 50 per user)
  await db.insert(recentlyViewedTable).values({ userId: req.user!.id, listingId });

  // Prune old entries beyond 50
  const views = await db.select({ id: recentlyViewedTable.id }).from(recentlyViewedTable)
    .where(eq(recentlyViewedTable.userId, req.user!.id))
    .orderBy(desc(recentlyViewedTable.viewedAt)).offset(50);
  if (views.length) {
    const oldIds = views.map(v => v.id);
    for (const id of oldIds) {
      await db.delete(recentlyViewedTable).where(eq(recentlyViewedTable.id, id));
    }
  }

  res.json({ message: "View tracked" });
});

function formatListing(listing: typeof listingsTable.$inferSelect, owner?: { id: number; name: string; profilePhoto: string | null; userType: string; isVerified: boolean; phone: string | null; createdAt: Date } | undefined) {
  return {
    id: listing.id, ownerId: listing.ownerId, title: listing.title, description: listing.description,
    category: listing.category, brand: listing.brand, condition: listing.condition,
    rentalPrice: { daily: listing.dailyPrice ? Number(listing.dailyPrice) : null, weekly: listing.weeklyPrice ? Number(listing.weeklyPrice) : null, monthly: listing.monthlyPrice ? Number(listing.monthlyPrice) : null },
    city: listing.city, state: listing.state, pincode: listing.pincode,
    latitude: listing.latitude ? Number(listing.latitude) : null, longitude: listing.longitude ? Number(listing.longitude) : null,
    images: listing.images ?? [], thumbnails: listing.thumbnails ?? [],
    status: listing.status, isFeatured: listing.isFeatured, rejectionReason: listing.rejectionReason,
    expiresAt: listing.expiresAt, createdAt: listing.createdAt, owner: owner ? { ...owner, listingCount: 0 } : null,
  };
}

export default router;
