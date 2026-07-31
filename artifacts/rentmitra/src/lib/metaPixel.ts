/**
 * Meta (Facebook) Pixel utility for RentNEarn.
 *
 * - Pixel ID is read from VITE_META_PIXEL_ID (set in env vars).
 * - The pixel is initialised only in production builds.
 * - Every helper is a no-op when the pixel is not available, so
 *   development never throws.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { fbq: any; _fbq?: any }
}

const PIXEL_ID: string =
  import.meta.env.VITE_META_PIXEL_ID ?? "4570778229865331";

const IS_PROD = import.meta.env.PROD;

// ─── Internal safe caller ────────────────────────────────────────────────────

function fbq(method: string, event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (data !== undefined) {
    window.fbq(method, event, data);
  } else {
    window.fbq(method, event);
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Injects the Facebook Pixel base code and calls `fbq('init', PIXEL_ID)`.
 * Safe to call multiple times — skips if already initialised.
 * Only runs in production.
 */
export function initPixel(): void {
  if (!IS_PROD || typeof window === "undefined") return;
  if (typeof window.fbq === "function") return; // already initialised

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );
  /* eslint-enable */

  window.fbq("init", PIXEL_ID);
}

// ─── Standard events ─────────────────────────────────────────────────────────

/** Fire a PageView event. Called automatically on every route change. */
export function trackPageView(): void {
  fbq("track", "PageView");
}

/**
 * ViewContent — fired when a renter views a listing detail page.
 */
export function trackViewContent(data?: {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}): void {
  fbq("track", "ViewContent", data);
}

/**
 * Search — fired when a user submits a search query.
 */
export function trackSearch(data?: { search_string?: string }): void {
  fbq("track", "Search", data);
}

/**
 * CompleteRegistration — fired when a new user completes sign-up.
 */
export function trackRegistration(data?: {
  content_name?: string;
  status?: boolean;
}): void {
  fbq("track", "CompleteRegistration", data);
}

/**
 * Lead — fired when an owner submits a new listing.
 */
export function trackLead(data?: {
  content_name?: string;
  content_category?: string;
}): void {
  fbq("track", "Lead", data);
}

/**
 * Contact — fired when a renter clicks WhatsApp or Phone on a listing.
 */
export function trackContact(): void {
  fbq("track", "Contact");
}

/**
 * InitiateCheckout — fired when a user starts the membership payment flow.
 */
export function trackInitiateCheckout(data?: {
  value?: number;
  currency?: string;
  content_ids?: string[];
  num_items?: number;
}): void {
  fbq("track", "InitiateCheckout", data);
}

/**
 * Purchase — fired after a membership payment is verified successfully.
 */
export function trackPurchase(data: {
  value: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
}): void {
  fbq("track", "Purchase", { currency: "INR", ...data });
}

// ─── Custom events ───────────────────────────────────────────────────────────

/**
 * Generic custom event helper — for events not covered by Meta's standard set.
 * e.g. trackCustom("Login"), trackCustom("InquirySent", { listingId: 42 })
 */
export function trackCustom(
  eventName: string,
  data?: Record<string, unknown>
): void {
  fbq("trackCustom", eventName, data);
}
