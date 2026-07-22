import { Router } from "express";
import { eq, count, and, isNull } from "drizzle-orm";
import { db, categoriesTable, listingsTable } from "@workspace/db";

const router = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  // Fetch all rows in one query
  const all = await db.select().from(categoriesTable).orderBy(categoriesTable.id);

  // Listing counts keyed by parent category slug
  const counts = await db
    .select({ category: listingsTable.category, count: count() })
    .from(listingsTable)
    .where(eq(listingsTable.status, "approved"))
    .groupBy(listingsTable.category);
  const countMap = new Map(counts.map(c => [c.category, Number(c.count)]));

  // Separate parents and children
  const parents = all.filter(c => c.parentId === null);
  const children = all.filter(c => c.parentId !== null);

  const nested = parents.map(p => ({
    ...p,
    listingCount: countMap.get(p.slug) ?? 0,
    subcategories: children
      .filter(c => c.parentId === p.id)
      .map(c => ({ ...c, listingCount: countMap.get(c.slug) ?? 0 })),
  }));

  res.json(nested);
});

export default router;
