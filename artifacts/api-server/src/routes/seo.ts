import { Router } from "express";
import { eq, desc, isNull, and } from "drizzle-orm";
import { db, listingsTable, categoriesTable } from "@workspace/db";
import { SITE_URL } from "../lib/config";

const router = Router();

// Static pages with their SEO metadata
const STATIC_PAGES = [
  { loc: "/",             changefreq: "daily",   priority: "1.0" },
  { loc: "/search",       changefreq: "hourly",  priority: "0.9" },
  { loc: "/categories",   changefreq: "weekly",  priority: "0.8" },
  { loc: "/pricing",      changefreq: "monthly", priority: "0.7" },
  { loc: "/how-it-works", changefreq: "monthly", priority: "0.6" },
  { loc: "/faq",          changefreq: "monthly", priority: "0.6" },
  { loc: "/safety",       changefreq: "monthly", priority: "0.5" },
  { loc: "/about",        changefreq: "monthly", priority: "0.5" },
  { loc: "/contact",      changefreq: "monthly", priority: "0.5" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, opts: { lastmod?: string; changefreq: string; priority: string }): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : null,
    `    <changefreq>${opts.changefreq}</changefreq>`,
    `    <priority>${opts.priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

// GET /robots.txt
router.get("/robots.txt", (req, res): void => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Private / authenticated paths — do not index",
    "Disallow: /admin",
    "Disallow: /dashboard",
    "Disallow: /profile",
    "Disallow: /favourites",
    "Disallow: /listings/new",
    "Disallow: /listings/*/edit",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /forgot-password",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(body);
});

// GET /sitemap.xml — dynamically generated sitemap
router.get("/sitemap.xml", async (req, res): Promise<void> => {
  const [listings, categories] = await Promise.all([
    db
      .select({ id: listingsTable.id, updatedAt: listingsTable.updatedAt })
      .from(listingsTable)
      .where(eq(listingsTable.status, "approved"))
      .orderBy(desc(listingsTable.updatedAt))
      .limit(50_000),
    db
      .select({ slug: categoriesTable.slug })
      .from(categoriesTable)
      // only active top-level categories (parentId IS NULL)
      .where(and(eq(categoriesTable.isActive, true), isNull(categoriesTable.parentId))),
  ]);

  const entries: string[] = [];

  // 1. Static pages
  for (const page of STATIC_PAGES) {
    entries.push(urlEntry(`${SITE_URL}${page.loc}`, { changefreq: page.changefreq, priority: page.priority }));
  }

  // 2. Category search pages
  for (const cat of categories) {
    entries.push(
      urlEntry(`${SITE_URL}/search?category=${encodeURIComponent(cat.slug)}`, {
        changefreq: "daily",
        priority: "0.7",
      }),
    );
  }

  // 3. Individual listing pages
  for (const listing of listings) {
    const lastmod = listing.updatedAt?.toISOString().split("T")[0];
    entries.push(
      urlEntry(`${SITE_URL}/listings/${listing.id}`, {
        lastmod,
        changefreq: "weekly",
        priority: "0.8",
      }),
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.send(xml);
});

export default router;
