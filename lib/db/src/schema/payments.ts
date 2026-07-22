import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const planEnum = pgEnum("plan_type", ["single", "bundle", "unlimited", "featured"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  listingId: integer("listing_id"),                     // null for plan purchases, set for featured
  plan: planEnum("plan").notNull(),
  amountPaise: integer("amount_paise").notNull(),       // amount in paise (₹49 = 4900)
  razorpayOrderId: text("razorpay_order_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id"),       // set after successful payment
  razorpaySignature: text("razorpay_signature"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
