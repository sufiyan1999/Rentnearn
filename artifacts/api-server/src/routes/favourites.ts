import { Router } from "express";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db, favouritesTable, listingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

// GET /favourites
router.get("/favourites", requireAuth, async (req, res): Promise<void> => {
  const favs = await db.select().from(favouritesTable)
    .where(eq(favouritesTable.userId, req.user!.id))
    .orderBy(desc(favouritesTable.createdAt));

  if (!favs.length) { res.json([]); return; }

  const listingIds = favs.map(f => f.listingId);
  const listings = await db.select().from(listingsTable)
    .where(and(inArray(listingsTable.id, listingIds), eq(listingsTable.status, "approved")));

  const ownerIds = [...new Set(listings.map(l => l.ownerId))];
  const owners = ownerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, profilePhoto: usersTable.profilePhoto, userType: usersTable.userType, isVerified: usersTable.isVerified, phone: usersTable.phone, createdAt: usersTable.createdAt }).from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];
  const ownerMap = new Map(owners.map(o => [o.id, o]));

  res.json(listings.map(l => formatListing(l, ownerMap.get(l.ownerId))));
});

// POST /favourites
router.post("/favourites", requireAuth, async (req, res): Promise<void> => {
  const { listingId } = req.body;
  if (!listingId) { res.status(400).json({ error: "listingId is required" }); return; }

  try {
    await db.insert(favouritesTable).values({ userId: req.user!.id, listingId }).onConflictDoNothing();
    res.status(201).json({ message: "Added to favourites" });
  } catch {
    res.status(400).json({ error: "Could not add to favourites" });
  }
});

// DELETE /favourites/:listingId
router.delete("/favourites/:listingId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;
  const listingId = parseInt(raw, 10);
  if (isNaN(listingId)) { res.status(400).json({ error: "Invalid listingId" }); return; }

  await db.delete(favouritesTable)
    .where(and(eq(favouritesTable.userId, req.user!.id), eq(favouritesTable.listingId, listingId)));
  res.json({ message: "Removed from favourites" });
});

// GET /favourites/ids
router.get("/favourites/ids", requireAuth, async (req, res): Promise<void> => {
  const favs = await db.select({ listingId: favouritesTable.listingId }).from(favouritesTable)
    .where(eq(favouritesTable.userId, req.user!.id));
  res.json({ ids: favs.map(f => f.listingId) });
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
