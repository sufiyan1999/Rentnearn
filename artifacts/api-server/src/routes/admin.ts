import { Router, Request } from "express";
import { eq, desc, count, and, ilike, sql, inArray, sum, gte, lt, or } from "drizzle-orm";
import {
  db, listingsTable, usersTable, favouritesTable, categoriesTable,
  businessProfilesTable, membershipPlansTable, userMembershipsTable,
  listingViewsTable, adminAuditLogTable, adminGoalsTable,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware";
import { sendListingApprovedEmail, sendListingRejectedEmail } from "../lib/email";

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── Audit log helper ──────────────────────────────────────────────────────────
async function logAudit(
  req: Request,
  action: string,
  module: string,
  affectedId?: number,
  affectedType?: string,
  prevValue?: unknown,
  newValue?: unknown,
) {
  try {
    await db.insert(adminAuditLogTable).values({
      action,
      module,
      affectedId: affectedId ?? null,
      affectedType: affectedType ?? null,
      prevValue: prevValue ?? null,
      newValue: newValue ?? null,
      ipAddress: (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      status: "success",
    });
  } catch { /* audit failures must not break the main action */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const nowFn = () => new Date();
const startOfDay   = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek  = (d = new Date()) => { const s = new Date(d); s.setDate(s.getDate() - s.getDay()); s.setHours(0,0,0,0); return s; };
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfYear  = (d = new Date()) => new Date(d.getFullYear(), 0, 1);
const prevPeriodStart = (start: Date, end: Date) => { const ms = end.getTime() - start.getTime(); return new Date(start.getTime() - ms); };

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null;
  return Math.round(((cur - prev) / prev) * 100);
}

// ─── GET /admin/stats (expanded) ─────────────────────────────────────────────
router.get("/admin/stats", async (req, res): Promise<void> => {
  const now = nowFn();
  const todayStart   = startOfDay(now);
  const weekStart    = startOfWeek(now);
  const monthStart   = startOfMonth(now);
  const yearStart    = startOfYear(now);

  const prevTodayStart   = new Date(todayStart.getTime() - 86400000);
  const prevWeekStart    = new Date(weekStart.getTime() - 7 * 86400000);
  const prevMonthStart   = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
  const prevMonthEnd     = monthStart;

  const [
    [totalUsers], [totalListings], [pending], [active], [expired], [featured], [rejected],
    [totalFavs], [totalTimesRented],
    [newUsersToday], [newUsersWeek], [newUsersMonth],
    [prevUsersToday], [prevUsersWeek], [prevUsersMonth],
    [newListingsMonth],
    [totalBiz], [verifiedBiz],
    [viewsToday], [viewsWeek], [viewsMonth],
    analyticsAgg,
    revenueToday, revenueWeek, revenueMonth, revenueYear,
    prevRevenueMonth,
    [failedPayments], [successPayments],
    membershipExpiringSoon,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "pending")),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "approved")),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "expired")),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.isFeatured, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "rejected")),
    db.select({ count: sql<number>`count(*)::int` }).from(favouritesTable),
    db.select({ s: sql<number>`coalesce(sum(${listingsTable.timesRented}),0)::int` }).from(listingsTable),

    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(gte(usersTable.createdAt, todayStart)),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(gte(usersTable.createdAt, weekStart)),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(gte(usersTable.createdAt, monthStart)),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(and(gte(usersTable.createdAt, prevTodayStart), lt(usersTable.createdAt, todayStart))),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(and(gte(usersTable.createdAt, prevWeekStart), lt(usersTable.createdAt, weekStart))),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(and(gte(usersTable.createdAt, prevMonthStart), lt(usersTable.createdAt, prevMonthEnd))),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(gte(listingsTable.createdAt, monthStart)),

    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.userType, "business")),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(and(eq(usersTable.userType, "business"), eq(usersTable.isVerified, true))),

    db.select({ count: sql<number>`count(*)::int` }).from(listingViewsTable).where(gte(listingViewsTable.createdAt, todayStart)),
    db.select({ count: sql<number>`count(*)::int` }).from(listingViewsTable).where(gte(listingViewsTable.createdAt, weekStart)),
    db.select({ count: sql<number>`count(*)::int` }).from(listingViewsTable).where(gte(listingViewsTable.createdAt, monthStart)),

    db.select({
      totalViews:       sql<number>`coalesce(sum(${listingsTable.viewCount}),0)::int`,
      totalWhatsapp:    sql<number>`coalesce(sum(${listingsTable.whatsappClicks}),0)::int`,
      totalPhone:       sql<number>`coalesce(sum(${listingsTable.phoneClicks}),0)::int`,
      totalShare:       sql<number>`coalesce(sum(${listingsTable.shareCount}),0)::int`,
      totalQr:          sql<number>`coalesce(sum(${listingsTable.qrScans}),0)::int`,
    }).from(listingsTable),

    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, todayStart), sql`${userMembershipsTable.amountPaise} > 0`)),
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, weekStart), sql`${userMembershipsTable.amountPaise} > 0`)),
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, monthStart), sql`${userMembershipsTable.amountPaise} > 0`)),
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, yearStart), sql`${userMembershipsTable.amountPaise} > 0`)),
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, prevMonthStart), lt(userMembershipsTable.createdAt, prevMonthEnd), sql`${userMembershipsTable.amountPaise} > 0`)),

    db.select({ count: sql<number>`count(*)::int` }).from(userMembershipsTable).where(eq(userMembershipsTable.status, "cancelled")),
    db.select({ count: sql<number>`count(*)::int` }).from(userMembershipsTable).where(eq(userMembershipsTable.status, "active")),

    db.select({ count: sql<number>`count(*)::int` }).from(userMembershipsTable).where(and(
      eq(userMembershipsTable.status, "active"),
      gte(userMembershipsTable.expiresAt, now),
      lt(userMembershipsTable.expiresAt, new Date(now.getTime() + 7 * 86400000)),
    )),
  ]);

  const agg = analyticsAgg[0] ?? { totalViews: 0, totalWhatsapp: 0, totalPhone: 0, totalShare: 0, totalQr: 0 };
  const totalContactClicks = agg.totalWhatsapp + agg.totalPhone;
  const revTodayPaise   = (revenueToday[0] as any)?.s ?? 0;
  const revWeekPaise    = (revenueWeek[0] as any)?.s ?? 0;
  const revMonthPaise   = (revenueMonth[0] as any)?.s ?? 0;
  const revYearPaise    = (revenueYear[0] as any)?.s ?? 0;
  const prevRevMonthPaise = (prevRevenueMonth[0] as any)?.s ?? 0;
  const timesRented     = (totalTimesRented as any)?.s ?? 0;

  const totalPayments = failedPayments.count + successPayments.count;
  const paymentSuccessRate = totalPayments > 0 ? Math.round((successPayments.count / totalPayments) * 100) : 100;

  // Top categories
  const topCats = await db.select({ category: listingsTable.category, count: count() })
    .from(listingsTable).where(eq(listingsTable.status, "approved"))
    .groupBy(listingsTable.category).orderBy(desc(count())).limit(5);

  // Top favourited
  const topFavRows = await db
    .select({ listingId: favouritesTable.listingId, favouriteCount: sql<number>`count(*)::int` })
    .from(favouritesTable).groupBy(favouritesTable.listingId).orderBy(desc(sql`count(*)`)).limit(8);

  const topListingIds = topFavRows.map(r => r.listingId);
  const topListings = topListingIds.length > 0
    ? await db.select({ id: listingsTable.id, title: listingsTable.title, category: listingsTable.category, city: listingsTable.city, isFeatured: listingsTable.isFeatured })
        .from(listingsTable).where(inArray(listingsTable.id, topListingIds))
    : [];
  const listingMap = new Map(topListings.map(l => [l.id, l]));
  const topFavourites = topFavRows.filter(r => listingMap.has(r.listingId))
    .map(r => ({ ...listingMap.get(r.listingId)!, favouriteCount: r.favouriteCount }));

  // ── Business Health Score ─────────────────────────────────────────────────
  // Each component 0–20 pts; total 0–100
  const userGrowthScore   = Math.min(20, newUsersMonth.count > 0 ? Math.round((newUsersMonth.count / Math.max(totalUsers.count - newUsersMonth.count, 1)) * 100) : 0);
  const listingGrowthScore = Math.min(15, newListingsMonth.count > 0 ? Math.round((newListingsMonth.count / Math.max(totalListings.count - newListingsMonth.count, 1)) * 100) : 0);
  const revenueGrowthScore = Math.min(20, pctChange(revMonthPaise, prevRevMonthPaise) !== null ? Math.min(20, Math.max(0, Math.round((pctChange(revMonthPaise, prevRevMonthPaise)! / 100) * 20))) : 10);
  const paymentScore       = Math.round((paymentSuccessRate / 100) * 20);
  const pendingScore       = Math.max(0, 10 - Math.min(10, Math.round((pending.count / Math.max(totalListings.count, 1)) * 50)));
  const contactScore       = Math.min(15, totalContactClicks > 0 ? Math.min(15, Math.round((totalContactClicks / Math.max(agg.totalViews, 1)) * 150)) : 5);

  const healthScore = Math.min(100, userGrowthScore + listingGrowthScore + revenueGrowthScore + paymentScore + pendingScore + contactScore);
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Average" : "Needs Attention";

  // ── AI Business Insights (rule-based) ────────────────────────────────────
  const insights: string[] = [];
  if (pending.count > 5) insights.push(`${pending.count} listings are awaiting approval — review them to keep owners engaged.`);
  if (paymentSuccessRate < 90) insights.push(`Payment success rate is ${paymentSuccessRate}% — consider following up on failed payments.`);
  if ((membershipExpiringSoon as any)?.count > 0) insights.push(`${(membershipExpiringSoon as any).count} memberships expire within 7 days — send renewal reminders.`);
  if (agg.totalViews > 100 && totalContactClicks < agg.totalViews * 0.05) insights.push("Contact rate is below 5% — listing quality or CTAs may need improvement.");
  if (agg.totalWhatsapp > agg.totalPhone * 2) insights.push("WhatsApp is the preferred contact channel — ensure all listings have WhatsApp numbers.");
  if (verifiedBiz.count < totalBiz.count * 0.5 && totalBiz.count > 3) insights.push(`${totalBiz.count - verifiedBiz.count} business accounts are unverified — review and approve them.`);
  if (insights.length === 0) insights.push("Platform is performing well. Keep monitoring listing quality and engagement metrics.");

  res.json({
    // User metrics
    totalUsers: totalUsers.count,
    newUsersToday: newUsersToday.count,
    newUsersWeek: newUsersWeek.count,
    newUsersMonth: newUsersMonth.count,
    prevUsersToday: prevUsersToday.count,
    prevUsersWeek: prevUsersWeek.count,
    prevUsersMonth: prevUsersMonth.count,
    totalBusiness: totalBiz.count,
    verifiedBusiness: verifiedBiz.count,

    // Listing metrics
    totalListings: totalListings.count,
    pendingApprovals: pending.count,
    activeListings: active.count,
    expiredListings: expired.count,
    featuredListings: featured.count,
    rejectedListings: rejected.count,
    newListingsMonth: newListingsMonth.count,

    // Analytics metrics
    totalFavourites: totalFavs.count,
    totalTimesRented: timesRented,
    totalViews: agg.totalViews,
    viewsToday: viewsToday.count,
    viewsWeek: viewsWeek.count,
    viewsMonth: viewsMonth.count,
    totalWhatsappClicks: agg.totalWhatsapp,
    totalPhoneClicks: agg.totalPhone,
    totalShareCount: agg.totalShare,
    totalQrScans: agg.totalQr,
    totalContactClicks,

    // Revenue metrics
    revenueTodayPaise: revTodayPaise,
    revenueWeekPaise: revWeekPaise,
    revenueMonthPaise: revMonthPaise,
    revenueYearPaise: revYearPaise,
    prevRevenueMonthPaise: prevRevMonthPaise,
    pctRevenueChange: pctChange(revMonthPaise, prevRevMonthPaise),
    failedPayments: failedPayments.count,
    paymentSuccessRate,
    membershipsExpiringSoon: (membershipExpiringSoon as any)?.count ?? 0,

    // Health & insights
    healthScore,
    healthLabel,
    insights,

    // Top lists
    topCategories: topCats.map(c => ({ category: c.category, count: Number(c.count) })),
    topFavourites,
  });
});

