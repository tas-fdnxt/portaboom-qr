/**
 * morph2 QR art: the PORTABOOM unit lying on its back, drawn in QR modules.
 *
 * The art grid (morph2-art-grid.js) is generated
 * from an orthographic top-down render of the real unit model (pb4000_named.glb,
 * lying on its back, boom down), quantised to the module grid: signal housing
 * with its three lenses, mast into the side bracket, orange cabinet with the
 * flasher pair and a door decal hint, wheels and outrigger legs, and the
 * red/white boom with its STOP disc. It sits on the QR grid with a one-module
 * light halo. Data modules under the art and the halo are replaced (ECC H
 * recovers them); finder, timing, alignment, format and version modules always
 * keep their QR values.
 *
 * Shared by scripts/make-morph2-qr.mjs (still) and app.js (frame 0), so both
 * draw the same cells in the same colours.
 */
import qrcode from "./qr-vendor.js?b=b034e56e";
import { MORPH2_GRID } from "./morph2-art-grid.js?b=b034e56e";

export const MORPH2_VERSION = MORPH2_GRID.version;
export const MORPH2_ECC = "H";

/** Cell roles. NONE = plain QR data. */
export const ART = Object.freeze({
  NONE: 0, HALO: 1, NAVY: 2, RED: 3, AMBER: 4, GREEN: 5, WHITE: 6, LAMP: 7,
  HOUSING: 8, BOOMRED: 9, STOP: 10, ORANGE: 11, DARK: 12, DECAL: 13,
});
/** Print colours per role (HALO is the paper colour). */
export const ART_COLORS = Object.freeze({
  2: "#1B2A4A", // navy steel (mast, legs), same as data modules
  3: "#D0192B", // red lens
  4: "#F5A300", // amber lens
  5: "#13924A", // green lens
  6: "#FFFFFF", // boom white
  7: "#C8102E",
  8: "#15171C", // signal housing
  9: "#D0192B", // boom red
  10: "#C8102E", // STOP disc
  11: "#F28C28", // cabinet orange
  12: "#2A2D33", // wheels, feet, flashers
  13: "#FFFFFF", // door decal
});
const LIGHT_ROLES = new Set([1, 4, 6, 11, 13]);
/** Roles the decoder should see as dark modules. */
export const ART_DARK = (role) => role >= 2 && !LIGHT_ROLES.has(role);
const CHAR_ROLE = { H: 8, R: 3, A: 4, G: 5, N: 2, W: 6, r: 9, S: 10, O: 11, K: 12, F: 12, D: 13 };

const ALIGN = {
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50], 11: [6, 30, 54],
  12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66], 15: [6, 26, 48, 70], 16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
};

/** Function-pattern cells (finders + separators + format, timing, alignment, version). */
export function functionCells(version, keepAlign = null) {
  const n = version * 4 + 17;
  const f = new Uint8Array(n * n);
  const set = (r, c) => { if (r >= 0 && c >= 0 && r < n && c < n) f[r * n + c] = 1; };
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) { set(r, c); set(r, n - 1 - c); set(n - 1 - r, c); }
  for (let i = 0; i < n; i += 1) { set(6, i); set(i, 6); }
  const pos = ALIGN[version] || [];
  for (const ar of pos) {
    for (const ac of pos) {
      if ((ar < 9 && ac < 9) || (ar < 9 && ac > n - 10) || (ar > n - 10 && ac < 9)) continue;
      // Interior alignment patterns may sit under the art (grid.hideAlign); the
      // bottom-right one, which decoders use for sampling, always stays.
      const last = pos[pos.length - 1];
      if (keepAlign && !(ar === last && ac === last) && keepAlign(ar, ac)) continue;
      for (let dr = -2; dr <= 2; dr += 1) for (let dc = -2; dc <= 2; dc += 1) set(ar + dr, ac + dc);
    }
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) for (let j = 0; j < 3; j += 1) { set(i, n - 11 + j); set(n - 11 + j, i); }
  }
  return f;
}

