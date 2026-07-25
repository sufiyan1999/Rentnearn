import { pgTable, text, serial, integer, timestamp, boolean, pgEnum, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// ─── Enums ─────────────────────────────────────────────────────────────────
export const membershipStatusEnum = pgEnum("membership_status", [
  "pending", "active", "expired", "cancelled"
]);

export const billingPeriodEnum = pgEnum("billing_period", [
  "trial", "monthly", "yearly"
]);

export const featuredPurchaseStatusEnum = pgEnum("featured_purchase_status", [
  "pending", "active", "expired", "failed"
]);

// ─── membership_plans ───────────────────────────────────────────────────────
export const membershipPlansTable = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),                         // "Free Trial", "Basic", "Plus", "Business"
  slug: text("slug").notNull().unique(),                // "free_trial", "basic", "plus", "business"
  pricePaise: integer("price_paise").notNull(),         // 0 for free_trial
  billingPeriod: billingPeriodEnum("billing_period").notNull(),
  durationDays: integer("duration_days").notNull(),     // 90 for trial, 30 for monthly, 365 for yearly
  maxListings: integer("max_listings").notNull(),       // 3 / 5 / 25 / 500
  maxImages: integer("max_images").notNull(),           // 5 / 8 / 8 / 8
  features: jsonb("features").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── user_memberships ───────────────────────────────────────────────────────
export const userMembershipsTable = pgTable("user_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => membershipPlansTable.id),
  status: membershipStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  amountPaise: integer("amount_paise").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── featured_listing_purchases ─────────────────────────────────────────────
export const featuredListingPurchasesTable = pgTable("featured_listing_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull(),
  durationDays: integer("duration_days").notNull(),     // 7 or 30
  amountPaise: integer("amount_paise").notNull(),       // 2900 or 9900
  status: featuredPurchaseStatusEnum("status").notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Zod / TS types ─────────────────────────────────────────────────────────
export const insertMembershipPlanSchema = createInsertSchema(membershipPlansTable).omit({ id: true, createdAt: true });
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MembershipPlan = typeof membershipPlansTable.$inferSelect;

export const insertUserMembershipSchema = createInsertSchema(userMembershipsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserMembership = z.infer<typeof insertUserMembershipSchema>;
export type UserMembership = typeof userMembershipsTable.$inferSelect;

export const insertFeaturedPurchaseSchema = createInsertSchema(featuredListingPurchasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeaturedPurchase = z.infer<typeof insertFeaturedPurchaseSchema>;
export type FeaturedListingPurchase = typeof featuredListingPurchasesTable.$inferSelect;