// ─── Listings ─────────────────────────────────────────────────────────────────

// GET /admin/listings
router.get("/admin/listings", async (req, res): Promise<void> => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset   = (pageNum - 1) * limitNum;

  const conditions: ReturnType<typeof eq>[] = [];
  if (status && status !== "all") {
    conditions.push(eq(listingsTable.status, status as typeof listingsTable.$inferSelect.status));
  }

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(listingsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const rows = await db
    .select({
      listing: listingsTable,
      ownerName: usersTable.name,
      ownerEmail: usersTable.email,
      ownerType: usersTable.userType,
    })
    .from(listingsTable)
    .leftJoin(usersTable, eq(usersTable.id, listingsTable.ownerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(listingsTable.createdAt)).limit(limitNum).offset(offset);

  res.json({
    data: rows.map(r => ({ ...formatListing(r.listing), owner: { name: r.ownerName, email: r.ownerEmail, type: r.ownerType } })),
    total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum),
  });
});

// PATCH /admin/listings/:id/approve
router.patch("/admin/listings/:id/approve", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [listing] = await db.update(listingsTable).set({ status: "approved", rejectionReason: null }).where(eq(listingsTable.id, id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, listing.ownerId)).limit(1);
  if (owner) await sendListingApprovedEmail(owner.email, owner.name, listing.title, listing.id);
  await logAudit(req, "approve_listing", "listings", id, "listing", { status: "pending" }, { status: "approved" });
  res.json(formatListing(listing));
});

