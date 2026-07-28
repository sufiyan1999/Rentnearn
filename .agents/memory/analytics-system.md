---
name: Analytics system
description: Listing analytics — view tracking, interaction counters, availability status, interest score badges, owner analytics dashboard.
---

## Schema additions
- `listings` table: 8 new columns — `availability_status` (text default 'available'), `times_rented`, `view_count`, `whatsapp_clicks`, `phone_clicks`, `phone_copy_clicks`, `share_count`, `qr_scans` (all integer default 0).
- `listing_views` table — deduplication: `(listing_id, visitor_key, bucket_key)` unique, bucket_key = floor(unixMs / 30min).

## Backend (artifacts/api-server/src/routes/analytics.ts)
- `POST /listings/:id/view` — anonymous, 30-min dedup, increments view_count.
- `POST /listings/:id/interact` — anonymous, type ∈ {whatsapp, phone, phone_copy, share, qr}.
- `PATCH /listings/:id/availability` — owner auth, sets availabilityStatus.
- `POST /listings/:id/times-rented` — owner auth, increments timesRented.
- `GET /listings/:id/analytics` — owner auth, returns views today/week + full breakdown.

## formatListing (listings.ts)
Includes `availabilityStatus`, `analytics` (all counters), `interestBadge` (null | {emoji, label, detail}), `updatedAt`.
Interest badge thresholds: 10+ contacts → 🔥 High Demand; 50+ views → 📈 Trending; score≥30 → ⭐ Popular.

## Frontend
- `ListingDetails.tsx`: view tracked on mount via `rn_vid` localStorage key; trackInteract() wraps WhatsApp/phone/share/QR; interest badge + availability badge near title tags; public stats bar; owner controls card (availability dropdown + "Log a Rental").
- `Dashboard.tsx`: "Analytics" tab added between My Listings and Membership; per-listing expandable rows fetch detailed stats from GET /analytics.
- `Search.tsx`: added `most_viewed`, `most_favorited`, `recently_updated` sort options.

**Why:** Auth token is stored at `localStorage.getItem("rentnearn_token")` for direct fetch calls. DB package must be rebuilt (`cd lib/db && npx tsc -p tsconfig.json`) when schema changes before API server sees new column types.
