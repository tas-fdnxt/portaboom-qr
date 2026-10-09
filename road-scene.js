/*
 * PORTABOOM road scene for ?v=road (app-road.js).
 * Everything here is built in code: no models, no image files, no third-party assets.
 * Units are metres; the PB4000 stands on the left shoulder near the origin with its
 * lenses facing +z (the camera). The boom, when down, spans the open lane (x 0.8 to 4).
 * Controlled traffic comes from behind the camera and drives away from it (-z),
 * facing the lenses and the STOP side of the boom: it queues at the stop line on the
 * near side of the boom, goes through on green, past the unit into the work zone and
 * off to the horizon. The far lane is coned off as the work zone (no oncoming traffic).
 *
 * buildRoadScene(THREE, opts) returns { group, setReveal(r), update(dt, sig), snapshot() }.
 * setReveal(r): the world is drawn only inside radius r (metres) round the unit, with a
 * glowing build front, so the road can grow outward from the unit.
 */

const BOOM_Z = 0.2; // the lowered boom crosses the open lane here
const STOP_Z = 1.35; // painted stop line on the approach side of the boom
const STOP_FRONT_Z = STOP_Z + 0.3; // front bumpers stop here, just short of the line
const LANE_X = 2.4; // centre of the open lane (painted lines)
const CAR_X = 1.75; // queue line: left of the lane centre so the waiting car shows beside the unit
const CAR_EASE_X = 0.5; // pulling away, cars ease right to pass the unit with room
const ROAD_X0 = -1.0; // sealed surface, left edge (left shoulder)
const ROAD_X1 = 8.4; // sealed surface, right edge
const Z_NEAR = 30; // road runs from behind the camera ...
const Z_FAR = -230; // ... to beyond the fog

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToVec(THREE, hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Merge non-indexed copies of geometries (position, normal, color only). */
function merge(THREE, list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3);
  const nrm = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, c * 3), o * 3);
    if (g.attributes.normal) nrm.set(g.attributes.normal.array.subarray(0, c * 3), o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array.subarray(0, c * 3), o * 3);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