// PATCH /admin/listings/:id/reject
router.patch("/admin/listings/:id/reject", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { reason } = req.body;
  if (!reason) { res.status(400).json({ error: "reason is required" }); return; }
  const [listing] = await db.update(listingsTable).set({ status: "rejected", rejectionReason: reason }).where(eq(listingsTable.id, id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, listing.ownerId)).limit(1);
  if (owner) await sendListingRejectedEmail(owner.email, owner.name, listing.title, reason);
  await logAudit(req, "reject_listing", "listings", id, "listing", { status: "pending" }, { status: "rejected", reason });
  res.json(formatListing(listing));
});

// PATCH /admin/listings/:id/feature
router.patch("/admin/listings/:id/feature", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { featured } = req.body;
  const [listing] = await db.update(listingsTable).set({ isFeatured: featured }).where(eq(listingsTable.id, id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  await logAudit(req, featured ? "feature_listing" : "unfeature_listing", "listings", id, "listing", { isFeatured: !featured }, { isFeatured: featured });
  res.json(formatListing(listing));
});

// PATCH /admin/listings/:id/unfeature
router.patch("/admin/listings/:id/unfeature", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [listing] = await db.update(listingsTable).set({ isFeatured: false }).where(eq(listingsTable.id, id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  await logAudit(req, "unfeature_listing", "listings", id, "listing", { isFeatured: true }, { isFeatured: false });
  res.json(formatListing(listing));
});

// PATCH /admin/listings/:id/extend-expiry
router.patch("/admin/listings/:id/extend-expiry", async (req, res): Promise<void> => {
  const id   = parseInt(String(req.params.id), 10);
  const days = parseInt(String(req.body.days ?? 30), 10);
  if (![30, 60, 90].includes(days)) { res.status(400).json({ error: "days must be 30, 60 or 90" }); return; }

  const [existing] = await db.select({ expiresAt: listingsTable.expiresAt }).from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }

  const base = existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date();
  const newExpiry = new Date(base.getTime() + days * 86400000);

  const [listing] = await db.update(listingsTable).set({ expiresAt: newExpiry, status: "approved" }).where(eq(listingsTable.id, id)).returning();
  await logAudit(req, "extend_expiry", "listings", id, "listing", { expiresAt: existing.expiresAt }, { expiresAt: newExpiry, days });
  res.json(formatListing(listing));
});

// DELETE /admin/listings/:id
router.delete("/admin/listings/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [listing] = await db.select({ title: listingsTable.title, ownerId: listingsTable.ownerId }).from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  await logAudit(req, "delete_listing", "listings", id, "listing", { title: listing.title }, null);
  res.json({ success: true, id });
});

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /admin/users
router.get("/admin/users", async (req, res): Promise<void> => {
  const { page = "1", limit = "20", q } = req.query as Record<string, string>;
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset   = (pageNum - 1) * limitNum;

  const conditions = q ? [or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.email, `%${q}%`))] : [];

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const rows = await db
    .select({
      user: usersTable,
      listingCount: sql<number>`(select count(*)::int from listings where owner_id = ${usersTable.id})`,
      activeMembership: sql<string | null>`(select mp.name from user_memberships um join membership_plans mp on mp.id = um.plan_id where um.user_id = ${usersTable.id} and um.status = 'active' order by um.expires_at desc limit 1)`,
    })
    .from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.createdAt)).limit(limitNum).offset(offset);

  res.json({ data: rows.map(r => ({ ...sanitizeUser(r.user), listingCount: r.listingCount, activeMembership: r.activeMembership })), total, page: pageNum, limit: limitNum });
});

