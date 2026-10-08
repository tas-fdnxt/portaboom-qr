/**
 * Showtime leave destination - any http(s) website.
 *
 * Default (when ?dest= is omitted): Traffic Access PB4000 product page.
 * Override on the living door:
 *   ?showtime=1&dest=<URL-encoded https URL>
 *
 * The stationary send QR still encodes the living showtime page
 * (`?v=living10&showtime=1`) so the ICQR door + transform can run.
 * This value is only the post-showtime leave URL.
 * The in-world tap-to-scan H-matrix stays the baked default product bits.
 */
export const SHOWTIME_DEST_DEFAULT =
  "https://www.trafficaccess.com.au/portaboom-product/portaboom-pb4000-series/";

export function parseHttpUrl(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function resolveLeaveDest(raw, fallback = SHOWTIME_DEST_DEFAULT) {
  return parseHttpUrl(raw) || fallback;
}
