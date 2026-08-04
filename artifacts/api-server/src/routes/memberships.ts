import { Router } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db, membershipPlansTable, userMembershipsTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware";
import { sendTrialExtendedEmail } from "../lib/email";
import {
  getAllPlans,
  getActiveMembership,
  activateMembership,
  backfillFreeTrials,
  countActiveListings,
  getPlanBySlug,
} from "../lib/membership";

function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

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

// ── Razorpay checkout ──────────────────────────────────────────────────────

// POST /memberships/create-order — create a Razorpay order for a paid plan
router.post("/memberships/create-order", requireAuth, async (req, res): Promise<void> => {
  const rzp = getRazorpay();
  if (!rzp) {
    res.status(503).json({ error: "Payment gateway not configured." });
    return;
  }

  const { planSlug } = req.body as { planSlug: string };
  const PAID_PLANS = ["basic", "plus", "business"];
  if (!planSlug || !PAID_PLANS.includes(planSlug)) {
    res.status(400).json({ error: "Invalid plan. Choose basic, plus, or business." });
    return;
  }

  const plan = await getPlanBySlug(planSlug);
  if (!plan) {
    res.status(404).json({ error: "Plan not found." });
    return;
  }

  try {
    const order = await rzp.orders.create({
      amount: plan.pricePaise,
      currency: "INR",
      receipt: `mem_${req.user!.id}_${Date.now()}`,
      notes: { planSlug, userId: String(req.user!.id) },
    });

    // Store a pending membership row so we can look up planId on verify
    await db.insert(userMembershipsTable).values({
      userId: req.user!.id,
      planId: plan.id,
      status: "pending",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1-hr TTL placeholder
      razorpayOrderId: order.id,
      amountPaise: plan.pricePaise,
    });

    res.json({
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: plan.pricePaise,
      currency: "INR",
    });
  } catch (err: any) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ error: "Failed to create payment order." });
  }
});

// POST /memberships/verify — verify Razorpay signature and activate plan
router.post("/memberships/verify", requireAuth, async (req, res): Promise<void> => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  };

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Payment gateway not configured." });
    return;
  }

  // Verify HMAC signature
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSig !== razorpaySignature) {
    res.status(400).json({ error: "Payment signature verification failed." });
    return;
  }

  // Find the pending row created during create-order (owned by this user)
  const [pending] = await db
    .select({
      id: userMembershipsTable.id,
      planId: userMembershipsTable.planId,
      amountPaise: userMembershipsTable.amountPaise,
    })
    .from(userMembershipsTable)
    .where(
      and(
        eq(userMembershipsTable.userId, req.user!.id),
        eq(userMembershipsTable.razorpayOrderId, razorpayOrderId),
        eq(userMembershipsTable.status, "pending")
      )
    )
    .limit(1);

  if (!pending) {
    res.status(404).json({ error: "Payment order not found or already processed." });
    return;
  }

  // Look up plan slug from planId
  const [planRow] = await db
    .select({ slug: membershipPlansTable.slug, name: membershipPlansTable.name })
    .from(membershipPlansTable)
    .where(eq(membershipPlansTable.id, pending.planId))
    .limit(1);

  if (!planRow) {
    res.status(500).json({ error: "Plan not found." });
    return;
  }

  // Activate: cancel old active membership, insert new active one with Razorpay IDs
  await activateMembership(req.user!.id, planRow.slug, {
    razorpayOrderId,
    razorpayPaymentId,
    amountPaise: pending.amountPaise,
  });

  // Clean up the pending placeholder row
  await db
    .update(userMembershipsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(userMembershipsTable.id, pending.id));

  res.json({ success: true, planSlug: planRow.slug, planName: planRow.name });
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

// PATCH /memberships/admin/subscriptions/:id/extend-trial
router.patch("/memberships/admin/subscriptions/:id/extend-trial", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const days = parseInt(String(req.body.days ?? "30"), 10);

  if (isNaN(id) || isNaN(days) || days < 1 || days > 365) {
    res.status(400).json({ error: "days must be between 1 and 365" });
    return;
  }

  const [membership] = await db
    .select({ m: userMembershipsTable, u: usersTable })
    .from(userMembershipsTable)
    .innerJoin(usersTable, eq(userMembershipsTable.userId, usersTable.id))
    .where(eq(userMembershipsTable.id, id))
    .limit(1);

  if (!membership) { res.status(404).json({ error: "Membership not found" }); return; }

  // Extend from current expiresAt (or now if already expired)
  const base = membership.m.expiresAt > new Date() ? membership.m.expiresAt : new Date();
  const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(userMembershipsTable)
    .set({ expiresAt: newExpiry, status: "active", updatedAt: new Date() })
    .where(eq(userMembershipsTable.id, id))
    .returning();

  // Send notification email (fire-and-forget)
  sendTrialExtendedEmail(membership.u.email, membership.u.name, days, newExpiry).catch(() => {});

  res.json({ success: true, membership: updated, newExpiryDate: newExpiry });
});

// POST /memberships/admin/backfill — back-fill free trials for legacy users
router.post("/memberships/admin/backfill", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const count = await backfillFreeTrials();
  res.json({ backfilled: count });
});

export default router;