// PATCH /admin/users/:userId/verify
router.patch("/admin/users/:userId/verify", async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  const [user] = await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await logAudit(req, "verify_user", "users", userId, "user", { isVerified: false }, { isVerified: true });
  res.json(sanitizeUser(user));
});

// PATCH /admin/users/:id/suspend
router.patch("/admin/users/:id/suspend", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [user] = await db.update(usersTable).set({ isSuspended: true }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await logAudit(req, "suspend_user", "users", id, "user", { isSuspended: false }, { isSuspended: true });
  res.json(sanitizeUser(user));
});

// PATCH /admin/users/:id/activate
router.patch("/admin/users/:id/activate", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [user] = await db.update(usersTable).set({ isSuspended: false }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await logAudit(req, "activate_user", "users", id, "user", { isSuspended: true }, { isSuspended: false });
  res.json(sanitizeUser(user));
});

// GET /admin/users/:id/detail
router.get("/admin/users/:id/detail", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [listings, memberships] = await Promise.all([
    db.select({ id: listingsTable.id, title: listingsTable.title, status: listingsTable.status, viewCount: listingsTable.viewCount, createdAt: listingsTable.createdAt })
      .from(listingsTable).where(eq(listingsTable.ownerId, id)).orderBy(desc(listingsTable.createdAt)).limit(10),
    db.select({ membership: userMembershipsTable, planName: membershipPlansTable.name })
      .from(userMembershipsTable).innerJoin(membershipPlansTable, eq(membershipPlansTable.id, userMembershipsTable.planId))
      .where(eq(userMembershipsTable.userId, id)).orderBy(desc(userMembershipsTable.createdAt)).limit(5),
  ]);

  res.json({ user: sanitizeUser(user), listings, memberships });
});

