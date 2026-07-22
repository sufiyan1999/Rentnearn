import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

// Razorpay instance — keys loaded from env; gracefully absent if not configured
function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

const PLAN_AMOUNTS: Record<string, number> = {
  single: 4900,    // ₹49
  bundle: 19900,   // ₹199
  unlimited: 49900, // ₹499
  featured: 9900,  // ₹99
};

// POST /payments/create-order
router.post("/payments/create-order", requireAuth, async (req, res): Promise<void> => {
  const rzp = getRazorpay();
  if (!rzp) {
    res.status(503).json({ message: "Payment gateway not configured yet. Please try again later." });
    return;
  }

  const { plan, listingId } = req.body as { plan: string; listingId?: number };

  const validPlans = Object.keys(PLAN_AMOUNTS);
  if (!validPlans.includes(plan)) {
    res.status(400).json({ message: "Invalid plan." });
    return;
  }

  const amountPaise = PLAN_AMOUNTS[plan];

  try {
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rm_${Date.now()}`,
      notes: { plan, userId: String(req.user!.id) },
    });

    // Persist pending payment record
    await db.insert(paymentsTable).values({
      userId: req.user!.id,
      listingId: listingId ?? null,
      plan: plan as any,
      amountPaise,
      razorpayOrderId: order.id,
      status: "pending",
    });

    res.json({
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: amountPaise,
      currency: "INR",
    });
  } catch (err: any) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ message: "Failed to create payment order." });
  }
});

// POST /payments/verify
router.post("/payments/verify", requireAuth, async (req, res): Promise<void> => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  };

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    res.status(503).json({ message: "Payment gateway not configured." });
    return;
  }

  // Verify HMAC signature
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSig !== razorpaySignature) {
    res.status(400).json({ message: "Payment signature verification failed." });
    return;
  }

  // Mark payment as paid
  await db
    .update(paymentsTable)
    .set({
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.razorpayOrderId, razorpayOrderId));

  res.json({ success: true });
});

// GET /payments/my — list user's payments
router.get("/payments/my", requireAuth, async (req, res): Promise<void> => {
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, req.user!.id))
    .orderBy(paymentsTable.createdAt);
  res.json(payments);
});

export default router;
