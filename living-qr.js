/**
 * Living QR field - dense 3D cuboid crowd (living5/6 GOOD door).
 *
 * Dark modules are raised sculptures on the XZ plaza so an elevated camera
 * reads a QR field around the hero. Finder / alignment stay dark clusters.
 * Cabinet-vocab modules get a light miniature PORTABOOM dress (orange body,
 * wordmark, face LEDs). Tiny ones do NOT grow traffic lights or boom arms.
 * living8/9 instanced-orange footer strips are rejected.
 */
import { classifyModule, vocabFor, QUIET } from "./qr-encode.js?b=b034e56e";

export const CELL = 0.068;
export const MODULE_FILL = 0.96;

function makeStripeTex(THREE) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 16;
  const ctx = c.getContext("2d");
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i % 2 ? "#c01421" : "#f0f1f3";
    ctx.fillRect(i * 8, 0, 8, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.anisotropy = 4;
  return tex;
}

function makeMiniLogoTex(THREE) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 180;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 256, 180);
  ctx.fillStyle = "#1b1e24";
  ctx.font = "900 54px Arial Black, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PORTA", 128, 50);
  ctx.fillText("BOOM", 128, 104);
  ctx.fillStyle = "#c01421";
  for (let i = 0; i < 4; i += 1) {
    const x = 78 + i * 28;
    ctx.beginPath();
    ctx.moveTo(x, 138);
    ctx.lineTo(x + 14, 138);
    ctx.lineTo(x + 6, 162);
    ctx.lineTo(x - 8, 162);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function powder(THREE, hex) {
  return new THREE.MeshPhysicalMaterial({
    color: hex,
    metalness: 0,
    roughness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.05,
    sheen: 0.22,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0xffffff),
  });
}

function heightFor(vocab) {
  if (vocab === "finder") return 0.34;
  if (vocab === "head") return 0.24;
  if (vocab === "cabinet") return 0.2;
  if (vocab === "boom") return 0.22;
  if (vocab === "led") return 0.16;
  if (vocab === "timing") return 0.1;
  return 0.17;
}

function pickBodyMat(vocab, mats) {
  if (vocab === "boom" || vocab === "timing") return mats.stripeMat;
  if (vocab === "head") return mats.darkMat;
  if (vocab === "led") return mats.navyMat;
  if (vocab === "finder") return mats.darkMat;
  return mats.cabMat;
}

/**
 * Modules live on the XZ plaza. Row 0 is at −Z (far / top of a +Y camera).
 * Dark scan caps sit on +Y for the tap-to-scan top-down pose.
 * @param {typeof import("three")} THREE
 */