// ─── Business Profiles ────────────────────────────────────────────────────────

router.get("/admin/business-profiles", async (req, res): Promise<void> => {
  const { verified } = req.query as Record<string, string>;
  const conditions = [eq(usersTable.userType, "business")];
  if (verified === "true")  conditions.push(eq(usersTable.isVerified, true));
  if (verified === "false") conditions.push(eq(usersTable.isVerified, false));
  const rows = await db
    .select({ user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, isVerified: usersTable.isVerified, createdAt: usersTable.createdAt }, profile: businessProfilesTable })
    .from(usersTable).leftJoin(businessProfilesTable, eq(businessProfilesTable.userId, usersTable.id))
    .where(and(...conditions)).orderBy(usersTable.isVerified, desc(usersTable.createdAt));
  res.json(rows);
});

router.patch("/admin/business-profiles/:userId/approve", async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  const [user] = await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await logAudit(req, "approve_business", "businesses", userId, "user", { isVerified: false }, { isVerified: true });
  res.json({ success: true, userId });
});

router.patch("/admin/business-profiles/:userId/reject", async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  const [user] = await db.update(usersTable).set({ isVerified: false }).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await logAudit(req, "reject_business", "businesses", userId, "user", { isVerified: true }, { isVerified: false });
  res.json({ success: true, userId });
});

// ─── Categories ───────────────────────────────────────────────────────────────

router.get("/admin/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.parentId, categoriesTable.id);
  const listingCounts = await db
    .select({ category: listingsTable.category, count: sql<number>`count(*)::int` })
    .from(listingsTable).where(eq(listingsTable.status, "approved")).groupBy(listingsTable.category);
  const countMap = new Map(listingCounts.map(r => [r.category, r.count]));
  const topLevel = cats.filter(c => !c.parentId).map(c => ({
    ...c, listingCount: countMap.get(c.name) ?? 0,
    subcategories: cats.filter(s => s.parentId === c.id),
  }));
  res.json(topLevel);
});

router.post("/admin/categories", async (req, res): Promise<void> => {
  const { name, slug, icon, description } = req.body;
  if (!name || !slug || !icon) { res.status(400).json({ error: "name, slug, and icon are required" }); return; }
  const [cat] = await db.insert(categoriesTable).values({ name, slug, icon, description: description ?? null }).returning();
  await logAudit(req, "create_category", "categories", cat.id, "category", null, { name, slug });
  res.status(201).json({ ...cat, listingCount: 0, subcategories: [] });
});

router.patch("/admin/categories/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { isActive, name, description } = req.body;
  const updates: Partial<typeof categoriesTable.$inferInsert> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  const [cat] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
  await logAudit(req, "update_category", "categories", id, "category", null, updates);
  res.json(cat);
});

// ─── Activity Log ─────────────────────────────────────────────────────────────

