---
name: GCS image storage
description: How listing/profile images are stored and served — GCS replaces local disk.
---

## Rule
All user-uploaded images are stored in Replit Object Storage (GCS) and served via `/api/storage/public-objects/<folder>/<filename>`. Never store images on the local filesystem.

**Why:** Local disk files exist only on the dev server; the production deployment has its own ephemeral filesystem. Any image uploaded in dev was invisible to the live site, causing 404/401 on the QR-code-linked production URL.

## How to apply
- `artifacts/api-server/src/lib/images.ts` — `processAndSaveImage()` uploads display + thumb WebP buffers directly to GCS using `objectStorageClient.bucket(...).file(...).save(buffer, { resumable: false })`.
- GCS path: `<PUBLIC_OBJECT_SEARCH_PATHS prefix>/<folder>/<filename>` → `public/listings/file.webp` inside the bucket.
- Returned URLs are root-relative: `/api/storage/public-objects/<folder>/<filename>`.
- Serving route: `artifacts/api-server/src/routes/storage.ts` — `router.use("/storage/public-objects", ...)` uses `ObjectStorageService.searchPublicObject()` to stream the file from GCS. Mounted in `routes/index.ts` before auth routes.
- `toRelativeUrl()` in `routes/listings.ts` normalises any stored absolute URLs to root-relative paths using `new URL(url).pathname`.
- `/api/uploads` legacy path returns 404 (not 401) via a catch-all in `app.ts` so old-style URLs never fall through to the auth router.
- Bucket env vars: `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` — all set by `setupObjectStorage()`.
- `router.use()` is required for the GCS serving route — path-to-regexp v8 (used by Express's router v2) no longer supports bare `*` or `(*)` wildcard patterns in `router.get()`.
