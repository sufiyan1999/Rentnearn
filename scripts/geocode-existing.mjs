/**
 * One-time script: geocode existing listings that have area/city/state but no lat/lng.
 * Run from workspace root: node --experimental-vm-modules scripts/geocode-existing.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Pool } = require("/home/runner/workspace/node_modules/.pnpm/pg@8.22.0/node_modules/pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function geocode(area, city, state) {
  const q = [area, city, state, "India"].filter(Boolean).join(", ");
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`,
      { headers: { "User-Agent": "RentNEarn/1.0 (contact@rentnearnindia.com)", "Accept-Language": "en" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat).toFixed(7), lng: parseFloat(data[0].lon).toFixed(7) };
  } catch (e) { console.warn("  geocode error:", e.message); return null; }
}

const { rows } = await pool.query(
  `SELECT id, title, area, city, state FROM listings WHERE latitude IS NULL AND city IS NOT NULL`
);
console.log(`Geocoding ${rows.length} listings...\n`);

for (const row of rows) {
  process.stdout.write(`  [${row.id}] ${row.title} (${[row.area, row.city, row.state].filter(Boolean).join(", ")}) ... `);
  const c = await geocode(row.area ?? "", row.city, row.state);
  if (c) {
    await pool.query(`UPDATE listings SET latitude=$1, longitude=$2 WHERE id=$3`, [c.lat, c.lng, row.id]);
    console.log(`✓  ${c.lat}, ${c.lng}`);
  } else {
    console.log("✗  not found");
  }
  await new Promise(r => setTimeout(r, 1200)); // Nominatim: max 1 req/sec
}

await pool.end();
console.log("\nDone.");
