/**
 * URL QR matrix for the morph1 tip.
 *
 * The flat PORTABOOM still and the page's first frame are both built from
 * encodeUrlMatrix(TIP_URL), so the still and frame 0 share one matrix.
 * Encoder: vendored qrcode-generator (MIT), no CDN at runtime.
 */
import qrcode from "./qr-vendor.js";

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

/**
 * Centre knockout for the PORTABOOM logo, in whole modules.
 * About 16% of the symbol area for version 6 (21 x 13 of 41 x 41).
 */
export function logoKnockout(n) {
  const odd = (v) => (v % 2 ? v : v + 1);
  const cols = odd(Math.round(n * 0.52));
  const rows = odd(Math.round(n * 0.32));
  const c0 = (n - cols) / 2;
  const r0 = (n - rows) / 2;
  return { r0, c0, rows, cols, areaFrac: (rows * cols) / (n * n) };
}

export function inKnockout(ko, r, c) {
  return r >= ko.r0 && r < ko.r0 + ko.rows && c >= ko.c0 && c < ko.c0 + ko.cols;
}

/** Matrix as printed and as drawn on frame 0: knockout modules forced light. */
export function knockedMatrix(matrix, ko) {
  return matrix.map((row, r) => row.map((bit, c) => (inKnockout(ko, r, c) ? 0 : bit)));
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
 * Logo box inside the knockout, in module units from the symbol's top-left
 * (quiet zone excluded). One module of cream padding on every side.
 */
export function logoPlacement(ko, aspect) {
  const availW = ko.cols - 2;
  const availH = ko.rows - 2;
  let w = availW;
  let h = w / aspect;
  if (h > availH) {
    h = availH;
    w = h * aspect;
  }
  return {
    x: ko.c0 + (ko.cols - w) / 2,
    y: ko.r0 + (ko.rows - h) / 2,
    w,
    h,
  };
}

/**
 * Smallest version the logo knockout is tested at. Short URLs (local test
 * hosts) would otherwise land on version 4, where a 16% knockout eats most
 * of the ECC H budget.
 */
export const MORPH_MIN_VERSION = 6;

/** The one call both the still and the page use for the tip matrix. */
export function encodeTipMatrix(url) {
  return encodeUrlMatrix(url, { ecc: MORPH_ECC, minVersion: MORPH_MIN_VERSION });
}
