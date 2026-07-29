import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Tracks page-level analytics events (page views, CTA clicks, etc.)
 * for marketing and conversion analysis. Not linked to listings.
 */
export const pageEventsTable = pgTable("page_events", {
  id:         serial("id").primaryKey(),
  eventType:  text("event_type").notNull(),       // 'page_view', 'cta_click', …
  page:       text("page").notNull(),              // e.g. '/list-your-item'
  meta:       jsonb("meta"),                       // { cta: 'list_free', … }
  visitorKey: text("visitor_key"),                 // rn_sid cookie or localStorage key
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PageEvent = typeof pageEventsTable.$inferSelect;
