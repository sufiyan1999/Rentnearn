/**
 * Membership service — all membership business logic lives here.
 * Keeps routes thin and makes the logic easy to unit-test.
 */
import { db, membershipPlansTable, userMembershipsTable, listingsTable, usersTable } from "@workspace/db";
import { SITE_URL } from "./config";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { sendEmail } from "./email";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Return the plan row for a given slug (cached per process lifetime). */
const planCache = new Map<string, typeof membershipPlansTable.$inferSelect>();

export async function getPlanBySlug(slug: string) {
  if (planCache.has(slug)) return planCache.get(slug)!;
  const [plan] = await db.select().from(membershipPlansTable).where(eq(membershipPlansTable.slug, slug)).limit(1);
  if (plan) planCache.set(slug, plan);
  return plan ?? null;
}

export async function getAllPlans() {
  return db.select().from(membershipPlansTable)
    .where(eq(membershipPlansTable.isActive, true))
    .orderBy(membershipPlansTable.sortOrder);
}

// ─── core membership operations ─────────────────────────────────────────────

/**
 * Get the single active membership for a user (the most recent active/trial one).
 * Returns null if none found (expired / never set up).
 */
export async function getActiveMembership(userId: number) {
  const [membership] = await db
    .select({
      membership: userMembershipsTable,
      plan: membershipPlansTable,
    })
    .from(userMembershipsTable)
    .innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
    .where(
      and(
        eq(userMembershipsTable.userId, userId),
        eq(userMembershipsTable.status, "active"),
      )
    )
    .orderBy(desc(userMembershipsTable.startedAt))
    .limit(1);

  if (!membership) return null;

  // Lazily expire if past expiresAt
  if (membership.membership.expiresAt < new Date()) {
    await db
      .update(userMembershipsTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(userMembershipsTable.id, membership.membership.id));
    return null;
  }

  return membership;
}

/**
 * Assign the free-trial membership to a newly registered user.
 * No-op if the user already has any membership row.
 */
export async function assignFreeTrial(userId: number) {
  // Guard: only create if no membership exists yet
  const existing = await db
    .select({ id: userMembershipsTable.id })
    .from(userMembershipsTable)
    .where(eq(userMembershipsTable.userId, userId))
    .limit(1);

  if (existing.length > 0) return;

  const plan = await getPlanBySlug("free_trial");
  if (!plan) {
    console.error("[membership] free_trial plan not found in DB — run the seed script");
    return;
  }

  const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

  await db.insert(userMembershipsTable).values({
    userId,
    planId: plan.id,
    status: "active",
    startedAt: new Date(),
    expiresAt,
    amountPaise: 0,
  });
}

/**
 * Return the max number of ACTIVE approved listings a user is allowed.
 * Falls back to 0 (no listings) when there's no active membership.
 */
export async function getListingLimit(userId: number): Promise<number> {
  const active = await getActiveMembership(userId);
  return active?.plan.maxListings ?? 0;
}

/**
 * Count how many approved/pending listings the user currently has.
 */
export async function countActiveListings(userId: number): Promise<number> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listingsTable)
    .where(
      and(
        eq(listingsTable.ownerId, userId),
        sql`${listingsTable.status} IN ('approved', 'pending')`
      )
    );
  return n;
}

/**
 * Expire all memberships whose expiresAt has passed. 
 * Call this from a periodic job or on every API boot.
 */
export async function expireStaleTrials() {
  await db
    .update(userMembershipsTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(userMembershipsTable.status, "active"),
        sql`${userMembershipsTable.expiresAt} < now()`
      )
    );
}

/**
 * Back-fill free trials for any existing users who have no membership row.
 * Run once after the schema migration.
 */
export async function backfillFreeTrials() {
  const usersWithoutMembership = await db.execute(sql`
    SELECT u.id FROM users u
    LEFT JOIN user_memberships um ON um.user_id = u.id
    WHERE um.id IS NULL
  `);

  for (const row of usersWithoutMembership.rows as { id: number }[]) {
    await assignFreeTrial(row.id);
  }
  return usersWithoutMembership.rows.length;
}

/**
 * Activate a paid membership for a user after successful payment.
 */
export async function activateMembership(
  userId: number,
  planSlug: string,
  opts: { razorpayOrderId?: string; razorpayPaymentId?: string; amountPaise?: number } = {}
) {
  const plan = await getPlanBySlug(planSlug);
  if (!plan) throw new Error(`Plan not found: ${planSlug}`);

  // Cancel any current active memberships
  await db
    .update(userMembershipsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(userMembershipsTable.userId, userId),
        eq(userMembershipsTable.status, "active")
      )
    );

  const startedAt = new Date();
  const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

  const [created] = await db
    .insert(userMembershipsTable)
    .values({
      userId,
      planId: plan.id,
      status: "active",
      startedAt,
      expiresAt,
      razorpayOrderId: opts.razorpayOrderId ?? null,
      razorpayPaymentId: opts.razorpayPaymentId ?? null,
      amountPaise: opts.amountPaise ?? plan.pricePaise,
    })
    .returning();

  return created;
}

/**
 * Send a trial-expiry warning email when ≤7 days remain.
 * Best-effort — silent skip if email is unconfigured.
 */
export async function sendTrialExpiryWarnings() {
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const in8days = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

  const expiring = await db
    .select({
      membership: userMembershipsTable,
      user: { id: usersTable.id, name: usersTable.name, email: usersTable.email },
    })
    .from(userMembershipsTable)
    .innerJoin(usersTable, eq(userMembershipsTable.userId, usersTable.id))
    .innerJoin(membershipPlansTable, eq(userMembershipsTable.planId, membershipPlansTable.id))
    .where(
      and(
        eq(userMembershipsTable.status, "active"),
        eq(membershipPlansTable.slug, "free_trial"),
        sql`${userMembershipsTable.expiresAt} BETWEEN ${in7days} AND ${in8days}`
      )
    );

  for (const { user, membership } of expiring) {
    const days = Math.ceil((membership.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    try {
      await sendEmail({
        to: user.email,
        subject: "Your RentNEarn Free Trial expires soon",
        html: `
          <p>Hi ${user.name},</p>
          <p>Your <strong>3-month free trial</strong> on RentNEarn expires in <strong>${days} days</strong>.</p>
          <p>To keep your listings active, please upgrade to a paid plan:</p>
          <ul>
            <li>Basic — ₹49/month (up to 5 listings)</li>
            <li>Plus — ₹199/month (up to 25 listings)</li>
            <li>Business — ₹1,999/year (up to 500 listings)</li>
          </ul>
          <p><a href="${SITE_URL}/pricing">View Plans →</a></p>
          <p>— The RentNEarn Team</p>
        `,
      });
    } catch {
      // Silent skip if email is unconfigured
    }
  }
}