router.get("/admin/audit-log", async (req, res): Promise<void> => {
  const { page = "1", limit = "20", module: mod, search } = req.query as Record<string, string>;
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const offset   = (pageNum - 1) * limitNum;

  const conditions: ReturnType<typeof eq>[] = [];
  if (mod && mod !== "all") conditions.push(eq(adminAuditLogTable.module, mod));
  if (search) conditions.push(ilike(adminAuditLogTable.action, `%${search}%`));

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(adminAuditLogTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const rows = await db.select().from(adminAuditLogTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(adminAuditLogTable.createdAt)).limit(limitNum).offset(offset);

  res.json({ data: rows, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// ─── Payment Analytics ────────────────────────────────────────────────────────

router.get("/admin/payment-analytics", async (_req, res): Promise<void> => {
  const now        = nowFn();
  const todayStart = startOfDay(now);
  const weekStart  = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart  = startOfYear(now);

  const [revToday, revWeek, revMonth, revYear, byPlan, [failed], [success], recentFailed] = await Promise.all([
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, todayStart), sql`${userMembershipsTable.amountPaise} > 0`)),
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, weekStart), sql`${userMembershipsTable.amountPaise} > 0`)),
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, monthStart), sql`${userMembershipsTable.amountPaise} > 0`)),
    db.select({ s: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(and(gte(userMembershipsTable.createdAt, yearStart), sql`${userMembershipsTable.amountPaise} > 0`)),

    db.select({ planName: membershipPlansTable.name, planSlug: membershipPlansTable.slug, totalPaise: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int`, count: sql<number>`count(*)::int` })
      .from(userMembershipsTable).innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
      .where(sql`${userMembershipsTable.amountPaise} > 0`)
      .groupBy(membershipPlansTable.id, membershipPlansTable.name, membershipPlansTable.slug)
      .orderBy(desc(sql`sum(${userMembershipsTable.amountPaise})`)),

    db.select({ count: sql<number>`count(*)::int` }).from(userMembershipsTable).where(eq(userMembershipsTable.status, "cancelled")),
    db.select({ count: sql<number>`count(*)::int` }).from(userMembershipsTable).where(eq(userMembershipsTable.status, "active")),

    db.select({ id: userMembershipsTable.id, createdAt: userMembershipsTable.createdAt, userId: userMembershipsTable.userId, planName: membershipPlansTable.name })
      .from(userMembershipsTable).innerJoin(membershipPlansTable, eq(membershipPlansTable.id, userMembershipsTable.planId))
      .where(eq(userMembershipsTable.status, "cancelled")).orderBy(desc(userMembershipsTable.createdAt)).limit(5),
  ]);

  const total = failed.count + success.count;
  const successRate = total > 0 ? Math.round((success.count / total) * 100) : 100;
  const avgPaise = byPlan.reduce((s, r) => s + r.count, 0) > 0
    ? Math.round(byPlan.reduce((s, r) => s + r.totalPaise, 0) / byPlan.reduce((s, r) => s + r.count, 0))
    : 0;

  const mostPopular = byPlan.reduce((best, r) => (!best || r.count > best.count ? r : best), byPlan[0] ?? null);

  res.json({
    revenueTodayPaise:  (revToday[0] as any)?.s  ?? 0,
    revenueWeekPaise:   (revWeek[0] as any)?.s   ?? 0,
    revenueMonthPaise:  (revMonth[0] as any)?.s  ?? 0,
    revenueYearPaise:   (revYear[0] as any)?.s   ?? 0,
    byPlan: byPlan.map(r => ({ ...r, totalRupees: Math.round(r.totalPaise / 100) })),
    failedCount: failed.count,
    successCount: success.count,
    successRate,
    avgPaymentRupees: Math.round(avgPaise / 100),
    mostPopularPlan: mostPopular?.planName ?? null,
    recentFailed,
  });
});

// ─── Goals ────────────────────────────────────────────────────────────────────

router.get("/admin/goals", async (_req, res): Promise<void> => {
  const goals = await db.select().from(adminGoalsTable).orderBy(desc(adminGoalsTable.createdAt));

  // Compute live current values
  const [[tu], [tl], [tb], [rev]] = await Promise.all([
    db.select({ v: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ v: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "approved")),
    db.select({ v: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.userType, "business")),
    db.select({ v: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int` }).from(userMembershipsTable).where(sql`${userMembershipsTable.amountPaise} > 0`),
  ]);

  const liveValues: Record<string, number> = {
    users: tu.v, listings: tl.v, businesses: tb.v, revenue_paise: rev.v,
  };

  res.json(goals.map(g => ({ ...g, currentValue: liveValues[g.metricType] ?? 0 })));
});

router.post("/admin/goals", async (req, res): Promise<void> => {
  const { title, targetValue, metricType, deadline } = req.body;
  if (!title || !targetValue || !metricType) { res.status(400).json({ error: "title, targetValue, metricType required" }); return; }
  const [goal] = await db.insert(adminGoalsTable).values({ title, targetValue: Number(targetValue), metricType, deadline: deadline ?? null }).returning();
  res.status(201).json({ ...goal, currentValue: 0 });
});

