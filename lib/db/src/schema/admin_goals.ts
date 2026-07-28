import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const adminGoalsTable = pgTable("admin_goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  targetValue: integer("target_value").notNull(),
  metricType: text("metric_type").notNull(), // 'users','listings','businesses','revenue_paise','rentals'
  deadline: text("deadline"),                 // ISO date string, nullable
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminGoal = typeof adminGoalsTable.$inferSelect;
