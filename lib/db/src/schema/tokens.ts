import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const tokenTypeEnum = pgEnum("token_type", ["password_reset", "email_verification", "email_otp"]);

export const tokensTable = pgTable("tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }), // nullable for pre-registration OTPs
  email: text("email"), // set for email_otp tokens before user exists
  token: text("token").notNull().unique(),
  type: tokenTypeEnum("type").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Token = typeof tokensTable.$inferSelect;