export function buildLivingQr(THREE, spec) {
  const matrix = spec.matrix;
  const n = matrix.length;
  const cell = spec.cell ?? CELL;
  const livery = spec.livery;
  const kindcol = spec.kindcol;
  const dest = spec.dest;

  const group = new THREE.Group();
  group.name = "LivingQrTree";

  const capMat = new THREE.MeshBasicMaterial({
    color: spec.capColor ?? 0x111318,
    toneMapped: false,
  });
  // morph1 options (all optional; living10 and other modes pass none of them).
  const skipCell = typeof spec.skipCell === "function" ? spec.skipCell : null;
  const capColorFor = typeof spec.capColorFor === "function" ? spec.capColorFor : null;
  const capMats = new Map();
  const capMatFor = (r, c, kind) => {
    if (!capColorFor) return capMat;
    const hex = capColorFor(r, c, kind);
    if (hex == null) return capMat;
    if (!capMats.has(hex)) {
      capMats.set(hex, new THREE.MeshBasicMaterial({ color: hex, toneMapped: false }));
    }
    return capMats.get(hex);
  };
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.86,
    metalness: 0.02,
    envMapIntensity: 0.2,
  });
  const scanPaperMat = new THREE.MeshBasicMaterial({
    color: spec.scanPaperColor ?? 0xffffff,
    toneMapped: false,
  });
  const cabMat = powder(THREE, livery.Y);
  const darkMat = new THREE.MeshStandardMaterial({
    color: livery.K,
    metalness: 0.14,
    roughness: 0.52,
    envMapIntensity: 0.7,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: livery.S,
    metalness: 0.9,
    roughness: 0.28,
    envMapIntensity: 1.15,
  });
  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x1b2a4a,
    metalness: 0.12,
    roughness: 0.44,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    map: makeStripeTex(THREE),
    roughness: 0.32,
    metalness: 0.12,
    toneMapped: false,
  });
  const ledFaceMat = new THREE.MeshStandardMaterial({
    color: 0x062c10,
    emissive: kindcol.green,
    emissiveIntensity: 1.15,
    roughness: 0.2,
    metalness: 0.04,
    toneMapped: false,
  });
  const ledRedMat = new THREE.MeshStandardMaterial({
    color: 0x3a0000,
    emissive: kindcol.red,
    emissiveIntensity: 0.55,
    roughness: 0.2,
    metalness: 0.04,
    toneMapped: false,
  });
  const logoMat = new THREE.MeshBasicMaterial({
    map: makeMiniLogoTex(THREE),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });

  // morph1 scales the cuboids with its larger unit; other modes keep 1.
  const heightScale = spec.heightScale ?? 1;
  const fill = cell * MODULE_FILL;
  const capFill = cell * (spec.capFill ?? MODULE_FILL);
  const capGeo = new THREE.BoxGeometry(capFill, cell * 0.07, capFill);
  const bodyGeo = new THREE.BoxGeometry(fill * 0.9, 1, fill * 0.9);
  const bandGeo = new THREE.BoxGeometry(fill * 0.92, fill * 0.16, fill * 0.92);
  const rimGeo = new THREE.BoxGeometry(fill * 0.98, cell * 0.04, fill * 0.98);
  const lensGeo = new THREE.CircleGeometry(cell * 0.16, 20);
  const faceLedGeo = new THREE.CircleGeometry(cell * 0.09, 16);
  const logoGeo = new THREE.PlaneGeometry(fill * 0.62, fill * 0.42);
  const lightGeo = new THREE.BoxGeometry(fill, cell * 0.02, fill);

  const origin = (n - 1) / 2;
  const mods = [];
  const kinds = { finder: 0, timing: 0, alignment: 0, data: 0 };
  const vocabs = { finder: 0, timing: 0, cabinet: 0, boom: 0, head: 0, led: 0 };
  const ledMats = [];
  let stripeModules = 0;
  let miniCabinetCount = 0;

  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const x = (c - origin) * cell;
      const z = (r - origin) * cell;
      if (skipCell && skipCell(r, c)) continue;
      if (!matrix[r][c]) {
        const tile = new THREE.Mesh(lightGeo, paperMat);
        tile.position.set(x, cell * 0.01, z);
        tile.name = `QrLight_${r}_${c}`;
        group.add(tile);
        continue;
      }
      const kind = classifyModule(n, r, c);
      const vocab = vocabFor(n, r, c);
      kinds[kind] += 1;
      vocabs[vocab] += 1;

      const g = new THREE.Group();
      g.name = `QrMod_${r}_${c}`;
      const bodyH = heightFor(vocab) * heightScale;
      const striped = vocab === "boom" || vocab === "timing";
      if (striped) stripeModules += 1;

      const body = new THREE.Mesh(bodyGeo, pickBodyMat(vocab, {
        cabMat, darkMat, navyMat, stripeMat,
      }));
      body.name = "QrModBody";
      body.scale.y = bodyH;
      body.position.y = bodyH * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      if (vocab === "cabinet" || vocab === "finder") {
        const band = new THREE.Mesh(bandGeo, navyMat);
        band.name = "QrModBand";
        band.position.y = bodyH * 0.62;
        g.add(band);
      }
      if (vocab === "finder") {
        const rim = new THREE.Mesh(rimGeo, steelMat);
        rim.name = "QrModRim";
        rim.position.y = bodyH + cell * 0.01;
        g.add(rim);
      }

      const cap = new THREE.Mesh(capGeo, capMatFor(r, c, kind));
      cap.name = "QrModTop";
      cap.position.y = bodyH + cell * 0.03;
      g.add(cap);

      // Light mini-PORTABOOM dress on cabinet-vocab only - keep finders dark.
      const miniCabinet = vocab === "cabinet";
      if (miniCabinet) {
        miniCabinetCount += 1;
        const logo = new THREE.Mesh(logoGeo, logoMat);
        logo.name = "MiniLogo";
        logo.position.set(0, bodyH * 0.38, fill * 0.46);
        g.add(logo);
        for (const dx of [-fill * 0.16, fill * 0.16]) {
          const lens = new THREE.Mesh(faceLedGeo, ledFaceMat);
          lens.name = "MiniFaceLed";
          lens.position.set(dx, bodyH * 0.72, fill * 0.47);
          g.add(lens);
        }
        ledMats.push(ledFaceMat);
      } else if (vocab === "finder" || vocab === "led" || vocab === "head") {
        const ledMat = vocab === "head" ? ledFaceMat : ((r + c) % 5 === 0 ? ledRedMat : ledFaceMat);
        const lens = new THREE.Mesh(lensGeo, ledMat);
        lens.name = "QrModDot";
        lens.position.set(0, bodyH * 0.55, fill * 0.46);
        g.add(lens);
        if (vocab === "finder" || vocab === "led") ledMats.push(ledMat);
      }

      g.position.set(x, 0, z);
      g.userData = {
        r,
        c,
        kind,
        vocab,
        baseY: 0,
        bodyH,
        miniCabinet,
        hasTrafficLight: false,
        phase: ((r * 17 + c * 13) % 1000) / 1000 * Math.PI * 2,
      };
      group.add(g);
      mods.push(g);
    }
  }

  const padSize = (n + QUIET * 2) * cell;
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(padSize * 2.35, cell * 0.035, padSize * 2.35),
    powder(THREE, livery.Y)
  );
  apron.name = "LivingQrApron";
  apron.position.y = -cell * 0.09;
  apron.receiveShadow = true;
  group.add(apron);

  const ring = new THREE.Mesh(
    new THREE.BoxGeometry(padSize * 1.18, cell * 0.05, padSize * 1.18),
    navyMat
  );
  ring.name = "LivingQrRing";
  ring.position.y = -cell * 0.05;
  ring.receiveShadow = true;
  group.add(ring);

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(padSize, cell * 0.04, padSize),
    paperMat
  );
  pad.name = "LivingQrPad";
  pad.position.y = -cell * 0.02;
  pad.receiveShadow = true;
  group.add(pad);

  const scanPad = new THREE.Mesh(
    new THREE.PlaneGeometry(padSize, padSize),
    scanPaperMat
  );
  scanPad.name = "LivingQrScanPad";
  scanPad.rotation.x = -Math.PI / 2;
  scanPad.position.y = -cell * 0.01;
  scanPad.visible = false;
  group.add(scanPad);

  group.userData = {
    n,
    cell,
    dest,
    ecc: "H",
    padSize,
    darkCount: mods.length,
    kinds,
    vocabs,
    texturedQuad: false,
    product: "living10-3d-field",
    plane: "xz",
    cameraHint: "elevated-ortho-field / ortho-scan",
    miniHasTrafficLight: false,
    stripeModules,
    miniCabinetCount,
    miniCabinetSource: "cuboid-field",
    miniFieldKind: "dense-cuboid-qr",
    modulePalette: "finder-dark / cabinet-orange / boom-stripe / led-navy",
  };

  return {
    group,
    mods,
    pad,
    apron,
    ring,
    scanPad,
    paperMat,
    scanPaperMat,
    topMat: capMat,
    capMats: [capMat, ...capMats.values()],
    ledMats,
    n,
    cell,
    padSize,
    kinds,
    vocabs,
    darkCount: mods.length,
    miniHasTrafficLight: false,
    stripeModules,
    miniCabinetCount,
    miniCabinetSource: "cuboid-field",
    miniFieldKind: "dense-cuboid-qr",
    modulePalette: "finder-dark / cabinet-orange / boom-stripe / led-navy",
    miniClonedFromTwin: false,
    miniField: null,
    miniInstances: [],
  };
}

/** living8/9 instancing hooks - no-ops so a leftover call cannot flatten the field. */
export function dressMiniCabinetsFromTwin() {
  return "cuboid-field";
}
export function dressLookalikeCabinets() {
  return "cuboid-field";
}
export function instanceCabinetField() {
  return null;
}
export function syncMiniFieldWith() {}
export function setMiniFieldVisible() {}
export function measureTwinCabinet() {
  return null;
}

export function livingExtent(living) {
  return living.padSize;
}
