import { Router } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, listingsTable, businessProfilesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware";
import multer from "multer";
import { processAndSaveImage, validateImageBuffer } from "../lib/images";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// PATCH /users/me
router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const { name, phone, city, state } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (city !== undefined) updates.city = city;
  if (state !== undefined) updates.state = state;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id)).returning();
  res.json(sanitizeUser(user));
});

// POST /users/me/photo (multipart, outside OpenAPI spec)
router.post("/users/me/photo", requireAuth, upload.single("photo"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No photo uploaded" });
    return;
  }
  validateImageBuffer(req.file.buffer, req.file.mimetype);
  const { imageUrl } = await processAndSaveImage(req.file.buffer, "profiles", req.file.originalname);
  await db.update(usersTable).set({ profilePhoto: imageUrl }).where(eq(usersTable.id, req.user!.id));
  res.json({ photoUrl: imageUrl });
});

// GET /users/:userId
router.get("/users/:userId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [listingCount] = await db.select({ count: count() }).from(listingsTable)
    .where(eq(listingsTable.ownerId, userId));

  const [businessProfile] = await db.select().from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, userId)).limit(1);

  res.json({
    id: user.id,
    name: user.name,
    profilePhoto: user.profilePhoto,
    phone: user.phone,
    userType: user.userType,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    listingCount: Number(listingCount?.count ?? 0),
    businessProfile: businessProfile ?? null,
  });
});

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id, name: user.name, email: user.email, phone: user.phone,
    profilePhoto: user.profilePhoto, userType: user.userType,
    isVerified: user.isVerified, emailVerified: user.emailVerified, createdAt: user.createdAt,
  };
}

export default router;
