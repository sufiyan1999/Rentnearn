import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, listingsTable, listingViewsTable, favouritesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

const AVAILABILITY_VALUES = [
  "available", "reserved", "rented_out", "under_maintenance", "no_longer_available",
] as const;

// ── POST /listings/:id/view ───────────────────────────────────────────────────
// No auth required — anonymous visitors can trigger this.
// Deduplication: one count per (listingId, visitorKey) per 30-min bucket.
router.post("/listings/:id/view", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { visitorKey } = req.body as { visitorKey?: string };

  if (!id || !visitorKey || typeof visitorKey !== "string" || visitorKey.length > 128) {
    res.json({ counted: false }); return;
  }

  const [listing] = await db
    .select({ id: listingsTable.id, ownerId: listingsTable.ownerId, status: listingsTable.status })
    .from(listingsTable).where(eq(listingsTable.id, id)).limit(1);

  if (!listing || listing.status !== "approved") {
    res.json({ counted: false }); return;
  }

  // 30-minute bucket key
  const bucketKey = Math.floor(Date.now() / (30 * 60 * 1000)).toString();

  try {
    // Check if view already counted in this window
    const [existing] = await db
      .select({ id: listingViewsTable.id })
      .from(listingViewsTable)
      .where(
        and(
          eq(listingViewsTable.listingId, id),
          eq(listingViewsTable.visitorKey, visitorKey.slice(0, 128)),
          eq(listingViewsTable.bucketKey, bucketKey)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(listingViewsTable).values({
        listingId: id,
        visitorKey: visitorKey.slice(0, 128),
        bucketKey,
      });
      await db
        .update(listingsTable)
        .set({ viewCount: sql`${listingsTable.viewCount} + 1` })
        .where(eq(listingsTable.id, id));
      res.json({ counted: true });
    } else {
      res.json({ counted: false });
    }
  } catch (err) {
    // Swallow errors silently — analytics should never break UX
    res.json({ counted: false });
  }
});

// ── POST /listings/:id/interact ──────────────────────────────────────────────
// Increment one of the interaction counters. No auth required.
router.post("/listings/:id/interact", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { type } = req.body as { type?: string };

  const UPDATE_MAP: Record<string, Partial<typeof listingsTable.$inferInsert>> = {
    whatsapp:  { whatsappClicks:  sql`${listingsTable.whatsappClicks}  + 1` as any },
    phone:     { phoneClicks:     sql`${listingsTable.phoneClicks}     + 1` as any },
    phone_copy:{ phoneCopyClicks: sql`${listingsTable.phoneCopyClicks} + 1` as any },
    share:     { shareCount:      sql`${listingsTable.shareCount}      + 1` as any },
    qr:        { qrScans:         sql`${listingsTable.qrScans}         + 1` as any },
  };

  const update = type ? UPDATE_MAP[type] : undefined;
  if (!update) { res.status(400).json({ error: "Invalid interaction type" }); return; }

  try {
    await db.update(listingsTable).set(update).where(eq(listingsTable.id, id));
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// ── PATCH /listings/:id/availability ────────────────────────────────────────
router.patch("/listings/:id/availability", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { status } = req.body as { status?: string };

  if (!status || !AVAILABILITY_VALUES.includes(status as any)) {
    res.status(400).json({ error: "Invalid availability status" }); return;
  }

  const [listing] = await db
    .select({ ownerId: listingsTable.ownerId })
    .from(listingsTable).where(eq(listingsTable.id, id)).limit(1);

  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (listing.ownerId !== req.user!.id) { res.status(403).json({ error: "Not authorized" }); return; }

  await db
    .update(listingsTable)
    .set({ availabilityStatus: status })
    .where(eq(listingsTable.id, id));

  res.json({ success: true, status });
});

// ── POST /listings/:id/times-rented ─────────────────────────────────────────
// Owner increments the "times rented" counter after a successful rental.
router.post("/listings/:id/times-rented", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  const [listing] = await db
    .select({ ownerId: listingsTable.ownerId })
    .from(listingsTable).where(eq(listingsTable.id, id)).limit(1);

  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (listing.ownerId !== req.user!.id) { res.status(403).json({ error: "Not authorized" }); return; }

  const [updated] = await db
    .update(listingsTable)
    .set({ timesRented: sql`${listingsTable.timesRented} + 1` })
    .where(eq(listingsTable.id, id))
    .returning({ timesRented: listingsTable.timesRented });

  res.json({ success: true, timesRented: updated.timesRented });
});

// ── GET /listings/:id/analytics ──────────────────────────────────────────────
// Owner-only: full analytics breakdown including views today / this week.
router.get("/listings/:id/analytics", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, id))
    .limit(1);

  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (listing.ownerId !== req.user!.id) { res.status(403).json({ error: "Not authorized" }); return; }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [[{ viewsToday }], [{ viewsWeek }], [{ favCount }]] = await Promise.all([
    db.select({ viewsToday: sql<number>`count(*)::int` })
      .from(listingViewsTable)
      .where(and(eq(listingViewsTable.listingId, id), sql`${listingViewsTable.createdAt} >= ${todayStart}`)),
    db.select({ viewsWeek: sql<number>`count(*)::int` })
      .from(listingViewsTable)
      .where(and(eq(listingViewsTable.listingId, id), sql`${listingViewsTable.createdAt} >= ${weekStart}`)),
    db.select({ favCount: sql<number>`count(*)::int` })
      .from(favouritesTable)
      .where(eq(favouritesTable.listingId, id)),
  ]);

  const contactClicks = listing.whatsappClicks + listing.phoneClicks;

  res.json({
    viewCount:       listing.viewCount,
    viewsToday,
    viewsThisWeek:   viewsWeek,
    favouriteCount:  favCount,
    whatsappClicks:  listing.whatsappClicks,
    phoneClicks:     listing.phoneClicks,
    phoneCopyClicks: listing.phoneCopyClicks,
    shareCount:      listing.shareCount,
    qrScans:         listing.qrScans,
    timesRented:     listing.timesRented,
    contactClicks,
    availabilityStatus: listing.availabilityStatus,
    expiresAt:       listing.expiresAt,
  });
});

export default router;
