/**
 * Geocoding helper using OpenStreetMap Nominatim (free, no API key required).
 * Policy: max 1 request/second, must include User-Agent.
 * We fire-and-forget — listing creation never blocks on geocoding.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  area: string,
  city: string,
  state: string,
): Promise<{ latitude: string; longitude: string } | null> {
  // Input validation to mitigate SSRF: only accept simple ASCII address components
  const isSafeComponent = (s: string) =>
    typeof s === "string" &&
    s.trim().length > 0 &&
    /^[a-zA-Z0-9\s,'-.]+$/.test(s);

  if (![area, city, state].every(isSafeComponent)) {
    return null;
  }

  const q = [area, city, state, "India"].filter(Boolean).join(", ");
  try {
    const res = await fetch(
      `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`,
      {
        headers: {
          "User-Agent": "RentNEarn/1.0 (contact@rentnearnindia.com)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      latitude: parseFloat(data[0].lat).toFixed(7),
      longitude: parseFloat(data[0].lon).toFixed(7),
    };
  } catch {
    return null; // geocoding failure must never break listing creation
  }
}
