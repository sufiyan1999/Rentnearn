import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, tokensTable } from "@workspace/db";
import { hashPassword, comparePassword, signToken, generateSecureToken } from "../lib/auth";
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, phone, userType } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name, email, phone: phone ?? null, passwordHash,
    userType: userType === "business" ? "business" : "individual",
  }).returning();

  const verifyToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(tokensTable).values({ userId: user.id, token: verifyToken, type: "email_verification", expiresAt });

  await sendWelcomeEmail(email, name);
  await sendVerificationEmail(email, name, verifyToken);

  const token = signToken({ userId: user.id, email: user.email, userType: user.userType });
  req.log.info({ userId: user.id }, "User registered");
  res.status(201).json({ token, user: sanitizeUser(user) });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, userType: user.userType });
  res.json({ token, user: sanitizeUser(user) });
});

// POST /auth/logout
router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out" });
});

// POST /auth/google
router.post("/auth/google", async (req, res): Promise<void> => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: "idToken is required" });
    return;
  }
  try {
    // Decode the JWT to get user info (Google ID token is a JWT)
    const parts = idToken.split(".");
    if (parts.length < 2) throw new Error("Invalid token");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const { email, name, sub: googleId, picture } = payload;

    if (!email || !googleId) {
      res.status(400).json({ error: "Invalid Google token" });
      return;
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      [user] = await db.insert(usersTable).values({
        name: name ?? email, email, googleId, profilePhoto: picture ?? null, emailVerified: true,
      }).returning();
      await sendWelcomeEmail(email, name ?? email);
    } else if (!user.googleId) {
      await db.update(usersTable).set({ googleId, emailVerified: true }).where(eq(usersTable.id, user.id));
    }

    const token = signToken({ userId: user.id, email: user.email, userType: user.userType });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    logger.warn({ err }, "Google auth failed");
    res.status(400).json({ error: "Invalid Google token" });
  }
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  // Always return success to prevent email enumeration
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (user) {
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(tokensTable).values({ userId: user.id, token, type: "password_reset", expiresAt });
    await sendPasswordResetEmail(email, user.name, token);
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [record] = await db.select().from(tokensTable).where(eq(tokensTable.token, token)).limit(1);
  if (!record || record.type !== "password_reset" || record.usedAt || record.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId));
  await db.update(tokensTable).set({ usedAt: new Date() }).where(eq(tokensTable.id, record.id));

  res.json({ message: "Password reset successfully" });
});

// POST /auth/verify-email
router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  const [record] = await db.select().from(tokensTable).where(eq(tokensTable.token, token)).limit(1);
  if (!record || record.type !== "email_verification" || record.usedAt || record.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired verification token" });
    return;
  }

  await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, record.userId));
  await db.update(tokensTable).set({ usedAt: new Date() }).where(eq(tokensTable.id, record.id));

  res.json({ message: "Email verified successfully" });
});

// GET /auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { verifyToken } = await import("../lib/auth");
    const payload = verifyToken(authHeader.slice(7));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(sanitizeUser(user));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profilePhoto: user.profilePhoto,
    userType: user.userType,
    isVerified: user.isVerified,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export default router;
