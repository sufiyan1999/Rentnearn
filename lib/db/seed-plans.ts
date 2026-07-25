import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { membershipPlansTable } from "./src/schema/memberships";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const plans = [
  {
    name: "Free Trial", slug: "free_trial", pricePaise: 0,
    billingPeriod: "trial" as const, durationDays: 90,
    maxListings: 3, maxImages: 5, sortOrder: 0, isActive: true,
    features: ["3 months free", "Up to 3 listings", "5 images per listing", "WhatsApp contact", "QR code per listing"],
  },
  {
    name: "Basic", slug: "basic", pricePaise: 4900,
    billingPeriod: "monthly" as const, durationDays: 30,
    maxListings: 5, maxImages: 8, sortOrder: 1, isActive: true,
    features: ["Up to 5 listings", "8 images per listing", "WhatsApp contact", "Email notifications", "Listing renewal"],
  },
  {
    name: "Plus", slug: "plus", pricePaise: 19900,
    billingPeriod: "monthly" as const, durationDays: 30,
    maxListings: 25, maxImages: 8, sortOrder: 2, isActive: true,
    features: ["Up to 25 listings", "8 images per listing", "Priority search ranking", "Featured discount", "Basic analytics"],
  },
  {
    name: "Business", slug: "business", pricePaise: 199900,
    billingPeriod: "yearly" as const, durationDays: 365,
    maxListings: 500, maxImages: 8, sortOrder: 3, isActive: true,
    features: ["Up to 500 listings", "Business profile", "Verified badge", "Priority search", "Advanced analytics", "Email support"],
  },
];

async function seed() {
  for (const p of plans) {
    const existing = await db.select({ id: membershipPlansTable.id })
      .from(membershipPlansTable)
      .where(eq(membershipPlansTable.slug, p.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(membershipPlansTable).values(p);
      console.log("Inserted:", p.slug);
    } else {
      console.log("Already exists:", p.slug);
    }
  }
  console.log("✅ Plans seed complete");
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
