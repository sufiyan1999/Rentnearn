import { pgTable, text, serial, timestamp, boolean, numeric, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const listingStatusEnum = pgEnum("listing_status", ["pending", "approved", "rejected", "expired"]);
export const conditionEnum = pgEnum("condition", ["new", "like_new", "good", "fair", "poor"]);

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  customCategory: text("custom_category"),
  brand: text("brand"),
  condition: conditionEnum("condition").notNull().default("good"),
  dailyPrice: numeric("daily_price", { precision: 10, scale: 2 }),
  weeklyPrice: numeric("weekly_price", { precision: 10, scale: 2 }),
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }),
  securityDeposit: numeric("security_deposit", { precision: 10, scale: 2 }),
  // ─── availability & analytics ────────────────────────────────────────────
  availabilityStatus: text("availability_status").notNull().default("available"),
  timesRented: integer("times_rented").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  whatsappClicks: integer("whatsapp_clicks").notNull().default(0),
  phoneClicks: integer("phone_clicks").notNull().default(0),
  phoneCopyClicks: integer("phone_copy_clicks").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  qrScans: integer("qr_scans").notNull().default(0),
  city: text("city").notNull(),
  state: text("state").notNull(),
  area: text("area"),
  pincode: text("pincode"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  thumbnails: jsonb("thumbnails").$type<string[]>().notNull().default([]),
  status: listingStatusEnum("status").notNull().default("pending"),
  isFeatured: boolean("is_featured").notNull().default(false),
  rejectionReason: text("rejection_reason"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
