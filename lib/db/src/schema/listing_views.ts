import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { listingsTable } from "./listings";

/**
 * Tracks unique listing views for analytics.
 * Each row represents one view event from a visitor in a 30-min bucket.
 * The unique constraint prevents double-counting within the window.
 */
export const listingViewsTable = pgTable("listing_views", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listingsTable.id, { onDelete: "cascade" }),
  visitorKey: text("visitor_key").notNull(),
  bucketKey: text("bucket_key").notNull(), // floor(unixMs / 30min) as string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.listingId, t.visitorKey, t.bucketKey)]);

export type ListingView = typeof listingViewsTable.$inferSelect;
