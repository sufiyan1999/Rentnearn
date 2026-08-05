import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db, usersTable, tokensTable } from "@workspace/db";
import { hashPassword, comparePassword, signToken, generateSecureToken } from "../lib/auth";
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, sendOtpEmail, sendAdminNewUserEmail } from "../lib/email";
import { logger } from "../lib/logger";
import { assignFreeTrial } from "../lib/membership";

const router = Router();

// POST /auth/send-otp  — check uniqueness and email a 6-digit OTP before registration
router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const { email, phone } = req.body;
  if (!email || !phone) {
    res.status(400).json({ error: "email and phone are required" });
    return;
  }

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existingEmail) {
    res.status(400).json({ error: "This email is already registered. Please log in." });
    return;
  }

  const [existingPhone] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (existingPhone) {
    res.status(400).json({ error: "This phone number is already registered with another account." });
    return;
  }

  // Invalidate any existing unused OTPs for this email
  const oldTokens = await db.select({ token: tokensTable.token })
    .from(tokensTable)
    .where(and(eq(tokensTable.email, email), eq(tokensTable.type, "email_otp"), isNull(tokensTable.usedAt)));
  for (const t of oldTokens) {
    await db.update(tokensTable).set({ usedAt: new Date() }).where(eq(tokensTable.token, t.token));
  }

  // Generate and store a 6-digit OTP (valid 10 minutes)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(tokensTable).values({ email, token: otp, type: "email_otp", expiresAt });

  await sendOtpEmail(email, otp);
  req.log.info({ email }, "OTP sent for registration");
  res.json({ message: "OTP sent to your email." });
});

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, phone, otp, userType } = req.body;
  if (!name || !email || !password || !phone || !otp) {
    res.status(400).json({ error: "name, email, phone, password, and OTP are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  // Verify OTP
  const [otpRecord] = await db.select().from(tokensTable).where(
    and(eq(tokensTable.token, otp), eq(tokensTable.type, "email_otp"), eq(tokensTable.email, email))
  ).limit(1);
  if (!otpRecord || otpRecord.usedAt || otpRecord.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });
    return;
  }

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existingEmail) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [existingPhone] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (existingPhone) {
    res.status(400).json({ error: "This phone number is already registered with another account." });
    return;
  }

  // Mark OTP as used
  await db.update(tokensTable).set({ usedAt: new Date() }).where(eq(tokensTable.id, otpRecord.id));

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name, email, phone, passwordHash,
    userType: userType === "business" ? "business" : "individual",
    emailVerified: true, // OTP confirms email ownership
  }).returning();

  // Assign 90-day free trial membership (fire-and-forget — don't block the response)
  assignFreeTrial(user.id).catch(err => logger.warn({ err, userId: user.id }, "assignFreeTrial failed"));
  sendWelcomeEmail(email, name).catch(() => {});
  sendAdminNewUserEmail(name, email, userType === "business" ? "business" : "individual").catch(() => {});

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

  if (user.isSuspended) {
    res.status(403).json({ error: "Account suspended. Please contact support." });
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
      sendWelcomeEmail(email, name ?? email).catch(() => {});
      sendAdminNewUserEmail(name ?? email, email, "individual").catch(() => {});
      assignFreeTrial(user.id).catch(err => logger.warn({ err, userId: user.id }, "assignFreeTrial failed"));
    } else if (!user.googleId) {
      await db.update(usersTable).set({ googleId, emailVerified: true }).where(eq(usersTable.id, user.id));
    }

    if (user.isSuspended) {
      res.status(403).json({ error: "Account suspended. Please contact support." });
      return;
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

// POST /auth/change-password
router.post("/auth/change-password", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { verifyToken } = await import("../lib/auth");
    const payload = verifyToken(authHeader.slice(7));
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" }); return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" }); return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    if (!user.passwordHash) {
      res.status(400).json({ error: "Cannot change password for Google-linked accounts" }); return;
    }
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Current password is incorrect" }); return; }
    const newHash = await hashPassword(newPassword);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
    res.json({ message: "Password changed successfully" });
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
    city: user.city ?? null,
    state: user.state ?? null,
    profilePhoto: user.profilePhoto,
    userType: user.userType,
    isVerified: user.isVerified,
    emailVerified: user.emailVerified,
    hasPassword: !!user.passwordHash,
    createdAt: user.createdAt,
  };
}

export default router;
