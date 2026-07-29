import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, listingsTable, listingViewsTable, favouritesTable, pageEventsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

const AVAILABILITY_VALUES = [
  "available", "reserved", "rented_out", "under_maintenance", "no_longer_available",
] as const;

// ── Bot detection ─────────────────────────────────────────────────────────────
// A lightweight UA denylist covering the most common crawlers and headless
// browsers.  Not exhaustive, but catches the bulk of automated traffic.
const BOT_UA_RE = /bot|crawl|spider|slurp|facebookexternalhit|ia_archiver|semrush|ahrefs|mj12bot|rogerbot|dotbot|screaming.?frog|headless|phantomjs|selenium|puppeteer|playwright|wget|curl\/[0-9]/i;

function isBot(ua: string | undefined): boolean {
  if (!ua) return false;
  return BOT_UA_RE.test(ua);
}

// Cookie name used for server-side session token.
const SESSION_COOKIE = "rn_sid";
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── POST /listings/:id/view ───────────────────────────────────────────────────
// No auth required — anonymous visitors can trigger this.
// Deduplication: one count per (listingId, visitorKey) per 30-min bucket.
//
// Visitor key resolution order (most to least trustworthy):
//  1. httpOnly session cookie `rn_sid`  — survives page reloads, not accessible
//     to JS, set by the server so private-browsing sessions get a fresh key but
//     can't re-count within the same session.
//  2. Body `visitorKey`                 — localStorage UUID sent by the client
//     as a fallback when cookies are blocked.
//  3. Server-generated UUID             — if neither is present on the first
//     request; the generated key is immediately set as a cookie.
//
// Bot requests are rejected before any DB work.
router.post("/listings/:id/view", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (!id) { res.json({ counted: false }); return; }

  // 1. Reject known bots
  if (isBot(req.headers["user-agent"])) {
    res.json({ counted: false }); return;
  }

  // 2. Resolve visitor key
  let visitorKey: string;
  const cookieSid = req.cookies?.[SESSION_COOKIE];

  if (typeof cookieSid === "string" && cookieSid.length > 0 && cookieSid.length <= 128) {
    // Existing session cookie — use it directly (no need to re-set)
    visitorKey = cookieSid;
  } else {
    // Fall back to the localStorage key sent in the request body
    const bodyKey = (req.body as any)?.visitorKey;
    visitorKey = (typeof bodyKey === "string" && bodyKey.length > 0 && bodyKey.length <= 128)
      ? bodyKey
      : crypto.randomUUID();

    // Promote to server-side cookie so future requests from this browser
    // session use the stable key even if localStorage is cleared.
    res.cookie(SESSION_COOKIE, visitorKey, {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE_MS,
      sameSite: "lax",
      path: "/",
    });
  }

  // 3. Verify listing exists and is approved
  const [listing] = await db
    .select({ id: listingsTable.id, ownerId: listingsTable.ownerId, status: listingsTable.status })
    .from(listingsTable).where(eq(listingsTable.id, id)).limit(1);

  if (!listing || listing.status !== "approved") {
    res.json({ counted: false }); return;
  }

  // 30-minute bucket key
  const bucketKey = Math.floor(Date.now() / (30 * 60 * 1000)).toString();

  try {
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
  } catch {
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

// ── POST /analytics/event ─────────────────────────────────────────────────────
// Records a page-level analytics event (page_view, cta_click, …).
// No auth required. Bots are silently dropped. Errors are swallowed so
// analytics can never break the user experience.
router.post("/analytics/event", async (req, res): Promise<void> => {
  res.json({ ok: true }); // respond immediately — don't block the client

  const { eventType, page, meta, visitorKey: bodyKey } = req.body as {
    eventType?: unknown;
    page?: unknown;
    meta?: unknown;
    visitorKey?: unknown;
  };

  if (typeof eventType !== "string" || !eventType || typeof page !== "string" || !page) return;
  if (isBot(req.headers["user-agent"])) return;

  const resolvedKey: string | null =
    (typeof req.cookies?.[SESSION_COOKIE] === "string" && (req.cookies[SESSION_COOKIE] as string).length > 0)
      ? (req.cookies[SESSION_COOKIE] as string).slice(0, 128)
      : typeof bodyKey === "string" && bodyKey.length > 0
        ? bodyKey.slice(0, 128)
        : null;

  try {
    await db.insert(pageEventsTable).values({
      eventType: eventType.slice(0, 64),
      page:      page.slice(0, 255),
      meta:      (meta && typeof meta === "object") ? meta : null,
      visitorKey: resolvedKey,
    });
  } catch { /* swallow — analytics must not affect UX */ }
});

export default router;
