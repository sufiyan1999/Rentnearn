import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const adminAuditLogTable = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),       // e.g. "approve_listing", "suspend_user"
  module: text("module").notNull(),        // e.g. "listings", "users", "businesses"
  affectedId: integer("affected_id"),
  affectedType: text("affected_type"),
  prevValue: jsonb("prev_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  status: text("status").notNull().default("success"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminAuditLog = typeof adminAuditLogTable.$inferSelect;
