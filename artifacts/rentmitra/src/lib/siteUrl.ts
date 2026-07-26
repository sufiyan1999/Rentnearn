/**
 * SITE_URL — canonical production domain, always https://www.rentnearn.com.
 *
 * This is a FIXED constant. Share links, QR codes, canonical URLs, Open Graph
 * tags, JSON-LD structured data, and email links must always point to the
 * production domain — never to a Replit preview URL, localhost, or any
 * dynamically detected hostname.
 *
 * Do NOT use window.location.origin here. The dev server runs on a .replit.dev
 * domain; using it would leak preview URLs into share links and social metadata.
 */
export const SITE_URL = "https://www.rentnearn.com";

/**
 * Returns an absolute URL for the given path using SITE_URL.
 * Handles both relative paths ("/listings/1") and already-absolute URLs.
 */
export function toAbsoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
