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
  const ALLOWED = ["listingId"]; 
  const extraKeys = Object.keys(req.body).filter(k => !ALLOWED.includes(k));
  if (extraKeys.length > 0) {
    console.warn("POST /recently-viewed: Unknown fields", extraKeys);
  }

  const { listingId } = req.body;
  if (!listingId) { res.status(400).json({ error: "listingId is required" }); return; }

  // Validate that the user is authorized to reference this listing
  const listingRows = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
  if (listingRows.length === 0) {
    res.status(400).json({ error: "Invalid listingId" });
    return;
  }
  const listing = listingRows[0];
  const userId = req.user!.id;
  const authorized = (listing.ownerId === userId) || (listing.status === "approved");
  if (!authorized) {
    res.status(403).json({ error: "Unauthorized access to this listing." });
    return;
  }

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

});
