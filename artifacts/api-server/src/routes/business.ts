import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, businessProfilesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

// POST /business-profiles
router.post("/business-profiles", requireAuth, async (req, res): Promise<void> => {
  const { businessName, description, contactEmail, contactPhone, address, city, state, gstNumber, website } = req.body;
  if (!businessName) { res.status(400).json({ error: "businessName is required" }); return; }

  const [existing] = await db.select().from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, req.user!.id)).limit(1);

  if (existing) {
    const [updated] = await db.update(businessProfilesTable).set({
      businessName, description: description ?? null, contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null, address: address ?? null, city: city ?? null,
      state: state ?? null, gstNumber: gstNumber ?? null, website: website ?? null,
    }).where(eq(businessProfilesTable.userId, req.user!.id)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(businessProfilesTable).values({
      userId: req.user!.id, businessName, description: description ?? null,
      contactEmail: contactEmail ?? null, contactPhone: contactPhone ?? null,
      address: address ?? null, city: city ?? null, state: state ?? null,
      gstNumber: gstNumber ?? null, website: website ?? null,
    }).returning();
    res.json(created);
  }
});

// GET /business-profiles/:userId
router.get("/business-profiles/:userId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }

  const [profile] = await db.select().from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, userId)).limit(1);
  if (!profile) { res.status(404).json({ error: "Business profile not found" }); return; }

  res.json(profile);
});

export default router;
