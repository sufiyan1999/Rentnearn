/**
 * SITE_URL — the single source of truth for the canonical production domain.
 *
 * Rules:
 *  - Production build (import.meta.env.PROD === true):
 *    always "https://www.rentnearn.com" — baked in at build time.
 *  - Development (Vite dev server):
 *    uses the current browser origin so local previews work correctly.
 *
 * Never use window.location.origin directly in share links, OG tags, JSON-LD,
 * or QR code targets — those will leak the .replit.dev preview domain.
 */
export const SITE_URL: string = import.meta.env.PROD
  ? "https://www.rentnearn.com"
  : typeof window !== "undefined"
    ? window.location.origin
    : "https://www.rentnearn.com";

/**
 * Returns an absolute URL for the given path using SITE_URL.
 * Handles both relative paths ("/listings/1") and already-absolute URLs.
 */
export function toAbsoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
