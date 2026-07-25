import { Router } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, membershipPlansTable, userMembershipsTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware";
import {
  getAllPlans,
  getActiveMembership,
  activateMembership,
  backfillFreeTrials,
  countActiveListings,
} from "../lib/membership";

const router = Router();

// ── Public / user endpoints ────────────────────────────────────────────────

// GET /memberships/plans — all active plans
router.get("/memberships/plans", async (_req, res): Promise<void> => {
  const plans = await getAllPlans();
  res.json(plans);
});

// GET /memberships/me — current user's active membership
router.get("/memberships/me", requireAuth, async (req, res): Promise<void> => {
  const active = await getActiveMembership(req.user!.id);
  if (!active) {
    res.json({ membership: null, plan: null, listingsUsed: 0, listingLimit: 0, daysRemaining: 0 });
    return;
  }

  const listingsUsed = await countActiveListings(req.user!.id);
  const daysRemaining = Math.max(
    0,
    Math.ceil((active.membership.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  res.json({
    membership: active.membership,
    plan: active.plan,
    listingsUsed,
    listingLimit: active.plan.maxListings,
    daysRemaining,
  });
});

// ── Admin endpoints ────────────────────────────────────────────────────────

// GET /memberships/admin/plans — all plans (including inactive)
router.get("/memberships/admin/plans", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const plans = await db.select().from(membershipPlansTable).orderBy(membershipPlansTable.sortOrder);
  res.json(plans);
});

// PATCH /memberships/admin/plans/:id — update a plan
router.patch("/memberships/admin/plans/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { isActive, name, pricePaise, maxListings, maxImages } = req.body;

  const updates: Partial<typeof membershipPlansTable.$inferInsert> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (name) updates.name = name;
  if (pricePaise !== undefined) updates.pricePaise = pricePaise;
  if (maxListings !== undefined) updates.maxListings = maxListings;
  if (maxImages !== undefined) updates.maxImages = maxImages;

  const [updated] = await db
    .update(membershipPlansTable)
    .set(updates)
    .where(eq(membershipPlansTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Plan not found" }); return; }
  res.json(updated);
});

// GET /memberships/admin/subscriptions — all user memberships
router.get("/memberships/admin/subscriptions", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select({
      membership: userMembershipsTable,
      plan: { id: membershipPlansTable.id, name: membershipPlansTable.name, slug: membershipPlansTable.slug },
      user: { id: usersTable.id, name: usersTable.name, email: usersTable.email },
    })
    .from(userMembershipsTable)
    .innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
    .innerJoin(usersTable, eq(userMembershipsTable.userId, usersTable.id))
    .orderBy(desc(userMembershipsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(userMembershipsTable);

  res.json({ data: rows, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// PATCH /memberships/admin/subscriptions/:id/activate — manually activate a membership
router.patch("/memberships/admin/subscriptions/:id/activate", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { planSlug } = req.body;

  const [membership] = await db
    .select()
    .from(userMembershipsTable)
    .where(eq(userMembershipsTable.id, id))
    .limit(1);

  if (!membership) { res.status(404).json({ error: "Membership not found" }); return; }

  await activateMembership(membership.userId, planSlug || "basic");
  res.json({ success: true });
});

// PATCH /memberships/admin/subscriptions/:id/cancel
router.patch("/memberships/admin/subscriptions/:id/cancel", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [updated] = await db
    .update(userMembershipsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(userMembershipsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Membership not found" }); return; }
  res.json(updated);
});

// POST /memberships/admin/backfill — back-fill free trials for legacy users
router.post("/memberships/admin/backfill", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const count = await backfillFreeTrials();
  res.json({ backfilled: count });
});

export default router;