router.delete("/admin/goals/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  await db.delete(adminGoalsTable).where(eq(adminGoalsTable.id, id));
  res.json({ success: true, id });
});

// ─── Trending Listings ────────────────────────────────────────────────────────

router.get("/admin/trending", async (req, res): Promise<void> => {
  const limit = Math.min(50, parseInt(String((req.query as any).limit ?? "20"), 10));

  const rows = await db
    .select({
      id: listingsTable.id, title: listingsTable.title, category: listingsTable.category,
      city: listingsTable.city, viewCount: listingsTable.viewCount,
      whatsappClicks: listingsTable.whatsappClicks, phoneClicks: listingsTable.phoneClicks,
      shareCount: listingsTable.shareCount, timesRented: listingsTable.timesRented,
      isFeatured: listingsTable.isFeatured, status: listingsTable.status,
      availabilityStatus: listingsTable.availabilityStatus,
      interestScore: sql<number>`(${listingsTable.viewCount} + (${listingsTable.whatsappClicks} + ${listingsTable.phoneClicks}) * 5)`,
      ownerName: usersTable.name,
    })
    .from(listingsTable)
    .leftJoin(usersTable, eq(usersTable.id, listingsTable.ownerId))
    .where(eq(listingsTable.status, "approved"))
    .orderBy(desc(sql`(${listingsTable.viewCount} + (${listingsTable.whatsappClicks} + ${listingsTable.phoneClicks}) * 5)`))
    .limit(limit);

  res.json(rows.map(r => {
    const contacts = r.whatsappClicks + r.phoneClicks;
    const badge = contacts >= 10 ? { emoji: "🔥", label: "High Demand" }
      : r.viewCount >= 50 ? { emoji: "📈", label: "Trending" }
      : r.interestScore >= 30 ? { emoji: "⭐", label: "Popular" }
      : null;
    return { ...r, badge };
  }));
});

// ─── Reports ──────────────────────────────────────────────────────────────────

router.get("/admin/reports", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenueByPlan, listingsPerDay, topCities, userGrowth, membershipBreakdown] = await Promise.all([
    db.select({ planName: membershipPlansTable.name, planSlug: membershipPlansTable.slug, totalPaise: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}), 0)::int`, count: sql<number>`count(*)::int` })
      .from(userMembershipsTable).innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
      .where(sql`${userMembershipsTable.amountPaise} > 0`)
      .groupBy(membershipPlansTable.id, membershipPlansTable.name, membershipPlansTable.slug)
      .orderBy(desc(sql`sum(${userMembershipsTable.amountPaise})`)),

    db.select({ day: sql<string>`date_trunc('day', ${listingsTable.createdAt})::date::text`, count: sql<number>`count(*)::int` })
      .from(listingsTable).where(gte(listingsTable.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', ${listingsTable.createdAt})`).orderBy(sql`date_trunc('day', ${listingsTable.createdAt})`),

    db.select({ city: listingsTable.city, count: sql<number>`count(*)::int` })
      .from(listingsTable).where(eq(listingsTable.status, "approved"))
      .groupBy(listingsTable.city).orderBy(desc(sql`count(*)`)).limit(10),

    db.select({ day: sql<string>`date_trunc('day', ${usersTable.createdAt})::date::text`, count: sql<number>`count(*)::int` })
      .from(usersTable).where(gte(usersTable.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', ${usersTable.createdAt})`).orderBy(sql`date_trunc('day', ${usersTable.createdAt})`),

    db.select({ planName: membershipPlansTable.name, planSlug: membershipPlansTable.slug, count: sql<number>`count(*)::int` })
      .from(userMembershipsTable).innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
      .where(eq(userMembershipsTable.status, "active"))
      .groupBy(membershipPlansTable.id, membershipPlansTable.name, membershipPlansTable.slug).orderBy(membershipPlansTable.sortOrder),
  ]);

  res.json({
    totalRevenuePaise: revenueByPlan.reduce((s, r) => s + r.totalPaise, 0),
    revenueByPlan: revenueByPlan.map(r => ({ ...r, totalRupees: Math.round(r.totalPaise / 100) })),
    listingsPerDay, topCities,
    userGrowth: userGrowth.map(r => ({ day: r.day, count: r.count })),
    membershipBreakdown,
  });
});

// ─── CSV Export: Audit Log ────────────────────────────────────────────────────

