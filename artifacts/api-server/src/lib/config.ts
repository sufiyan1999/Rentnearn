/**
 * SITE_URL — the single source of truth for the canonical production domain.
 *
 * Rules:
 *  - Production: always https://www.rentnearn.com (from APP_URL env var).
 *  - Development (NODE_ENV !== "production" and APP_URL not set):
 *    falls back to http://localhost:<PORT> so local dev curl/QR testing works.
 *
 * Never derive URLs from request.hostname, window.location, or
 * REPLIT_DEV_DOMAIN — those leak Replit preview domains into share links.
 */
export const SITE_URL = (
  process.env.APP_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://www.rentnearn.com"
    : `http://localhost:${process.env.PORT ?? "8080"}`)
).replace(/\/$/, "");
