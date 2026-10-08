/**
 * DEST QR bit matrix - error correction H (version 8, 49×49).
 * Bits packed by qrcode@1.5.4 for:
 *   https://www.trafficaccess.com.au/portaboom-product/portaboom-pb4000-series/
 * Row-major, MSB first in each hex byte. Light modules = 0, dark = 1.
 */
export const DEST = "https://www.trafficaccess.com.au/portaboom-product/portaboom-pb4000-series/";
export const ECC = "H";
export const QR_VERSION = 8;
export const QR_SIZE = 49;
export const QUIET = 4;

/** Packed row-major bits for DEST @ H. */
const DEST_BITS_HEX = "fe0e4fd264bfc11e625d29d06e9e160fd06bb75136f9b6a5dba8cdfe4082ec113fb112d107faaaaaaaaafe01c6e46d5f00321323e3516c1ca07c3cebc13bff5d9ca984fc202e341a798f783972984e9d2fdb739377e38cc2d5ade1abaa37e9f0dd88471681dccff78e66492539bed2d25f7e2c44342bcad158b8823e29a336d3296c23d346a265fefd7ffadfe6118c1c669d145ad13ea3d1afdc77fd18d8c61bfaa0fa7c7e0aaea7e589e582253565430bdc2dff9573111f4cdef5ad3bd2199c409da36cb2259c2f7ee1b8740917a5fefcbe59c75e2d8611210e2d5b6570e8eebeeeafc25401eb6b311d3eb18719b0e195e8b7bf96e25017e101fc0032331c7b46ff9157a9b8aad04250479e514ba3ce7f3d5fb5d4dd8e69cfbeeb4695e9df9d044681e90712fe322a3ba2bf80";

/** Version-8 alignment centers. Finder-overlapping (6,6)/(6,42)/(42,6) skipped at classify. */
const ALIGN_CENTERS = [6, 24, 42];

export function unpackMatrix(hex = DEST_BITS_HEX, size = QR_SIZE) {
  const bits = [];
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    for (let k = 7; k >= 0; k -= 1) bits.push((byte >> k) & 1);
  }
  const matrix = [];
  for (let r = 0; r < size; r += 1) {
    matrix.push(bits.slice(r * size, (r + 1) * size));
  }
  return matrix;
}

export function encodeDestMatrix() {
  const matrix = unpackMatrix();
  let dark = 0;
  for (const row of matrix) {
    for (const bit of row) dark += bit;
  }
  return {
    dest: DEST,
    ecc: ECC,
    version: QR_VERSION,
    size: QR_SIZE,
    quiet: QUIET,
    dark,
    matrix,
    generatedBy: "qrcode@1.5.4 errorCorrectionLevel=H",
  };
}

export function inFinder(n, r, c) {
  return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
}

export function isTiming(r, c) {
  return r === 6 || c === 6;
}

export function inAlignment(n, r, c) {
  for (const ar of ALIGN_CENTERS) {
    for (const ac of ALIGN_CENTERS) {
      const finderOverlap = (ar <= 8 && ac <= 8)
        || (ar <= 8 && ac >= n - 9)
        || (ar >= n - 9 && ac <= 8);
      if (finderOverlap) continue;
      if (Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2) return true;
    }
  }
  return false;
}

/** Function-pattern kind for a dark module. */
export function classifyModule(n, r, c) {
  if (inFinder(n, r, c)) return "finder";
  if (inAlignment(n, r, c)) return "alignment";
  if (isTiming(r, c)) return "timing";
  return "data";
}

/** Mini PORTABOOM vocab on data modules - cabinet / boom / head / led. */
export function vocabFor(n, r, c) {
  const kind = classifyModule(n, r, c);
  if (kind === "finder") return "finder";
  if (kind === "timing") return "timing";
  if (kind === "alignment") return "head";
  const bag = ["cabinet", "boom", "head", "led"];
  return bag[(r * 11 + c * 3) % bag.length];
}

/**
 * High-contrast print PNG from the same matrix.
 * Secondary export only - never the live-scan product.
 */
export function renderPrintCanvas(matrix, opts = {}) {
  const modulePx = opts.modulePx || 12;
  const quiet = opts.quiet ?? QUIET;
  const dark = opts.dark || "#111318";
  const light = opts.light || "#ffffff";
  const n = matrix.length;
  const dim = (n + quiet * 2) * modulePx;
  const c = document.createElement("canvas");
  c.width = c.height = dim;
  const ctx = c.getContext("2d");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = dark;
  for (let r = 0; r < n; r += 1) {
    for (let col = 0; col < n; col += 1) {
      if (!matrix[r][col]) continue;
      ctx.fillRect(
        (col + quiet) * modulePx,
        (r + quiet) * modulePx,
        modulePx,
        modulePx
      );
    }
  }
  return c;
}

export function downloadPrintPng(matrix, filename = "portaboom-icqr-print.png") {
  const c = renderPrintCanvas(matrix);
  const a = document.createElement("a");
  a.download = filename;
  a.href = c.toDataURL("image/png");
  a.rel = "noopener";
  a.click();
  return { filename, width: c.width, height: c.height, claimReady: false };
}
