import { Router } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, listingsTable, favouritesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const statuses = ["pending", "approved", "rejected", "expired"] as const;
  const statusCounts = await Promise.all(
    statuses.map(s => db.select({ count: sql<number>`count(*)::int` }).from(listingsTable)
      .where(and(eq(listingsTable.ownerId, userId), eq(listingsTable.status, s))))
  );

  const [favCount] = await db.select({ count: sql<number>`count(*)::int` }).from(favouritesTable)
    .where(eq(favouritesTable.userId, userId));

  const [totalListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable)
    .where(eq(listingsTable.ownerId, userId));

  res.json({
    totalListings: totalListings.count,
    pendingListings: statusCounts[0][0].count,
    activeListings: statusCounts[1][0].count,
    rejectedListings: statusCounts[2][0].count,
    expiredListings: statusCounts[3][0].count,
    totalFavourites: favCount.count,
    profileViews: 0,
  });
});

// GET /dashboard/activity
router.get("/dashboard/activity", requireAuth, async (req, res): Promise<void> => {
  const limit = Math.min(20, parseInt(String(req.query.limit ?? "10"), 10));
  const userId = req.user!.id;

  // Return recent listing status changes as activity
  const listings = await db.select().from(listingsTable)
    .where(eq(listingsTable.ownerId, userId))
    .orderBy(desc(listingsTable.updatedAt)).limit(limit);

  const activities = listings.map((l, i) => ({
    id: i + 1,
    type: l.status === "approved" ? "listing_approved"
      : l.status === "rejected" ? "listing_rejected"
        : l.status === "expired" ? "listing_expired"
          : "listing_viewed",
    description: l.status === "approved" ? `Your listing "${l.title}" was approved`
      : l.status === "rejected" ? `Your listing "${l.title}" was rejected: ${l.rejectionReason ?? ""}`
        : l.status === "expired" ? `Your listing "${l.title}" has expired`
          : `Your listing "${l.title}" is pending review`,
    listingId: l.id,
    listingTitle: l.title,
    createdAt: l.updatedAt,
  }));

  res.json(activities);
});

export default router;