/** Art roles on an n x n grid: the art rows placed at (row0, col0), plus a one-module halo. */
export function artRoles(grid = MORPH2_GRID) {
  const { version, row0, col0, rows } = grid;
  const n = version * 4 + 17;
  const role = new Uint8Array(n * n);
  rows.forEach((line, dr) => {
    [...line].forEach((ch, dc) => {
      const r = row0 + dr, c = col0 + dc;
      if (CHAR_ROLE[ch] && r >= 0 && c >= 0 && r < n && c < n) role[r * n + c] = CHAR_ROLE[ch];
    });
  });
  const haloOf = grid.haloChars ? new Set([...grid.haloChars].map((ch) => CHAR_ROLE[ch])) : null;
  const out = role.slice();
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (role[r * n + c]) continue;
      let near = false;
      for (let dr = -1; dr <= 1 && !near; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < n && cc < n && role[rr * n + cc] && (!haloOf || haloOf.has(role[rr * n + cc]))) { near = true; break; }
        }
      }
      if (near) out[r * n + c] = ART.HALO;
    }
  }
  return out;
}

export { MORPH2_GRID };
/** Placement summary (version, origin, mask), kept for callers of the older API. */
export const MORPH2_PLACE = Object.freeze({
  version: MORPH2_GRID.version, row0: MORPH2_GRID.row0, col0: MORPH2_GRID.col0, mask: MORPH2_GRID.mask,
  rowsN: MORPH2_GRID.rows.length, colsN: MORPH2_GRID.rows[0].length,
});

function rawMatrix(url, version, mask) {
  const q = qrcode(version, MORPH2_ECC);
  q.addData(String(url), "Byte");
  q.makeWithMask(mask);
  const n = q.getModuleCount();
  const m = [];
  for (let r = 0; r < n; r += 1) {
    const row = [];
    for (let c = 0; c < n; c += 1) row.push(q.isDark(r, c) ? 1 : 0);
    m.push(row);
  }
  return m;
}

/**
 * Tip QR with the art: picks the mask pattern that agrees most with the art,
 * returns the raw matrix, the art roles (function cells cleared) and the
 * drawn grid (per cell: null = paper, or a colour hex).
 */
export function encodeMorph2(url, grid = MORPH2_GRID) {
  const { version } = grid;
  const place = { version, row0: grid.row0, col0: grid.col0, mask: grid.mask, rowsN: grid.rows.length, colsN: grid.rows[0].length };
  const n = version * 4 + 17;
  const roles = artRoles(grid);
  // An interior alignment pattern is hidden only when the art covers part of it.
  const fn = functionCells(version, grid.hideAlign ? (ar, ac) => {
    for (let dr = -2; dr <= 2; dr += 1) for (let dc = -2; dc <= 2; dc += 1) if (roles[(ar + dr) * n + ac + dc] > 1) return true;
    return false;
  } : null);
  for (let i = 0; i < n * n; i += 1) if (fn[i]) roles[i] = ART.NONE;
  let best = null;
  for (let mask = 0; mask < 8; mask += 1) {
    if (place.mask != null && mask !== place.mask) continue;
    const m = rawMatrix(url, version, mask);
    let miss = 0;
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        const ro = roles[r * n + c];
        if (ro && (ART_DARK(ro) ? 1 : 0) !== m[r][c]) miss += 1;
      }
    }
    if (!best || miss < best.miss) best = { mask, miss, matrix: m };
  }
  const colors = [];
  let artCells = 0;
  for (let r = 0; r < n; r += 1) {
    const row = [];
    for (let c = 0; c < n; c += 1) {
      const ro = roles[r * n + c];
      if (ro) artCells += 1;
      if (ro === ART.HALO) row.push(null);
      else if (ro) row.push(ART_COLORS[ro]);
      else row.push(best.matrix[r][c] ? ART_COLORS[2] : null);
    }
    colors.push(row);
  }
  // Art letter per cell ('' for data, halo and function cells), for mapping art to unit parts.
  const chars = new Array(n * n).fill("");
  grid.rows.forEach((line, dr) => {
    [...line].forEach((ch, dc) => {
      const r = grid.row0 + dr, c = grid.col0 + dc;
      if (ch !== "." && r >= 0 && c >= 0 && r < n && c < n && roles[r * n + c] > 1) chars[r * n + c] = ch;
    });
  });
  return {
    chars, url: String(url), ecc: MORPH2_ECC, version, size: n, mask: best.mask, artMismatch: best.miss,
    artCells, artFrac: artCells / (n * n), matrix: best.matrix, roles, colors, place,
  };
}