export function buildRoadScene(THREE, opts) {
  const cfg = opts.cfg || {};
  const C = cfg.colours || {};
  const col = (k, d) => new THREE.Color(C[k] || d);
  const group = new THREE.Group();
  group.name = "RoadScene";
  const R = rng(20261009);
  const aniso = opts.anisotropy || 4;

  /* ---------- reveal: draw only inside radius uR round the unit ---------- */
  const reveal = {
    uR: { value: 0 },
    uRC: { value: new THREE.Vector2(opts.cx || 0, opts.cz || 0) },
    uGlow: { value: hexToVec(THREE, C.build_glow || "#FFB347") },
    uBand: { value: 1 },
  };
  function revealMat(mat, key, emissiveFromColour = 0) {
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, reveal);
      sh.vertexShader = "varying vec3 vRoadW;\n" + sh.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n\t{ vec4 rw = vec4(transformed, 1.0);\n\t#ifdef USE_INSTANCING\n\trw = instanceMatrix * rw;\n\t#endif\n\tvRoadW = (modelMatrix * rw).xyz; }"
      );
      let fs = "varying vec3 vRoadW;\nuniform float uR;\nuniform vec2 uRC;\nuniform vec3 uGlow;\nuniform float uBand;\n" + sh.fragmentShader;
      fs = fs.replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\n\tfloat roadD = length(vRoadW.xz - uRC);\n\tif (roadD > uR) discard;"
      );
      if (emissiveFromColour > 0) {
        fs = fs.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += diffuseColor.rgb * ${emissiveFromColour.toFixed(3)};`);
      }
      fs = fs.replace(
        "#include <dithering_fragment>",
        "#include <dithering_fragment>\n\tgl_FragColor.rgb = mix(gl_FragColor.rgb, uGlow, 0.85 * (1.0 - smoothstep(0.0, uBand, uR - roadD)));"
      );
      sh.fragmentShader = fs;
    };
    mat.customProgramCacheKey = () => "road-" + key;
    return mat;
  }
  const paint = (g, hex) => {
    const c = new THREE.Color(hex);
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(a, 3));
    return g;
  };
  const box = (w, h, d, x, y, z, hex) => paint(new THREE.BoxGeometry(w, h, d).translate(x, y, z), hex);

  /* ---------- procedural textures (canvas, no image files) ---------- */
  function noiseTex(size, base, specks, seed, scale) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    const r = rng(seed);
    for (const [hex, count, rmax, alpha] of specks) {
      g.fillStyle = hex;
      for (let i = 0; i < count; i += 1) {
        g.globalAlpha = alpha * (0.4 + 0.6 * r());
        const s = 0.6 + r() * rmax;
        g.fillRect(r() * size, r() * size, s, s);
      }
    }
    g.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = aniso;
    t.repeat.set(scale[0], scale[1]);
    return t;
  }
  const asphaltTex = noiseTex(256, C.asphalt || "#4A4E55", [["#2E3136", 2600, 1.6, 0.55], ["#70747B", 2200, 1.4, 0.45], ["#8C9097", 500, 1.2, 0.35]], 11, [(ROAD_X1 - ROAD_X0) / 3, (Z_NEAR - Z_FAR) / 3]);
  const grassTex = noiseTex(256, C.grass || "#6E8B4E", [["#56733A", 3000, 2.4, 0.55], ["#8BA562", 2200, 2.0, 0.45], ["#A39B6A", 600, 1.8, 0.35]], 23, [520 / 5, 520 / 5]);

  function canvasSign(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  }
  const signFont = (px) => `900 ${px}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  function roadSign(lines) {
    return canvasSign(512, 384, (g, w, h) => {
      g.fillStyle = "#111";
      g.fillRect(0, 0, w, h);
      g.fillStyle = C.sign || "#FFB81C";
      g.fillRect(14, 14, w - 28, h - 28);
      g.fillStyle = "#111";
      g.textAlign = "center";
      g.textBaseline = "middle";
      const px = lines.length > 2 ? 92 : 110;
      g.font = signFont(px);
      lines.forEach((ln, i) => {
        let size = px;
        while (g.measureText(ln).width > w - 70 && size > 40) { size -= 4; g.font = signFont(size); }
        g.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * px * 1.05);
        g.font = signFont(px);
      });
    });
  }
  function batFace(word, bg, fg) {
    return canvasSign(256, 256, (g, w) => {
      g.translate(w / 2, w / 2);
      const oct = (r) => {
        g.beginPath();
        for (let i = 0; i < 8; i += 1) {
          const a = Math.PI / 8 + (i * Math.PI) / 4;
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath();
      };
      g.fillStyle = "#fff"; oct(128); g.fill();
      g.fillStyle = bg; oct(118); g.fill();
      g.fillStyle = fg;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = signFont(64);
      g.fillText(word, 0, 4);
    });
  }

  /* ---------- shared materials ---------- */
  const M = {
    grass: revealMat(new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, metalness: 0 }), "grass"),
    asphalt: revealMat(new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.95, metalness: 0 }), "asphalt"),
    vc: revealMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0 }), "vc"),
    hivis: revealMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0 }), "hivis", 0.12),
    paint: revealMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.35 }), "paint"),
    glass: revealMat(new THREE.MeshStandardMaterial({ color: 0x16202b, roughness: 0.1, metalness: 0.7 }), "glass"),
    lamp: revealMat(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), "lamp"),
    flat: revealMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, flatShading: true }), "flat"),
    hills: revealMat(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }), "hills"),
    signBack: revealMat(new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.6, metalness: 0.4 }), "signback"),
  };
  // Lines and the beacon are slightly self-lit so they read in shade.
  M.line = revealMat(new THREE.MeshStandardMaterial({ color: C.line || "#F2F1EA", roughness: 0.7 }), "line", 0.15);

  /* ---------- ground: grass, sealed road, kerbs, lines ---------- */
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(520, 520).rotateX(-Math.PI / 2), M.grass);
  grass.position.set(0, 0.008, -80);
  grass.name = "RoadGrass";
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_X1 - ROAD_X0, Z_NEAR - Z_FAR).rotateX(-Math.PI / 2), M.asphalt);
  road.position.set((ROAD_X0 + ROAD_X1) / 2, 0.016, (Z_NEAR + Z_FAR) / 2);
  road.name = "RoadSurface";
  const L = Z_NEAR - Z_FAR;
  const kerbs = new THREE.Mesh(merge(THREE, [
    box(0.26, 0.13, L, ROAD_X0 - 0.13, 0.065, (Z_NEAR + Z_FAR) / 2, C.kerb || "#BDB9B0"),
    box(0.26, 0.13, L, ROAD_X1 + 0.13, 0.065, (Z_NEAR + Z_FAR) / 2, C.kerb || "#BDB9B0"),
  ]), M.vc);
  kerbs.name = "RoadKerbs";
  const lineGeos = [];
  const strip = (x, z0, z1, w) => lineGeos.push(paint(new THREE.PlaneGeometry(w, Math.abs(z1 - z0)).rotateX(-Math.PI / 2).translate(x, 0.024, (z0 + z1) / 2), "#ffffff"));
  strip(0.74, Z_NEAR, Z_FAR, 0.11); // left edge line
  strip(7.46, Z_NEAR, Z_FAR, 0.11); // right edge line
  for (let z = Z_NEAR; z > Z_FAR; z -= 9) strip(4.05, z, z - 3, 0.11); // dashed centre line
  lineGeos.push(paint(new THREE.PlaneGeometry(3.2, 0.32).rotateX(-Math.PI / 2).translate(2.4, 0.024, STOP_Z), "#ffffff")); // stop line
  const lines = new THREE.Mesh(merge(THREE, lineGeos), M.line);
  lines.name = "RoadLines";
  group.add(grass, road, kerbs, lines);

  /* ---------- blob shadows (no shadow maps) ---------- */
  const blobTex = canvasSign(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, "rgba(12,16,22,0.62)");
    gr.addColorStop(0.55, "rgba(12,16,22,0.32)");
    gr.addColorStop(1, "rgba(12,16,22,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  });
  const blobMat = revealMat(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false }), "blob");
  const blobs = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), blobMat, 160);
  blobs.name = "RoadBlobs";
  blobs.renderOrder = 1;
  blobs.frustumCulled = false;
  blobs.count = 0;
  const _bm = new THREE.Matrix4();
  const _bq = new THREE.Quaternion();
  const _bp = new THREE.Vector3();
  const _bs = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);
  function setBlob(i, x, z, sx, sz, rotY = 0) {
    _bq.setFromAxisAngle(_up, rotY);
    _bm.compose(_bp.set(x, 0.03, z), _bq, _bs.set(sx, 1, sz));
    blobs.setMatrixAt(i, _bm);
  }
  function addBlob(x, z, sx, sz, rotY) {
    const i = blobs.count;
    blobs.count += 1;
    setBlob(i, x, z, sx, sz, rotY);
    return i;
  }
  group.add(blobs);

  /* ---------- trees and distant hills ---------- */
  const trees = [];
  for (let i = 0; i < 46; i += 1) {
    const left = i % 3 === 0;
    const z = -6 - R() * 150;
    const x = left ? -(5 + R() * 14) : 10.5 + R() * 22;
    trees.push({ x, z, h: 3.2 + R() * 4.5, w: 1.6 + R() * 1.9, tone: R() });
  }
  const trunkGeo = paint(new THREE.CylinderGeometry(0.12, 0.2, 1, 6).translate(0, 0.5, 0), "#6B5A48");
  const canopyGeo = new THREE.IcosahedronGeometry(1, 0);
  const trunk = new THREE.InstancedMesh(trunkGeo, M.flat, trees.length);
  const canopy = new THREE.InstancedMesh(paint(canopyGeo, "#ffffff"), M.flat, trees.length * 2);
  trunk.name = "RoadTreeTrunks";
  canopy.name = "RoadTreeCanopies";
  const greens = [C.tree_a || "#4F7A3C", C.tree_b || "#3E6533", C.tree_c || "#6F8F5E", "#5C7F45"].map((h) => new THREE.Color(h));
  const _tm = new THREE.Matrix4();
  trees.forEach((t, i) => {
    const th = t.h * 0.55;
    _tm.compose(_bp.set(t.x, 0, t.z), _bq.identity(), _bs.set(1, th, 1));
    trunk.setMatrixAt(i, _tm);
    _bq.setFromAxisAngle(_up, t.tone * 6.28);
    _tm.compose(_bp.set(t.x, th + t.w * 0.55, t.z), _bq, _bs.set(t.w, t.w * 0.85, t.w));
    canopy.setMatrixAt(i * 2, _tm);
    _tm.compose(_bp.set(t.x + t.w * 0.3, th + t.w * 1.15, t.z - t.w * 0.2), _bq, _bs.set(t.w * 0.7, t.w * 0.65, t.w * 0.7));
    canopy.setMatrixAt(i * 2 + 1, _tm);
    const c = greens[Math.floor(t.tone * greens.length) % greens.length];
    canopy.setColorAt(i * 2, c);
    canopy.setColorAt(i * 2 + 1, c.clone().multiplyScalar(1.08));
    addBlob(t.x, t.z, t.w * 2.4, t.w * 2.4);
  });
  group.add(trunk, canopy);
  const hillGeos = [];
  const haze = new THREE.Color(C.hills || "#9DB09A");
  for (let i = 0; i < 7; i += 1) {
    const g = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(55 + R() * 50, 9 + R() * 12, 28).translate(-90 + i * 42 + R() * 15, 0, -215 - R() * 10);
    hillGeos.push(paint(g, "#" + haze.clone().offsetHSL(0, 0, (R() - 0.5) * 0.06).getHexString()));
  }
  const hills = new THREE.Mesh(merge(THREE, hillGeos), M.hills);
  hills.name = "RoadHills";
  hills.renderOrder = -4;
  group.add(hills);

  /* ---------- cones: one instanced mesh ---------- */
  const coneGeo = merge(THREE, [
    box(0.38, 0.035, 0.38, 0, 0.0175, 0, "#1d1f22"),
    paint(new THREE.CylinderGeometry(0.035, 0.155, 0.68, 12).translate(0, 0.375, 0), C.cone || "#FF5B0A"),
    paint(new THREE.CylinderGeometry(0.085, 0.108, 0.13, 12).translate(0, 0.43, 0), "#F4F4F0"),
  ]);
  const conePts = [];
  for (let k = 0; k < 7; k += 1) conePts.push([7.2 - (2.9 * k) / 7, 22 - 2.6 * k]);
  for (let z = 3.8; z > -42; z -= 3) conePts.push([4.3, z]);
  for (let k = 1; k <= 5; k += 1) conePts.push([4.3 + (2.9 * k) / 5, -42 - 2.4 * k]);
  conePts.push([3.95, 0.8]);
  const cones = new THREE.InstancedMesh(coneGeo, M.hivis, conePts.length);
  cones.name = "RoadCones";
  conePts.forEach(([x, z], i) => {
    _tm.compose(_bp.set(x, 0.016, z), _bq.identity(), _bs.set(1, 1, 1));
    cones.setMatrixAt(i, _tm);
    addBlob(x + 0.05, z, 0.55, 0.55);
  });
  group.add(cones);

  /* ---------- A-frame signs ---------- */
  function aFrame(x, z, rotY, lines) {
    const g = new THREE.Group();
    const legs = [];
    for (const s of [-1, 1]) {
      // front pair and back pair of legs, leaning together at the top
      for (const f of [1, -1]) {
        const leg = new THREE.BoxGeometry(0.05, 1.55, 0.05);
        leg.rotateX(f * 0.2).translate(s * 0.58, 0.76, -f * 0.15 + 0.0);
        legs.push(paint(leg, "#E9EBEE"));
      }
    }
    legs.push(box(1.2, 0.04, 0.04, 0, 0.3, 0.22, "#E9EBEE"));
    g.add(new THREE.Mesh(merge(THREE, legs), M.vc));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), revealMat(new THREE.MeshStandardMaterial({ map: roadSign(lines), roughness: 0.55 }), "sign"));
    face.position.set(0, 1.0, 0.105);
    face.rotation.x = -0.2;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), M.signBack);
    back.position.set(0, 1.0, 0.095);
    back.rotation.set(-0.2, Math.PI, 0);
    g.add(face, back);
    g.position.set(x, 0.016, z);
    g.rotation.y = rotY;
    g.name = "RoadSign";
    addBlob(x, z, 1.5, 0.7, rotY);
    group.add(g);
    return g;
  }
  aFrame(-0.35, -16, 0.12, ["WORKERS", "AHEAD"]);
  aFrame(9.1, -40, -0.1, ["END", "ROADWORK"]);

  /* ---------- cars (extruded side profiles, vertex coloured) ---------- */
  const TYPES = {
    sedan: {
      L: 4.7, W: 1.82, r: 0.33,
      body: [[-2.35, 0.3], [2.28, 0.3], [2.36, 0.55], [2.3, 0.78], [1.15, 0.95], [-1.95, 0.98], [-2.35, 0.86]],
      glass: [[1.12, 0.95], [0.22, 1.4], [-1.08, 1.4], [-1.8, 0.98]],
      roof: [[0.25, 1.38], [-1.05, 1.38], [-1.02, 1.45], [0.2, 1.45]],
    },
    suv: {
      L: 4.8, W: 1.9, r: 0.38,
      body: [[-2.4, 0.38], [2.33, 0.38], [2.42, 0.65], [2.35, 1.0], [1.45, 1.1], [-2.4, 1.12]],
      glass: [[1.42, 1.1], [0.7, 1.66], [-2.28, 1.68], [-2.36, 1.12]],
      roof: [[0.72, 1.64], [-2.3, 1.66], [-2.3, 1.75], [0.68, 1.73]],
    },
    ute: {
      L: 5.3, W: 1.88, r: 0.38, tray: true,
      body: [[-2.65, 0.4], [2.58, 0.4], [2.67, 0.68], [2.6, 1.02], [1.75, 1.12], [-2.65, 1.12]],
      glass: [[1.72, 1.12], [1.05, 1.7], [-0.32, 1.72], [-0.42, 1.12]],
      roof: [[1.05, 1.68], [-0.38, 1.7], [-0.38, 1.78], [1.0, 1.76]],
    },
  };
  function profile(pts, width, hex) {
    const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, steps: 1 });
    g.translate(0, 0, -width / 2);
    g.rotateY(-Math.PI / 2); // shape x (length) -> world z, extrude -> world x
    g.deleteAttribute("uv");
    g.computeVertexNormals();
    return paint(g, hex);
  }
  function carGeometry(type, hex, work = false) {
    const T = TYPES[type];
    const { L: len, W, r } = T;
    const paintParts = [profile(T.body, W, hex), profile(T.roof, W - 0.18, hex)];
    const dark = "#15171a";
    // front: grille, bumper, plate; rear bumper
    paintParts.push(box(W * 0.62, 0.2, 0.06, 0, T.body[2][1] + 0.05, len / 2 + 0.04, dark));
    paintParts.push(box(W + 0.02, 0.16, 0.12, 0, T.body[0][1] + 0.08, len / 2 - 0.02, "#2a2d31"));
    paintParts.push(box(0.5, 0.12, 0.02, 0, T.body[0][1] + 0.12, len / 2 + 0.06, "#f2f2ee"));
    paintParts.push(box(W + 0.02, 0.16, 0.12, 0, T.body[0][1] + 0.08, -len / 2 + 0.02, "#2a2d31"));
    // wheels: tyres + rims
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x = sx * (W / 2 - 0.09);
        const z = sz * (len / 2 - 0.85);
        paintParts.push(paint(new THREE.CylinderGeometry(r, r, 0.25, 14).rotateZ(Math.PI / 2).translate(x, r, z), "#151617"));
        paintParts.push(paint(new THREE.CylinderGeometry(r * 0.58, r * 0.58, 0.26, 10).rotateZ(Math.PI / 2).translate(x, r, z), "#9CA2A8"));
      }
    }
    if (T.tray) {
      const y0 = T.body[5][1];
      paintParts.push(box(0.06, 0.38, 2.2, W / 2 - 0.03, y0 + 0.19, -1.55, hex));
      paintParts.push(box(0.06, 0.38, 2.2, -W / 2 + 0.03, y0 + 0.19, -1.55, hex));
      paintParts.push(box(W, 0.38, 0.06, 0, y0 + 0.19, -2.62, hex));
      paintParts.push(box(W, 0.62, 0.05, 0, y0 + 0.31, -0.47, "#202226")); // headboard
      if (work) {
        // light bar and orange chevrons on the tailgate
        paintParts.push(box(1.1, 0.08, 0.22, 0, 1.82, 0.35, "#202226"));
        paintParts.push(box(W * 0.9, 0.18, 0.02, 0, y0 + 0.2, -2.66, "#FF6A00"));
      }
    }
    const lampParts = [];
    for (const sx of [-1, 1]) {
      lampParts.push(box(0.34, 0.11, 0.04, sx * (W / 2 - 0.26), T.body[2][1] + 0.08, len / 2 + 0.05, "#FFF4D6"));
      lampParts.push(box(0.26, 0.12, 0.04, sx * (W / 2 - 0.2), T.body[0][1] + 0.38, -len / 2 - 0.02, "#C8141A"));
    }
    let beacon = null;
    if (work) {
      beacon = paint(new THREE.CylinderGeometry(0.09, 0.1, 0.13, 10).translate(0, 1.93, 0.35), "#FFA21A");
    }
    // Where this car's front bumper stops so its glass and roof stay under the camera's view
    // of the lowered boom and its STOP disc (camera eye 2.18 m, boom 1.09 m, 7.6 m apart).
    let stopZ = STOP_FRONT_Z;
    for (const [x, y] of T.glass.concat(T.roof)) stopZ = Math.max(stopZ, BOOM_Z + (y + 0.1 - 1.09) * (7.6 / 1.09) - (len / 2 - x));
    return { paint: merge(THREE, paintParts), glass: profile(T.glass, W - 0.12, "#ffffff"), lamp: merge(THREE, lampParts), beacon, len, W, stopZ };
  }
  const carCount = Math.max(0, Math.min(5, Math.round(cfg.cars ?? 4)));
  const kinds = ["sedan", "suv", "ute", "sedan", "suv"];
  const paints = cfg.car_colours || ["#C9CED6", "#1F3D6E", "#F4F5F2", "#8C1D24", "#2C3036"];
  const cars = [];
  // c.z is the front bumper; cars face and drive toward -z (away from the camera).
  let zFront = STOP_FRONT_Z;
  for (let i = 0; i < carCount; i += 1) {
    const g = carGeometry(kinds[i % kinds.length], paints[i % paints.length]);
    const obj = new THREE.Group();
    obj.add(new THREE.Mesh(g.paint, M.paint), new THREE.Mesh(g.glass, M.glass), new THREE.Mesh(g.lamp, M.lamp));
    obj.rotation.y = Math.PI;
    obj.name = `RoadCar${i}`;
    const x = CAR_X + (R() - 0.5) * 0.16;
    const car = { obj, len: g.len, W: g.W, stopZ: g.stopZ, z: Math.max(zFront, g.stopZ), v: 0, committed: false, blob: addBlob(x, zFront + g.len / 2, g.W * 1.25, g.len * 1.1), x };
    obj.position.set(car.x, 0.016, car.z + car.len / 2);
    cars.push(car);
    group.add(obj);
    zFront = car.z + g.len + 1.9 + R() * 0.6;
  }
  // Parked work ute in the closed lane, beacon turning.
  const wu = carGeometry("ute", C.work_ute || "#F2F3F0", true);
  const workUte = new THREE.Group();
  workUte.add(new THREE.Mesh(wu.paint, M.paint), new THREE.Mesh(wu.glass, M.glass), new THREE.Mesh(wu.lamp, M.lamp));
  const beaconMat = revealMat(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), "beacon");
  const beacon = new THREE.Mesh(wu.beacon, beaconMat);
  workUte.add(beacon);
  workUte.position.set(5.85, 0.016, -36);
  workUte.rotation.y = 0.04;
  workUte.name = "RoadWorkUte";
  addBlob(5.85, -36 - 2.65, wu.W * 1.25, wu.len * 1.1, 0.04);
  group.add(workUte);

  /* ---------- traffic controllers (low poly, hi-vis, stop/slow bat) ---------- */
  const HIVIS = C.hivis || "#FF6A00";
  const SILVER = "#E6EAEE";
  const NAVY = "#24324F";
  const SKIN = "#C68B66";
  const stopTex = batFace("STOP", "#C8102E", "#ffffff");
  const slowTex = batFace("SLOW", "#FFB81C", "#111111");
  const stopMat = revealMat(new THREE.MeshStandardMaterial({ map: stopTex, roughness: 0.5, side: THREE.FrontSide }), "bat-stop", 0.25);
  const slowMat = revealMat(new THREE.MeshStandardMaterial({ map: slowTex, roughness: 0.5, side: THREE.FrontSide }), "bat-slow", 0.25);
  function armGeo() {
    return merge(THREE, [
      box(0.11, 0.6, 0.12, 0, -0.3, 0, HIVIS),
      box(0.115, 0.05, 0.125, 0, -0.42, 0, SILVER),
      paint(new THREE.SphereGeometry(0.055, 8, 6).translate(0, -0.64, 0), SKIN),
    ]);
  }
  const bodyGeo = merge(THREE, [
    box(0.13, 0.1, 0.28, -0.1, 0.05, 0.03, "#2a2420"), box(0.13, 0.1, 0.28, 0.1, 0.05, 0.03, "#2a2420"),
    box(0.15, 0.78, 0.17, -0.1, 0.49, 0, NAVY), box(0.15, 0.78, 0.17, 0.1, 0.49, 0, NAVY),
    box(0.16, 0.05, 0.18, -0.1, 0.3, 0, SILVER), box(0.16, 0.05, 0.18, 0.1, 0.3, 0, SILVER),
    box(0.36, 0.2, 0.2, 0, 0.92, 0, NAVY),
    box(0.42, 0.58, 0.24, 0, 1.28, 0, HIVIS),
    box(0.43, 0.05, 0.25, 0, 1.11, 0, SILVER), box(0.43, 0.05, 0.25, 0, 1.24, 0, SILVER),
    box(0.05, 0.58, 0.25, -0.11, 1.28, 0, SILVER), box(0.05, 0.58, 0.25, 0.11, 1.28, 0, SILVER),
    box(0.1, 0.08, 0.1, 0, 1.6, 0, SKIN),
    paint(new THREE.SphereGeometry(0.11, 10, 8).translate(0, 1.72, 0), SKIN),
    paint(new THREE.SphereGeometry(0.128, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.76, 0), "#FAFAF7"),
    paint(new THREE.CylinderGeometry(0.155, 0.155, 0.018, 14).translate(0, 1.765, 0.02), "#FAFAF7"),
  ]);
  const poleGeo = paint(new THREE.CylinderGeometry(0.017, 0.017, 1.86, 6).translate(0, 0.93, 0), "#8E959C");
  const discGeo = new THREE.CircleGeometry(0.23, 8);
  const SPOTS = [
    { x: 5.15, z: -8.6, face: [-0.75, 0.66], wave: true },
    { x: 6.45, z: -19, face: [-0.45, 0.89], wave: false },
    { x: 6.0, z: -30.5, face: [-0.1, 1], wave: true },
  ];
  const workerCount = Math.max(0, Math.min(3, Math.round(cfg.workers ?? 3)));
  const workers = [];
  for (let i = 0; i < workerCount; i += 1) {
    const s = SPOTS[i];
    const w = new THREE.Group();
    w.name = `RoadTrafficController${i}`;
    w.add(new THREE.Mesh(bodyGeo, M.hivis));
    const armL = new THREE.Group();
    armL.position.set(-0.27, 1.52, 0);
    armL.add(new THREE.Mesh(armGeo(), M.hivis));
    const armR = new THREE.Group();
    armR.position.set(0.27, 1.52, 0);
    armR.add(new THREE.Mesh(armGeo(), M.hivis));
    armR.rotation.z = 0.12;
    armR.rotation.x = -0.25;
    const bat = new THREE.Group();
    bat.position.set(0.36, 0.0, 0.16);
    bat.add(new THREE.Mesh(poleGeo, M.vc));
    const front = new THREE.Mesh(discGeo, stopMat);
    front.position.set(0, 1.98, 0.012);
    const back = new THREE.Mesh(discGeo, slowMat);
    back.position.set(0, 1.98, -0.012);
    back.rotation.y = Math.PI;
    bat.add(front, back);
    w.add(armL, armR, bat);
    w.position.set(s.x, 0.016, s.z);
    w.rotation.y = Math.atan2(s.face[0], s.face[1]);
    addBlob(s.x, s.z, 0.75, 0.75);
    group.add(w);
    workers.push({ obj: w, armL, armR, bat, spot: s, flip: 0, phase: R() * 6.28 });
  }

  blobs.instanceMatrix.needsUpdate = true;

  /* ---------- traffic: simple car following (IDM) with a stop line ---------- */
  const V0 = cfg.car_speed ?? 9; // free speed m/s
  const A = cfg.car_accel ?? 2.4;
  const B = 3.0;
  const S0 = 1.7;
  const TH = 0.9;
  let greenAt = -1;
  let clock = 0;
  let lastAspect = "red";
  function idm(v, gap, dv, s0) {
    const ss = s0 + Math.max(0, v * TH + (v * dv) / (2 * Math.sqrt(A * B)));
    return A * (1 - Math.pow(v / V0, 4) - Math.pow(ss / Math.max(0.05, gap), 2));
  }
  function update(dt, sig) {
    dt = Math.min(0.05, Math.max(0, dt));
    clock += dt;
    const aspect = sig.aspect || "red";
    if (aspect === "green" && lastAspect !== "green") {
      greenAt = clock;
      for (const c of cars) c.committed = false;
    }
    lastAspect = aspect;
    const go = aspect === "green" && clock - greenAt > 0.35 && (sig.boomPct ?? 100) > 92;
    // Order cars front to back (smallest z first: furthest along).
    const order = cars.slice().sort((a, b) => a.z - b.z);
    for (let k = 0; k < order.length; k += 1) {
      const c = order[k];
      const ahead = k > 0 ? order[k - 1] : null;
      let acc = A * (1 - Math.pow(c.v / V0, 4));
      if (ahead) acc = Math.min(acc, idm(c.v, c.z - (ahead.z + ahead.len), c.v - ahead.v, S0));
      const toLine = c.z - c.stopZ; // distance left to this car's stopping point
      if (!go && !c.committed && toLine > -0.2) {
        // Amber or red: stop at the line unless too close to stop comfortably.
        const need = (c.v * c.v) / (2 * 4.5);
        if (aspect !== "red" && c.v > 1.5 && need > toLine - 0.2) c.committed = true;
        else acc = Math.min(acc, idm(c.v, Math.max(0.02, toLine), c.v, 0.05));
      }
      c.v = Math.max(0, c.v + acc * dt);
      if (toLine > 0 && !go && !c.committed) c.v = Math.min(c.v, Math.max(0, toLine) * 4);
      c.z -= c.v * dt;
      if (c.z < -160) {
        // Gone into the haze: rejoin behind the camera and roll up to the queue.
        const last = order[order.length - 1];
        c.z = Math.max(last.z + last.len + 26, 40);
        c.v = V0 * 0.8;
        c.committed = false;
        order.push(order.splice(k, 1)[0]);
        k -= 1;
      }
    }
    for (const c of cars) {
      const u = Math.min(1, Math.max(0, (STOP_FRONT_Z - c.z) / 3.5));
      const x = c.x + CAR_EASE_X * u * u * (3 - 2 * u);
      const slope = u > 0 && u < 1 ? (CAR_EASE_X * 6 * u * (1 - u)) / 3.5 : 0;
      c.obj.position.set(x, 0.016 + Math.sin(clock * 9 + c.x) * 0.004 * Math.min(1, c.v / 4), c.z + c.len / 2);
      c.obj.rotation.y = Math.PI - Math.atan(slope);
      setBlob(c.blob, x, c.z + c.len / 2, c.W * 1.25, c.len * 1.1);
    }
    blobs.instanceMatrix.needsUpdate = true;
    // Traffic controllers: bat shows SLOW on green, STOP otherwise; the near one waves traffic through.
    for (const w of workers) {
      const want = aspect === "green" ? 1 : 0;
      w.flip += Math.sign(want - w.flip) * Math.min(Math.abs(want - w.flip), dt / 0.45);
      w.bat.rotation.y = Math.PI * (w.flip * w.flip * (3 - 2 * w.flip));
      const t = clock + w.phase;
      const waving = w.spot.wave && aspect === "green";
      const lift = waving ? 2.3 + Math.sin(t * 5.2) * 0.45 : 0.08 + Math.sin(t * 1.3) * 0.03;
      w.armL.rotation.z += (-lift - w.armL.rotation.z) * Math.min(1, dt * 6);
    }
    // Work ute beacon pulses amber.
    beaconMat.color.setScalar(0.45 + 0.55 * Math.max(0, Math.sin(clock * 7.5)));
  }

  function setReveal(r) {
    reveal.uR.value = r;
    reveal.uBand.value = 0.8 + r * 0.035;
  }
  function snapshot() {
    return {
      reveal: +reveal.uR.value.toFixed(2),
      cars: cars.map((c) => ({ z: +c.z.toFixed(2), v: +c.v.toFixed(2), committed: c.committed })),
      workers: workers.length,
      stopZ: STOP_Z,
      boomZ: BOOM_Z,
    };
  }
  return { group, setReveal, update, snapshot, cars, workers, materials: M };
}
