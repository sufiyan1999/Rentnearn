# RentMitra

A mobile-first peer-to-peer rental classifieds marketplace for India. People list items they own (tools, cameras, baby strollers, medical equipment, party gear, etc.) and rent them to nearby users. The platform only connects owners and renters — no payments, no deposits, no commissions. Users contact each other via WhatsApp.

## Run & Operate

- `pnpm --filter @workspace/rentmitra run dev` — run the React frontend (port set by env)
- `pnpm --filter @workspace/api-server run dev` — run the Express API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React + Vite + TailwindCSS + Shadcn UI + Framer Motion + Wouter
- **Backend:** Express 5 (Clean Architecture: routes → services → DB)
- **DB:** PostgreSQL + Drizzle ORM
- **Validation:** Zod (zod/v4), drizzle-zod
- **API codegen:** Orval (from OpenAPI spec)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Email:** Nodemailer + Zoho SMTP
- **Images:** Sharp (resize → WebP conversion)
- **QR Code:** qrcode library

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle DB schema (users, listings, categories, favourites, recently_viewed, business_profiles, tokens)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, listings, categories, favourites, recently_viewed, business, admin, dashboard)
- `artifacts/api-server/src/lib/` — shared services (auth.ts, email.ts, images.ts, logger.ts)
- `artifacts/api-server/src/middlewares/` — Express middleware (authMiddleware.ts)
- `artifacts/rentmitra/src/` — React frontend (pages, components, hooks)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not hand-edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not hand-edit)

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed hooks + Zod schemas. Never hand-write what codegen produces.
- JWT stored in localStorage as `rentmitra_token`. Auth context reads on mount and provides user/login/logout globally.
- Image uploads handled outside OpenAPI spec (multipart route in Express + Sharp pipeline). Images resized to 1000×1000 and thumbnails at 400×400, both in WebP.
- Nearby listings use PostgreSQL Haversine formula in a raw SQL expression. No paid maps API.
- WhatsApp contact uses deep link `https://wa.me/91{phone}?text=...`. No Business API.
- QR codes generated server-side with `qrcode` library, returned as data URLs.
- Email is optional (Zoho SMTP via env vars). If not configured, emails are silently skipped and logged.

## Product

- **Public:** Home (featured + nearby + categories), Search (filter/paginate), Listing Detail (gallery, pricing, WhatsApp CTA, QR, share), Category browser, Business profile pages, Login/Register/Forgot-password
- **User Dashboard:** My Listings, Add/Edit Listing, Favourites, Recently Viewed, Profile Edit
- **Admin:** Pending approvals, All listings, User management, Platform stats
- **Mobile:** Bottom nav (Home/Search/Add/Favourites/Profile), PWA-ready, Capacitor-compatible

## User preferences

- Mobile-first, feel like a native app not a website
- No paid APIs — OpenStreetMap, Zoho SMTP, free OAuth
- Modern & luxury UI with saffron/marigold brand color
- Dark mode support

## Gotchas

- After any `lib/api-spec/openapi.yaml` change, run `pnpm --filter @workspace/api-spec run codegen` before touching routes or hooks
- After any `lib/db/src/schema/` change, run `pnpm --filter @workspace/db run push`
- Multipart image upload routes (`POST /api/listings/:id/images`, `POST /api/users/me/photo`) are outside the OpenAPI spec — they use Express + Multer directly
- `req.params.id` in Express 5 is `string | string[]` — always parse with `Array.isArray` check

## Environment Variables Required

```
DATABASE_URL=           # PostgreSQL connection string (auto-set by Replit)
JWT_SECRET=             # Secret for signing JWT tokens
ZOHO_SMTP_HOST=         # smtp.zoho.in
ZOHO_SMTP_PORT=         # 465
ZOHO_EMAIL=             # your@zoho.email
ZOHO_PASSWORD=          # zoho app password
APP_URL=                # https://your-domain.com (for email links, QR codes)
UPLOAD_DIR=             # /path/to/uploads (defaults to ./uploads in server dir)
```

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Admin credentials: admin@rentmitra.in (password hash is placeholder — set real one in production)
