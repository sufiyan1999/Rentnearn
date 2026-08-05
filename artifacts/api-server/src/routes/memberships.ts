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
  // Whitelist for request body fields to prevent mass assignment
  const ALLOWED_ORDER_FIELDS = ["amount", "currency", "receipt", "notes", "meta", "planId", "userId"];
  const body = req.body || {};
  const unknownFields = Object.keys(body).filter((k) => !ALLOWED_ORDER_FIELDS.includes(k));
  if (unknownFields.length > 0) {
    console.warn("Unknown fields in create-order request:", unknownFields);
  }

  // Basic ownership guard: if a userId is supplied that differs from the requester, only admins can proceed
  const userIdParam = (body && body.userId) as string | undefined;
  const requesterId = req.user?.id;
  const requesterRole = req.user?.role;
  if (userIdParam && requesterId && userIdParam !== requesterId && requesterRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const amount = body?.amount;
  const currency = body?.currency ?? "INR";
  const receipt = body?.receipt;
  const notes = body?.notes;
  const meta = body?.meta;
  const planId = body?.planId;

  if (typeof amount !== "number" && typeof amount !== "string") {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }
  const amountNum = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const rz = getRazorpay();
  if (!rz) {
    res.status(500).json({ error: "Payment provider not configured" });
    return;
  }

  const orderOptions: any = {
    amount: amountNum,
    currency,
    receipt,
    notes,
    meta,
    payment_capture: 1,
  };

  try {
    const order = await rz.orders.create(orderOptions);
    res.json({ order });
  } catch (err) {
    console.error("Error creating Razorpay order", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});
