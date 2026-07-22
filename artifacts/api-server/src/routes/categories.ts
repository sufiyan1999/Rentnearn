import { Router } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, categoriesTable, listingsTable } from "@workspace/db";

const router = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.id);

  // Get listing counts per category
  const counts = await db
    .select({ category: listingsTable.category, count: count() })
    .from(listingsTable)
    .where(and(eq(listingsTable.status, "approved")))
    .groupBy(listingsTable.category);

  const countMap = new Map(counts.map(c => [c.category, Number(c.count)]));

  res.json(cats.map(c => ({ ...c, listingCount: countMap.get(c.name) ?? 0 })));
});

export default router;
