import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "rentnearn-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "30d";
const REVOKED_TOKENS = new Set<string>();

function generateJti(): string {
  try {
    return crypto.randomBytes(16).toString("hex");
  } catch {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; email: string; userType: string }): string {
  const jti = generateJti();
  return jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number; email: string; userType: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; userType: string; jti?: string; exp?: number };
  if (decoded?.jti && REVOKED_TOKENS.has(decoded.jti)) {
    throw new Error("Token revoked.");
  }
  if (typeof decoded.exp === "number" && decoded.exp * 1000 < Date.now()) {
    throw new Error("Token expired.");
  }
  return { userId: decoded.userId, email: decoded.email, userType: decoded.userType };
}

export function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function revokeToken(token: string): void {
  const decoded = jwt.decode(token) as { jti?: string } | null;
  if (decoded && decoded.jti) {
    REVOKED_TOKENS.add(decoded.jti);
  }
}