router.get("/admin/audit-log/export", async (req, res): Promise<void> => {
  const { module: mod, search } = req.query as Record<string, string>;

  const conditions: ReturnType<typeof eq>[] = [];
  if (mod && mod !== "all") conditions.push(eq(adminAuditLogTable.module, mod));
  if (search) conditions.push(ilike(adminAuditLogTable.action, `%${search}%`));

  const rows = await db.select().from(adminAuditLogTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(adminAuditLogTable.createdAt));

  const esc = (v: unknown): string => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };

  const lines = [
    ["ID", "Timestamp", "Action", "Module", "Affected Type", "Affected ID", "IP Address", "Status"].join(","),
    ...rows.map(r => [
      r.id,
      new Date(r.createdAt).toISOString(),
      esc(r.action),
      esc(r.module),
      esc(r.affectedType ?? ""),
      r.affectedId ?? "",
      esc(r.ipAddress ?? ""),
      esc(r.status),
    ].join(",")),
  ].join("\r\n");

  const filename = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(lines);
});

// ─── CSV Export: Payment Analytics ───────────────────────────────────────────

router.get("/admin/payment-analytics/export", async (_req, res): Promise<void> => {
  const [byPlan, recentPayments] = await Promise.all([
    db.select({
      planName:   membershipPlansTable.name,
      totalPaise: sql<number>`coalesce(sum(${userMembershipsTable.amountPaise}),0)::int`,
      count:      sql<number>`count(*)::int`,
    })
      .from(userMembershipsTable)
      .innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
      .where(sql`${userMembershipsTable.amountPaise} > 0`)
      .groupBy(membershipPlansTable.id, membershipPlansTable.name, membershipPlansTable.slug)
      .orderBy(desc(sql`sum(${userMembershipsTable.amountPaise})`)),

    db.select({
      id:        userMembershipsTable.id,
      createdAt: userMembershipsTable.createdAt,
      userId:    userMembershipsTable.userId,
      planName:  membershipPlansTable.name,
      amountPaise: userMembershipsTable.amountPaise,
      status:    userMembershipsTable.status,
    })
      .from(userMembershipsTable)
      .innerJoin(membershipPlansTable, eq(membershipPlansTable.id, userMembershipsTable.planId))
      .where(sql`${userMembershipsTable.amountPaise} > 0`)
      .orderBy(desc(userMembershipsTable.createdAt))
      .limit(500),
  ]);

  const esc = (v: unknown): string => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };

  // Section 1: revenue by plan
  const summaryLines = [
    "## Revenue by Plan",
    ["Plan", "Subscriptions", "Total Revenue (INR)"].join(","),
    ...byPlan.map(r => [esc(r.planName), r.count, Math.round(r.totalPaise / 100)].join(",")),
    "",
    "## Payment Transactions",
    ["Transaction ID", "Timestamp", "User ID", "Plan", "Amount (INR)", "Status"].join(","),
    ...recentPayments.map(r => [
      r.id,
      new Date(r.createdAt).toISOString(),
      r.userId,
      esc(r.planName),
      Math.round(r.amountPaise / 100),
      esc(r.status),
    ].join(",")),
  ].join("\r\n");

  const filename = `payment-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(summaryLines);
});

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatListing(listing: typeof listingsTable.$inferSelect) {
  return {
    id: listing.id, ownerId: listing.ownerId, title: listing.title,
    category: listing.category, condition: listing.condition,
    rentalPrice: { daily: listing.dailyPrice ? Number(listing.dailyPrice) : null, weekly: listing.weeklyPrice ? Number(listing.weeklyPrice) : null, monthly: listing.monthlyPrice ? Number(listing.monthlyPrice) : null },
    city: listing.city, state: listing.state,
    images: listing.images ?? [], thumbnails: listing.thumbnails ?? [],
    status: listing.status, isFeatured: listing.isFeatured, rejectionReason: listing.rejectionReason,
    expiresAt: listing.expiresAt, createdAt: listing.createdAt, updatedAt: listing.updatedAt,
    availabilityStatus: listing.availabilityStatus,
    viewCount: listing.viewCount, whatsappClicks: listing.whatsappClicks,
    phoneClicks: listing.phoneClicks, shareCount: listing.shareCount,
    qrScans: listing.qrScans, timesRented: listing.timesRented,
    owner: null,
  };
}

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id, name: user.name, email: user.email, phone: user.phone,
    profilePhoto: user.profilePhoto, userType: user.userType,
    isVerified: user.isVerified, emailVerified: user.emailVerified,
    isSuspended: user.isSuspended, city: user.city, state: user.state,
    createdAt: user.createdAt,
  };
}

export default router;
