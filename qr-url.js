/**
 * URL QR matrix for the morph1 tip.
 *
 * The flat PORTABOOM still and the page's first frame are both built from
 * encodeUrlMatrix(TIP_URL), so the still and frame 0 share one matrix.
 * Encoder: vendored qrcode-generator (MIT), no CDN at runtime.
 */
import qrcode from "./qr-vendor.js?b=b034e56e";

export const MORPH_ECC = "H";

/** Bit matrix (1 = dark) for any URL at ECC H, smallest version that fits. */
export function encodeUrlMatrix(url, opts = {}) {
  const ecc = opts.ecc || MORPH_ECC;
  const minVersion = opts.minVersion || 1;
  let qr = null;
  for (let v = minVersion; v <= 40; v += 1) {
    try {
      const q = qrcode(v, ecc);
      q.addData(String(url), "Byte");
      q.make();
      qr = q;
      break;
    } catch (err) {
      // too long for this version, try the next one
    }
  }
  if (!qr) throw new Error("URL too long for a QR code");
  const n = qr.getModuleCount();
  const matrix = [];
  let dark = 0;
  for (let r = 0; r < n; r += 1) {
    const row = [];
    for (let c = 0; c < n; c += 1) {
      const bit = qr.isDark(r, c) ? 1 : 0;
      dark += bit;
      row.push(bit);
    }
    matrix.push(row);
  }
  return { url: String(url), ecc, version: (n - 17) / 4, size: n, dark, matrix };
}

/** Finder outer ring (TAS orange) vs finder eye / data (navy). */
export function finderRole(n, r, c) {
  const corners = [[0, 0], [0, n - 7], [n - 7, 0]];
  for (const [fr, fc] of corners) {
    const dr = r - fr;
    const dc = c - fc;
    if (dr < 0 || dc < 0 || dr > 6 || dc > 6) continue;
    if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return "ring";
    if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return "eye";
    return "gap";
  }
  return null;
}

/** Shared palette for the still and the page. */
export const MORPH_PALETTE = Object.freeze({
  cream: "#F4EFE6",
  navy: "#1B2A4A",
  orange: "#EE7202",
});

/**
 * Fixed version for the tip so the still, the page and every host share one
 * grid size (57 x 57 at version 10). The lying unit knockout is baked for it.
 */
export const MORPH_MIN_VERSION = 10;

/** The one call both the still and the page use for the tip matrix. */
export function encodeTipMatrix(url) {
  return encodeUrlMatrix(url, { ecc: MORPH_ECC, minVersion: MORPH_MIN_VERSION });
}

/**
 * Unit knockout mask (cells where the lying unit covers the symbol), packed
 * as hex, row-major, 4 cells per digit. Returns a Uint8Array of n * n.
 */
export function unpackMask(mask, n) {
  const out = new Uint8Array(n * n);
  if (!mask || mask.n !== n || !mask.hex) return null;
  for (let i = 0; i < n * n; i += 1) {
    const d = parseInt(mask.hex[i >> 2], 16) || 0;
    out[i] = (d >> (3 - (i & 3))) & 1;
  }
  return out;
}

export function packMask(bits, n) {
  let hex = "";
  for (let i = 0; i < n * n; i += 4) {
    let d = 0;
    for (let k = 0; k < 4; k += 1) d = (d << 1) | (bits[i + k] ? 1 : 0);
    hex += d.toString(16);
  }
  return hex;
}

/** Matrix as printed and as drawn on frame 0: masked modules forced light. */
export function maskedMatrix(matrix, bits) {
  const n = matrix.length;
  return matrix.map((row, r) => row.map((bit, c) => (bits && bits[r * n + c] ? 0 : bit)));
}
