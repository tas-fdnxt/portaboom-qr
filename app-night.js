import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DEST, ECC, encodeDestMatrix, downloadPrintPng } from "./qr-encode.js?b=b034e56e";
import { buildLivingQr } from "./living-qr.js?b=b034e56e";
import { encodeTipMatrix, unpackMask, MORPH_PALETTE } from "./qr-url.js?b=b034e56e";
import { MORPH_MASK } from "./morph-mask.js?b=b034e56e";
import { encodeMorph2, ART } from "./morph2-art.js?b=b034e56e";
import {
  SHOWTIME_DEST_DEFAULT,
  parseHttpUrl,
  resolveLeaveDest,
} from "./dest-config.mjs?b=b034e56e";

/* ------------------------------------------------------------------
 * app-night.js: the ?v=night cut. It is app3.js (morph3) plus the night
 * look; all night code is marked "night".
 *
 * Editable settings. Everything a person may want to tune lives in
 * morph-config.json next to this file (see EDITING.md); editor.html edits
 * it live. Order of precedence: built-in defaults < morph-config.json <
 * ?config=<url> < this browser's saved override (localStorage).
 * ------------------------------------------------------------------ */
const MORPH_DEFAULTS = {"_about":"PORTABOOM morph3 settings. Times are in seconds. Edit with editor.html or by hand, then commit this file. See EDITING.md.","dest":"https://www.trafficaccess.com.au/portaboom-product/portaboom-pb4000-series/","scan":{"auto_start_delay_s":0.8,"duration_s":1.8,"passes":2},"fill":{"duration_s":0.9,"pop_s":0.4},"lift":{"start_s":0.12,"spread_s":0.55,"duration_s":0.75,"height_cells":1.2,"tilt":0.55,"print_fade_s":0.75},"flight":{"boom":{"start_s":0.3,"stagger_dist":0.35,"stagger_height":0.95,"jitter_s":0.04,"duration_s":1.25,"duration_jitter_s":0.1,"arc":0.18,"spin":0.25},"head":{"start_s":0.45,"stagger_dist":0.1,"stagger_height":1.45,"stagger_across":0.2,"jitter_s":0.02,"duration_s":0.85,"duration_jitter_s":0.06,"arc":0.12,"spin":0.15},"body":{"start_s":0.22,"stagger_dist":0.5,"stagger_height":0.85,"jitter_s":0.08,"duration_s":1.35,"duration_jitter_s":0.25,"arc":0.35,"spin":0.8},"recolour_from":0.45,"recolour_over":0.35},"assembly":{"voxel_count":1100,"floor_ripple":true,"ripple_speed_cells":26,"ripple_height_cells":0.35},"resolve":{"style":"shimmer","start_s":3.3,"duration_s":1.3,"shimmer_color":"#FFD27A","shimmer_band":0.2,"flip_deg":90,"sweep_ring":0.85,"lens_flash":1.0,"push_in":0.05},"morph_end_s":4.8,"camera":{"tilt_start_s":0.05,"tilt_end_s":3.55,"tilt_curve":0.72,"fov_portrait":50,"fov_wide":34,"unit_height":0.49,"unit_height_boom_down":0.415,"lens_y":0.44,"left_margin":0.015,"pitch_deg":0,"glide_yaw_deg":18,"glide_start_s":3.6,"glide_s":2.6,"glide_hold_s":0.3},"lights":{"green_s":0.5,"amber_s":1.0,"red_hold_s":0.5},"boom":{"lower_s":1.0,"leave_after_s":0.4},"colours":{"lens_red":"#FF3A2E","lens_amber":"#FFAA1C","lens_green":"#2CCB68","boom_red":"#C8102E","boom_white":"#F4F4F2","floor":"#34466B","sky_top":"#D7E0EA","horizon":"#F1ECE3","ground":"#E3DACB"},"road":{"_about":"Only used by ?v=road: the worksite road scene that builds outward from the unit. Traffic queues on the camera side of the boom; the boom lowers, waits boom_down_wait_s, rises (boom.lower_s each way), then green, amber, red, boom down. cars 0-5, workers 0-3, speeds in m/s.","build_start_s":2.9,"build_s":3.4,"build_radius":280,"cars":4,"car_speed":9,"car_accel":2.4,"workers":3,"fog_near":16,"fog_far":125,"green_s":2.4,"amber_s":1.0,"red_hold_s":0.6,"leave_after_s":1.6,"boom_down_wait_s":0.6,"colours":{"sky_top":"#8FB4DA","horizon":"#E4EAEE","asphalt":"#4A4E55","grass":"#6E8B4E","line":"#F2F1EA","kerb":"#BDB9B0","cone":"#FF5B0A","sign":"#FFB81C","hivis":"#FF6A00","tree_a":"#4F7A3C","tree_b":"#3E6533","tree_c":"#6F8F5E","hills":"#9DB09A","work_ute":"#F2F3F0","build_glow":"#FFB347"}},"minions":{"_about":"Only used by ?v=minions: little PORTABOOMs pop up out of the QR modules, bob, run their own lights and boom out of sync, then line up in rows behind the hero and follow its lights and boom. count 30-80, size is the mini's height as a share of the hero, times in seconds after the QR fills the screen.","count":60,"spacing_cells":10,"size":0.27,"pop_start_s":0.1,"pop_spread_s":1.2,"pop_s":0.45,"stand_up_s":1.0,"stand_up_spread_s":0.6,"bob":0.1,"bob_hz":2.2,"cycle_s":2.6,"arm_length":0.85,"duck_s":1.6,"line_up_s":3.7,"line_up_duration_s":1.2,"rows":4,"row_gap":0.36,"col_gap":0.3},"minions2":{"_about":"Only used by ?v=minions2: the minions crowd covering the whole visible floor, horizon to the bottom edge. Anything not set here comes from the minions section. ring and hero_clear keep the crowd off the hero (ring in hero heights, hero_clear in screen units), ripple_s is how long the hero's lights and boom take to ripple out to the furthest mini.","count":220,"size":0.2,"pop_spread_s":1.6,"ring":0.55,"hero_clear":0.08,"depth_grow":0.85,"max_depth":60,"reach_cells":60,"ripple_s":0.8,"bob":0.08},"domino":{"_about":"Only used by ?v=domino: the QR topples like dominoes from the corners to the middle, the fallen modules along an aisle flip up as little PORTABOOMs in straight rows either side, the camera comes down into the aisle and travels along it while each row raises its booms, then the hero's boom drop ripples down the rows. Times are seconds after the QR fills the screen; sizes are in hero heights.","delay_s":1.7,"topple_start_s":0.05,"topple_spread_s":1.25,"topple_s":0.42,"overshoot":0.14,"size":0.14,"aisle_width":0.6,"lines_per_side":3,"line_gap":0.13,"row_gap":0.16,"first_row":0.45,"max_rows":40,"flip_s":0.5,"stand_delay_s":0.35,"swoop_start_s":1.25,"swoop_s":1.5,"dolly_s":4.6,"dolly_start":1.55,"camera_height":0.42,"look_height":0.5,"salute_lead":0.25,"salute_s":0.45,"ripple_s":0.9,"glide_yaw_deg":0,"hero_clear":0.03},"night":{"_about":"Only used by ?v=night: after the scan the page fades to night, the QR modules switch on like city lights, the modules fly in as glowing cubes, then a wet road spreads in front of the real unit and its lenses and cabinet flashers light it. fade_s: how long the fade to night takes. city_glow, cube_glow: glow strengths. light_min, bright_share, dark_share: the dimmest QR light, the share of bright ones and the share that stay dark. road_start_s, road_s: when the wet road spreads (seconds after the QR fills the screen); road_radius, road_behind: its size in front of and behind the unit. wash, sky_wash: the light cycle's colour wash on the scene and the sky. streaks, streak_length: the reflections on the road. haze_near, haze_far: how far the night haze starts and ends behind the unit. scene_light: how much of the day lighting stays.","fade_s":0.9,"city_glow":0.35,"light_min":0.02,"bright_share":0.12,"dark_share":0.35,"cube_glow":0.55,"cube_brighten":0.25,"road_start_s":3.2,"road_s":1.6,"road_radius":9,"road_behind":1.1,"road_roughness":0.16,"wash":3.2,"wash_range":9,"sky_wash":0.008,"haze_near":1.0,"haze_far":10,"flasher_light":1.2,"flasher_range":5,"streaks":0.9,"streak_length":0.85,"scene_light":0.3,"colours":{"paper":"#070A12","sky_top":"#03050B","horizon":"#151C36","ground":"#05070C","asphalt":"#0B0E13","city_light":"#FFE6B5","city_warm":"#FFC46B","city_cool":"#F4F1FF","city_glow":"#FFC978","window_off":"#141A2A"}}};
const editorMode = new URLSearchParams(location.search).get("editor") === "1";
function cfgMerge(base, over) {
  if (!over || typeof over !== "object" || Array.isArray(over)) return base;
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base && typeof base[k] === "object") out[k] = cfgMerge(base[k], v);
    else if (base == null || !(k in base) || typeof v === typeof base[k]) out[k] = v;
  }
  return out;
}
async function loadMorphConfig() {
  const q = new URLSearchParams(location.search);
  let cfg = JSON.parse(JSON.stringify(MORPH_DEFAULTS));
  const sources = ["defaults"];
  const getJson = async (u) => {
    const r = await fetch(u, { cache: "no-cache" });
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    return r.json();
  };
  try {
    cfg = cfgMerge(cfg, await getJson(new URL("./morph-config.json", import.meta.url).href.replace(/\?.*$/, "")));
    sources.push("morph-config.json");
  } catch (e) {
    console.info("morph-config.json not loaded, using built-in defaults:", e && e.message);
  }
  const cu = q.get("config");
  if (cu) {
    try {
      cfg = cfgMerge(cfg, await getJson(new URL(cu, location.href).href));
      sources.push("?config");
    } catch (e) {
      console.warn("?config could not be loaded:", e && e.message);
    }
  }
  try {
    const raw = localStorage.getItem(editorMode ? "portaboom.editor.config" : "portaboom.config");
    if (raw) {
      cfg = cfgMerge(cfg, JSON.parse(raw));
      sources.push(editorMode ? "editor" : "saved");
    }
  } catch (e) {
    console.info("saved settings ignored:", e && e.message);
  }
  cfg._sources = sources;
  return cfg;
}
const MODE_KEY = "night";
const CFG = ((c) => (c[MODE_KEY] && c[MODE_KEY].base ? Object.assign(cfgMerge(c, c[MODE_KEY].base), { _sources: c._sources }) : c))(await loadMorphConfig());
window.__morphConfig = CFG;

/* Editor preview clock: play / pause / fast-forward to a time after the scan. */
const editorClock = { playing: true, seek: null, scanAt: null };
if (editorMode) {
  const q = new URLSearchParams(location.search);
  const realNow = performance.now.bind(performance);
  const realRAF = window.requestAnimationFrame.bind(window);
  let vt = realNow();
  let last = realNow();
  const sk = parseFloat(q.get("seek"));
  editorClock.seek = Number.isFinite(sk) && sk > 0 ? sk : null;
  // Runs until the jump target is reached; a paused jump stops there.
  editorClock.playing = q.get("paused") !== "1" || editorClock.seek != null;
  const pauseAfterSeek = q.get("paused") === "1";
  performance.now = () => vt;
  const ffActive = () => editorClock.seek != null && editorClock.scanAt != null && vt < editorClock.scanAt + editorClock.seek * 1000;
  window.requestAnimationFrame = (cb) => {
    if (ffActive()) {
      return setTimeout(() => {
        vt += 1000 / 15; // coarse steps while jumping: half the frames to draw
        last = realNow();
        if (!ffActive()) { editorClock.seek = null; if (pauseAfterSeek) editorClock.playing = false; }
        cb(vt);
      }, 0);
    }
    return realRAF(() => {
      const r = realNow();
      if (editorClock.playing) vt += Math.min(50, r - last);
      last = r;
      cb(vt);
    });
  };
  window.__iqrOnLeaveToDest = (d) => { window.__leaveReq = d; parent.postMessage({ type: "morph-dest", dest: d.dest }, "*"); };
  addEventListener("message", (e) => {
    const m = e.data || {};
    if (m.type === "morph-play") editorClock.playing = true;
    if (m.type === "morph-pause") editorClock.playing = false;
    if (m.type === "morph-step") { vt += (m.ms || 1000 / 30); }
  });
  setInterval(() => {
    const t = editorClock.scanAt == null ? -1 : (vt - editorClock.scanAt) / 1000;
    parent.postMessage({ type: "morph-time", t, playing: editorClock.playing, phase: window.__iqr?.morph1?.phase, ff: ffActive() }, "*");
  }, 100);
}

const NAVY = 0x1b2a4a;
const ORANGE = 0xee7202;
const PAPER = 0xffffff;
const CREAM = 0xfce3cc;
const STEEL = 0xc5cad3;
const INK = 0x202020;

/** twin-core livery.ts palette. Do not invent hex. */
const LIVERY = Object.freeze({
  Y: 0xf47514, // powder orange cabinet
  S: 0xcdd0d5, // stainless
  K: 0x222426, // wheels / dark
  R: 0xc41a1a,
  A: 0xe07b12,
});
/** CAD RGB → tag. Same table as twin-core `ut`. */
const LIVERY_RGB = Object.freeze({
  "255,55,0": "Y", "255,255,226": "Y", "255,255,90": "Y", "13,79,90": "Y",
  "0,255,0": "Y", "1,104,10": "Y", "61,104,255": "Y",
  "183,202,222": "S", "87,111,133": "S", "123,147,179": "S", "208,20,255": "S",
  "8,9,11": "K", "255,255,255": "K", "34,34,0": "K", "17,20,22": "K",
  "18,21,25": "K", "13,15,17": "K", "63,37,133": "K", "18,18,17": "K",
  "34,4,0": "K", "114,1,17": "K", "13,73,255": "K", "11,74,101": "K",
  "8,2,4": "K", "56,0,0": "K", "78,72,67": "K", "24,10,39": "K",
  "0,88,166": "K", "3,75,145": "K", "19,12,55": "K", "46,27,150": "K",
  "114,10,0": "K", "32,3,5": "K",
  "66,131,184": "B", "169,109,246": "B",
  "255,0,0": "R", "183,14,1": "R", "117,191,23": "R", "191,101,0": "R", "10,60,4": "R",
  "133,35,5": "A",
  "222,255,24": "G",
});
/** twin-core sign.ts - STOP face default round. Clamp visible while mounted. */
let signType = "round";
let signGroup = null;
/** PB4000 manual: cabinet 1153×415 mm, boom 4 m class, STOP Ø 400 mm. */
const REAL = Object.freeze({
  boomM: 4.0,
  cabinetHM: 1.153,
  cabinetWM: 0.415,
  signDM: 0.40,
  /**
   * Hero studio tape (TAS pb4000.jpg / WZS Porta_Boom_Large_LP):
   * period ≈ 330-345 mm (~12 repeats on a 4 m arm); red≈gap (duty ≈ 0.48);
   * lean-forward chevrons. tidy4 0.22 local / duty 0.33 was too tight + too thin.
   */
  stripePeriodM: 0.34,
  stripeRedDuty: 0.48,
});
/** Fraction of boom tip length. Hero: not at tip - ~1/6 of arm past the face. */
const SIGN_ALONG_DEFAULT = 0.72;
const SIGN_ALONG_MIN = 0.32;
const SIGN_ALONG_MAX = 0.90;
const SIGN_NUDGE = 0.04;
let signAlong = SIGN_ALONG_DEFAULT;
let signRadiusLocal = REAL.signDM / 2;
let stripePeriodLocal = 0.22;
let plantedProof = null;

/** Hero SoT boom tape - retuned pass 2 vs photo (not tidy4 0.22/0.33 local). */
const STRIPE = {
  get period() { return stripePeriodLocal; },
  redDuty: REAL.stripeRedDuty,
  slant: 1.0,
  red: [0.753, 0.078, 0.129],
  white: [0.94, 0.945, 0.95],
};

/**
 * Overnight SHOW CONFIG - clean core defaults (twin-core setGroup).
 * KEEP: cabinet + boom + ONE traffic head.
 * HIDE: solar group until user toggles ON. Hide 2nd head / ped if present.
 * OrbitControls on; autoRotate only via setSpin (default OFF).
 */
const SHOW_CONFIG = Object.freeze({
  solar: false,
  traffic: true,
  secondHead: false,
  productLedFlanks: false,
  spin: false,
});

let groups = { solar: [], traffic: [], traffic2: [] };
let optsVisible = { solar: SHOW_CONFIG.solar, traffic: SHOW_CONFIG.traffic };
let spin = false;
let controls = null;
let framed = false;
const HOME = {
  pos: new THREE.Vector3(0, 1.5, 5.4),
  tgt: new THREE.Vector3(0, 1.1, 0),
  fov: 32,
};
let camGlide = null;
let lampMats = { red: null, amber: null, green: null };
let lampHalos = { red: null, amber: null, green: null };
let lampLights = { red: null, amber: null, green: null };
let signalAspect = "green";

/** twin-core lights.ts KINDCOL - face LEDs match the 3-aspect head family. */
const KINDCOL = Object.freeze({ red: 0xff2a1a, amber: 0xffa51e, green: 0x2aff55 });
const FACE_GREEN = KINDCOL.green;
const FACE_GREEN_BASE = 0x062c10;
const FACE_RED = KINDCOL.red;
const FACE_RED_BASE = 0x3a0000;
const STRIP_GREEN = KINDCOL.green;
const STRIP_RED = KINDCOL.red;

/** 3-aspect signal head - same KINDCOL as door faces. */
const LAMP_COL = { red: KINDCOL.red, amber: KINDCOL.amber, green: KINDCOL.green };

function makeFaceLedMat(ready) {
  return new THREE.MeshStandardMaterial({
    color: ready ? FACE_GREEN_BASE : FACE_RED_BASE,
    emissive: ready ? FACE_GREEN : FACE_RED,
    emissiveIntensity: ready ? 5.5 : 2.4,
    roughness: 0.15,
    metalness: 0.04,
    toneMapped: false,
  });
}

function stainlessMat() {
  return new THREE.MeshStandardMaterial({
    color: LIVERY.S, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.2,
  });
}

/** twin-core sign.ts Be() - AS STOP red #c01421, white legend, round or octagon. */
function makeStopTex(type) {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.lineJoin = "round";
  const red = "#c01421";
  const white = "#ffffff";
  const cx = size / 2;
  const cy = size / 2;
  if (type === "octagon") {
    const oct = (r) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 8 + i * Math.PI / 4;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
    };
    ctx.fillStyle = white;
    oct(size / 2);
    ctx.fill();
    ctx.fillStyle = red;
    oct(size * 0.44);
    ctx.fill();
  } else {
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
    ctx.fill();
  }
  const hl = ctx.createRadialGradient(size * 0.78, size * 0.74, size * 0.04, cx, cy, size * 0.5);
  hl.addColorStop(0, "rgba(255,255,255,0.18)");
  hl.addColorStop(0.4, "rgba(255,255,255,0.04)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
  ctx.fillStyle = white;
  ctx.font = `900 ${Math.round(size * 0.27)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI);
  ctx.fillText("STOP", 0, -size * 0.015);
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** twin-core sign.ts Ve() - mount STOP on boom pivot. */
function buildSign() {
  if (signGroup) {
    signGroup.parent && signGroup.parent.remove(signGroup);
    signGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        if (o.material.emissiveMap) o.material.emissiveMap.dispose();
        o.material.dispose();
      }
    });
    signGroup = null;
  }
  if (!boomRig?.pivot) return;
  const type = signType === "octagon" ? "octagon" : "round";
  const radius = signRadiusLocal;
  const tex = makeStopTex(type);
  const wrap = new THREE.Group();
  wrap.name = "PortaboomStopSign";
  const faceMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.26,
    metalness: 0.05,
    envMapIntensity: 2,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: tex,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x8a7b65,
    metalness: 0.7,
    roughness: 0.4,
  });
  let faceGeo;
  let backGeo;
  if (type === "octagon") {
    const shape = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + i * Math.PI / 4;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (i) shape.lineTo(x, y);
      else shape.moveTo(x, y);
    }
    shape.closePath();
    faceGeo = new THREE.ShapeGeometry(shape);
    const pos = faceGeo.attributes.position;
    const uv = faceGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) + radius) / (2 * radius), (pos.getY(i) + radius) / (2 * radius));
    }
    uv.needsUpdate = true;
    backGeo = new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.012, 8);
  } else {
    faceGeo = new THREE.CircleGeometry(radius, 72);
    backGeo = new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.012, 72);
  }
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.name = "PortaboomStopFace";
  face.castShadow = true;
  const back = new THREE.Mesh(backGeo, backMat);
  back.rotation.x = Math.PI / 2;
  back.position.z = -0.015;
  const inner = new THREE.Group();
  inner.name = "PortaboomStopInner";
  inner.add(back);
  inner.add(face);
  wrap.add(inner);
  boomRig.pivot.add(wrap);
  signGroup = wrap;
  placeSign();
  tickSignUpright();
  if (boom) classifyGroups(boom);
}

function placeSign() {
  if (!signGroup || !boomRig) return;
  const tipY = boomRig.tipY != null ? boomRig.tipY : 1.6;
  const along = tipY * signAlong;
  if (boomRig.tipAxis === "x") signGroup.position.set(along, 0, 0.1);
  else signGroup.position.set(0, along, 0.1);
}

function setSignAlong(t) {
  signAlong = Math.max(SIGN_ALONG_MIN, Math.min(SIGN_ALONG_MAX, Number(t)));
  placeSign();
  syncDock();
}

function nudgeSign(dir) {
  setSignAlong(signAlong + dir * SIGN_NUDGE);
}

/**
 * 180° canvas legend + full pivot cancel. Boom-up rest is ≈π; holding
 * that rest (only cancelling the drop delta) left STOP inverted against
 * CanvasTexture flipY. Counter the whole pivot.z so wording stays
 * world-upright in the default boom-up view and as the arm lowers.
 */
function tickSignUpright() {
  if (!signGroup || !boomRig?.pivot) return;
  const inner = signGroup.getObjectByName("PortaboomStopInner") || signGroup.children[0];
  if (!inner) return;
  inner.rotation.z = -boomRig.pivot.rotation.z;
}

function setSignType(type) {
  signType = type === "octagon" ? "octagon" : "round";
  buildSign();
  syncDock();
}

function worldSizeOf(o) {
  if (!o) return new THREE.Vector3();
  return worldBox(o).getSize(new THREE.Vector3());
}

/** Uniform-ish world scale of an object (column length of matrixWorld). */
function worldScaleAbs(o) {
  if (!o) return 1;
  o.updateWorldMatrix(true, false);
  const sc = new THREE.Vector3();
  o.getWorldScale(sc);
  return Math.max(Math.abs(sc.x), 1e-6);
}

/**
 * Measured STOP face diameter in planted world units.
 * Do not use root.scale alone: BoomPivot.attach() compensates plant scale
 * so new children of the pivot sit at world scale ≈ 1, not plant 0.50.
 */
function measureSignWorldDiameter() {
  const face = signGroup?.getObjectByName("PortaboomStopFace");
  if (!face) return plantedProof?.signDiameterWorld ?? null;
  // Vertex/circle diameter: 2 × localR × face world scale (not AABB -
  // an octagon AABB is flat-to-flat, ~8% short of Ø400 mm).
  return +(2 * signRadiusLocal * worldScaleAbs(face)).toFixed(4);
}

/**
 * Prove Ø400 mm on the planted twin. GLB is not 1 unit = 1 m after
 * plantTwin (hero box → 1.28). Ruler is cabinet height (manual 1.153 m).
 * STOP is parented to BoomPivot; stripe meshes keep plant world scale.
 */
function measurePlantedScale(root) {
  const scaleFactor = root?.scale?.x || 1;
  const tipY = boomRig?.tipY != null ? Math.abs(boomRig.tipY) : 0;
  const boomLengthCad = tipY;
  const pivot = boomRig?.pivot;
  const pivotWorldScale = pivot ? worldScaleAbs(pivot) : scaleFactor;
  let meshWorldScale = scaleFactor;
  root?.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData?.tag !== "B" && !o.material?.userData?.stripe) return;
    meshWorldScale = worldScaleAbs(o);
  });
  const boomLengthWorld = tipY * pivotWorldScale;
  let door = null;
  root?.traverse((o) => {
    if (!door && /^115-DOOR$|^115_DOOR$|HeroCabinet/i.test(o.name || "")) door = o;
  });
  const doorSz = door ? worldSizeOf(door) : new THREE.Vector3();
  const doorHeightWorld = doorSz.y || 0;
  const doorWidthWorld = Math.max(doorSz.x || 0, doorSz.z || 0);
  const doorHeightCad = scaleFactor ? doorHeightWorld / scaleFactor : 0;
  const doorWidthCad = scaleFactor ? doorWidthWorld / scaleFactor : 0;

  const doorOk = doorHeightWorld > 0.15;
  const metresPerWorld = doorOk
    ? REAL.cabinetHM / doorHeightWorld
    : (boomLengthWorld > 0.05 ? REAL.boomM / boomLengthWorld : 1 / Math.max(pivotWorldScale, 1e-6));

  const signDiameterWorld = REAL.signDM / metresPerWorld;
  signRadiusLocal = signDiameterWorld / (2 * pivotWorldScale);
  stripePeriodLocal = metresPerWorld > 0 && meshWorldScale > 1e-6
    ? REAL.stripePeriodM / metresPerWorld / meshWorldScale
    : REAL.stripePeriodM;

  const how = doorOk
    ? `Ø400mm world=${signDiameterWorld.toFixed(4)}=0.40/(1.153/doorH ${doorHeightWorld.toFixed(3)}); localR=${signRadiusLocal.toFixed(4)}=worldD/(2×pivotWorldScale ${pivotWorldScale.toFixed(4)}); plant ${scaleFactor.toFixed(4)} · m/world ${metresPerWorld.toFixed(3)} · meshScale ${meshWorldScale.toFixed(4)}`
    : `Ø400mm world = 0.40 × boomWorld / 4.0 (door fallback)`;

  plantedProof = {
    scaleFactor,
    pivotWorldScale,
    meshWorldScale,
    boomLengthWorld,
    boomLengthCad,
    boomLengthM: REAL.boomM,
    impliedBoomM: boomLengthWorld * metresPerWorld,
    doorHeightWorld,
    doorWidthWorld,
    doorHeightCad,
    doorWidthCad,
    metresPerWorld,
    signDiameterM: REAL.signDM,
    signDiameterWorld,
    signRadiusLocal,
    stripePeriodLocal,
    stripePeriodM: REAL.stripePeriodM,
    stripeRedDuty: REAL.stripeRedDuty,
    derived: how,
  };
  if (root?.userData) root.userData.plantedProof = plantedProof;
  return plantedProof;
}

function repaintBoomStripes(root) {
  if (!root) return 0;
  let n = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData?.tag !== "B" && !o.material?.userData?.stripe) return;
    o.material = stripeMaterial(o.geometry);
    n += 1;
  });
  return n;
}

function isDiscLikeMesh(o) {
  if (!o?.isMesh || !o.geometry) return false;
  if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
  const sz = o.geometry.boundingBox.getSize(new THREE.Vector3());
  const sorted = [sz.x, sz.y, sz.z].sort((a, b) => a - b);
  return sorted[0] < 0.08 && Math.abs(sorted[1] - sorted[2]) < 0.16 && sorted[1] > 0.06;
}

/** Kill leftover CAD lime/yellow glow discs (tag G / 灯条 orbs / sprites). */
function killStrayGlowDiscs(root) {
  if (!root) return [];
  const killed = [];
  const keep = /PortaboomFaceLed|PortaboomLedBezel|PortaboomStopSign|SignalLens_|SignalHalo_|HeroLens_|HeroSignal/;
  const kill = [];
  root.traverse((o) => {
    if (keep.test(o.name || "") || keep.test(o.parent?.name || "")) return;
    if (o.isSprite) {
      kill.push(o);
      return;
    }
    if (!o.isMesh) return;
    const n = `${o.name || ""}|${o.parent?.name || ""}`;
    if (o.userData?.tag === "G" || o.userData?.liveryTag === "G") {
      kill.push(o);
      return;
    }
    if (/灯条/.test(n) && isDiscLikeMesh(o)) {
      kill.push(o);
      return;
    }
    const mat = firstMat(o);
    const em = mat?.emissive ? mat.emissive.getHex() : 0;
    const col = mat?.color ? mat.color.getHex() : 0;
    const bright = (mat?.emissiveIntensity || 0) > 0.4;
    const lime = em === 0x39e562 || em === 0xbdf7c8 || col === 0xbdf7c8 || col === 0xdeff18;
    if (isDiscLikeMesh(o) && bright && lime) kill.push(o);
  });
  kill.forEach((o) => {
    o.visible = false;
    killed.push(o.name || o.type);
    if (o.parent) o.parent.remove(o);
  });
  if (root.userData) root.userData.strayGlowKilled = killed;
  return killed;
}

function classifyLiveryRgb(r, g, b) {
  const rgb = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  let tag = null;
  let best = 1e9;
  for (const key of Object.keys(LIVERY_RGB)) {
    const t = key.split(",").map(Number);
    const d = (rgb[0] - t[0]) ** 2 + (rgb[1] - t[1]) ** 2 + (rgb[2] - t[2]) ** 2;
    if (d < best) {
      best = d;
      tag = LIVERY_RGB[key];
    }
  }
  return best <= 900 ? tag : null;
}

/** twin-core `ft()` - powder-coat Physical. */
function alumMat() {
  return new THREE.MeshStandardMaterial({
    color: LIVERY.S, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.2,
  });
}

function powderMat(hex = LIVERY.Y) {
  return new THREE.MeshPhysicalMaterial({
    color: hex,
    metalness: 0,
    roughness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.15,
    sheen: 0.25,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0xffffff),
  });
}

/**
 * Hero SoT boom tape (real PB4000 photo):
 * silver/white arm, 45° chevrons leaning away from cabinet,
 * white gaps ~2× red width, deep #c01421 - not 50/50 coral bands.
 */
function stripeMaterial(geometry) {
  if (geometry && !geometry.boundingBox) geometry.computeBoundingBox();
  const t = new THREE.Vector3();
  if (geometry?.boundingBox) geometry.boundingBox.getSize(t);
  else t.set(1, 0.1, 0.1);
  const axis = t.x >= t.y && t.x >= t.z ? "x" : t.y >= t.z ? "y" : "z";
  const cross = axis === "x" ? "y" : "x";
  const period = STRIPE.period;
  const redDuty = STRIPE.redDuty;
  const slant = STRIPE.slant;
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xe8eaee,
    metalness: 0.22,
    roughness: 0.28,
    clearcoat: 0.55,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.4,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    toneMapped: false,
  });
  mat.userData.stripe = true;
  mat.userData.stripePeriod = period;
  mat.userData.stripeRedDuty = redDuty;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vOPos;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>\nvOPos = position;`
    );
    shader.fragmentShader = `varying vec3 vOPos;\n${shader.fragmentShader}`
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
       float u = fract((vOPos.${axis} + vOPos.${cross} * ${slant.toFixed(2)}) / ${period.toFixed(3)});
       float band = step(u, ${redDuty.toFixed(3)});
       vec3 white = vec3(${STRIPE.white[0]},${STRIPE.white[1]},${STRIPE.white[2]});
       vec3 red   = vec3(${STRIPE.red[0]},${STRIPE.red[1]},${STRIPE.red[2]});
       diffuseColor.rgb = mix(white, red, band);`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
       roughnessFactor *= mix(0.42, 0.62, band);`
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
       metalnessFactor *= mix(0.28, 0.04, band);`
      );
  };
  return mat;
}

function makeLampMat(kind, on) {
  return new THREE.MeshStandardMaterial({
    color: on ? 0x22180c : 0x0c0a08,
    emissive: LAMP_COL[kind],
    emissiveIntensity: on ? 8.5 : 0.08,
    roughness: 0.22,
    metalness: 0.04,
    toneMapped: false,
  });
}

const canvas = document.getElementById("stage");
const hintEl = document.getElementById("hint"); // optional; slim HUD may omit
const statusEl = document.getElementById("status");
const failEl = document.getElementById("fail");
const aspectEl = document.getElementById("aspect");

const destQr = encodeDestMatrix();
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pageParams = new URLSearchParams(location.search);
const preview5Wanted = pageParams.get("v") === "preview5";
const motion1Wanted = pageParams.get("v") === "motion1";
const motion2Wanted = pageParams.get("v") === "motion2";
/**
 * morph1: flat PORTABOOM QR first frame -> modules rise into the 3D field ->
 * GLB unit rises out of the logo box -> boom cycle -> DEST.
 * Reuses the motion3 field, camera and showtime paths (motion3Wanted is true),
 * with morph1-only overrides guarded by morph1Wanted.
 * The loader in index.html may pass the mode as app.js?v=morph1.
 */
const modeParam = pageParams.get("v") || new URL(import.meta.url).searchParams.get("v") || "";
/** morph2 runs on the morph1 frame (one surface, scan, camera, end scene) with module art and a voxel morph. */
/** morph3: morph2 with a wider hero framing, a camera glide and a progressive resolve (this file only runs for ?v=morph3). */
/** night: morph3 plus the night look (this file only runs for ?v=night). */
const nightWanted = true;
const morph3Wanted = modeParam === "morph3" || nightWanted;
const morph2Wanted = modeParam === "morph2" || morph3Wanted;
const morph1Wanted = modeParam === "morph1" || morph2Wanted;
const motion3Wanted = pageParams.get("v") === "motion3" || morph1Wanted;
/** morph1 field matrix comes from the tip URL the still encodes, not DEST. */
const MORPH1_TIP_URL = new URL(morph2Wanted ? "./?v=morph2" : "./?v=morph1", import.meta.url).href;
const morph2Qr = morph2Wanted ? encodeMorph2(MORPH1_TIP_URL) : null;
const morph1Qr = morph2Qr ? { url: morph2Qr.url, ecc: morph2Qr.ecc, version: morph2Qr.version, size: morph2Qr.size, matrix: morph2Qr.matrix }
  : (morph1Wanted ? encodeTipMatrix(MORPH1_TIP_URL) : null);
/** ?m1bake=1: render the lying unit alone for the still (no knockout yet). */
const morph1BakeMode = morph1Wanted && pageParams.get("m1bake") === "1";
const morph1Mask = morph1Qr && !morph2Wanted && !morph1BakeMode ? unpackMask(MORPH_MASK, morph1Qr.size) : null;
if (morph1Qr && !morph2Wanted && !morph1BakeMode && !morph1Mask) console.warn("morph1 unit mask missing for this grid size");
const morph1Masked = (r, c) => !!(morph1Mask && morph1Mask[r * morph1Qr.size + c]);
/** Lying unit length (boom up, laid along the ground) as a fraction of the symbol side. */
const MORPH1_UNIT_SPAN = 0.85;
/** Cuboid heights scale with the larger unit. */
const MORPH1_HEIGHT_SCALE = 1.0;
const hexNum = (h) => parseInt(String(h).replace("#", ""), 16);
const showtimeWanted = pageParams.get("showtime") === "1" || preview5Wanted;
const destParam = pageParams.get("dest");
const destParsed = parseHttpUrl(destParam);
const cfgDest = parseHttpUrl(CFG.dest);
const leaveDest = destParsed || cfgDest || resolveLeaveDest(destParam, SHOWTIME_DEST_DEFAULT);
const leaveDestSource = destParsed ? "query" : (cfgDest && cfgDest !== SHOWTIME_DEST_DEFAULT ? "config" : "default");
/**
 * living2 teaser GIF loop ≈ 3.58-3.6s (43 frames @ ~12fps).
 * Showtime lock is now shorter: 0.5 + 1.0 + 0.5 + boom down.
 */
const TEASER_LOOP_S = 3.6;
/** Green 0.5s → amber 1s → red 0.5s → boom down. */
const SHOWTIME_GREEN_S = CFG.lights.green_s;
const SHOWTIME_AMBER_S = CFG.lights.amber_s;
const SHOWTIME_RED_HOLD_S = CFG.lights.red_hold_s;
const SHOWTIME_LOWER_S = CFG.boom.lower_s;
const SHOWTIME_HOLD_S = 0;
/** Short beat after boom fully down, then leave to DEST. */
const SHOWTIME_LEAVE_S = CFG.boom.leave_after_s;
const SHOWTIME_TOTAL_S = SHOWTIME_GREEN_S + SHOWTIME_AMBER_S + SHOWTIME_RED_HOLD_S + SHOWTIME_LOWER_S + SHOWTIME_HOLD_S;
/**
 * First paint stays on the QR-matrix door so the scan does not open
 * looking like a twin-site 3/4 product hero. Tap starts transform;
 * if nobody taps, this beat still auto-plays for phone-scan UX.
 */
const SHOWTIME_DOOR_S = motion3Wanted ? 2.5 : (motion2Wanted ? 0.35 : (motion1Wanted ? 6.0 : (preview5Wanted ? 0.85 : 2.6)));
/** Magic Tree tap door - modules must sit still this long for Camera. motion1 only. */
const MAGIC_HOLD_MS = 500;
/** Idle bob of raised dark modules. living10 showtime stays frozen. */
const MOTION1_AMP_CELL = 0.72;
/** motion3 only - same bob as motion1. living10 stays frozen. */
const MOTION3_AMP_CELL = 0.72;
/** motion3 only - shift the hero LEFT in the living field so boom-down reads. */
const MOTION3_UNIT_X = -0.28;
/** motion3 only - extra boom span in the door crop (living10 keeps DOOR_BOOM_KEEP). */
const MOTION3_BOOM_KEEP = 1.35;
/** Minimum pad fraction so the QR crowd stays a field, not a footer. */
const DOOR_PAD_SPAN = 0.30;
/**
 * Elevated field crop: cabinet + lantern sit IN the crowd.
 * Do not let the 4 m boom drive the span (that recreates living4 speck).
 * living7/8/9 subject-fill 0.72 flattened the door.
 */
const DOOR_SUBJECT_FILL = 0.44;
/** Extra ortho so the lantern housing clears the crop. */
const DOOR_SIGNAL_PAD = 1.10;
/** World units of boom kept in the look-at subject - tip may trim. */
const DOOR_BOOM_KEEP = 0.62;
/** motion2 camera only - yaw 0 puts boom-down to screen-right, unit LEFT. living10/motion1 keep planted π. */
const MOTION2_YAW = 0;
// Showtime lock (0.5+1+0.5+boom) is shorter than the living2 teaser loop.
let showtimePhase = (showtimeWanted || motion2Wanted || motion3Wanted) ? "door" : "off";
let showtimeStartedAt = 0;
let showtimeElapsed = 0;
let destLeave = null;
let destLeaveTimer = 0;
let doorBeatTimer = 0;
let magicPhase = (motion1Wanted || motion3Wanted) ? "idle" : "off"; // off | idle | flattening | hold
let magicHoldStartedAt = 0;
let magicHoldMs = 0;
let magicModulesStable = false;
if (showtimeWanted || motion1Wanted || motion2Wanted || motion3Wanted) document.body.classList.add("showtime");
let viewMode = motion2Wanted ? "motion2" : ((showtimeWanted || motion1Wanted || motion3Wanted) ? "door" : "world"); // door = ICQR QR-field · world = living2 plaza · scan = tap-to-scan · motion2 = left hero-lock
let scanOpen = false;
let lifeOn = !reduced;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: true,
  });
} catch (err) {
  if (morph1Wanted && typeof window.__morph1Fallback === "function") window.__morph1Fallback("webgl-create-failed: " + (err?.message || err));
  else failEl.classList.add("show");
  throw err;
}
if (!renderer.getContext()) {
  if (morph1Wanted && typeof window.__morph1Fallback === "function") window.__morph1Fallback("webgl-unavailable");
  else failEl.classList.add("show");
  throw new Error("WebGL unavailable");
}
window.__iqrBooted = true;
if (morph1Wanted) {
  canvas.addEventListener("webglcontextlost", (ev) => {
    ev.preventDefault();
    morph1Fallback("webgl-context-lost");
  });
}

renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setClearColor(0x0d0d12, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
// twin-core Ye() studio: background 0x0d0d12, RoomEnvironment, no fog
scene.background = new THREE.Color(0x0d0d12);
scene.backgroundBlurriness = 0;
try {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1;
} catch (err) {
  console.warn("RoomEnvironment skipped", err);
}

const unitCam = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
unitCam.position.set(0, 1.5, 5.4);
unitCam.lookAt(0, 1.1, 0);
const scanCam = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.05, 80);
/** Elevated ortho into the 3D QR field - living5 GOOD door, not living7 dead-on. */
const doorCam = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.05, 80);
/** Dead-on +Y ortho of the XZ caps. OrbitControls must not own this camera. */
const SCAN_POSE = {
  pos: new THREE.Vector3(0, 8, 0.0001),
  tgt: new THREE.Vector3(0, 0, 0),
};
scanCam.position.copy(SCAN_POSE.pos);
scanCam.up.set(0, 0, -1);
scanCam.lookAt(SCAN_POSE.tgt);
let camera = motion2Wanted ? unitCam : ((showtimeWanted || motion1Wanted || motion3Wanted) && !preview5Wanted ? doorCam : unitCam);

scene.add(new THREE.HemisphereLight(0xc9d4e8, 0x1b2a4a, 0.42));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(2.6, 5.8, 3.6);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.bias = -0.0003;
scene.add(key);
const fill = new THREE.DirectionalLight(0x9fbfff, 0.32);
fill.position.set(-2.2, 3.2, 2.4);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffe2c4, 0.38);
rim.position.set(-3.2, 2.4, -3.4);
scene.add(rim);

/** twin-core scenes.ts ct() - studio floor + warm contact + cyclorama horizon */
const studioGroup = new THREE.Group();
studioGroup.name = "TwinStudio";
function makeStudioGroundTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2a2d33";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3200; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const n = 40 + Math.random() * 50;
    ctx.fillStyle = `rgba(${n},${n + 2},${n + 6},${0.14 + Math.random() * 0.18})`;
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let g = 32; g < 512; g += 32) {
    ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(512, g); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 14);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 48),
  new THREE.MeshStandardMaterial({
    color: 0xb4b8be,
    map: makeStudioGroundTex(),
    roughness: 0.88,
    metalness: 0.08,
    envMapIntensity: 0.22,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
studioGroup.add(floor);
{
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
  g.addColorStop(0, "rgba(255,214,170,0.42)");
  g.addColorStop(0.45, "rgba(255,190,130,0.16)");
  g.addColorStop(1, "rgba(255,180,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 64),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.012;
  studioGroup.add(glow);
}
{
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#030508");
  g.addColorStop(0.55, "#0a0e14");
  g.addColorStop(1, "#0c1118");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  const cycTex = new THREE.CanvasTexture(c);
  const cyc = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 16, 18, 64, 1, true),
    new THREE.MeshBasicMaterial({
      map: cycTex,
      side: THREE.BackSide,
      toneMapped: false,
    })
  );
  cyc.position.y = 7.2;
  studioGroup.add(cyc);
  const cove = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 10),
    new THREE.MeshBasicMaterial({ map: cycTex, toneMapped: false })
  );
  cove.position.set(0, 3.4, -4.8);
  studioGroup.add(cove);
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 6),
    new THREE.MeshBasicMaterial({
      color: 0x1a2433,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  haze.position.set(0, 1.6, -4.6);
  studioGroup.add(haze);
}
studioGroup.visible = true;
scene.add(studioGroup);

const living = buildLivingQr(THREE, morph1Qr ? {
  matrix: morph1Qr.matrix,
  dest: MORPH1_TIP_URL,
  livery: LIVERY,
  kindcol: KINDCOL,
  heightScale: MORPH1_HEIGHT_SCALE,
  capColor: hexNum(MORPH_PALETTE.navy),
  capFill: 1,
  scanPaperColor: hexNum(MORPH_PALETTE.cream),
} : {
  matrix: destQr.matrix,
  dest: DEST,
  livery: LIVERY,
  kindcol: KINDCOL,
});
const grid = living.group;
grid.name = "QrModuleGrid";
grid.visible = true;
scene.add(grid);
const mods = living.mods;
const paperMat = living.paperMat;
const scanPlane = null;
let brandBack = null;

function makeBrandWordmarkTex() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 2048, 512);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 210px Arial Black, Arial, sans-serif";
  ctx.fillStyle = "#1b2a4a";
  ctx.fillText("PORTA", 620, 210);
  ctx.fillStyle = "#1b1e24";
  ctx.fillText("BOOM", 1440, 210);
  ctx.fillStyle = "#ee7202";
  for (let i = 0; i < 4; i += 1) {
    const x = 1225 + i * 100;
    ctx.beginPath();
    ctx.moveTo(x, 340);
    ctx.lineTo(x + 68, 340);
    ctx.lineTo(x + 34, 440);
    ctx.lineTo(x - 34, 440);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeDoorSkyTex() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
const doorSkyTex = makeDoorSkyTex();

function makeBrandBack() {
  const group = new THREE.Group();
  group.name = "PortaboomBackBrand";
  const word = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 0.84 * (512 / 2048)),
    new THREE.MeshBasicMaterial({
      map: makeBrandWordmarkTex(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  word.name = "PortaboomBackLogo";
  word.position.set(0, 1.48, -1.35);
  group.add(word);
  scene.add(group);
  return group;
}
brandBack = makeBrandBack();
if (brandBack) brandBack.visible = false;

function makeHeroBoom() {
  const g = new THREE.Group();
  g.name = "portaboom-hero-standin";
  const matCab = powderMat(LIVERY.Y);
  const matNavy = new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.42, metalness: 0.14 });
  const matSteel = new THREE.MeshStandardMaterial({ color: LIVERY.S, roughness: 0.28, metalness: 0.9, envMapIntensity: 1.2 });
  const matBlack = new THREE.MeshStandardMaterial({ color: LIVERY.K, roughness: 0.62, metalness: 0.18 });

  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.7), matCab);
  cab.name = "HeroCabinet";
  cab.position.set(-0.85, 0.35, 0);
  cab.castShadow = true;
  g.add(cab);
  const cabBand = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.71), matNavy);
  cabBand.position.set(-0.85, 0.48, 0);
  g.add(cabBand);
  for (const z of [-0.22, 0.22]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 20), matBlack);
    w.rotation.z = Math.PI / 2;
    w.position.set(-0.85, 0.11, z);
    g.add(w);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.55, 16), matSteel);
  mast.position.set(-0.55, 0.55, 0);
  g.add(mast);
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), matSteel);
  pivot.position.set(-0.55, 0.82, 0);
  g.add(pivot);
  const arm = new THREE.Group();
  arm.name = "HeroBoomArm";
  arm.position.set(-0.55, 0.82, 0);
  const armLen = 2.05;
  const armGeom = new THREE.BoxGeometry(armLen, 0.09, 0.12);
  const armMain = new THREE.Mesh(armGeom, stripeMaterial(armGeom));
  armMain.position.x = armLen / 2;
  armMain.castShadow = true;
  arm.add(armMain);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(armLen * 0.92, 0.025, 0.125), makeFaceLedMat(true));
  stripe.name = "PortaboomBoomStrip";
  stripe.position.set(armLen / 2, 0.02, 0);
  arm.add(stripe);
  const tipGeom = new THREE.BoxGeometry(0.12, 0.12, 0.14);
  const tip = new THREE.Mesh(tipGeom, stripeMaterial(tipGeom));
  tip.position.set(armLen - 0.02, 0, 0);
  arm.add(tip);
  g.add(arm);
  const solar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.28), matNavy);
  solar.name = "太阳能板";
  solar.position.set(-0.85, 0.58, 0);
  solar.rotation.x = -0.25;
  solar.visible = SHOW_CONFIG.solar;
  g.add(solar);
  const head = new THREE.Group();
  head.name = "HeroSignalHead";
  head.position.set(-0.22, 1.22, 0.02);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, 0.16), matBlack);
  head.add(housing);
  ["red", "amber", "green"].forEach((kind, i) => {
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.08, 28), makeLampMat(kind, kind === "green"));
    lens.position.set(0, 0.21 - i * 0.21, 0.086);
    lens.name = `HeroLens_${kind}`;
    head.add(lens);
  });
  g.add(head);
  g.userData.heroHead = head;
  const bezelMat = alumMat();
  const heroFaceMats = [];
  for (const dx of [-0.09, 0.09]) {
    const faceMat = makeFaceLedMat(true);
    heroFaceMats.push(faceMat);
    const bezel = new THREE.Mesh(new THREE.CircleGeometry(0.055, 36), bezelMat);
    bezel.name = "PortaboomLedBezel";
    bezel.position.set(-0.85 + dx, 0.28, 0.354);
    g.add(bezel);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.048, 48), faceMat);
    lens.position.set(-0.85 + dx, 0.28, 0.357);
    lens.name = "PortaboomFaceLed";
    g.add(lens);
  }
  g.userData.heroArm = arm;
  g.userData.heroFaceMat = heroFaceMats[0];
  g.userData.heroFaceMats = heroFaceMats;
  g.position.y = 0.02;
  return g;
}

let boom = makeHeroBoom();
boom.userData.plantedYaw = Math.PI;
boom.rotation.y = boom.userData.plantedYaw;
boom.visible = true;
scene.add(boom);
bindGroups(boom);
applyCoreShowConfig(boom);
placeTwinInLivingWorld();
initOrbit(boom);
let usingGlb = false;
let baseScale = 1;
let flat = false;
let flatT = 0;
let boomRig = null;
let unitHomeCaptured = false;
if (motion2Wanted) {
  applyMotion2Pose();
  showtimePhase = "door";
  armDoorBeat();
} else if (motion3Wanted) {
  magicPhase = "idle";
  applyDoorPose();
  showtimePhase = "door";
  armDoorBeat();
} else if (motion1Wanted) {
  applyDoorPose();
  if (showtimeWanted) {
    showtimePhase = "door";
    armDoorBeat();
  }
} else if (showtimeWanted) {
  applyDoorPose();
  armDoorBeat();
} else {
  applyWorldPose();
}
if (canvas) canvas.dataset.iqrReady = "1";

function setStatus(text) {
  statusEl.textContent = text;
}


function isVisibleInTree(o) {
  let p = o;
  while (p) {
    if (p.visible === false) return false;
    p = p.parent;
  }
  return true;
}

function worldBox(obj) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let any = false;
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!isVisibleInTree(o)) return;
    box.expandByObject(o);
    any = true;
  });
  return any ? box : new THREE.Box3().setFromObject(obj);
}

function ancestorBlob(o) {
  const parts = [];
  let p = o;
  while (p) {
    parts.push(p.name || "");
    p = p.parent;
  }
  return parts.join("|");
}

function isTrafficNode(o) {
  return /traffic[_\s-]*light|信号灯|信号/i.test(ancestorBlob(o));
}

/** Door + signal lenses are authored on local −Z. Yaw so that face looks at the camera. */
function yawFaceCamera(negZIsFace = true) {
  const yawToCam = Math.atan2(camera.position.x || 0.0001, camera.position.z || 1);
  return negZIsFace ? yawToCam + Math.PI : yawToCam;
}

function gatherHeroBox(root) {
  const box = new THREE.Box3();
  let any = false;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const n = ancestorBlob(o);
    if (!isVisibleInTree(o)) return;
    if (!/115-DOOR|AK-XLH-D115C-01-01|Traffic[_\s-]*Light|HeroCabinet|PortaboomFaceLed/i.test(n)) return;
    if (/PART_|GB_T|螺钉|垫|自攻|太阳能|solar|PED_|TL2_/i.test(n)) return;
    box.union(new THREE.Box3().setFromObject(o));
    any = true;
  });
  return any ? box : worldBox(root);
}

/** Front framing on cabinet + traffic head. Orbit takes over after init. */
function lockHeroCamera(root) {
  const box = gatherHeroBox(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const yaw = root.rotation.y;
  const faceDir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  camera.fov = 32;
  camera.updateProjectionMatrix();
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = Math.max(0.55, camera.aspect || 1);
  const distH = (size.y * 1.38) / (2 * Math.tan(fov / 2));
  const distW = (Math.max(size.x, size.z) * 1.72) / (2 * Math.tan(fov / 2) * aspect);
  const dist = Math.max(distH, distW, 1.7);
  camera.position.set(
    center.x + faceDir.x * dist,
    center.y + size.y * 0.16,
    center.z + faceDir.z * dist
  );
  camera.lookAt(center.x, center.y + size.y * 0.02, center.z);
  camera.updateProjectionMatrix();
}

/**
 * motion2 only - unit on the LEFT of a phone frame, boom-down across the right.
 * Yaw 0 (motion2 camera only; living10/motion1 keep planted π) so local +X
 * boom-down reads to screen-right. Subject includes the lowered boom.
 */
function plantMotion2Yaw(root) {
  if (!root) return;
  root.rotation.y = MOTION2_YAW;
  root.userData.plantedYaw = MOTION2_YAW;
}

function motion2SubjectBox(root) {
  const box = new THREE.Box3();
  const hero = gatherHeroBox(root);
  if (hero && !hero.isEmpty()) box.union(hero);
  const arm = findBoomArm(root);
  if (arm) {
    const saved = boomRig?.shownPct;
    const poseDown = !!(boomRig && showtimePhase !== "playing" && showtimePhase !== "settled");
    if (poseDown) applyBoomShown(0);
    root.updateMatrixWorld(true);
    const boomBox = worldBox(arm);
    if (boomBox && !boomBox.isEmpty()) box.union(boomBox);
    if (poseDown && saved != null) applyBoomShown(saved);
    root.updateMatrixWorld(true);
  }
  return box.isEmpty() && root ? gatherHeroBox(root) : box;
}

function lockMotion2Camera(root) {
  if (!root) return;
  camera = unitCam;
  plantMotion2Yaw(root);
  const box = motion2SubjectBox(root);
  const hero = gatherHeroBox(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const heroC = hero && !hero.isEmpty()
    ? hero.getCenter(new THREE.Vector3())
    : center.clone();
  const yaw = MOTION2_YAW;
  const face = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(face.z, 0, -face.x);
  unitCam.fov = 36;
  unitCam.near = 0.05;
  unitCam.far = 80;
  unitCam.updateProjectionMatrix();
  const fov = THREE.MathUtils.degToRad(unitCam.fov);
  const aspect = Math.max(0.42, unitCam.aspect || 0.46);
  const distH = (size.y * 1.28) / (2 * Math.tan(fov / 2));
  const distW = (Math.max(size.x, size.z) * 1.55) / (2 * Math.tan(fov / 2) * aspect);
  const dist = Math.max(distH, distW, 2.05);
  // Front with a little boom-side (screen-right) so the down arm reads.
  unitCam.position.set(
    center.x + face.x * dist * 0.90 + right.x * dist * 0.22,
    center.y + size.y * 0.22,
    center.z + face.z * dist * 0.90 + right.z * dist * 0.22
  );
  // Look toward the boom so the cabinet sits LEFT and more arm is in frame.
  const look = new THREE.Vector3(
    THREE.MathUtils.lerp(heroC.x, center.x, 0.78),
    Math.max(heroC.y - size.y * 0.08, center.y - size.y * 0.12),
    THREE.MathUtils.lerp(heroC.z, center.z, 0.35)
  );
  unitCam.lookAt(look);
  unitCam.updateProjectionMatrix();
  unitCam.userData.motion2Look = look;
}

function measureMotion2HeroFrame() {
  if (!boom || viewMode !== "motion2") return null;
  return projectBoxViewportFrac(gatherHeroBox(boom), unitCam);
}

function measureMotion2BoomFrame() {
  if (!boom || (viewMode !== "motion2" && viewMode !== "scan")) return null;
  const arm = findBoomArm(boom);
  if (!arm || arm.visible === false) return null;
  return projectBoxViewportFrac(worldBox(arm), camera);
}

function measureMotion2BoomDownFrame() {
  if (!boom || viewMode !== "motion2") return null;
  const arm = findBoomArm(boom);
  if (!arm) return null;
  const saved = boomRig?.shownPct;
  if (boomRig) applyBoomShown(0);
  boom.updateMatrixWorld(true);
  const frame = projectBoxViewportFrac(worldBox(arm), unitCam);
  if (boomRig && saved != null) applyBoomShown(saved);
  boom.updateMatrixWorld(true);
  return frame;
}

/** Twin plant: wheels on ground, face camera, then hero-lock on cabinet + signal. */
function plantTwin(obj) {
  obj.rotation.set(0, 0, 0);
  obj.scale.setScalar(1);
  obj.position.set(0, 0, 0);
  let box = worldBox(obj);
  let center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  // twin-core instance.ts: model.rotation.y = Math.PI
  obj.rotation.y = Math.PI;
  const hero0 = gatherHeroBox(obj);
  const heroH = Math.max(0.4, hero0.getSize(new THREE.Vector3()).y);
  const s = 1.28 / heroH;
  obj.scale.setScalar(s);
  box = worldBox(obj);
  center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
  obj.position.y += 0.02;
  obj.rotation.y = Math.PI;
  obj.userData.plantedYaw = Math.PI;
  // twin-core instance.ts: head.group.rotation.y = yaw (180° so lenses match cabinet front)
  faceSignalHead(obj);
  return s;
}

function findSignalHead(root) {
  let hit = null;
  root.traverse((o) => {
    if (hit) return;
    if (/Traffic[_\s-]*Light|HeroSignal|信号灯/i.test(o.name || "")) hit = o;
  });
  if (!hit) return null;
  while (
    hit.parent
    && hit.parent !== root
    && /Traffic[_\s-]*Light|HeroSignal|信号/i.test(hit.parent.name || "")
  ) {
    hit = hit.parent;
  }
  return hit;
}

/**
 * twin-core instance.ts: head.group.rotation.y at the mast socket.
 * A bbox-center spin swings the STEP off the pole - wrap at the cabinet
 * mount, then yaw so lanterns sit on the door / camera side and face it.
 */
function faceSignalHead(root) {
  const signal = findSignalHead(root);
  if (!signal || signal.userData.signalFaced) return signal;

  root.updateMatrixWorld(true);
  const doorFwd = new THREE.Vector3(-Math.sin(root.rotation.y), 0, -Math.cos(root.rotation.y));
  let door = null;
  root.traverse((o) => {
    if (!door && /^115-DOOR$|^115_DOOR$|HeroCabinet/i.test(o.name || "")) door = o;
  });
  const cabC = door
    ? worldBox(door).getCenter(new THREE.Vector3())
    : worldBox(root).getCenter(new THREE.Vector3());

  const headBox = worldBox(signal);
  const mount = new THREE.Vector3(
    THREE.MathUtils.clamp(cabC.x, headBox.min.x, headBox.max.x),
    headBox.min.y + Math.max(0.04, headBox.getSize(new THREE.Vector3()).y * 0.12),
    THREE.MathUtils.clamp(cabC.z, headBox.min.z, headBox.max.z)
  );

  const yawGroup = new THREE.Group();
  yawGroup.name = "TwinHeadYaw";
  const parent = signal.parent || root;
  parent.updateMatrixWorld(true);
  parent.add(yawGroup);
  parent.worldToLocal(mount);
  yawGroup.position.copy(mount);
  yawGroup.attach(signal);

  const lensC = new THREE.Vector3();
  let lensN = 0;
  const sample = (o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const sz = o.geometry.boundingBox.getSize(new THREE.Vector3());
    const sorted = [sz.x, sz.y, sz.z].sort((a, b) => a - b);
    const disc = sorted[0] < 0.05 && sorted[1] > 0.06;
    if (!disc) return;
    const c = worldBox(o).getCenter(new THREE.Vector3());
    lensC.add(c);
    lensN += 1;
  };
  signal.traverse(sample);
  if (lensN) lensC.multiplyScalar(1 / lensN);
  else headBox.getCenter(lensC);

  const pivotW = yawGroup.getWorldPosition(new THREE.Vector3());
  const toLens = lensC.clone().sub(pivotW);
  toLens.y = 0;
  if (toLens.lengthSq() > 1e-8 && toLens.dot(doorFwd) < 0) {
    yawGroup.rotation.y += Math.PI;
    yawGroup.updateMatrixWorld(true);
  }

  root.updateMatrixWorld(true);
  signal.userData.signalFaced = true;
  root.userData.signalPivot = yawGroup;
  return yawGroup;
}

function isDescendantOf(o, ancestor) {
  let p = o;
  while (p) {
    if (p === ancestor) return true;
    p = p.parent;
  }
  return false;
}

function collectTops(hits) {
  return hits.filter((o) => !hits.some((p) => p !== o && isDescendantOf(o, p)));
}

/**
 * twin-core De() + setGroup(solar/traffic).
 * Solar: 太阳能板 / 支架 / 固定板 / 管套 / 调节螺柱.
 * Traffic: port1 Traffic Light. Extra / ped / TL2 hidden for clean core.
 */
function bindGroups(root) {
  groups = { solar: [], traffic: [], traffic2: [] };
  if (!root) return groups;
  const solarHits = [];
  const trafficHits = [];
  const extraHits = [];
  root.traverse((o) => {
    const n = o.name || "";
    if (/ProductLed/i.test(n)) {
      o.visible = false;
      return;
    }
    if (/太阳能板|太阳能板支架|固定板|管套|调节螺柱|^太阳能|solar|^柱子/i.test(n)) solarHits.push(o);
    if (/灯条/.test(n)) return;
    if (/PED_|TL2_|行人|人行|pedestrian|walk[_\s-]*light|walk[_\s-]*signal/i.test(n)) {
      extraHits.push(o);
      return;
    }
    if (/Traffic[_\s.-]*Light|HeroSignal|信号灯/i.test(n)) trafficHits.push(o);
  });
  groups.solar = solarHits;
  const trafficTops = collectTops(trafficHits);
  const keep = trafficTops.find((o) => /Traffic[_\s.-]*Light|HeroSignal/i.test(o.name || "") && !/PED_|TL2_/i.test(o.name || ""))
    || trafficTops[0]
    || null;
  groups.traffic = keep ? [keep] : [];
  groups.traffic2 = [
    ...collectTops(extraHits),
    ...trafficTops.filter((o) => o !== keep),
  ];
  root.userData.groups = {
    solar: groups.solar.map((o) => o.name),
    traffic: groups.traffic.map((o) => o.name),
    extra: groups.traffic2.map((o) => o.name),
  };
  classifyGroups(root);
  return groups;
}

/**
 * twin-core classifyGroups extras for this first-format bake:
 * hide unused 2nd-head mast AK-XLH-D115C-03 + its spare socket;
 * hide CAD stop clamp (快速夹具) unless a STOP face is mounted.
 */
function classifyGroups(root) {
  const hidden = { mast: [], spareSocket: [], stopClamp: [] };
  if (!root) return hidden;
  const sockets = [];
  const stopMounted = signType === "round" || signType === "octagon" || signType === "STOP";
  root.traverse((o) => {
    const n = o.name || "";
    if (/AK-XLH-D115C-03|^柱子/i.test(n)) {
      o.visible = false;
      hidden.mast.push(n);
      return;
    }
    if (/AK-XLH-D115C-01-01-11/i.test(n) && o.isMesh) sockets.push(o);
    if (/快速夹具|^夹具$/i.test(n)) {
      o.visible = !!stopMounted;
      if (!stopMounted) hidden.stopClamp.push(n);
    }
  });
  const keep = groups.traffic[0] || null;
  if (sockets.length >= 2 && keep) {
    const hc = worldBox(keep).getCenter(new THREE.Vector3());
    sockets.sort((a, b) => {
      const da = worldBox(a).getCenter(new THREE.Vector3()).distanceToSquared(hc);
      const db = worldBox(b).getCenter(new THREE.Vector3()).distanceToSquared(hc);
      return da - db;
    });
    const spare = sockets[sockets.length - 1];
    spare.visible = false;
    hidden.spareSocket.push(spare.name || "AK-XLH-D115C-01-01-11");
  } else if (sockets.length && !keep) {
    sockets.forEach((s) => {
      s.visible = false;
      hidden.spareSocket.push(s.name || "AK-XLH-D115C-01-01-11");
    });
  }
  root.userData.classifyHidden = hidden;
  return hidden;
}

/** twin-core lights.ts setGroup - visibility only. */
function setGroup(name, on) {
  optsVisible[name] = !!on;
  const list = groups[name] || [];
  list.forEach((o) => { o.visible = !!on; });
  if (name === "traffic") {
    if (!on) {
      for (const k of ["red", "amber", "green"]) {
        if (lampLights[k]) lampLights[k].intensity = 0;
        if (lampHalos[k]) lampHalos[k].opacity = 0;
      }
      setAspectHud("off");
    } else {
      setSignalAspect(signalAspect || "green");
    }
  }
}

function setSolar(on) {
  setGroup("solar", on);
  syncDock();
}

function setTrafficLights(on) {
  setGroup("traffic", on);
  if (!on) groups.traffic2.forEach((o) => { o.visible = false; });
  else if (boom) paintTrafficPolesStainless(boom);
  syncDock();
}

/** twin-core setSpin. autoRotate stays false unless the user turns spin on. */
function setSpin(on) {
  spin = !!on;
  if (controls) {
    controls.autoRotate = spin;
    controls.autoRotateSpeed = 1;
  }
  syncDock();
}

function applyCoreShowConfig(root) {
  bindGroups(root);
  groups.traffic2.forEach((o) => { o.visible = false; });
  root.traverse((o) => {
    if (/ProductLed/i.test(o.name || "")) o.visible = false;
  });
  setGroup("solar", SHOW_CONFIG.solar);
  setGroup("traffic", SHOW_CONFIG.traffic);
  root.userData.coreShow = {
    solarOn: optsVisible.solar,
    trafficOn: optsVisible.traffic,
    keepName: groups.traffic[0]?.name || null,
    extraHidden: (root.userData.groups?.extra || []),
  };
}

function initOrbit(root) {
  if (controls) return controls;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.minPolarAngle = 0.55;
  controls.minDistance = 3.2;
  controls.maxDistance = 16;
  controls.enablePan = true;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 1;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  controls.target.set(0, 0.7, 0);
  controls.update();
  framed = true;
  return controls;
}

function fitScanOrtho() {
  const w = Math.max(1, canvas.clientWidth || innerWidth);
  const h = Math.max(1, canvas.clientHeight || innerHeight);
  const aspect = w / h;
  const padSize = living.padSize;
  const fracW = 0.82;
  const worldW = padSize / fracW;
  const worldH = worldW / aspect;
  scanCam.left = -worldW / 2;
  scanCam.right = worldW / 2;
  scanCam.top = worldH / 2;
  scanCam.bottom = -worldH / 2;
  scanCam.near = 0.05;
  scanCam.far = 80;
  scanCam.updateProjectionMatrix();
}

function doorCabinetBox() {
  const cab = findCabinetMesh(boom);
  if (cab) return worldBox(cab);
  if (boom) return gatherHeroBox(boom);
  return null;
}

function findBoomArm(root) {
  if (!root) return null;
  return root.getObjectByName("BoomPivot")
    || root.getObjectByName("HeroBoomArm")
    || root.userData?.heroArm
    || null;
}

/** Near boom only - enough striped arm to read, not the whole 4 m tip. */
function doorBoomClipBox() {
  const arm = findBoomArm(boom);
  if (!arm) return null;
  const box = worldBox(arm);
  if (box.isEmpty()) return null;
  const cab = doorCabinetBox();
  if (cab && !cab.isEmpty()) {
    const keep = DOOR_BOOM_KEEP;
    const cabH = cab.getSize(new THREE.Vector3()).y;
    box.max.y = Math.min(box.max.y, cab.max.y + keep);
    box.min.y = Math.max(box.min.y, cab.min.y + cabH * 0.28);
  }
  if (box.max.y <= box.min.y) return null;
  return box;
}

/**
 * Door subject = portable unit + traffic light + a meaningful boom span.
 * living7: cabinet + lantern + boom, straight-on. Not living4 speck.
 */
function doorSubjectBox() {
  const box = new THREE.Box3();
  const cab = doorCabinetBox();
  if (cab && !cab.isEmpty()) box.union(cab);
  const signal = boom ? findSignalHead(boom) : null;
  if (signal) {
    const sig = worldBox(signal);
    if (!sig.isEmpty()) box.union(sig);
  }
  const boomClip = doorBoomClipBox();
  if (boomClip && !boomClip.isEmpty()) box.union(boomClip);
  if (box.isEmpty() && boom) return gatherHeroBox(boom);
  return box;
}

/**
 * Size the door from cabinet + lantern + a boom span.
 * Do not let the 4 m boom drive the crop (that recreates living4 speck).
 */
function fitDoorOrtho() {
  const w = Math.max(1, canvas.clientWidth || innerWidth);
  const h = Math.max(1, canvas.clientHeight || innerHeight);
  const aspect = w / h;
  const crop = new THREE.Box3();
  const cab = doorCabinetBox();
  if (cab && !cab.isEmpty()) crop.union(cab);
  const lantern = doorSignalLanternBox();
  if (lantern && !lantern.isEmpty()) crop.union(lantern);
  let span = living.padSize * DOOR_PAD_SPAN;
  if (!crop.isEmpty()) {
    const size = crop.getSize(new THREE.Vector3());
    span = Math.max(
      size.y / DOOR_SUBJECT_FILL,
      size.x / 0.55,
      living.padSize * DOOR_PAD_SPAN,
      1.05
    ) * DOOR_SIGNAL_PAD;
  }
  let worldW;
  let worldH;
  if (aspect < 1) {
    worldH = span;
    worldW = worldH * aspect;
  } else {
    worldW = span;
    worldH = worldW / aspect;
  }
  doorCam.left = -worldW / 2;
  doorCam.right = worldW / 2;
  doorCam.top = worldH / 2;
  doorCam.bottom = -worldH / 2;
  doorCam.near = 0.05;
  doorCam.far = 80;
  doorCam.updateProjectionMatrix();
}

function projectBoxViewportFrac(box, cam) {
  if (!box || box.isEmpty()) return null;
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of corners) {
    p.project(cam);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX) || maxX <= minX) return null;
  const overflowX = Math.max(0, -1 - minX, maxX - 1);
  const overflowY = Math.max(0, -1 - minY, maxY - 1);
  const x0 = Math.max(-1, Math.min(1, minX));
  const x1 = Math.max(-1, Math.min(1, maxX));
  const y0 = Math.max(-1, Math.min(1, minY));
  const y1 = Math.max(-1, Math.min(1, maxY));
  const widthFrac = Math.max(0, (x1 - x0) / 2);
  const heightFrac = Math.max(0, (y1 - y0) / 2);
  return {
    widthFrac: +widthFrac.toFixed(4),
    heightFrac: +heightFrac.toFixed(4),
    areaFrac: +(widthFrac * heightFrac).toFixed(4),
    overflowX: +overflowX.toFixed(4),
    overflowY: +overflowY.toFixed(4),
    fullyIn: overflowX <= 0.02 && overflowY <= 0.02,
    mostlyIn: overflowX <= 0.18 && overflowY <= 0.18,
    midX: +((x0 + x1) / 2).toFixed(4),
    midY: +((y0 + y1) / 2).toFixed(4),
  };
}

function measureDoorHeroFrame() {
  if (!boom || viewMode !== "door") return null;
  return projectBoxViewportFrac(gatherHeroBox(boom), doorCam);
}

function findCabinetMesh(root) {
  if (!root) return null;
  let door = null;
  root.traverse((o) => {
    if (!door && /^115-DOOR$|^115_DOOR$|HeroCabinet/i.test(o.name || "")) door = o;
  });
  return door;
}

function measureDoorCabinetFrame() {
  if (!boom || viewMode !== "door") return null;
  const cab = findCabinetMesh(boom);
  if (!cab) return measureDoorHeroFrame();
  return projectBoxViewportFrac(worldBox(cab), doorCam);
}

function doorSignalLanternBox() {
  const head = boom ? findSignalHead(boom) : null;
  if (!head) return null;
  const box = new THREE.Box3();
  let any = false;
  head.traverse((o) => {
    if (!o.isMesh || !isVisibleInTree(o)) return;
    const n = ancestorBlob(o);
    if (!/HeroLens|SignalLens|HeroSignalHead|灯罩|灯壳|Lens_/i.test(n)) return;
    box.union(new THREE.Box3().setFromObject(o));
    any = true;
  });
  return any ? box : worldBox(head);
}

function measureDoorSignalFrame() {
  if (!boom || viewMode !== "door") return null;
  const box = doorSignalLanternBox();
  if (!box || box.isEmpty()) return null;
  return projectBoxViewportFrac(box, doorCam);
}

function measureDoorBoomFrame() {
  if (!boom || viewMode !== "door") return null;
  const arm = findBoomArm(boom);
  if (!arm || arm.visible === false) return null;
  return projectBoxViewportFrac(worldBox(arm), doorCam);
}

function measureDoorSubjectFrame() {
  if (!boom || viewMode !== "door") return null;
  return projectBoxViewportFrac(doorSubjectBox(), doorCam);
}

/**
 * living7: boom stays in the QR field on first paint.
 * Camera crop may trim the far tip; never hide BoomPivot.
 */
function setDoorBoomArm(visible = true) {
  if (!boom) return;
  const show = visible !== false;
  const pivot = boom.getObjectByName("BoomPivot");
  if (pivot) pivot.visible = show;
  const heroArm = boom.getObjectByName("HeroBoomArm") || boom.userData?.heroArm;
  if (heroArm && heroArm !== pivot) heroArm.visible = show;
}

/**
 * Elevated look into the QR field (living5 GOOD door).
 * Not living7/8/9 dead-on poster. Not living6 roof-tilt.
 * Cabinet + lantern + boom stay in the crowd.
 */
/**
 * motion3 only - living ICQR door, unit LEFT, more boom in the crop.
 * Does not change living10 / motion1 lockDoorCamera.
 */
function fitMotion3DoorOrtho() {
  const w = Math.max(1, canvas.clientWidth || innerWidth);
  const h = Math.max(1, canvas.clientHeight || innerHeight);
  const aspect = w / h;
  const crop = new THREE.Box3();
  const cab = doorCabinetBox();
  if (cab && !cab.isEmpty()) crop.union(cab);
  const lantern = doorSignalLanternBox();
  if (lantern && !lantern.isEmpty()) crop.union(lantern);
  const arm = findBoomArm(boom);
  if (arm && boom) {
    const saved = boomRig?.shownPct;
    const poseDown = !!(boomRig && showtimePhase !== "playing");
    if (poseDown) applyBoomShown(0);
    boom.updateMatrixWorld(true);
    const boomBox = worldBox(arm);
    if (boomBox && !boomBox.isEmpty() && cab && !cab.isEmpty()) {
      boomBox.min.x = Math.max(boomBox.min.x, cab.min.x - 0.10);
      boomBox.max.x = Math.min(boomBox.max.x, cab.max.x + MOTION3_BOOM_KEEP);
      if (boomBox.max.x > boomBox.min.x) crop.union(boomBox);
    } else if (boomBox && !boomBox.isEmpty()) {
      crop.union(boomBox);
    }
    if (poseDown && saved != null) applyBoomShown(saved);
    boom.updateMatrixWorld(true);
  }
  let span = living.padSize * 0.34;
  if (!crop.isEmpty()) {
    const size = crop.getSize(new THREE.Vector3());
    span = Math.max(
      size.y / 0.48,
      size.x / 0.78,
      living.padSize * 0.34,
      1.12
    ) * 1.06;
  }
  let worldW;
  let worldH;
  if (aspect < 1) {
    worldH = span;
    worldW = worldH * aspect;
  } else {
    worldW = span;
    worldH = worldW / aspect;
  }
  doorCam.left = -worldW / 2;
  doorCam.right = worldW / 2;
  doorCam.top = worldH / 2;
  doorCam.bottom = -worldH / 2;
  doorCam.near = 0.05;
  doorCam.far = 80;
  doorCam.updateProjectionMatrix();
}

function plantMotion3InField() {
  if (!boom || !motion3Wanted) return;
  const m1rest = boom.userData.m1RestPos;
  boom.position.x = m1rest ? m1rest.x : MOTION3_UNIT_X;
  boom.position.z = m1rest ? m1rest.z : 0.12;
  boom.visible = true;
  boom.userData.livingPlanted = true;
}

function lockMotion3Camera() {
  plantMotion3InField();
  fitMotion3DoorOrtho();
  doorCam.up.set(0, 1, 0);
  let cx = MOTION3_UNIT_X;
  let cy = 0.48;
  let cz = 0.12;
  let sy = 0.72;
  const cab = doorCabinetBox();
  if (cab && !cab.isEmpty()) {
    const c = cab.getCenter(new THREE.Vector3());
    const s = cab.getSize(new THREE.Vector3());
    if (Number.isFinite(c.x)) cx = c.x;
    if (Number.isFinite(c.y)) cy = c.y;
    if (Number.isFinite(c.z)) cz = c.z;
    if (Number.isFinite(s.y) && s.y > 0.2) sy = s.y;
  }
  const lantern = doorSignalLanternBox();
  if (lantern && !lantern.isEmpty()) {
    const sc = lantern.getCenter(new THREE.Vector3());
    if (Number.isFinite(sc.x)) cx = THREE.MathUtils.lerp(cx, sc.x, 0.22);
    if (Number.isFinite(sc.y)) cy = THREE.MathUtils.lerp(cy, sc.y, 0.18);
  }
  // Boom reads to screen-right; look toward the arm so the cabinet sits LEFT.
  const lookX = cx + sy * 0.78;
  doorCam.position.set(lookX + sy * 0.08, cy + sy * 0.50, cz + sy * 1.44);
  doorCam.lookAt(lookX, cy - sy * 0.10, cz);
  doorCam.userData.look = new THREE.Vector3(lookX, cy - sy * 0.10, cz);
  doorCam.updateProjectionMatrix();
}

function lockDoorCamera() {
  if (motion3Wanted) {
    lockMotion3Camera();
    return;
  }
  fitDoorOrtho();
  doorCam.up.set(0, 1, 0);
  let cx = 0;
  let cy = 0.48;
  let cz = 0.12;
  let sy = 0.72;
  const cab = doorCabinetBox();
  if (cab && !cab.isEmpty()) {
    const c = cab.getCenter(new THREE.Vector3());
    const s = cab.getSize(new THREE.Vector3());
    if (Number.isFinite(c.x)) cx = c.x;
    if (Number.isFinite(c.y)) cy = c.y;
    if (Number.isFinite(c.z)) cz = c.z;
    if (Number.isFinite(s.y) && s.y > 0.2) sy = s.y;
  }
  const lantern = doorSignalLanternBox();
  if (lantern && !lantern.isEmpty()) {
    const sc = lantern.getCenter(new THREE.Vector3());
    if (Number.isFinite(sc.x)) cx = THREE.MathUtils.lerp(cx, sc.x, 0.28);
    if (Number.isFinite(sc.y)) cy = THREE.MathUtils.lerp(cy, sc.y, 0.22);
  }
  doorCam.position.set(cx + sy * 0.20, cy + sy * 0.54, cz + sy * 1.48);
  doorCam.lookAt(cx, cy - sy * 0.08, cz);
  doorCam.updateProjectionMatrix();
}

function doorCamElevationDeg() {
  const dir = new THREE.Vector3();
  doorCam.getWorldDirection(dir);
  const elev = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
  return +THREE.MathUtils.radToDeg(elev).toFixed(2);
}

function setLivingCaps(visible) {
  for (const m of mods) {
    const cap = m.getObjectByName("QrModTop");
    if (cap) cap.visible = visible;
  }
}

/** Door: hide scan caps so the heap reads as cuboid minis, not black lids. */
function setDoorModuleLook(on) {
  for (const m of mods) {
    const cap = m.getObjectByName("QrModTop");
    if (cap) cap.visible = !on;
  }
}

/** Scan: only black caps + paper. Hide mini chrome so jsQR can read. */
function setScanModuleLook(on) {
  for (const m of mods) {
    const cap = m.getObjectByName("QrModTop");
    if (cap) cap.visible = true;
    m.traverse((o) => {
      if (/MiniLogo|MiniFaceLed|QrModDot|QrModBand|QrModRim/.test(o.name || "")) {
        o.visible = !on;
      }
    });
  }
}

function placeTwinInLivingWorld() {
  if (!boom) return;
  // Center of the branded field. Wheels on the plaza; boom reaches over the towers.
  boom.position.x = 0;
  boom.position.z = 0.12;
  boom.visible = !scanOpen;
  boom.userData.livingPlanted = true;
}

/** Default share pose: 3/4 product hero on the plaza - not an aerial of the QR field. */
function lockWorldCamera() {
  if (!boom) return;
  camera = unitCam;
  const hero = gatherHeroBox(boom);
  const full = worldBox(boom);
  const size = hero.getSize(new THREE.Vector3());
  const fullSize = full.getSize(new THREE.Vector3());
  const center = hero.getCenter(new THREE.Vector3());
  const yaw = boom.rotation.y || Math.PI;
  const face = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const side = new THREE.Vector3(face.z, 0, -face.x);
  unitCam.fov = 32;
  unitCam.near = 0.05;
  unitCam.far = 80;
  unitCam.updateProjectionMatrix();
  const fov = THREE.MathUtils.degToRad(unitCam.fov);
  const aspect = Math.max(0.42, unitCam.aspect || 0.46);
  const distH = (size.y * 1.62) / (2 * Math.tan(fov / 2));
  const distW = (Math.max(size.x, size.z) * 1.85) / (2 * Math.tan(fov / 2) * aspect);
  const dist = Math.max(distH, distW, 2.15);
  unitCam.position.set(
    center.x + face.x * dist * 0.82 + side.x * dist * 0.48 + fullSize.x * 0.06,
    center.y + size.y * 0.14,
    center.z + face.z * dist * 0.82 + side.z * dist * 0.48
  );
  const look = new THREE.Vector3(
    center.x + fullSize.x * 0.16,
    center.y - size.y * 0.02,
    center.z
  );
  unitCam.lookAt(look);
  unitCam.updateProjectionMatrix();
  unitCam.userData.worldLook = look;
}

function showtimeHudHidden() {
  return !!showtimeWanted || motion1Wanted || motion2Wanted || motion3Wanted;
}

function clearDoorBeat() {
  if (doorBeatTimer) {
    window.clearTimeout(doorBeatTimer);
    doorBeatTimer = 0;
  }
}

function armDoorBeat() {
  if (morph1Wanted) return; // morph1 runs its own flat -> rise timeline
  if (motion1Wanted && pageParams.get("showtime") !== "1") return;
  if (!showtimeWanted && !motion1Wanted && !motion2Wanted && !motion3Wanted) return;
  clearDoorBeat();
  doorBeatTimer = window.setTimeout(() => {
    doorBeatTimer = 0;
    if (motion1Wanted && magicPhase !== "idle") return;
    if (showtimePhase === "door" || (motion1Wanted && showtimePhase === "off")) {
      startShowtime();
    }
  }, Math.round(SHOWTIME_DOOR_S * 1000));
}

function startShowtime() {
  if (!boomRig) return false;
  if (!showtimeWanted && !motion1Wanted && !motion2Wanted && !motion3Wanted) return false;
  if (showtimePhase === "settled") return false;
  if (showtimePhase === "playing") return true;
  if (motion1Wanted || motion3Wanted) {
    magicPhase = "idle";
    magicHoldStartedAt = 0;
    magicHoldMs = 0;
    magicModulesStable = false;
    scanOpen = false;
  }
  if (motion3Wanted) freezeLivingModules();
  clearDoorBeat();
  showtimePhase = "playing";
  if (motion2Wanted) applyMotion2Pose();
  else applyDoorPose();
  setDoorBoomArm(true);
  boomRig.speed = 100 / SHOWTIME_LOWER_S;
  applyBoomShown(100);
  showtimeStartedAt = performance.now();
  showtimeElapsed = 0;
  showMode = "green";
  showClock = 0;
  setSignalAspect("green");
  document.body.classList.add("showtime");
  if (controls) controls.enabled = false;
  setStatus("Showtime");
  syncModeHud();
  return true;
}

function leaveToDest(reason = "showtime-complete") {
  if (destLeave) return destLeave;
  destLeave = {
    dest: leaveDest,
    reason,
    at: performance.now(),
    source: leaveDestSource,
  };
  const hook = typeof window.__iqrOnLeaveToDest === "function"
    ? window.__iqrOnLeaveToDest
    : null;
  if (hook) {
    hook(destLeave);
    return destLeave;
  }
  location.assign(leaveDest);
  return destLeave;
}

function settleShowtime() {
  if (!boomRig) return;
  showtimePhase = "settled";
  showMode = "down";
  showClock = 0;
  applyBoomShown(0);
  setSignalAspect("red");
  // Stay in showtime HUD - this page is not the destination. DEST is.
  document.body.classList.add("showtime");
  if (controls) controls.enabled = false;
  setStatus("Showtime");
  syncModeHud();
  if (motion2Wanted) {
    beginMotion2FlattenThenDest();
    return;
  }
  if (motion3Wanted && !morph1Wanted) {
    beginMotion3MorphInPlace();
    return;
  }
  if (!destLeave && !destLeaveTimer) {
    destLeaveTimer = window.setTimeout(() => {
      destLeaveTimer = 0;
      leaveToDest("showtime-complete");
    }, Math.round(SHOWTIME_LEAVE_S * 1000));
  }
}

function applyWorldPose() {
  scanOpen = false;
  viewMode = "world";
  camera = unitCam;
  if (boom) boom.visible = true;
  studioGroup.visible = true;
  grid.visible = true;
  if (living.scanPad) living.scanPad.visible = false;
  if (living.apron) living.apron.visible = true;
  if (living.ring) living.ring.visible = true;
  setScanModuleLook(false);
  setDoorModuleLook(true);
  if (paperMat?.color) paperMat.color.setHex(0xf4efe6);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene.background = new THREE.Color(0x0d0d12);
  renderer.setClearColor(0x0d0d12, 1);
  if (controls) {
    controls.object = unitCam;
    controls.enabled = !showtimeHudHidden();
  }
  unitCam.near = 0.05;
  unitCam.far = 80;
  if (brandBack) brandBack.visible = false;
  placeTwinInLivingWorld();
  if (boom) {
    lockWorldCamera();
    const look = unitCam.userData.worldLook || new THREE.Vector3(0, 0.7, 0);
    if (controls) {
      const offset = unitCam.position.clone().sub(look);
      const polar = Math.atan2(Math.hypot(offset.x, offset.z), Math.max(0.05, offset.y));
      controls.target.copy(look);
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.minPolarAngle = Math.max(0.55, polar - 0.28);
      controls.maxPolarAngle = Math.min(Math.PI * 0.49, polar + 0.22);
      controls.minDistance = 2.4;
      controls.maxDistance = 14;
      controls.update();
    }
    captureHome();
  } else if (HOME.pos.lengthSq() > 0.01) {
    unitCam.position.copy(HOME.pos);
    unitCam.fov = HOME.fov || 34;
    unitCam.updateProjectionMatrix();
    unitCam.lookAt(HOME.tgt);
  }
  if (!showtimeHudHidden()) setStatus("Living QR · tap to scan the field");
  syncModeHud();
}

/**
 * Showtime first paint: living ICQR - pixelated QR field with PORTABOOM
 * standing in the matrix. No studio cyclorama, no plaza apron, no HUD chrome.
 */
function applyPreview5Pose() {
  scanOpen = false;
  viewMode = "preview5";
  camera = unitCam;
  if (boom) boom.visible = true;
  studioGroup.visible = false;
  grid.visible = false;
  if (living.scanPad) living.scanPad.visible = false;
  if (living.apron) living.apron.visible = false;
  if (living.ring) living.ring.visible = false;
  setScanModuleLook(false);
  setDoorModuleLook(true);
  if (paperMat?.color) paperMat.color.setHex(0xf4efe6);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  scene.background = new THREE.Color(0x0d0d12);
  renderer.setClearColor(0x0d0d12, 1);
  if (controls) {
    controls.enabled = false;
    controls.autoRotate = false;
    controls.object = unitCam;
  }
  placeTwinInLivingWorld();
  setDoorBoomArm(true);
  if (brandBack) brandBack.visible = false;
  if (boom) lockHeroCamera(boom);
  if (showtimeHudHidden()) setStatus("PREVIEW5");
  syncModeHud();
}

function freezeLivingModules() {
  for (const m of mods) {
    m.position.y = m.userData.baseY || 0;
    m.rotation.y = 0;
  }
}

function beginMagicHold() {
  if (!motion1Wanted) return false;
  magicPhase = "flattening";
  freezeLivingModules();
  applyScanPose();
  magicHoldStartedAt = performance.now();
  magicHoldMs = 0;
  magicModulesStable = false;
  magicPhase = "hold";
  setStatus("Hold · Camera");
  syncModeHud();
  return true;
}

function endMagicHold() {
  if (!motion1Wanted) return false;
  magicPhase = "idle";
  magicHoldStartedAt = 0;
  magicHoldMs = 0;
  magicModulesStable = false;
  scanOpen = false;
  applyDoorPose();
  setStatus("MOTION1");
  syncModeHud();
  return true;
}

function applyMotion2Pose() {
  scanOpen = false;
  viewMode = "motion2";
  camera = unitCam;
  if (boom) boom.visible = true;
  studioGroup.visible = false;
  grid.visible = false;
  if (living.scanPad) living.scanPad.visible = false;
  if (living.apron) living.apron.visible = false;
  if (living.ring) living.ring.visible = false;
  setScanModuleLook(false);
  setDoorModuleLook(true);
  if (paperMat?.color) paperMat.color.setHex(0xf4efe6);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  scene.background = new THREE.Color(0x0d0d12);
  renderer.setClearColor(0x0d0d12, 1);
  if (controls) {
    controls.enabled = false;
    controls.autoRotate = false;
    controls.object = unitCam;
  }
  placeTwinInLivingWorld();
  setDoorBoomArm(true);
  if (brandBack) brandBack.visible = false;
  if (boom) {
    plantMotion2Yaw(boom);
    lockMotion2Camera(boom);
  }
  setStatus("MOTION2");
  syncModeHud();
}

function beginMotion2FlattenThenDest() {
  magicPhase = "flattening";
  freezeLivingModules();
  applyScanPose();
  magicHoldStartedAt = performance.now();
  magicHoldMs = 0;
  magicModulesStable = false;
  magicPhase = "hold";
  setStatus("Hold · Camera");
  syncModeHud();
  if (!destLeave && !destLeaveTimer) {
    destLeaveTimer = window.setTimeout(() => {
      destLeaveTimer = 0;
      leaveToDest("motion2-flatten-hold");
    }, MAGIC_HOLD_MS);
  }
}

/**
 * motion3 morph - SAME living ICQR field, in place.
 * Never applyScanPose (motion2 REJECTED cutaway). Boom stays. doorCam stays.
 */
function flattenMotion3Modules() {
  for (const m of mods) {
    m.position.y = m.userData.baseY || 0;
    m.rotation.y = 0;
    if (m.userData.motion3ScaleY0 == null) m.userData.motion3ScaleY0 = m.scale.y;
    m.scale.y = (m.userData.motion3ScaleY0 || 1) * 0.28;
  }
}

function applyMotion3HoldLook() {
  scanOpen = false;
  viewMode = "door";
  camera = doorCam;
  if (boom) boom.visible = true;
  studioGroup.visible = false;
  grid.visible = true;
  if (living.scanPad) living.scanPad.visible = false;
  if (living.apron) living.apron.visible = false;
  if (living.ring) living.ring.visible = false;
  if (brandBack) brandBack.visible = false;
  freezeLivingModules();
  flattenMotion3Modules();
  setScanModuleLook(true);
  if (paperMat?.color) paperMat.color.setHex(0xffffff);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.16;
  scene.background = doorSkyTex;
  renderer.setClearColor(0xf4efe6, 1);
  if (controls) {
    controls.enabled = false;
    controls.autoRotate = false;
    controls.object = doorCam;
  }
  plantMotion3InField();
  setDoorBoomArm(true);
  lockMotion3Camera();
  setStatus("MOTION3 · hold");
  syncModeHud();
}

function beginMotion3MorphInPlace() {
  if (!motion3Wanted) return false;
  magicPhase = "flattening";
  freezeLivingModules();
  applyMotion3HoldLook();
  magicHoldStartedAt = performance.now();
  magicHoldMs = 0;
  magicModulesStable = false;
  magicPhase = "hold";
  setStatus("MOTION3 · hold");
  syncModeHud();
  if (!destLeave && !destLeaveTimer) {
    destLeaveTimer = window.setTimeout(() => {
      destLeaveTimer = 0;
      leaveToDest("motion3-morph-hold");
    }, MAGIC_HOLD_MS);
  }
  return true;
}

function applyDoorPose() {
  if (preview5Wanted) {
    applyPreview5Pose();
    return;
  }
  if (motion2Wanted) {
    applyMotion2Pose();
    return;
  }
  scanOpen = false;
  viewMode = "door";
  camera = doorCam;
  if (boom) boom.visible = true;
  studioGroup.visible = false;
  grid.visible = true;
  if (living.scanPad) living.scanPad.visible = false;
  if (living.apron) living.apron.visible = false;
  if (living.ring) living.ring.visible = false;
  setScanModuleLook(false);
  setDoorModuleLook(true);
  if (paperMat?.color) paperMat.color.setHex(0xf4efe6);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  scene.background = doorSkyTex;
  renderer.setClearColor(0xf4efe6, 1);
  if (controls) {
    controls.enabled = false;
    controls.autoRotate = false;
    controls.object = doorCam;
  }
  placeTwinInLivingWorld();
  if (motion3Wanted) {
    for (const m of mods) {
      if (m.userData.motion3ScaleY0 != null) m.scale.y = m.userData.motion3ScaleY0;
    }
    plantMotion3InField();
  }
  setDoorBoomArm(true);
  if (brandBack) brandBack.visible = false;
  lockDoorCamera();
  if (motion3Wanted) setStatus("MOTION3");
  else if (motion1Wanted) setStatus("MOTION1");
  else if (showtimeHudHidden()) setStatus("PORTABOOM");
  syncModeHud();
}

function applyScanPose() {
  scanOpen = true;
  viewMode = "scan";
  if (boom) boom.visible = false;
  studioGroup.visible = false;
  grid.visible = true;
  if (living.scanPad) living.scanPad.visible = true;
  if (living.apron) living.apron.visible = false;
  if (living.ring) living.ring.visible = false;
  if (brandBack) brandBack.visible = false;
  setLivingCaps(true);
  setScanModuleLook(true);
  if (paperMat?.color) paperMat.color.setHex(0xffffff);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.12;
  scene.background = new THREE.Color(0xffffff);
  renderer.setClearColor(0xffffff, 1);
  camera = scanCam;
  if (controls) {
    controls.enabled = false;
    controls.autoRotate = false;
  }
  fitScanOrtho();
  scanCam.up.set(0, 0, -1);
  scanCam.position.copy(SCAN_POSE.pos);
  scanCam.lookAt(SCAN_POSE.tgt);
  scanCam.updateProjectionMatrix();
  setStatus("Scan pose · point a phone at the field");
  syncModeHud();
}

function toggleScan() {
  if (motion3Wanted) {
    if (showtimePhase === "door") startShowtime();
    return;
  }
  if (motion1Wanted) {
    if (magicPhase === "hold" || magicPhase === "flattening") endMagicHold();
    else beginMagicHold();
    return;
  }
  if (showtimeHudHidden()) return;
  if (scanOpen) applyWorldPose();
  else applyScanPose();
}

function applyUnitPose() {
  camera = unitCam;
  if (controls) controls.object = unitCam;
  unitCam.near = 0.05;
  unitCam.far = 80;
  if (HOME.pos.lengthSq() > 0.01) {
    unitCam.position.copy(HOME.pos);
    unitCam.fov = HOME.fov || 32;
  }
  unitCam.updateProjectionMatrix();
  if (controls) {
    controls.target.copy(HOME.tgt);
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 0.85;
    controls.maxDistance = 12;
    controls.update();
  } else {
    unitCam.lookAt(HOME.tgt);
  }
}

function captureHome() {
  HOME.pos.copy(unitCam.position);
  HOME.fov = unitCam.fov;
  if (controls) HOME.tgt.copy(controls.target);
  else HOME.tgt.set(0, 0.7, 0);
}

function qrPose() {
  return {
    pos: new THREE.Vector3(0, 8, 0.0001),
    tgt: new THREE.Vector3(0, 0, 0),
    fov: 12,
  };
}

function startCamGlide(to, dur = 0.62) {
  camGlide = {
    fromPos: camera.position.clone(),
    fromTgt: (controls ? controls.target.clone() : HOME.tgt.clone()),
    fromFov: camera.fov,
    toPos: to.pos.clone(),
    toTgt: to.tgt.clone(),
    toFov: to.fov ?? camera.fov,
    t: 0,
    dur,
  };
}

function tickCamGlide(dt) {
  if (!camGlide) return;
  camGlide.t += dt;
  const u = Math.min(1, camGlide.t / camGlide.dur);
  const e = u * u * (3 - 2 * u);
  camera.position.lerpVectors(camGlide.fromPos, camGlide.toPos, e);
  camera.fov = THREE.MathUtils.lerp(camGlide.fromFov, camGlide.toFov, e);
  camera.updateProjectionMatrix();
  if (controls) {
    controls.target.lerpVectors(camGlide.fromTgt, camGlide.toTgt, e);
    controls.update();
  } else {
    camera.lookAt(camGlide.toTgt);
  }
  if (u >= 1) camGlide = null;
}

function syncDock() {
  const solarBtn = document.getElementById("solarBtn");
  const lightsBtn = document.getElementById("lightsBtn");
  const spinBtn = document.getElementById("spinBtn");
  const roundBtn = document.getElementById("signRoundBtn");
  const octBtn = document.getElementById("signOctagonBtn");
  if (solarBtn) {
    solarBtn.textContent = optsVisible.solar ? "Solar ON" : "Solar OFF";
    solarBtn.classList.toggle("on", optsVisible.solar);
    solarBtn.classList.toggle("off", !optsVisible.solar);
    solarBtn.setAttribute("aria-pressed", optsVisible.solar ? "true" : "false");
  }
  if (lightsBtn) {
    lightsBtn.textContent = optsVisible.traffic ? "Traffic lights ON" : "Traffic lights OFF";
    lightsBtn.classList.toggle("on", optsVisible.traffic);
    lightsBtn.classList.toggle("off", !optsVisible.traffic);
    lightsBtn.setAttribute("aria-pressed", optsVisible.traffic ? "true" : "false");
  }
  if (spinBtn) {
    spinBtn.textContent = spin ? "Spin ON" : "Spin OFF";
    spinBtn.classList.toggle("on", spin);
    spinBtn.classList.toggle("off", !spin);
    spinBtn.setAttribute("aria-pressed", spin ? "true" : "false");
  }
  const roundOn = signType !== "octagon";
  if (roundBtn) {
    roundBtn.classList.toggle("on", roundOn);
    roundBtn.classList.toggle("off", !roundOn);
    roundBtn.setAttribute("aria-pressed", roundOn ? "true" : "false");
  }
  if (octBtn) {
    octBtn.classList.toggle("on", !roundOn);
    octBtn.classList.toggle("off", roundOn);
    octBtn.setAttribute("aria-pressed", !roundOn ? "true" : "false");
  }
  const along = document.getElementById("signAlong");
  const alongLbl = document.getElementById("signAlongLbl");
  if (along) along.value = String(Math.round(signAlong * 100));
  if (alongLbl) alongLbl.textContent = `STOP ${Math.round(signAlong * 100)}%`;
}

/** Port of twin-core rigBoomMaster - rotates 主杆 up/down about shaft hinge. */
function rigBoomMaster(root) {
  const boomMeshes = [];
  const box = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    box.setFromObject(o);
    const tall = box.max.y > 2.2;
    const slim = box.max.x - box.min.x < 0.35 && box.max.z - box.min.z < 0.35;
    if (tall && slim) boomMeshes.push(o);
    else if (/主杆|105|灯条/.test(o.name || "")) boomMeshes.push(o);
  });
  if (!boomMeshes.length) {
    root.traverse((o) => {
      if (o.isMesh && /主杆|105/.test(o.name || "")) boomMeshes.push(o);
    });
  }
  if (!boomMeshes.length) return null;

  const hinge = new THREE.Vector3(0, 1.3, 0);
  let shaft = null;
  root.traverse((o) => {
    if (o.isMesh && /AK-D115-02-03-2/.test(o.name || "")) shaft = o;
  });
  if (shaft) {
    const sb = new THREE.Box3().setFromObject(shaft);
    sb.getCenter(hinge);
    hinge.y = sb.max.y;
  } else {
    let cx = 0, cz = 0;
    boomMeshes.forEach((o) => {
      box.setFromObject(o);
      cx += (box.min.x + box.max.x) / 2;
      cz += (box.min.z + box.max.z) / 2;
    });
    hinge.x = cx / boomMeshes.length;
    hinge.z = cz / boomMeshes.length;
  }

  const boomPivot = new THREE.Group();
  boomPivot.name = "BoomPivot";
  boomPivot.position.copy(hinge);
  // attach via scene then reparent under root (same as twin)
  scene.attach(boomPivot);
  boomMeshes.forEach((o) => {
    if (!isDescendantOf(o, boomPivot)) boomPivot.attach(o);
  });
  root.attach(boomPivot);

  let poleA0, poleA1;
  {
    boomPivot.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(boomPivot.matrixWorld).invert();
    const v = new THREE.Vector3();
    const polePts = [];
    boomPivot.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      if (!/主杆|105|灯条/.test(o.name || "")) return;
      const pos = o.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 200));
      for (let k = 0; k < pos.count; k += step) {
        v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
        polePts.push([v.x, v.y]);
      }
    });
    if (polePts.length < 4) {
      boomPivot.traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        const pos = o.geometry.attributes.position;
        for (let k = 0; k < pos.count; k += Math.max(1, pos.count >> 6)) {
          v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
          polePts.push([v.x, v.y]);
        }
      });
    }
    let far = -1;
    for (let a2 = 0; a2 < polePts.length; a2 += 3) {
      for (let b2 = a2 + 3; b2 < polePts.length; b2 += 3) {
        const dx = polePts[a2][0] - polePts[b2][0];
        const dy = polePts[a2][1] - polePts[b2][1];
        const d = dx * dx + dy * dy;
        if (d > far) {
          far = d;
          poleA0 = polePts[a2];
          poleA1 = polePts[b2];
        }
      }
    }
  }
  if (!poleA0 || !poleA1) return null;
  const d0 = poleA0[0] ** 2 + poleA0[1] ** 2;
  const d1 = poleA1[0] ** 2 + poleA1[1] ** 2;
  const base = d0 <= d1 ? poleA0 : poleA1;
  const tip = d0 <= d1 ? poleA1 : poleA0;
  const poleAngle = Math.atan2(tip[1] - base[1], tip[0] - base[0]);
  let boomRest = Math.PI / 2 - poleAngle;
  while (boomRest > Math.PI) boomRest -= 2 * Math.PI;
  while (boomRest < -Math.PI) boomRest += 2 * Math.PI;
  const probe = new THREE.Vector3();
  boomPivot.rotation.z = boomRest;
  boomPivot.updateMatrixWorld(true);
  probe.set(tip[0], tip[1], 0).applyMatrix4(boomPivot.matrixWorld);
  if (probe.y < hinge.y) boomRest += Math.PI;
  let boomDrop = -poleAngle;
  boomPivot.rotation.z = boomDrop;
  boomPivot.updateMatrixWorld(true);
  probe.set(tip[0], tip[1], 0).applyMatrix4(boomPivot.matrixWorld);
  if (probe.x < hinge.x) boomDrop = Math.PI - poleAngle;
  while (boomDrop - boomRest > Math.PI) boomDrop -= 2 * Math.PI;
  while (boomDrop - boomRest < -Math.PI) boomDrop += 2 * Math.PI;
  boomPivot.rotation.z = boomRest; // start UP
  killGhostBooms(root, boomPivot);
  return { pivot: boomPivot, rest: boomRest, drop: boomDrop, shownPct: 100, targetPct: 100, tipY: tip[1], tipAxis: "y" };
}

/**
 * One boom only. Attach leftover stripe / 主杆 meshes to BoomPivot so a
 * decoy copy cannot stay upright while the hinged arm lowers.
 */
function killGhostBooms(root, pivot) {
  if (!root || !pivot) return { attached: 0, hidden: 0, leftover: 0 };
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const sz = new THREE.Vector3();
  const leftovers = [];
  root.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    if (isDescendantOf(o, pivot)) return;
    if (isTrafficNode(o)) return;
    if (isDiscLikeMesh(o)) return;
    const n = `${o.name || ""}|${o.parent?.name || ""}`;
    box.setFromObject(o);
    box.getSize(sz);
    const tallSlim = sz.y > 1.05 && Math.max(sz.x, sz.z) < 0.62 && Math.min(sz.x, sz.z) < 0.48;
    const named = /主杆|105-|105_|灯条|BoomArm|HeroBoom|胶条|FENGKONG|^006$/.test(n);
    const tagged = o.userData?.tag === "B" || o.material?.userData?.stripe;
    if (tallSlim || named || tagged) leftovers.push(o);
  });
  let attached = 0;
  let hidden = 0;
  leftovers.forEach((o) => {
    try {
      if (!isDescendantOf(o, pivot)) {
        pivot.attach(o);
        attached += 1;
      }
    } catch {
      o.visible = false;
      hidden += 1;
    }
  });
  const hero = scene.getObjectByName("portaboom-hero-standin");
  if (hero && hero !== root) {
    hero.visible = false;
    if (hero.parent) hero.parent.remove(hero);
    hidden += 1;
  }
  const heroArm = root.getObjectByName("HeroBoomArm");
  if (heroArm && usingGlb) {
    heroArm.visible = false;
    hidden += 1;
  }
  const proof = { attached, hidden, leftover: leftovers.length };
  root.userData.ghostBoom = proof;
  return proof;
}

/** Visible stripe / boom meshes that are NOT on the hinged pivot = ghosts. */
function countUprightBoomGhosts() {
  if (!boom) return 0;
  const pivot = boomRig?.pivot || boom.getObjectByName("BoomPivot");
  let ghosts = 0;
  const box = new THREE.Box3();
  const sz = new THREE.Vector3();
  boom.traverse((o) => {
    if (!o.isMesh || !isVisibleInTree(o)) return;
    if (isTrafficNode(o)) return;
    if (pivot && isDescendantOf(o, pivot)) return;
    const tagged = o.userData?.tag === "B" || o.material?.userData?.stripe;
    const named = /主杆|105|灯条|BoomArm|HeroBoom/.test(o.name || "");
    if (!tagged && !named) return;
    box.setFromObject(o);
    box.getSize(sz);
    if (sz.y > 0.8 && sz.y > Math.max(sz.x, sz.z) * 1.45) ghosts += 1;
  });
  const hero = scene.getObjectByName("portaboom-hero-standin");
  if (hero && isVisibleInTree(hero) && boom !== hero) ghosts += 1;
  return ghosts;
}

function countMiniTrafficLights() {
  let n = 0;
  for (const m of mods) {
    if (!m) continue;
    if (m.userData?.hasTrafficLight) n += 1;
    m.traverse((o) => {
      if (/MiniSignal|MiniLantern|MiniTraffic|MiniBoom/.test(o.name || "")) n += 1;
    });
  }
  return n;
}

/** Hero stand-in arm - raise/lower works before (and if) the CAD rig mounts. */
function rigHeroArm(hero) {
  const arm = hero?.userData?.heroArm || hero?.getObjectByName?.("HeroBoomArm");
  if (!arm) return null;
  const drop = 0.06;
  const rest = 1.12;
  arm.rotation.z = rest;
  return { pivot: arm, rest, drop, shownPct: 100, targetPct: 100, tipY: 2.05, tipAxis: "x" };
}

function setBoomPct(pct) {
  if (!boomRig) return;
  boomRig.targetPct = Math.max(0, Math.min(100, pct));
}

function applyBoomShown(pct) {
  if (!boomRig) return;
  const p = Math.max(0, Math.min(100, pct));
  boomRig.shownPct = p;
  boomRig.targetPct = p;
  if (!boomRig.pivot) return;
  const u = p / 100;
  boomRig.pivot.rotation.z = boomRig.drop + (boomRig.rest - boomRig.drop) * u;
}

function tickBoom(dt) {
  if (!boomRig || !boomRig.pivot) return;
  if (showtimePhase === "playing") return;
  const d = boomRig.targetPct - boomRig.shownPct;
  const rate = boomRig.speed || 56;
  const step = Math.min(Math.abs(d), rate * dt);
  if (step > 0.01) boomRig.shownPct += Math.sign(d) * step;
  else boomRig.shownPct = boomRig.targetPct;
  const p = boomRig.shownPct / 100;
  boomRig.pivot.rotation.z = boomRig.drop + (boomRig.rest - boomRig.drop) * p;
}

/**
 * Port of twin-core livery.ts - ONLY two PORTABOOM logos:
 * front approach (local −Z, yaw π) and opposite face (local +Z, yaw 0).
 * Texture: twin door_decal.png (stacked PORTA / BOOM). No side plate. No chrome plate.
 */
function addLogoDecal(root) {
  const stale = [];
  root.traverse((o) => {
    if (/PortaboomLogo/.test(o.name || "") || o.userData?.decal) stale.push(o);
  });
  stale.forEach((o) => o.parent && o.parent.remove(o));

  const loader = new THREE.TextureLoader();
  const src = "./door_decal.png?b=b034e56e";
  loader.load(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const skip = /PED_|TL2_|Traffic[_\s-]*Light|HeroSignal|主杆|105|灯条|拉环|环6|FENGKONG|PRT|^006$|太阳能|固定板|管套|柱子|螺柱|调节/;
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    let door = null;
    root.traverse((o) => {
      if (/^115-DOOR$/.test(o.name || "")) door = o;
      if (!door && /AK-XLH-D115C-01-02-1|HeroCabinet/.test(o.name || "")) door = o;
    });
    let yBand = -0.3;
    const logoW = 0.26; // twin addDecals - FIXED local width, not faceSpan*0.72
    if (door) {
      const dc = worldBox(door).getCenter(new THREE.Vector3());
      root.worldToLocal(dc);
      yBand = dc.y;
    }
    let zMin = Infinity;
    let zMax = -Infinity;
    const v = new THREE.Vector3();
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position || skip.test(o.name || "")) return;
      const pos = o.geometry.attributes.position;
      const step = Math.max(1, pos.count >> 7);
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
        if (Math.abs(v.x) > 0.22 || Math.abs(v.y - yBand) > 0.13) continue;
        if (v.z < zMin) zMin = v.z;
        if (v.z > zMax) zMax = v.z;
      }
    });
    if (door && (!Number.isFinite(zMin) || !Number.isFinite(zMax))) {
      const db = worldBox(door);
      const a = db.min.clone().applyMatrix4(inv);
      const b = db.max.clone().applyMatrix4(inv);
      zMin = Math.min(a.z, b.z);
      zMax = Math.max(a.z, b.z);
    }
    const backZ = Number.isFinite(zMax) ? zMax : 0.2525;
    const frontZ = Number.isFinite(zMin) ? zMin : -0.2525;
    const place = (name, x, y, z, yaw) => {
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(logoW, logoW * 0.698),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        })
      );
      plate.name = name;
      plate.position.set(x, y, z);
      plate.rotation.y = yaw;
      plate.userData.decal = true;
      // morph2: the decal loads late; it stays under the reveal plane like the rest of the unit.
      if (morph2Wanted) morph2Clip(plate);
      root.add(plate);
    };
    // Front approach (cabinet door / viewer after instance.ts Math.PI plant)
    place("PortaboomLogoFace", 0, yBand, frontZ - 0.002, Math.PI);
    // Opposite face - the only other PORTABOOM mark (livery.ts)
    place("PortaboomLogoOpposite", 0, yBand, backZ + 0.002, 0);
    root.userData.logoLocalW = logoW;
    root.userData.logoWorldW = logoW * (root.scale?.x || 1);
  }, undefined, () => {
    loader.load("./portaboom_logo.png?b=b034e56e", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.26, 0.26 * 0.698),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
      );
      plate.name = "PortaboomLogoFace";
      plate.position.set(0, -0.3, -0.255);
      plate.rotation.y = Math.PI;
      root.add(plate);
      if (morph2Wanted) morph2Clip(plate);
    });
  });
}

function paintGlb(root) {
  const matNavy = new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.44, metalness: 0.12 });
  const matSteel = new THREE.MeshStandardMaterial({
    color: LIVERY.S, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.2,
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: LIVERY.K, metalness: 0.12, roughness: 0.5, envMapIntensity: 0.85,
  });
  const skip = /垫|螺钉|螺柱|开口销|PART_244|PART_609|PART_602|GB_T|自攻|十字槽|环芯/i;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const name = `${o.name || ""}|${o.parent?.name || ""}`;
    const traffic = isTrafficNode(o);
    if (skip.test(name) && !traffic) {
      o.visible = false;
      return;
    }
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const r = o.geometry.boundingSphere?.radius || 0;
    if (r > 0 && r < 0.015 && !traffic) {
      o.visible = false;
      return;
    }
    o.castShadow = true;
    o.receiveShadow = true;
    if (traffic) {
      const r0 = firstMatRgb(o);
      if (r0 === "red" || r0 === "amber" || r0 === "green") return;
      if (isTrafficPoleMesh(o)) {
        o.material = matSteel;
        o.userData.tag = "S";
        return;
      }
      o.material = new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.48, metalness: 0.14 });
      return;
    }
    if (/灯条/.test(name)) {
      if (isDiscLikeMesh(o)) o.visible = false;
      return;
    }
    const src = firstMat(o)?.color;
    let tag = src ? classifyLiveryRgb(src.r, src.g, src.b) : null;
    if (/车轮|wheel/i.test(name)) tag = "K";
    else if (/主杆|胶条|105-|105_|105$|PRT000|FENGKONG|^006$|^0001$/i.test(name)) tag = "B";
    else if (!tag) {
      if (/AK-XLH|115-DOOR|小门|箱|柜|门|compound|DAO-ZHA|d115c|电池/i.test(name)) tag = "Y";
      else if (/LOCK-NEW|不锈钢|stainless/i.test(name)) tag = "S";
    }
    o.userData.tag = tag;
    if (tag === "Y") o.material = powderMat(LIVERY.Y);
    else if (tag === "S") o.material = matSteel;
    else if (tag === "B") o.material = stripeMaterial(o.geometry);
    else if (tag === "G") {
      // leftover CAD lime glow discs - hide, do not keep a green/yellow orb
      o.visible = false;
    } else if (tag === "A") {
      o.material = new THREE.MeshStandardMaterial({
        color: LIVERY.A, emissive: LIVERY.A, emissiveIntensity: 0.5, roughness: 0.2,
      });
    } else if (tag === "R") {
      o.material = new THREE.MeshStandardMaterial({
        color: LIVERY.R, metalness: 0.12, roughness: 0.5, envMapIntensity: 0.85,
      });
    } else if (tag === "K") o.material = matDark;
    else if (/太阳能|solar/i.test(name)) o.material = matNavy;
    else o.material = r > 0.55 ? powderMat(LIVERY.Y) : matDark;
  });
}

function isTrafficPoleMesh(o) {
  if (!o?.isMesh || !o.geometry) return false;
  const n = `${o.name || ""}|${o.parent?.name || ""}`;
  if (/AK-XLH-D115C-03/i.test(n)) return false;
  if (/柱子|灯杆|立柱|立杆|pole|mast/i.test(n) && isTrafficNode(o)) return true;
  if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
  const local = o.geometry.boundingBox.getSize(new THREE.Vector3());
  const locSorted = [local.x, local.y, local.z].sort((a, b) => a - b);
  const slimLocal = locSorted[2] > 0.15 && locSorted[0] < 0.09 && locSorted[1] < 0.09;
  const box = new THREE.Box3().setFromObject(o);
  const wsz = box.getSize(new THREE.Vector3());
  const poleWorld = wsz.y > 0.22 && Math.max(wsz.x, wsz.z) < 0.18;
  return slimLocal || poleWorld;
}

function paintTrafficPolesStainless(root) {
  if (!root) return 0;
  let n = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!isTrafficNode(o) && !/柱子|灯杆|立柱|立杆|pole|mast/i.test(o.name || "")) return;
    if (!isTrafficPoleMesh(o)) return;
    o.material = stainlessMat();
    o.userData.tag = "S";
    o.visible = true;
    n += 1;
  });
  return n;
}

function firstMat(o) {
  if (!o) return null;
  return Array.isArray(o.material) ? o.material[0] : o.material;
}

function firstMatRgb(o) {
  const c = firstMat(o)?.color;
  if (!c) return "other";
  const { r, g, b } = c;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max < 0.1) return "black";
  if (max - min < 0.1) return "grey";
  if (r > 0.5 && r > g * 1.55 && r > b * 1.55) return "red";
  if (g > 0.4 && g > r * 1.1 && g >= b * 0.9) return "green";
  if (r > 0.4 && g > 0.12 && g < 0.7 && b < 0.28) return "amber";
  return "other";
}

function setAspectHud(kind) {
  if (!aspectEl) return;
  aspectEl.dataset.aspect = kind;
  aspectEl.textContent = kind.toUpperCase();
}

function addGlowHalo(mesh, kind) {
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 28),
    new THREE.MeshBasicMaterial({
      color: LAMP_COL[kind],
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  halo.name = `SignalHalo_${kind}`;
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox;
  const sz = bb.getSize(new THREE.Vector3());
  const mid = bb.getCenter(new THREE.Vector3());
  const scale = Math.max(sz.x, sz.y, sz.z) * 1.15 || 0.22;
  halo.scale.setScalar(scale / 0.24);
  const axis = sz.x <= sz.y && sz.x <= sz.z
    ? "x"
    : sz.y <= sz.z
      ? "y"
      : "z";
  if (axis === "x") halo.rotation.y = Math.PI / 2;
  else if (axis === "y") halo.rotation.x = Math.PI / 2;
  halo.position.copy(mid);
  if (axis === "z") halo.position.z += 0.004;
  else if (axis === "x") halo.position.x += 0.004;
  else halo.position.y += 0.004;
  mesh.add(halo);
  const light = new THREE.PointLight(LAMP_COL[kind], 0.2, 2.4, 2);
  light.name = `SignalLight_${kind}`;
  light.position.copy(mid);
  mesh.add(light);
  return { halo, light };
}

function rigTrafficLamps(root) {
  lampMats = { red: null, amber: null, green: null };
  lampHalos = { red: null, amber: null, green: null };
  lampLights = { red: null, amber: null, green: null };

  const signalMeshes = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (/Traffic[_\s.-]*Light|HeroLens|HeroSignal|信号灯/i.test(ancestorBlob(o))) signalMeshes.push(o);
  });

  const byColor = { red: [], amber: [], green: [], housing: [] };
  const discs = [];
  signalMeshes.forEach((o) => {
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const sz = o.geometry.boundingBox.getSize(new THREE.Vector3());
    const sorted = [sz.x, sz.y, sz.z].sort((a, b) => a - b);
    const disc = sorted[0] < 0.045 && Math.abs(sorted[1] - sorted[2]) < 0.1 && sorted[1] > 0.07;
    if (disc) discs.push(o);
    const kind = firstMatRgb(o);
    if ((kind === "red" || kind === "amber" || kind === "green") && (o.geometry.boundingSphere?.radius || 0) < 0.35) {
      byColor[kind].push(o);
    } else if (!disc) {
      byColor.housing.push(o);
    }
  });
  if (discs.length >= 3) {
    discs.sort((a, b) => worldBox(b).getCenter(new THREE.Vector3()).y - worldBox(a).getCenter(new THREE.Vector3()).y);
    byColor.red = [discs[0]];
    byColor.amber = [discs[1]];
    byColor.green = [discs[2]];
  }

  ["red", "amber", "green"].forEach((kind) => {
    const mesh = byColor[kind][0];
    if (!mesh) return;
    const mat = makeLampMat(kind, kind === "green");
    mesh.material = mat;
    mesh.name = mesh.name && /lens/i.test(mesh.name) ? mesh.name : `SignalLens_${kind}`;
    lampMats[kind] = mat;
    const glow = addGlowHalo(mesh, kind);
    lampHalos[kind] = glow.halo.material;
    lampLights[kind] = glow.light;
  });

  byColor.housing.forEach((o) => {
    if (Object.values(lampMats).includes(o.material)) return;
    if (isTrafficPoleMesh(o)) {
      o.material = stainlessMat();
      o.userData.tag = "S";
      return;
    }
    o.material = new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.48, metalness: 0.14 });
  });

  setSignalAspect("green");
}

function setSignalAspect(kind) {
  signalAspect = kind;
  if (!optsVisible.traffic) {
    setAspectHud("off");
    for (const k of ["red", "amber", "green"]) {
      const m = lampMats[k];
      if (m) m.emissiveIntensity = 0.02;
      const h = lampHalos[k];
      if (h) h.opacity = 0;
      const l = lampLights[k];
      if (l) l.intensity = 0;
    }
    return;
  }
  for (const k of ["red", "amber", "green"]) {
    const on = k === kind;
    const m = lampMats[k];
    if (m) m.emissiveIntensity = on ? 8.8 : 0.07;
    const h = lampHalos[k];
    if (h) h.opacity = on ? 0.55 : 0.04;
    const l = lampLights[k];
    if (l) l.intensity = on ? 2.1 : 0.05;
  }
  const hero = boom?.userData?.heroHead;
  if (hero) {
    ["red", "amber", "green"].forEach((k) => {
      const lens = hero.getObjectByName(`HeroLens_${k}`);
      if (lens?.material) lens.material.emissiveIntensity = k === kind ? 8.8 : 0.08;
    });
  }
  setAspectHud(kind);
}

/** Twin-core lights.ts updateLeds - the only LED SoT. Per-lens mats for L/R alternate. */
let ledRig = {
  faceMat: null,
  faceMats: [],
  faceGlows: [],
  stripMat: null,
  lastShownPct: 100,
  movingHoldUntil: 0,
};
let showMode = "up";
let showClock = 0;

function findDoorLedHosts(root) {
  const hits = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const n = `${o.name || ""}|${o.parent?.name || ""}`;
    if (/转接板/.test(n) && /DOOR|门/i.test(n)) hits.push(o);
  });
  if (hits.length >= 2) return hits.slice(0, 2);
  const box = new THREE.Box3();
  const c = new THREE.Vector3();
  const sz = new THREE.Vector3();
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || isTrafficNode(o)) return;
    box.setFromObject(o);
    box.getSize(sz);
    c.copy(box.getCenter(new THREE.Vector3())).applyMatrix4(inv);
    const thin = Math.min(sz.x, sz.y, sz.z);
    const wide = Math.max(sz.x, sz.y, sz.z);
    if (thin < 0.02 && wide > 0.04 && wide < 0.12) hits.push(o);
  });
  return hits.slice(0, 2);
}

function rigTwinLeds(root) {
  const bezelMat = alumMat();
  const faceMats = [];
  const hosts = findDoorLedHosts(root).slice().sort((a, b) => {
    return worldBox(a).getCenter(new THREE.Vector3()).x - worldBox(b).getCenter(new THREE.Vector3()).x;
  });
  hosts.forEach((host) => {
    host.visible = false;
    const faceMat = makeFaceLedMat(true);
    faceMats.push(faceMat);
    const box = worldBox(host);
    const c = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const r = Math.max(0.028, Math.min(sz.x, sz.y) * 0.48);
    const camPos = unitCam.position;
    const toCam = new THREE.Vector3(camPos.x - c.x, 0, camPos.z - c.z);
    if (toCam.lengthSq() < 1e-6) toCam.set(0, 0, 1);
    else toCam.normalize();
    const bezel = new THREE.Mesh(new THREE.CircleGeometry(r + 0.006, 40), bezelMat);
    bezel.name = "PortaboomLedBezel";
    const lens = new THREE.Mesh(new THREE.CircleGeometry(r, 48), faceMat);
    lens.name = "PortaboomFaceLed";
    const pos = c.clone().addScaledVector(toCam, Math.max(0.006, Math.min(sz.x, sz.z) * 0.5 + 0.004));
    bezel.position.copy(pos);
    lens.position.copy(pos).addScaledVector(toCam, 0.002);
    bezel.lookAt(pos.x + toCam.x, pos.y, pos.z + toCam.z);
    lens.lookAt(pos.x + toCam.x, pos.y, pos.z + toCam.z);
    scene.add(bezel);
    scene.add(lens);
    root.attach(bezel);
    root.attach(lens);
  });
  let stripMat = null;
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!/灯条/.test(`${o.name || ""}|${o.parent?.name || ""}`)) return;
    const sz = worldBox(o).getSize(new THREE.Vector3());
    const sorted = [sz.x, sz.y, sz.z].sort((a, b) => a - b);
    const disc = sorted[0] < 0.05 && Math.abs(sorted[1] - sorted[2]) < 0.1;
    if (disc) {
      o.visible = false;
      return;
    }
    stripMat = new THREE.MeshStandardMaterial({
      color: FACE_GREEN_BASE, emissive: STRIP_GREEN, emissiveIntensity: 4,
      roughness: 0.28, metalness: 0.08, toneMapped: false,
    });
    o.material = stripMat;
  });
  ledRig = {
    faceMat: faceMats[0] || null,
    faceMats,
    faceGlows: [],
    stripMat,
    lastShownPct: boomRig?.shownPct ?? 100,
    movingHoldUntil: 0,
  };
}

/** Port of twin-core lights.ts updateLeds. Face LEDs alternate L/R when advisory.
 */
function updateLeds() {
  const faces = ledRig.faceMats?.length ? ledRig.faceMats : (ledRig.faceMat ? [ledRig.faceMat] : []);
  if (!faces.length && !ledRig.stripMat) return;
  const now = performance.now();
  const shown = boomRig ? boomRig.shownPct : 100;
  const target = boomRig ? boomRig.targetPct : 100;
  if (Math.abs(shown - ledRig.lastShownPct) > 0.03) ledRig.movingHoldUntil = now + 700;
  ledRig.lastShownPct = shown;
  const moving = now < ledRig.movingHoldUntil || Math.abs(shown - target) > 4;
  const down = target === 0;
  const advisory = moving || down;
  const flashOn = now % 640 < 340;
  faces.forEach((face, i) => {
    if (advisory) {
      face.color.setHex(FACE_RED_BASE);
      face.emissive.setHex(FACE_RED);
      const on = faces.length > 1 ? (i === 0 ? flashOn : !flashOn) : flashOn;
      face.emissiveIntensity = on ? 8 : 1.6;
    } else {
      face.color.setHex(FACE_GREEN_BASE);
      face.emissive.setHex(FACE_GREEN);
      face.emissiveIntensity = 5.5;
    }
  });
  const strip = ledRig.stripMat;
  if (strip) {
    if (advisory) {
      strip.color.setHex(0x300000);
      strip.emissive.setHex(STRIP_RED);
      strip.emissiveIntensity = flashOn ? 10 : 1.2;
    } else {
      strip.color.setHex(FACE_GREEN_BASE);
      strip.emissive.setHex(STRIP_GREEN);
      strip.emissiveIntensity = 5;
    }
  }
}

function beginAmberThenClose() {
  if (!boomRig) return;
  showMode = "amber";
  showClock = 0;
  setSignalAspect("amber");
  setStatus("Amber - boom holds, then drops red");
}

function beginCloseSequence() {
  if (!boomRig) return;
  showMode = "closing";
  showClock = 0;
  setBoomPct(0);
  setSignalAspect("red");
  setStatus("Boom lowering…");
}

function beginRaiseSequence() {
  if (!boomRig) return;
  showMode = "raising";
  showClock = 0;
  setBoomPct(100);
  setSignalAspect("red");
  setStatus("Boom raising…");
}

/** Boom motion beat. Showtime holds down+red. Dock raise/lower otherwise. */
function tickShow(dt) {
  if (!boomRig || flat) return;
  showClock += dt;
  if (showtimePhase === "playing") {
    showtimeElapsed = (performance.now() - showtimeStartedAt) / 1000;
    const t = showtimeElapsed;
    const greenEnd = SHOWTIME_GREEN_S;
    const amberEnd = greenEnd + SHOWTIME_AMBER_S;
    const redEnd = amberEnd + SHOWTIME_RED_HOLD_S;
    const lowerEnd = redEnd + SHOWTIME_LOWER_S;
    if (t < greenEnd) {
      showMode = "green";
      setSignalAspect("green");
      applyBoomShown(100);
    } else if (t < amberEnd) {
      showMode = "amber";
      setSignalAspect("amber");
      applyBoomShown(100);
    } else if (t < redEnd) {
      showMode = "redhold";
      setSignalAspect("red");
      applyBoomShown(100);
    } else if (t < lowerEnd) {
      showMode = "closing";
      setSignalAspect("red");
      const u = (t - redEnd) / SHOWTIME_LOWER_S;
      const eased = u * u * (3 - 2 * u);
      applyBoomShown(100 * (1 - eased));
    } else {
      showMode = "down";
      setSignalAspect("red");
      applyBoomShown(0);
      if (t >= lowerEnd + SHOWTIME_HOLD_S) {
        settleShowtime();
      }
    }
    return;
  }
  if (showtimePhase === "settled") {
    setBoomPct(0);
    if (optsVisible.traffic) setSignalAspect("red");
    return;
  }
  if (showMode === "up") {
    setBoomPct(100);
    if (optsVisible.traffic) setSignalAspect("green");
  } else if (showMode === "amber") {
    setSignalAspect("amber");
    if (showClock > 0.75) beginCloseSequence();
  } else if (showMode === "closing") {
    setSignalAspect("red");
    if (boomRig.shownPct <= 1.5) {
      showMode = "down";
      showClock = 0;
    }
  } else if (showMode === "down") {
    setSignalAspect("red");
    if (showClock > 0.4) beginRaiseSequence();
  } else if (showMode === "raising") {
    setSignalAspect("red");
    if (boomRig.shownPct >= 99) {
      showMode = "up";
      showClock = 0;
      setSignalAspect("green");
      setStatus("Idle. Boom up.");
    }
  }
}

function removeHero() {
  if (boom && boom.parent) boom.parent.remove(boom);
}

setStatus("Living QR · tap to scan the field");
boomRig = rigHeroArm(boom);
ledRig.faceMats = boom.userData.heroFaceMats || [];
ledRig.faceMat = ledRig.faceMats[0] || boom.userData.heroFaceMat || null;
ledRig.stripMat = boom.getObjectByName("PortaboomBoomStrip")?.material || null;
rigTrafficLamps(boom);
setSignType("round");
addLogoDecal(boom);
setSignalAspect("green");
if (motion2Wanted) {
  document.body.classList.add("showtime");
  applyMotion2Pose();
  showtimePhase = "door";
  armDoorBeat();
  syncModeHud();
} else if (motion3Wanted) {
  magicPhase = "idle";
  document.body.classList.add("showtime");
  applyDoorPose();
  showtimePhase = "door";
  armDoorBeat();
  syncModeHud();
} else if (motion1Wanted) {
  magicPhase = "idle";
  document.body.classList.add("showtime");
  applyDoorPose();
  if (showtimeWanted) {
    showtimePhase = "door";
    armDoorBeat();
  }
  syncModeHud();
} else if (showtimeWanted) {
  showtimePhase = "door";
  document.body.classList.add("showtime");
  applyDoorPose();
  syncModeHud();
}

const loader = new GLTFLoader();

function mountCad(gltf, label) {
  try {
    const cad = gltf.scene;
    cad.name = "Pb4000Twin";
    const probe = new THREE.Box3().setFromObject(cad);
    const probeSize = probe.getSize(new THREE.Vector3());
    if (Math.max(probeSize.x, probeSize.y, probeSize.z) < 0.05) {
      setStatus("Placeholder GLB. Hero stand-in stays.");
      return;
    }
    paintGlb(cad);
    applyCoreShowConfig(cad);
    const s = plantTwin(cad);
    removeHero();
    boom = cad;
    baseScale = s || 1;
    boom.userData.restY = boom.position.y;
    scene.add(boom);
    faceSignalHead(boom);
    usingGlb = true;
    boomRig = rigBoomMaster(boom);
    if (boomRig) boomRig.speed = 38;
    measurePlantedScale(boom);
    repaintBoomStripes(boom);
    rigTwinLeds(boom);
    rigTrafficLamps(boom);
    paintTrafficPolesStainless(boom);
    killStrayGlowDiscs(boom);
    setSignType(signType || "round");
    addLogoDecal(boom);
    applyCoreShowConfig(boom);
    if (boomRig?.pivot) killGhostBooms(boom, boomRig.pivot);
    boom.visible = true;
    placeTwinInLivingWorld();
    if (scanOpen) setScanModuleLook(true);
    else setDoorModuleLook(true);
    if (motion2Wanted) {
      applyBoomShown(100);
      setSignalAspect("green");
      if (magicPhase === "hold" || showtimePhase === "settled") {
        beginMotion2FlattenThenDest();
      } else if (showtimePhase === "playing") {
        applyMotion2Pose();
        boomRig.speed = 100 / SHOWTIME_LOWER_S;
      } else {
        applyMotion2Pose();
        showtimePhase = "door";
        armDoorBeat();
      }
    } else if (motion3Wanted) {
      applyBoomShown(100);
      setSignalAspect("green");
      if (magicPhase === "hold" || showtimePhase === "settled") {
        beginMotion3MorphInPlace();
      } else if (showtimePhase === "playing") {
        applyDoorPose();
        boomRig.speed = 100 / SHOWTIME_LOWER_S;
      } else {
        magicPhase = "idle";
        applyDoorPose();
        showtimePhase = "door";
        armDoorBeat();
      }
    } else if (motion1Wanted) {
      applyBoomShown(100);
      setSignalAspect("green");
      if (magicPhase === "hold") {
        beginMagicHold();
      } else {
        applyDoorPose();
        if (showtimeWanted && showtimePhase !== "playing" && showtimePhase !== "settled") {
          showtimePhase = "door";
          armDoorBeat();
        }
      }
    } else if (showtimeWanted && showtimePhase !== "settled") {
      applyDoorPose();
      if (showtimePhase === "playing") {
        boomRig.speed = 100 / SHOWTIME_LOWER_S;
      } else {
        showtimePhase = "door";
        applyBoomShown(100);
        setSignalAspect("green");
        armDoorBeat();
      }
    } else {
      applyWorldPose();
      showMode = "up";
      showClock = 0;
      setSignalAspect("green");
      if (boomRig) setStatus("Living QR · tap to scan the field");
      else setStatus(label);
    }
    if (morph1Wanted) morph1UnitReady();
  } catch (err) {
    console.error(err);
    setStatus("CAD parse error. Hero stand-in still live.");
  }
}

const NAMED = new URL("./pb4000_named.glb?b=b034e56e", import.meta.url).href;

function loadNamed(reason) {
  console.warn(reason);
  setStatus("Loading named twin…");
  loader.load(
    NAMED,
    (gltf) => mountCad(gltf, "Idle. PB4000 clean core. Front. Orbit."),
    (e) => {
      if (e.total && !usingGlb) {
        setStatus(`Loading named twin ${Math.round((100 * e.loaded) / e.total)}%.`);
      }
    },
    (err2) => {
      if (morph1Wanted) morph1.unitFailed = true;
      console.error(err2);
      setStatus("CAD blocked. Hero stand-in still live.");
    }
  );
}

async function bootTwin() {
  // Named twin first, no Meshopt. Static MeshoptDecoder import blanked phones.
  // Golden compressed.glb skipped for this preview (EXT_meshopt_compression).
  try {
    const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/");
    loader.setDRACOLoader(draco);
  } catch (e) {
    console.warn("Draco setup failed; hero stand-in stays if named needs it", e);
  }
  loadNamed("named-first");
}
requestAnimationFrame(() => {
  requestAnimationFrame(bootTwin);
});

function setFlat(next) {
  // Flatten-to-QR is gone from the product path. Print PNG is a demoted export.
  if (next) exportPrintPng();
}

function exportPrintPng() {
  const result = downloadPrintPng(destQr.matrix);
  setStatus("Print export saved - not the live scan. Point a phone at the 3D scene.");
  if (hintEl) hintEl.textContent = "Print PNG is a secondary export. Scan the living 3D QR.";
  return result;
}

function syncModeHud() {
  document.body.classList.toggle("scan-open", scanOpen);
  document.body.classList.remove("unit-dock");
  document.body.classList.toggle("showtime", showtimeHudHidden());
  const badge = document.getElementById("modeBadge");
  if (badge) badge.textContent = scanOpen ? "Scan" : "Living QR";
  const liveDock = document.getElementById("liveDock");
  if (liveDock) liveDock.hidden = showtimeHudHidden();
  const moreDock = document.getElementById("moreDock");
  if (moreDock) moreDock.hidden = !scanOpen || showtimeHudHidden();
  const scanBtn = document.getElementById("scanBtn");
  if (scanBtn) {
    scanBtn.textContent = scanOpen ? "World" : "Tap to scan";
    scanBtn.classList.toggle("primary", !scanOpen);
    scanBtn.classList.toggle("ghost", scanOpen);
  }
  const lifeBtn = document.getElementById("lifeBtn");
  if (lifeBtn) {
    lifeBtn.textContent = lifeOn ? "Life ON" : "Life OFF";
    lifeBtn.classList.toggle("on", lifeOn);
    lifeBtn.classList.toggle("off", !lifeOn);
    lifeBtn.setAttribute("aria-pressed", lifeOn ? "true" : "false");
  }
}

function setViewMode(next) {
  if (motion2Wanted) {
    applyMotion2Pose();
    return;
  }
  if (motion3Wanted) {
    if (magicPhase === "hold") beginMotion3MorphInPlace();
    else applyDoorPose();
    return;
  }
  if (motion1Wanted) {
    if (magicPhase === "hold") beginMagicHold();
    else applyDoorPose();
    return;
  }
  if (showtimeWanted) {
    applyDoorPose();
    return;
  }
  if (next === "scan") applyScanPose();
  else applyWorldPose();
}

function resize() {
  const w = Math.max(1, canvas.clientWidth || innerWidth);
  const h = Math.max(1, canvas.clientHeight || innerHeight);
  renderer.setSize(w, h, false);
  unitCam.aspect = w / h;
  unitCam.updateProjectionMatrix();
  if (viewMode === "door") {
    if (motion3Wanted && magicPhase === "hold") applyMotion3HoldLook();
    else if (motion3Wanted) lockMotion3Camera();
    else fitDoorOrtho();
  } else if (viewMode === "motion2") {
    unitCam.aspect = w / h;
    unitCam.updateProjectionMatrix();
    if (boom) lockMotion2Camera(boom);
  } else if (viewMode === "preview5") {
    unitCam.aspect = w / h;
    unitCam.updateProjectionMatrix();
    if (boom) lockHeroCamera(boom);
  } else if (scanOpen) fitScanOrtho();
  else camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
resize();

/* ------------------------------------------------------------------ *
 * morph1 timeline: frame 0 is the still (the real unit lying on its back in
 * the middle of the QR) -> the unit hinges up while it steps back into the
 * field, modules rise, the camera tilts to a portrait-composed eye-level
 * shot -> showtime (green 0.5s, amber 1s, red 0.5s, boom down) -> DEST.
 * ------------------------------------------------------------------ */
/** Minimum time the flat QR holds before it starts to rise. */
const MORPH1_FLAT_MIN_S = editorMode ? 0.2 : 1.4;
/** Longest wait for the GLB before rising with the stand-in unit. */
/** Real GLB must arrive by then; otherwise (or on a load error) play the recorded morph instead. */
const MORPH1_UNIT_WAIT_MAX_S = 25;
/*
 * Rise timeline (seconds from the end of the flat hold):
 *  0.05-3.25 the unit hinges up on its bottom-back edge (3.2 s, ease in-out)
 *           and slides back to its standing spot; modules ripple up
 *  2.5-4.1  the boom arm swings up (red until it is up, then green)
 *  0.1-3.5  camera comes down from top-down to eye level
 *  then a short beat and the boom cycle
 */
const MORPH1_HINGE_S = [0.05, 3.25];
/** The boom arm, laid along the ground in the still, swings up once the unit is nearly upright. */
const MORPH1_ARM_S = [2.5, 4.1];
const MORPH1_TILT_S = [0.1, 3.5];
/** The QR modules stay a flat navy tile floor; a low wave runs out through them. */
const MORPH1_MOD_DELAY_S = 0.35;
const MORPH1_RIPPLE_S = 1.1;
const MORPH1_MOD_RISE_S = 0.9;
/** Peak wave height as a multiple of the tile thickness. */
const MORPH1_WAVE_AMP = 3;
/** Scan caps fade out as the cuboids come up. */
const MORPH1_CAP_FADE = [1.3, 2.5];
/** Beat with the unit up before the boom cycle starts. */
const MORPH1_HOLD_S = 0.35;
/** Flat module height (fraction of full) for frame 0. */
const MORPH1_FLAT_SCALE = 0.04;
/** Frame 0: QR pad width as a fraction of the screen width ... */
const MORPH1_SCAN_FRAC = 0.9;
/** ... capped so the "Tap to scan" button fits under the square (CSS px, matches index.html). */
const MORPH1_BTN_SPACE = 100;
/** Frame 0 camera: top-down, near-orthographic long lens (degrees). */
const MORPH1_SCAN_FOV = 0.5;
/** Ortho camera distance for the still bake (top-down). */
const MORPH1_SCAN_DIST = 12;
/** Simulated scan: focus brackets + scan line over the QR before the morph. */
const MORPH1_SWEEP_S = 0.8;
/**
 * morph2 / morph3 / minions start by themselves: once the canvas has taken over from the still,
 * the QR holds for a short beat and the scan runs with no input (real scanners never see a button).
 * ?test=1 shows the "Tap to scan" button and waits for a tap; ?autoplay=1 is an alias of the default.
 */
const morph1TestMode = pageParams.get("test") === "1";
const morph1Autoplay = pageParams.get("autoplay") === "1" || (morph2Wanted && !morph1TestMode);
/** Still hold between the canvas being ready and the automatic scan (s). */
const MORPH1_AUTO_DELAY_S = Math.min(3, Math.max(0, Number(CFG.scan?.auto_start_delay_s ?? 0.8)));
/** Nudge of the lying silhouette from centre, in modules (x, z). */
const MORPH1_LYING_SHIFT = [1.6, -0.5];
/** Where the unit stands at the end, as a fraction of the pad (negative = far side); centred in x. */
const MORPH1_STAND_Z_FRAC = -0.05;
/*
 * End camera: standing in front of the unit. Eye at the signal lens height,
 * zero pitch (perspective), centred on the cabinet + signal housing. The
 * frame is composed with a vertical lens shift, never by tilting.
 */
const MORPH1_END_FOV_PORTRAIT = CFG.camera.fov_portrait;
const MORPH1_END_FOV_WIDE = CFG.camera.fov_wide;
/** Unit (ground to top of the signal housing, boom excluded) as a fraction of screen height. */
const MORPH1_END_UNIT_H = 0.66;
/** Lens stack centre, fraction of screen height from the top (kept within 0.35-0.42). */
const MORPH1_END_LENS_Y = 0.38;
/** Never let the unit body take more than this much of the screen width. */
const MORPH1_END_MAX_W = 0.8;
/*
 * End environment: soft sky gradient, horizon at eye level, subtle ground.
 * Everything starts as the still's cream and blends in with the camera move.
 */
const MORPH1_SKY_TOP = CFG.colours.sky_top;
const MORPH1_HORIZON = CFG.colours.horizon;
const MORPH1_TILE_END = CFG.colours.floor;
/** End frame: leftmost part of the unit sits this far from the left edge (fraction of width). */
const MORPH1_END_LEFT_MARGIN = 0.045;
const MORPH1_GROUND = CFG.colours.ground;
/** morph3 end frame: smaller unit, more boom (fractions of the screen). */
const MORPH3_END_UNIT_H = CFG.camera.unit_height;
const MORPH3_END_LENS_Y = CFG.camera.lens_y;
const MORPH3_END_LEFT_MARGIN = CFG.camera.left_margin;
/** morph3 hero glide: the camera ends the rise this far round the unit, then glides back square-on. */
const MORPH3_GLIDE_YAW_DEG = CFG.camera.glide_yaw_deg;
/** Glide window in seconds after the scan (it starts as the last modules land and runs past the resolve). */
const MORPH3_GLIDE_AT = CFG.camera.glide_start_s;
const MORPH3_GLIDE_S = Math.max(0.1, CFG.camera.glide_s);
const MORPH3_GLIDE_HOLD_S = CFG.camera.glide_hold_s;
/** After the scan the QR grows to fill the screen; the morph clock starts after that. */
const MORPH3_FILL_S = Math.max(0, CFG.fill.duration_s);

const morph1 = {
  phase: morph1Wanted ? "flat" : "off", // flat | scan | rise | hold | show
  scanAt: 0,
  bootAt: performance.now(),
  riseAt: 0,
  holdAt: 0,
  unitReady: false,
  unitFailed: false,
  restReady: false,
  scanPose: null,
  doorPose: null,
  caps: [],
  capMats: [],
  clip: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  clipMats: new Set(),
  restPos: null, // upright, at the lying pivot
  restQuat: null,
  pivot: null,
  slideZ: 0, // pivot travel from lying to standing
  slideX: 0,
  env: null,
  lyingBox: null,
  standBox: null,
  matte: [],
  shadow: null,
  bg: new THREE.Color(hexNum(MORPH_PALETTE.cream)),
  marks: {},
  riseEnd: 0,
};

/** One perspective camera for the whole morph (near-ortho at frame 0, eye level at the end). */
const morph1Cam = new THREE.PerspectiveCamera(MORPH1_SCAN_FOV, 1, 0.05, 100);
morph1Cam.name = "Morph1Camera";
const _m1q = new THREE.Quaternion();
const _m1v = new THREE.Vector3();
const _m1t = new THREE.Vector3();
const _m1h = new THREE.Quaternion();
const _m1x = new THREE.Vector3(1, 0, 0);

function m1clamp01(x) {
  return x < 0 ? 0 : (x > 1 ? 1 : x);
}
function m1smooth(x) {
  const u = m1clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
}
/** Cubic ease-in-out: gets going sooner than smootherstep over a 3 s move. */
function m1ease(x) {
  const u = m1clamp01(x);
  return u * u * (3 - 2 * u);
}
function m1outBack(x) {
  const u = m1clamp01(x);
  const k = 1.4;
  return 1 + (k + 1) * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2);
}
/** World box of the visible unit geometry only (the GLB carries hidden parts). */
function m1Box(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  root.traverse((o) => {
    if (o.isMesh && o.geometry && isVisibleInTree(o)) box.expandByObject(o);
  });
  return box;
}
function m1span(tr, w) {
  return m1clamp01((tr - w[0]) / (w[1] - w[0]));
}

function morph1Init() {
  if (!morph1Wanted) return;
  renderer.localClippingEnabled = true;
  const n = living.n;
  // Flat ground: unlit cream scan pad, no lit paper tiles, so frame 0 matches the still.
  for (const child of grid.children) {
    if (/^QrLight_/.test(child.name || "")) child.visible = false;
  }
  if (living.pad) living.pad.visible = false;
  morph1.caps = mods.filter((m) => !morph1Masked(m.userData.r, m.userData.c))
    .map((m) => m.getObjectByName("QrModTop")).filter(Boolean);
  for (const m of mods) {
    if (!morph1Masked(m.userData.r, m.userData.c)) continue;
    const cap = m.getObjectByName("QrModTop");
    if (cap) cap.visible = false;
  }
  morph1.capMats = living.capMats || [living.topMat];
  // Ripple order: distance from the symbol centre.
  const kc = (n - 1) / 2;
  let maxD = 1;
  for (const m of mods) {
    const d = Math.hypot(m.userData.c - kc, m.userData.r - kc);
    m.userData.m1d = d;
    if (d > maxD) maxD = d;
  }
  for (const m of mods) {
    // Cells under the lying unit are blank in the still; they fill in once the unit lifts off.
    m.userData.m1masked = morph1Masked(m.userData.r, m.userData.c);
    m.userData.m1delay = MORPH1_MOD_DELAY_S + (m.userData.m1d / maxD) * MORPH1_RIPPLE_S;
    m.userData.m1start = m.userData.m1delay;
    // morph1 keeps only the flat navy cap: a clean tile sitting on the ground.
    m.scale.set(1, 1, 1);
    // Drop the tall-module chrome (bodies, bands, rims, dots, logos) outright so no
    // other look toggle can bring it back.
    for (const child of [...m.children]) {
      if (child.name === "QrModTop") child.visible = !m.userData.m1masked;
      else m.remove(child);
    }
    const cap = m.getObjectByName("QrModTop");
    if (cap) {
      cap.position.y = living.cell * 0.035;
      cap.castShadow = false;
      cap.receiveShadow = false;
      m.userData.m1cap = cap;
    }
  }
  morph1BuildEnv();
  // Soft contact shadows once the field stands up.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(living.padSize * 1.8, living.padSize * 1.8),
    new THREE.ShadowMaterial({ opacity: 0, transparent: true, depthWrite: false })
  );
  shadow.name = "Morph1Shadow";
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = living.cell * 0.075;
  shadow.receiveShadow = true;
  shadow.visible = false;
  shadow.userData.m1off = true; // sun shadows read as ghost boxes; contact shadow only
  grid.add(shadow);
  morph1.shadow = shadow;
  if (morph2Wanted) {
    for (const m of mods) m.visible = false;
    morph2Init();
  }
  morph1PrepareUnit(boom);
  const scanBtn = document.getElementById("morph1Scan");
  if (scanBtn) scanBtn.addEventListener("click", () => morph1Tap());
  if (window.__morph1ScanQueued) morph1.scanQueued = true;
  // The page already switched to the recorded morph (app.js arrived too late): stay out of its way.
  if (window.__morph1FallbackReason) morph1.phase = "fallback";
  addEventListener("resize", morph1Resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", morph1Resize);
  morph1Resize();
}

/** Cabinet + signal housing (boom excluded): the "unit" the end frame is composed on. */
function morph1BodyBox() {
  const box = new THREE.Box3();
  const cab = doorCabinetBox();
  if (cab && !cab.isEmpty()) box.union(cab);
  const head = boom ? findSignalHead(boom) : null;
  if (head) {
    const hb = worldBox(head);
    if (hb && !hb.isEmpty()) box.union(hb);
  }
  if (box.isEmpty() && boom) box.copy(m1Box(boom));
  box.min.y = Math.min(box.min.y, boom ? m1Box(boom).min.y : 0); // wheels on the ground
  return box.isEmpty() ? null : box;
}

/** Sky dome, ground, fog and the contact shadow for the end frame. */
function morph1BuildEnv() {
  const cream = new THREE.Color(MORPH_PALETTE.cream);
  const env = {
    cream,
    top: new THREE.Color(MORPH1_SKY_TOP),
    horizon: new THREE.Color(MORPH1_HORIZON),
    groundC: new THREE.Color(MORPH1_GROUND),
    tileC: new THREE.Color(MORPH1_TILE_END),
    mix: -1,
  };
  // Fog is on from the first frame (no recompiles later) but parked far away.
  scene.fog = new THREE.Fog(cream.clone(), 1e5, 2e5);
  const skyGeo = new THREE.SphereGeometry(1, 48, 24);
  skyGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false,
  }));
  sky.name = "Morph1Sky";
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(90, 96),
    new THREE.MeshBasicMaterial({ color: cream.clone(), toneMapped: false })
  );
  ground.name = "Morph1Ground";
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -living.cell * 0.03;
  ground.renderOrder = -5;
  // Contact shadow: soft dark ellipse under the standing unit.
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(20,24,34,0.72)");
  grad.addColorStop(0.45, "rgba(20,24,34,0.38)");
  grad.addColorStop(1, "rgba(20,24,34,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })
  );
  contact.name = "Morph1Contact";
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = living.cell * 0.08;
  contact.renderOrder = 3;
  contact.visible = false;
  const group = new THREE.Group();
  group.name = "Morph1Env";
  group.add(sky, ground, contact);
  scene.add(group);
  Object.assign(env, { group, sky, ground, contact });
  morph1.env = env;
  morph1EnvMix(0);
}

const _m1c = new THREE.Color();
/** Blend the end environment in: 0 = the still's flat cream, 1 = sky, horizon, ground. */
function morph1EnvMix(m) {
  const env = morph1.env;
  if (!env) return;
  const k = Math.round(m1clamp01(m) * 1000) / 1000;
  if (k === env.mix) return;
  env.mix = k;
  const pos = env.sky.geometry.attributes.position;
  const col = env.sky.geometry.attributes.color;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const t = y <= 0 ? 0 : m1smooth(Math.min(1, y / 0.55));
    _m1c.lerpColors(env.horizon, env.top, t);
    _m1c.lerpColors(env.cream, _m1c, k);
    col.setXYZ(i, _m1c.r, _m1c.g, _m1c.b);
  }
  col.needsUpdate = true;
  _m1c.lerpColors(env.cream, env.groundC, k);
  env.ground.material.color.copy(_m1c);
  if (living.scanPad) living.scanPad.material.color.copy(_m1c);
  scene.fog.color.lerpColors(env.cream, env.horizon, k);
  // Tiles soften from print navy to a calmer floor navy so the unit leads.
  for (const mat of morph1.capMats) {
    if (!mat.userData.m1base) mat.userData.m1base = mat.color.clone();
    mat.color.lerpColors(mat.userData.m1base, env.tileC, k);
  }
}

/** Keep the sky dome around the camera, inside its clip range; fog relative to the subject. */
function morph1EnvFollow(m, dist) {
  const env = morph1.env;
  if (!env) return;
  env.sky.position.copy(morph1Cam.position);
  env.sky.scale.setScalar(dist + 10);
  // Objects at the subject distance stay clear; the tile floor and ground fade to the horizon behind.
  // The unit itself has fog off, so only the floor and ground fade.
  const k = Math.pow(m, 0.35);
  // At k = 0 the fog colour equals the cream ground, so frame 0 is untouched.
  const near = dist + THREE.MathUtils.lerp(30, -0.3, k);
  const far = near + THREE.MathUtils.lerp(60, 3.6, k);
  scene.fog.near = near;
  scene.fog.far = far;
}

function morph1ViewSize() {
  return {
    w: Math.max(1, canvas.clientWidth || innerWidth),
    h: Math.max(1, canvas.clientHeight || innerHeight),
  };
}

/** QR square side on screen in CSS px: same rule as --m1q in index.html. */
function morph1PadPx() {
  const { w, h } = morph1ViewSize();
  return Math.max(80, Math.min(w * MORPH1_SCAN_FRAC, h - 2 * MORPH1_BTN_SPACE));
}

/** Top-down frame 0: the pad is the --m1q square, centred. */
function morph1ScanPose() {
  const { w, h } = morph1ViewSize();
  const worldH = (living.padSize / morph1PadPx()) * h;
  const probe = new THREE.PerspectiveCamera(); // cameras look down their -Z
  probe.position.set(0, 10, 0.0001);
  probe.up.set(0, 0, -1);
  probe.lookAt(0, 0, 0);
  return {
    quat: probe.quaternion.clone(),
    target: new THREE.Vector3(0, 0, 0),
    height: worldH,
    fov: MORPH1_SCAN_FOV,
    shiftX: 0,
    shiftY: 0,
    aspect: w / h,
  };
}

/** Square ortho top-down frustum with the pad filling it (still bake). */
function morph1BakeFrustum() {
  const half = living.padSize / 2;
  const probe = new THREE.OrthographicCamera(-half, half, half, -half, 0.05, 80);
  probe.position.set(0, MORPH1_SCAN_DIST, 0.0001);
  probe.up.set(0, 0, -1);
  probe.lookAt(0, 0, 0);
  probe.updateProjectionMatrix();
  return probe;
}

/** World centre and facing of the signal lenses (average lens surface normal). */
function morph1LensInfo() {
  const head = boom ? findSignalHead(boom) : null;
  if (!head) return null;
  head.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const nrm = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  const v = new THREE.Vector3();
  let any = false;
  head.traverse((o) => {
    if (!o.isMesh || !isVisibleInTree(o)) return;
    if (!/HeroLens|SignalLens|Lens_|灯罩/i.test(ancestorBlob(o))) return;
    box.union(new THREE.Box3().setFromObject(o));
    const na = o.geometry?.attributes?.normal;
    if (na) {
      nm.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < na.count; i += 1) nrm.add(v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize());
    }
    any = true;
  });
  if (!any) {
    const lb = doorSignalLanternBox();
    if (!lb || lb.isEmpty()) return null;
    return { center: lb.getCenter(new THREE.Vector3()), normal: null, box: lb };
  }
  return { center: box.getCenter(new THREE.Vector3()), normal: nrm.lengthSq() > 0 ? nrm.normalize() : null, box };
}

/** World-space sample of the unit's opaque geometry (optionally only under one node). */
function morph1WorldPoints(root = boom, maxPts = 20000) {
  const meshes = [];
  let total = 0;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position || !isVisibleInTree(o)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    // Skip glow/halo cards (unlit, see-through); keep every solid part, matte or not.
    if (mats.some((m) => m && (m.isMeshBasicMaterial || m.opacity < 0.2))) return;
    meshes.push(o);
    total += o.geometry.attributes.position.count;
  });
  const stride = Math.max(1, Math.ceil(total / maxPts));
  const out = [];
  for (const mesh of meshes) {
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += stride) {
      out.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld));
    }
  }
  return out;
}

/**
 * End camera: eye at lens height, zero pitch, centred on the cabinet +
 * signal housing, distance set so that body is MORPH1_END_UNIT_H of the
 * screen height; a vertical lens shift puts the lens stack at MORPH1_END_LENS_Y.
 */
function morph1DoorPose(unitH = null) {
  if (!boom || !morph1.restReady) return null;
  const { w, h } = morph1ViewSize();
  const aspect = w / h;
  const savedHe = morph1.poseHe ?? 0;
  const savedSe = morph1.poseSe ?? 0;
  const savedVis = boom.visible;
  const savedArm = boomRig ? boomRig.shownPct : null;
  morph1UnitPose(1, 1);
  if (boomRig) applyBoomShown(100);
  boom.visible = true;
  boom.updateMatrixWorld(true);
  const lens = morph1LensInfo();
  const body = morph1BodyBox() || m1Box(boom);
  const unitPts = morph1WorldPoints(boom, Infinity); // every vertex: rounded corners are sparse
  // Full restore (pose, matte, env intensity) so the measuring pass never shows.
  morph1UnitPose(savedHe, savedSe);
  boom.visible = savedVis;
  if (boomRig && savedArm != null) applyBoomShown(savedArm);
  boom.updateMatrixWorld(true);
  const bc = body.getCenter(new THREE.Vector3());
  const L = lens ? lens.center : bc;
  const fov = aspect < 1 ? MORPH1_END_FOV_PORTRAIT : MORPH1_END_FOV_WIDE;
  const t = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  const bodyH = body.max.y - body.min.y;
  const bodyW = body.max.x - body.min.x;
  // Depth from the camera to the body's mid plane.
  let dz = bodyH / (2 * t * (unitH ?? (morph3Wanted ? MORPH3_END_UNIT_H : MORPH1_END_UNIT_H)));
  dz = Math.max(dz, bodyW / (2 * t * aspect * MORPH1_END_MAX_W));
  // Lens stack position: keep the housing top and the wheels inside with margin.
  const frac = (y) => (L.y - y) / (2 * dz * t); // screen-height fraction above the lens line
  let lensY = morph3Wanted ? MORPH3_END_LENS_Y : MORPH1_END_LENS_Y;
  const topY = lensY - frac(body.max.y);
  const botY = lensY - frac(body.min.y);
  if (topY < 0.08) lensY += 0.08 - topY;
  if (botY > 0.95) lensY -= botY - 0.95;
  lensY = morph3Wanted ? lensY : THREE.MathUtils.clamp(lensY, 0.35, 0.42);
  const camZ = bc.z + dz;
  const target = new THREE.Vector3(bc.x, L.y, L.z);
  // Horizontal lens shift (no yaw, no move): slide the picture so the leftmost
  // part of the unit sits MORPH1_END_LEFT_MARGIN from the left edge, giving the
  // boom the rest of the width.
  let minNdc = Infinity;
  for (const p of unitPts) {
    const depth = camZ - p.z;
    if (depth <= 0.01) continue;
    minNdc = Math.min(minNdc, (p.x - bc.x) / depth / (t * aspect));
  }
  const leftM = morph3Wanted ? MORPH3_END_LEFT_MARGIN : MORPH1_END_LEFT_MARGIN;
  const shiftX = Number.isFinite(minNdc) ? Math.min(0, (2 * leftM - 1) - minNdc) : 0;
  return {
    // looking down -Z: zero yaw; morph3 may take a small downward pitch from the settings
    quat: morph3Wanted ? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -THREE.MathUtils.degToRad(THREE.MathUtils.clamp(CFG.camera.pitch_deg, 0, 6))) : new THREE.Quaternion(),
    target,
    height: 2 * (camZ - L.z) * t,
    fov,
    shiftX,
    shiftY: 1 - 2 * lensY,
    aspect,
    lensY,
    pivot: new THREE.Vector3(bc.x, 0, bc.z),
  };
}

function morph1Resize() {
  if (!morph1Wanted) return;
  morph1.scanPose = morph1ScanPose();
  if (morph3Wanted && morph2Qr) {
    // Full-screen field: the code's modules span the screen width (quiet zone off screen), the field fills the height.
    const { w, h } = morph1ViewSize();
    morph1.fillPose = { ...morph1.scanPose, height: (morph2Qr.size * living.cell) * (h / w) };
  }
  morph1.doorPose = morph1DoorPose();
  if (morph3Wanted) morph1.doorPoseDown = morph1DoorPose(CFG.camera.unit_height_boom_down);
}

function morph1ApplyCamera(u, shiftPow = 1) {
  const a = morph1.scanPose;
  const b = morph1.doorPose || a;
  if (!a) return;
  const e = m1ease(u);
  // Long lens -> normal lens late in the move, so the top-down frame stays flat.
  const ef = Math.pow(e, 1.6);
  const lg = (x, y, k) => Math.exp(THREE.MathUtils.lerp(Math.log(x), Math.log(y), k));
  _m1q.slerpQuaternions(a.quat, b.quat, e);
  _m1t.lerpVectors(a.target, b.target, e);
  const fov = lg(a.fov, b.fov, ef);
  const height = lg(a.height, b.height, e);
  const dist = height / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
  _m1v.set(0, 0, 1).applyQuaternion(_m1q).multiplyScalar(dist);
  morph1Cam.position.copy(_m1t).add(_m1v);
  morph1Cam.quaternion.copy(_m1q);
  morph1Cam.fov = fov;
  morph1Cam.aspect = morph1ViewSize().w / morph1ViewSize().h;
  morph1Cam.near = Math.max(0.05, dist - 40);
  morph1Cam.far = dist + 60;
  morph1Cam.updateProjectionMatrix();
  // Lens shift (off-axis frustum): moves the picture, never tilts the camera.
  const sx = THREE.MathUtils.lerp(a.shiftX, b.shiftX, Math.pow(e, shiftPow));
  const sy = THREE.MathUtils.lerp(a.shiftY, b.shiftY, e);
  morph1Cam.projectionMatrix.elements[8] = -sx;
  morph1Cam.projectionMatrix.elements[9] = -sy;
  morph1Cam.projectionMatrixInverse.copy(morph1Cam.projectionMatrix).invert();
  morph1Cam.updateMatrixWorld(true);
  camera = morph1Cam;
  const em = Math.pow(e, 1.3);
  morph1.lastEm = em;
  morph1EnvMix(em);
  morph1EnvFollow(em, dist);
}

/** Final-frame geometry check: camera pitch/yaw and lens normal vs view direction. */
function morph1Measure() {
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(morph1Cam.quaternion);
  const lens = morph1LensInfo();
  const out = {
    phase: morph1.phase,
    cameraPitchDeg: +THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(fwd.y, -1, 1))).toFixed(2),
    cameraYawDeg: +THREE.MathUtils.radToDeg(Math.atan2(fwd.x, -fwd.z)).toFixed(2),
    cameraFovDeg: +morph1Cam.fov.toFixed(2),
    cameraPos: morph1Cam.position.toArray().map((x) => +x.toFixed(3)),
  };
  const { w, h } = morph1ViewSize();
  const toScreen = (p) => {
    const v = p.clone().project(morph1Cam);
    return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
  };
  const body = morph1BodyBox();
  if (body) {
    const c = body.getCenter(new THREE.Vector3());
    const top = toScreen(new THREE.Vector3(c.x, body.max.y, c.z));
    const bot = toScreen(new THREE.Vector3(c.x, body.min.y, body.max.z));
    const left = toScreen(new THREE.Vector3(body.min.x, c.y, body.max.z));
    const right = toScreen(new THREE.Vector3(body.max.x, c.y, body.max.z));
    out.viewport = `${w}x${h}`;
    out.unitTopY = +top.y.toFixed(3);
    out.unitGroundY = +bot.y.toFixed(3);
    out.unitHeightFrac = +(bot.y - top.y).toFixed(3);
    out.unitLeftX = +left.x.toFixed(3);
    out.unitRightX = +right.x.toFixed(3);
    out.unitCentreX = +((left.x + right.x) / 2).toFixed(3);
  }
  {
    // Whole unit (legs, wheels, housing, arm) and the arm's visible share.
    let minX = Infinity;
    for (const p of morph1WorldPoints(boom, Infinity)) minX = Math.min(minX, toScreen(p).x);
    out.unitLeftMostX = +minX.toFixed(4);
    out.shiftX = +(-morph1Cam.projectionMatrix.elements[8]).toFixed(4);
    if (boomRig?.pivot) {
      const arm = morph1WorldPoints(boomRig.pivot, 6000);
      if (arm.length) {
        let x0 = Infinity;
        let x1 = -Infinity;
        let zs = 0;
        for (const p of arm) {
          x0 = Math.min(x0, p.x);
          x1 = Math.max(x1, p.x);
          zs += p.z;
        }
        const depth = morph1Cam.position.z - zs / arm.length;
        const tt = Math.tan(THREE.MathUtils.degToRad(morph1Cam.fov) / 2) * morph1Cam.aspect;
        const sx = -morph1Cam.projectionMatrix.elements[8];
        const edge = (s) => morph1Cam.position.x + (1 - s) * tt * depth; // world x at the right screen edge
        const frac = (s) => THREE.MathUtils.clamp((Math.min(edge(s), x1) - x0) / Math.max(1e-6, x1 - x0), 0, 1);
        out.boomPct = boomRig.shownPct;
        out.armSpanWorld = +(x1 - x0).toFixed(3);
        out.boomVisibleFrac = +frac(sx).toFixed(3);
        out.boomVisibleFracNoShift = +frac(0).toFixed(3);
      }
    }
  }
  if (morph3Wanted) {
    out.yawDeg = morph1.yawDeg ?? 0;
    const face = signGroup?.getObjectByName("PortaboomStopFace");
    if (face?.geometry?.attributes?.position) {
      face.updateMatrixWorld(true);
      const pos = face.geometry.attributes.position;
      let inside = 0;
      for (let i = 0; i < pos.count; i += 1) {
        const sp = toScreen(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(face.matrixWorld));
        if (sp.x >= 0 && sp.x <= 1 && sp.y >= 0 && sp.y <= 1) inside += 1;
      }
      out.stopVisibleFrac = +(inside / pos.count).toFixed(3);
      const c = toScreen(face.getWorldPosition(new THREE.Vector3()));
      out.stopCentre = [+c.x.toFixed(3), +c.y.toFixed(3)];
    }
  }
  if (lens) {
    out.lensCentreY = +toScreen(lens.center).y.toFixed(3);
    out.lensCentreX = +toScreen(lens.center).x.toFixed(3);
    const toLens = lens.center.clone().sub(morph1Cam.position).normalize();
    out.lensCenter = lens.center.toArray().map((x) => +x.toFixed(3));
    out.cameraHeightMinusLensHeight = +(morph1Cam.position.y - lens.center.y).toFixed(4);
    out.viewRayToLensVsForwardDeg = +THREE.MathUtils.radToDeg(toLens.angleTo(fwd)).toFixed(2);
    if (lens.normal) {
      out.lensNormal = lens.normal.toArray().map((x) => +x.toFixed(3));
      out.lensNormalVsViewDeg = +THREE.MathUtils.radToDeg(lens.normal.angleTo(fwd.clone().negate())).toFixed(2);
      out.lensNormalVsRayDeg = +THREE.MathUtils.radToDeg(lens.normal.angleTo(toLens.clone().negate())).toFixed(2);
    }
  }
  return out;
}

/**
 * Attach the y = 0 clip plane once. Turning it "off" later only moves the
 * plane far below the field, so no material recompiles mid-sequence.
 */
function morph1SetClip(root, on) {
  if (!root) return;
  morph1.clip.constant = on ? 0 : 1000;
  if (!on) return;
  root.traverse((o) => {
    const list = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const mat of list) {
      if (morph1.clipMats.has(mat)) continue;
      mat.clippingPlanes = [morph1.clip];
      mat.needsUpdate = true;
      morph1.clipMats.add(mat);
    }
  });
}

/** Called for the stand-in and again when the GLB mounts. */
function morph1PrepareUnit(root) {
  if (!morph1Wanted || !root) return;
  if (morph2Wanted) {
    morph2Clip(root);
    return;
  }
  if (morph1.phase === "flat" || morph1.phase === "rise") morph1SetClip(root, true);
}

function morph1UnitReady() {
  morph1.unitReady = true;
  morph1CaptureRest();
  morph1PrepareUnit(boom);
  morph1Resize();
}

/** Glossy paint mirrors the white room when it faces the sky; keep it satin until upright. */
function morph1CollectMatte() {
  morph1.matte = [];
  const seen = new Set();
  boom.traverse((o) => {
    const list = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const mat of list) {
      if (mat.fog) {
        mat.fog = false;
        mat.needsUpdate = true;
      }
    }
  });
  boom.traverse((o) => {
    const list = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const mat of list) {
      if (seen.has(mat) || !mat.isMeshStandardMaterial) continue;
      seen.add(mat);
      if (!mat.userData.m1orig) {
        mat.userData.m1orig = {
          rough: mat.roughness,
          cc: mat.clearcoat ?? 0,
          sheen: mat.sheen ?? 0,
          spec: mat.specularIntensity ?? 1,
          env: mat.envMapIntensity ?? 1,
        };
      }
      morph1.matte.push({ mat, ...mat.userData.m1orig });
    }
  });
}

function morph1ApplyMatte(m) {
  for (const it of morph1.matte) {
    const mat = it.mat;
    // A flat panel tipped toward the key light mirrors it straight into a
    // camera above: kill the clearcoat and most of the specular while tipped.
    mat.roughness = THREE.MathUtils.lerp(it.rough, Math.max(it.rough, 0.62), m);
    mat.envMapIntensity = it.env * (1 - 0.55 * m);
    if (mat.isMeshPhysicalMaterial) {
      mat.clearcoat = it.cc * (1 - m);
      mat.sheen = it.sheen * (1 - m);
      mat.specularIntensity = it.spec * (1 - 0.8 * m);
    }
  }
}

/**
 * Unit pose. hingeE 0 = lying on its back (front faces +Y, top points to -Z,
 * screen-up in the top-down frame), 1 = upright. slideE moves the hinge
 * pivot from the lying spot to the standing spot further into the field.
 */
function morph1UnitPose(hingeE, slideE) {
  if (!boom || !morph1.restReady) return;
  morph1.poseHe = hingeE;
  morph1.poseSe = slideE;
  _m1h.setFromAxisAngle(_m1x, (-Math.PI / 2) * (1 - hingeE));
  boom.quaternion.copy(_m1h).multiply(morph1.restQuat);
  _m1v.copy(morph1.restPos).sub(morph1.pivot).applyQuaternion(_m1h).add(morph1.pivot);
  _m1v.z += morph1.slideZ * slideE;
  _m1v.x += morph1.slideX * slideE;
  boom.position.copy(_m1v);
  const m = 1 - m1smooth((hingeE - 0.55) / 0.45);
  morph1ApplyMatte(m);
  scene.environmentIntensity = 0.4 + 0.6 * hingeE;
}

/** Arm and lamps for a rise time (frame 0: arm down, red). */
function morph1ArmAt(tr) {
  const a = m1smooth(m1span(tr, MORPH1_ARM_S));
  if (boomRig) applyBoomShown(100 * a);
  return a;
}

/** Decimated unit vertices for the clearance pass (about 30k points). */
function morph1UnitPoints() {
  const meshes = [];
  let total = 0;
  boom.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    if (!isVisibleInTree(o)) return;
    if (o.material && o.material.transparent && o.material.opacity < 0.2) return;
    meshes.push(o);
    total += o.geometry.attributes.position.count;
  });
  const stride = Math.max(1, Math.ceil(total / 30000));
  return meshes.map((mesh) => {
    const pos = mesh.geometry.attributes.position;
    const arr = [];
    for (let i = 0; i < pos.count; i += stride) arr.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    return { mesh, arr };
  });
}

/**
 * Size and place the unit: the lying silhouette (arm down along the ground)
 * spans MORPH1_UNIT_SPAN of the symbol and is centred on the QR (the still
 * is baked from this exact pose). Then the standing spot and per-module
 * start times so no cuboid rises through the moving unit.
 */
function morph1CaptureRest() {
  if (!boom) return;
  const n = living.n;
  const cell = living.cell;
  if (boom.userData.m1BaseScale == null) boom.userData.m1BaseScale = boom.scale.x;
  const base = boom.userData.m1BaseScale;
  const vis = boom.visible;
  boom.visible = true;
  morph1ArmAt(0);
  const place = (scale, dx, dz) => {
    boom.rotation.set(0, boom.userData.plantedYaw ?? Math.PI, 0);
    boom.scale.setScalar(scale);
    boom.position.set(0, 0, 0);
    boom.updateMatrixWorld(true);
    const b0 = m1Box(boom);
    boom.position.set(dx, 0.02 - b0.min.y, dz);
    boom.updateMatrixWorld(true);
    const box = m1Box(boom);
    morph1.restPos = boom.position.clone();
    morph1.restQuat = boom.quaternion.clone();
    morph1.pivot = new THREE.Vector3(0, box.min.y, box.min.z);
    morph1.slideZ = 0;
    morph1.slideX = 0;
    morph1.restReady = true;
    morph1UnitPose(0, 0);
    boom.updateMatrixWorld(true);
    return { upright: box, lying: m1Box(boom) };
  };
  morph1.matte = [];
  let m = place(base, 0, 0);
  const lsz = m.lying.getSize(new THREE.Vector3());
  const k = (MORPH1_UNIT_SPAN * n * cell) / Math.max(0.1, lsz.x, lsz.z);
  m = place(base * k, 0, 0);
  const lc = m.lying.getCenter(new THREE.Vector3());
  m = place(base * k, -lc.x + MORPH1_LYING_SHIFT[0] * cell, -lc.z + MORPH1_LYING_SHIFT[1] * cell);
  morph1.unitScale = k;
  morph1.lyingBox = m.lying;
  const T = m.upright.max.z - m.upright.min.z;
  // Standing spot further into the field so the field fills the foreground.
  const standZ = MORPH1_STAND_Z_FRAC * living.padSize;
  morph1.slideZ = standZ - morph1.pivot.z;
  // ...and centred in x on the cabinet + signal housing.
  morph1UnitPose(1, 0);
  boom.updateMatrixWorld(true);
  const body0 = morph1BodyBox();
  morph1.slideX = body0 ? -body0.getCenter(new THREE.Vector3()).x : 0;
  const final = morph1.restPos.clone();
  final.z += morph1.slideZ;
  final.x += morph1.slideX;
  boom.userData.m1RestPos = final;
  morph1.finalPos = final;
  morph1CollectMatte();

  // Clearance: sample the real unit geometry through the rise and note, per
  // cell, the last time any part of it is below the cuboid tops.
  const pts = morph1UnitPoints();
  const modTop = cell * 0.07 * (1 + MORPH1_WAVE_AMP) + cell * 0.3;
  const steps = 72;
  const t0 = MORPH1_HINGE_S[0];
  const t1 = MORPH1_ARM_S[1];
  const lastBusy = new Float32Array(n * n).fill(-1);
  const finalBusy = new Uint8Array(n * n);
  const v = new THREE.Vector3();
  const origin = (n - 1) / 2;
  const mark = (x, z, tr, fin) => {
    for (const ox of [-0.45, 0.45]) {
      for (const oz of [-0.45, 0.45]) {
        const c = Math.round((x + ox * cell) / cell + origin);
        const r = Math.round((z + oz * cell) / cell + origin);
        if (c < 0 || r < 0 || c >= n || r >= n) continue;
        const idx = r * n + c;
        if (tr > lastBusy[idx]) lastBusy[idx] = tr;
        if (fin) finalBusy[idx] = 1;
      }
    }
  };
  for (let i = 0; i <= steps + 1; i += 1) {
    const fin = i === steps + 1;
    const tr = fin ? t1 : t0 + (i / steps) * (t1 - t0);
    const he = m1ease(m1span(tr, MORPH1_HINGE_S));
    morph1UnitPose(he, he);
    morph1ArmAt(fin ? MORPH1_ARM_S[0] : tr); // final: arm down too (showtime lowers it)
    boom.updateMatrixWorld(true);
    for (const { mesh, arr } of pts) {
      const mw = mesh.matrixWorld;
      for (let q = 0; q < arr.length; q += 3) {
        v.set(arr[q], arr[q + 1], arr[q + 2]).applyMatrix4(mw);
        if (v.y < modTop) mark(v.x, v.z, tr, fin);
      }
    }
  }
  let latest = 0;
  for (const mod of mods) {
    const idx = mod.userData.r * n + mod.userData.c;
    mod.userData.m1stay = !!finalBusy[idx];
    mod.userData.m1start = mod.userData.m1delay;
    if (mod.userData.m1stay) continue;
    if (lastBusy[idx] >= 0) {
      mod.userData.m1start = Math.max(mod.userData.m1delay, lastBusy[idx] + 0.1);
      latest = Math.max(latest, mod.userData.m1start);
    }
  }
  morph1UnitPose(1, 1);
  morph1ArmAt(MORPH1_ARM_S[1]);
  boom.updateMatrixWorld(true);
  morph1.standBox = m1Box(boom);
  {
    const body = morph1BodyBox();
    const bb = body || morph1.standBox;
    morph1.footX = (bb.min.x + bb.max.x) / 2;
    morph1.footZ = (bb.min.z + bb.max.z) / 2;
    morph1.footW = (bb.max.x - bb.min.x) * 1.5;
    morph1.footD = Math.max(T, bb.max.z - bb.min.z) * 1.9;
    boom.updateMatrixWorld(true);
    morph1.footLocal = boom.worldToLocal(new THREE.Vector3(morph1.footX, bb.min.y, morph1.footZ));
    morph1.footGroundY = bb.min.y;
  }
  morph1.uprightDepth = T;
  morph1.riseEnd = Math.max(MORPH1_TILT_S[1], MORPH1_HINGE_S[1], MORPH1_ARM_S[1],
    MORPH1_MOD_DELAY_S + MORPH1_RIPPLE_S + MORPH1_MOD_RISE_S, latest + MORPH1_MOD_RISE_S * 0.8);
  morph1UnitPose(0, 0);
  morph1ArmAt(0);
  boom.visible = vis;
  boom.updateMatrixWorld(true);
  if (morph2Wanted) morph2Prepare();
}

function morph1StartRise() {
  morph1.phase = "rise";
  morph1.riseAt = performance.now();
  morph1.marks.riseAt = morph1.riseAt - morph1.bootAt;
  morph1.marks.unit = usingGlb ? "glb" : "stand-in";
  if (!morph1.restReady) morph1CaptureRest();
  morph1.doorPose = morph1DoorPose();
  if (morph3Wanted) morph1.doorPoseDown = morph1DoorPose(CFG.camera.unit_height_boom_down);
  morph1SetClip(boom, true);
  if (morph1.shadow) morph1.shadow.visible = false;
  document.body.classList.add("morph1-rising");
}

function morph1FinishRise() {
  morph1.phase = "hold";
  morph1.holdAt = performance.now();
  morph1.marks.unitUpAt = morph1.holdAt - morph1.bootAt;
  morph1TileFloor(1e9);
  morph1UnitPose(1, 1);
  morph1Contact(1);
  morph1ArmAt(MORPH1_ARM_S[1]);
  setSignalAspect("green");
  morph1SetClip(boom, false);
}

/** Button or a tap on the QR: run the simulated scan, then the morph. */
function morph1Tap() {
  if (morph1.phase === "fallback" && typeof window.__morph1Play === "function") {
    window.__morph1Play();
    return;
  }
  if (morph1.phase !== "flat") return;
  if (!morph1.unitReady || !morph1.restReady || !morph1.handedOver) {
    // Remembered: the scan runs on the first frame after the canvas takes over.
    morph1.scanQueued = true;
    document.getElementById("morph1Scan")?.classList.add("pressed");
    return;
  }
  morph1BeginScan();
}

/**
 * One surface: as soon as the canvas has drawn the QR with the real unit
 * (identical to the still), the HTML still is removed from the DOM, so
 * nothing flat can ever sit over the morph.
 */
function morph1HandOver() {
  morph1.handedOver = true;
  const still = document.getElementById("morph1Still");
  if (still) still.remove();
  document.body.classList.add("morph1-live");
  morph1.marks.liveAt = performance.now() - morph1.bootAt;
  window.__morph1Live = true;
  console.info("morph1: canvas live, still removed");
}

/** No WebGL, lost context, or no GLB: play the recorded morph in the same place instead. */
function morph1Fallback(reason) {
  if (morph1.phase === "fallback") return;
  morph1.phase = "fallback";
  morph1.fallbackReason = reason;
  if (typeof window.__morph1Fallback === "function") window.__morph1Fallback(reason);
  else console.warn("morph1 fallback:", reason);
}

function morph1BeginScan() {
  morph1.phase = "scan";
  morph1.scanAt = performance.now();
  editorClock.scanAt = morph1.scanAt;
  morph1.scanQueued = false;
  morph1.marks.scanAt = morph1.scanAt - morph1.bootAt;
  document.body.classList.add("morph1-scanning");
  const btn = document.getElementById("morph1Scan");
  if (btn) {
    btn.classList.add("pressed");
    btn.setAttribute("aria-disabled", "true");
  }
  if (morph2Wanted) return; // morph2 buzzes on the finder lock instead
  try {
    if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([18, 40, 28]);
  } catch (err) {
    // vibration is optional
  }
}

/** Sweep overlay driven from the frame clock (so a fixed-clock render captures it). */
function morph1ScanFx(p) {
  const fx = document.getElementById("morph1ScanFx");
  const btn = document.getElementById("morph1Scan");
  if (btn) {
    if (p > 0.18) btn.classList.remove("pressed");
    btn.style.opacity = String(1 - m1clamp01((p - 0.1) / 0.35));
    if (p >= 1) btn.hidden = true;
  }
  if (!fx) return;
  const fadeIn = m1clamp01(p / 0.12);
  const fadeOut = 1 - m1clamp01((p - 0.85) / 0.15);
  fx.style.opacity = String(fadeIn * fadeOut);
  const side = fx.clientHeight || 1;
  const y = m1smooth(m1clamp01((p - 0.08) / 0.8)) * side;
  const line = fx.querySelector(".line");
  const glow = fx.querySelector(".glow");
  if (line) line.style.transform = `translateY(${y.toFixed(1)}px)`;
  if (glow) glow.style.transform = `translateY(calc(${y.toFixed(1)}px - 100%))`;
  const k = 1.06 - 0.06 * m1smooth(p / 0.25);
  for (const br of fx.querySelectorAll(".br")) br.style.transform = `scale(${k.toFixed(4)})`;
  if (p >= 1) document.body.classList.remove("morph1-scanning");
}

function morph1Look() {
  scanOpen = false;
  viewMode = "door";
  studioGroup.visible = false;
  grid.visible = true;
  if (living.scanPad) living.scanPad.visible = true;
  if (living.pad) living.pad.visible = false;
  if (living.apron) living.apron.visible = false;
  if (living.ring) living.ring.visible = false;
  if (brandBack) brandBack.visible = false;
  scene.background = morph1.bg;
  renderer.setClearColor(morph1.bg, 1);
  // One tone mapping for the whole run: caps, pad and background are untone-mapped
  // flat colours, so the unit never pops when the rise starts.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
}

function morph1FlatFrame() {
  morph1Look();
  if (morph2Wanted) {
    if (boom) boom.visible = morph1.restReady;
    if (morph1.restReady) morph2Park();
    setSignalAspect("red");
    morph1ApplyCamera(0);
    return;
  }
  for (const m of mods) {
    m.position.y = 0;
    m.rotation.y = 0;
    m.visible = !m.userData.m1masked;
    const cap = m.userData.m1cap;
    if (cap) {
      cap.visible = !m.userData.m1masked;
      cap.scale.set(1, 1, 1);
      cap.position.y = living.cell * 0.035;
    }
  }
  if (boom) {
    boom.visible = morph1.restReady;
    if (morph1.restReady) morph1UnitPose(0, 0);
  }
  morph1ArmAt(0);
  setSignalAspect("red");
  morph1ApplyCamera(0);
}

/**
 * The QR as a flat navy tile floor: a low wave runs out from the centre,
 * cells under the lying unit fill in once it has lifted off, cells under the
 * standing unit stay hidden. Nothing grows tall.
 */
function morph1TileFloor(tr) {
  if (morph2Wanted) return;
  for (const m of mods) {
    const cap = m.userData.m1cap;
    if (!cap) continue;
    m.position.y = 0;
    if (m.userData.m1stay) {
      m.visible = false;
      continue;
    }
    const u = (tr - m.userData.m1start) / MORPH1_MOD_RISE_S;
    const wave = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
    if (m.userData.m1masked) {
      const show = u > 0;
      m.visible = show;
      cap.visible = show;
      const s = show ? Math.max(0.05, m1outBack(Math.min(1, u * 1.6))) : 0.05;
      cap.scale.set(s, 1 + MORPH1_WAVE_AMP * wave, s);
    } else {
      m.visible = true;
      cap.visible = true;
      cap.scale.set(1, 1 + MORPH1_WAVE_AMP * wave, 1);
    }
    cap.position.y = living.cell * 0.035 * cap.scale.y;
  }
}

/** Contact shadow under the unit's feet: follows the real footprint and only shows once it is down. */
function morph1Contact(he) {
  const env = morph1.env;
  if (!env || !morph1.restReady || !morph1.footLocal || !boom) return;
  boom.updateMatrixWorld(true);
  const f = boom.localToWorld(morph1.footLocal.clone());
  const lift = Math.max(0, f.y - morph1.footGroundY);
  const a = m1smooth((he - 0.8) / 0.2) * m1smooth(1 - lift / (living.cell * 4));
  env.contact.visible = a > 0.001;
  if (!env.contact.visible) return;
  env.contact.position.set(f.x, living.cell * 0.08, f.z);
  env.contact.scale.set(morph1.footW ?? 1.2, morph1.footD ?? 1.2, 1);
  env.contact.material.opacity = 0.9 * a;
}

function morph1Tick(dt, t) {
  morph1TickBase(dt, t);
  nightTick(dt, t);
}

function morph1TickBase(dt, t) {
  if (!morph1Wanted) return;
  if (morph1.phase === "fallback") return;
  const now = performance.now();
  if (morph1.phase === "flat") {
    morph1FlatFrame();
    const elapsed = (now - morph1.bootAt) / 1000;
    // Only the real unit may stand in for the still; no stand-in morphs.
    const unitOk = morph1.unitReady;
    if (!unitOk && (morph1.unitFailed || elapsed >= MORPH1_UNIT_WAIT_MAX_S)) {
      morph1Fallback(morph1.unitFailed ? "glb-load-failed" : "glb-timeout");
      return;
    }
    if (unitOk && !morph1.restReady && boom) {
      morph1CaptureRest();
      morph1Resize();
    }
    // The scan (and with it the morph) only starts once the canvas has replaced the still.
    if (unitOk && morph1.restReady && morph1.handedOver && (!morph2Wanted || morph2.ready) && !window.__morph1Freeze) {
      if (morph1.readyAt == null) { morph1.readyAt = now; morph1.marks.readyAt = now - morph1.bootAt; }
      if (morph1.scanQueued) morph1BeginScan();
      else if (morph1Autoplay && (morph2Wanted ? (now - morph1.readyAt) / 1000 >= MORPH1_AUTO_DELAY_S : elapsed >= MORPH1_FLAT_MIN_S)) morph1BeginScan();
    }
    return;
  }
  if (morph1.phase === "scan") {
    morph1FlatFrame();
    if (morph2Wanted) {
      const p2 = (now - morph1.scanAt) / 1000 / MORPH2_SCAN_S;
      morph2ScanFx(Math.min(1, p2));
      if (p2 >= 1) morph2StartMorph();
      return;
    }
    const p = (now - morph1.scanAt) / 1000 / MORPH1_SWEEP_S;
    morph1ScanFx(Math.min(1, p));
    if (p >= 1) morph1StartRise();
    return;
  }
  if (morph1.phase === "rise" && morph2Wanted) {
    morph2Rise((now - morph1.riseAt) / 1000);
    return;
  }
  if (morph1.phase === "rise") {
    morph1Look();
    const tr = (now - morph1.riseAt) / 1000;
    morph1ApplyCamera(m1span(tr, MORPH1_TILT_S));
    morph1TileFloor(tr);
    if (boom) {
      const he = m1ease(m1span(tr, MORPH1_HINGE_S));
      // Sun shadow helps read the hinge; near upright the soft contact shadow takes over.
      if (morph1.shadow) {
        morph1.shadow.material.opacity = 0.2 * m1smooth(m1span(tr, MORPH1_TILT_S)) * (1 - m1smooth((he - 0.45) / 0.5));
      }
      boom.visible = true;
      morph1UnitPose(he, he);
      morph1Contact(he);
      morph1.hingeDeg = +(90 * (1 - he)).toFixed(1);
      const arm = morph1ArmAt(tr);
      setSignalAspect(arm >= 0.999 ? "green" : "red");
    }
    living.ledMats.forEach((mat, i) => {
      mat.emissiveIntensity = 0.8 + Math.sin(t * 3.4 + i * 0.35) * 0.6;
    });
    if (tr >= (morph1.riseEnd || MORPH1_HINGE_S[1])) morph1FinishRise();
    return;
  }
  // hold + show: end camera, unit up, showtime drives boom + lamps.
  morph1Look();
  scene.environmentIntensity = 1;
  morph1ApplyCamera(1);
  if (morph3Wanted && morph1.phase === "hold") morph3CameraFx((now - morph1.riseAt) / 1000 - MORPH3_FILL_S);
  else if (morph3Wanted) {
    morph1.yawDeg = 0;
    morph3BoomDownCamera();
  }
  morph1TileFloor(1e9);
  if (morph1.shadow) morph1.shadow.visible = false;
  if (boom) boom.visible = true;
  const holdS = morph3Wanted ? MORPH3_GLIDE_AT + MORPH3_GLIDE_S + MORPH3_GLIDE_HOLD_S - MORPH2_END_S : MORPH1_HOLD_S;
  if (morph1.phase === "hold" && (now - morph1.holdAt) / 1000 >= holdS) {
    if (startShowtime()) {
      morph1.phase = "show";
      morph1.marks.showAt = performance.now() - morph1.bootAt;
      // Showtime sets up its own camera and look; take the frame back at once.
      morph1Look();
      scene.environmentIntensity = 1;
      morph1ApplyCamera(1);
      morph1TileFloor(1e9);
      if (morph1.shadow) morph1.shadow.visible = false;
      if (boom) boom.visible = true;
    }
  }
}

/**
 * Build-time hook for scripts/make-morph-qr.mjs: renders frame 0's lying
 * unit alone (same scene, lights, camera direction and tone mapping) on a
 * flat background, square, with the quiet-zone pad filling the image.
 */
function morph1Bake(px, bgHex) {
  if (!morph1.restReady) return null;
  const savedPR = renderer.getPixelRatio();
  const savedSize = renderer.getSize(new THREE.Vector2());
  const savedBg = scene.background;
  morph1Look();
  morph1UnitPose(0, 0);
  morph1ArmAt(0);
  setSignalAspect("red");
  boom.visible = true;
  grid.visible = false;
  if (morph1.env) morph1.env.group.visible = false;
  const bg = new THREE.Color(bgHex);
  scene.background = bg;
  renderer.setClearColor(bg, 1);
  const cam = morph1BakeFrustum();
  renderer.setPixelRatio(1);
  renderer.setSize(px, px, false);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL("image/png");
  grid.visible = true;
  if (morph1.env) morph1.env.group.visible = true;
  scene.background = savedBg;
  renderer.setPixelRatio(savedPR);
  renderer.setSize(savedSize.x, savedSize.y, false);
  return url;
}

function morph1Snapshot() {
  if (!morph1Wanted) return null;
  return {
    phase: morph1.phase,
    tipUrl: MORPH1_TIP_URL,
    version: morph1Qr.version,
    size: morph1Qr.size,
    bakeMode: morph1BakeMode,
    maskCells: morph1Mask ? morph1Mask.reduce((a, b) => a + b, 0) : 0,
    unitReady: morph1.unitReady,
    unitFailed: morph1.unitFailed,
    restReady: morph1.restReady,
    handedOver: !!morph1.handedOver,
    stillInDom: !!document.getElementById("morph1Still"),
    fallbackReason: morph1.fallbackReason || null,
    unitScale: morph1.unitScale ?? null,
    usingGlb,
    showtimePhase,
    showMode,
    signalAspect,
    boomShownPct: boomRig?.shownPct ?? null,
    destLeave,
    leaveDest,
    scanFrac: MORPH1_SCAN_FRAC,
    scanPadPx: morph1PadPx(),
    autoplay: morph1Autoplay,
    testMode: morph1TestMode,
    readyAt: morph1.marks.readyAt ?? null,
    marks: { ...morph1.marks },
    riseEnd: morph1.riseEnd,
    hingeDeg: morph1.hingeDeg ?? (morph1.phase === "flat" ? 90 : 0),
    lyingBox: morph1.lyingBox ? { min: morph1.lyingBox.min.toArray(), max: morph1.lyingBox.max.toArray() } : null,
    standBox: morph1.standBox ? { min: morph1.standBox.min.toArray(), max: morph1.standBox.max.toArray() } : null,
    padSize: living.padSize,
    cell: living.cell,
    mode: morph2Wanted ? "morph2" : "morph1",
    morph2: morph2Wanted ? { ...morph2.stats, mask: morph2Qr.mask, artCells: morph2Qr.artCells, artFrac: +morph2Qr.artFrac.toFixed(4), ready: morph2.ready,
      colorRows: morph2Qr.colors.map((row) => row.map((c) => (c ? c.slice(1) : "-")).join(",")) } : null,
    night: nightSnapshot(),
    matrixRows: morph1Qr.matrix.map((row, r) => row.map((bit, c) => (morph1Masked(r, c) ? 0 : bit)).join("")),
    maskRows: morph1Qr.matrix.map((row, r) => row.map((bit, c) => (morph1Masked(r, c) ? 1 : 0)).join("")),
  };
}

/* ------------------------------------------------------------------ *
 * night: ?v=night. After the scan the page fades to night: deep navy-black
 * sky with a faint horizon glow, the QR modules glow like city lights (flat
 * warm colours plus a cheap blurred glow map, no postprocessing), the
 * modules fly in as glowing cubes, and once the real unit resolves a wet
 * asphalt disc spreads round it. The lenses and the two cabinet flashers
 * light the road with real point lights and streak reflections on it; the
 * light cycle washes the scene.
 * ------------------------------------------------------------------ */
const NIGHT_CFG = CFG.night || {};
const NIGHT_COL = NIGHT_CFG.colours || {};
const nightC = (k, d) => new THREE.Color(NIGHT_COL[k] || d);
const NIGHT_FADE_S = Math.max(0.1, NIGHT_CFG.fade_s ?? 0.9);
const NIGHT_ROAD_AT = NIGHT_CFG.road_start_s ?? 3.2;
const NIGHT_ROAD_S = Math.max(0.2, NIGHT_CFG.road_s ?? 1.6);
const night = { built: false, failed: false, k: 0, road: 0, colK: -1, cells: null, lastAspect: "", stats: {} };
const _nc = new THREE.Color();
const _nc2 = new THREE.Color();
const _nv = new THREE.Vector3();

function nightSoftTex(size, fn) {
  const c = document.createElement("canvas");
  c.width = size[0];
  c.height = size[1];
  const g = c.getContext("2d");
  fn(g, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One warm light colour per QR cell: city windows, some brighter, some dimmer. */
function nightCellColours() {
  const rnd = m2rng(31337);
  const base = nightC("city_light", "#FFE6B5");
  const warm = nightC("city_warm", "#FFC46B");
  const cool = nightC("city_cool", "#F4F1FF");
  const lo = THREE.MathUtils.clamp(NIGHT_CFG.light_min ?? 0.02, 0.002, 1);
  const bright = THREE.MathUtils.clamp(NIGHT_CFG.bright_share ?? 0.12, 0, 1);
  const off = THREE.MathUtils.clamp(NIGHT_CFG.dark_share ?? 0.35, 0, 0.95);
  const unlit = nightC("window_off", "#141A2A");
  night.onAt = morph2.cells.map(() => rnd());
  night.level = [];
  return morph2.cells.map((cl, i) => {
    const r = rnd();
    const q = rnd();
    const v = rnd();
    // Some windows stay dark, most glow dimly, a few are bright (linear light levels).
    if (q < off) { night.level[i] = 0; return unlit.clone(); }
    const c = base.clone().lerp(r < 0.3 ? warm : (r > 0.88 ? cool : base), 0.85);
    const b = q > 1 - bright ? 0.45 + 0.5 * v : lo + (0.16 - lo) * Math.pow(v, 1.5);
    night.level[i] = b;
    return c.multiplyScalar(b);
  });
}

/** Blurred light map of the QR field (one soft dot per module), laid flat on the paper as additive glow. */
function nightGlowPlane() {
  const cells = morph2.cells;
  let r0 = Infinity, r1 = -Infinity, c0 = Infinity, c1 = -Infinity;
  for (const cl of cells) { r0 = Math.min(r0, cl.r); r1 = Math.max(r1, cl.r); c0 = Math.min(c0, cl.c); c1 = Math.max(c1, cl.c); }
  const P = 3;
  const pad = 2;
  const W = (c1 - c0 + 1 + pad * 2) * P;
  const H = (r1 - r0 + 1 + pad * 2) * P;
  const dot = document.createElement("canvas");
  dot.width = dot.height = P * 4;
  const dg = dot.getContext("2d");
  const gr = dg.createRadialGradient(P * 2, P * 2, 0, P * 2, P * 2, P * 2);
  gr.addColorStop(0, "rgba(255,255,255,0.9)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.35)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  dg.fillStyle = gr;
  dg.fillRect(0, 0, P * 4, P * 4);
  const tex = nightSoftTex([W, H], (g) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    cells.forEach((cl, i) => {
      // Cells that fly away leave no glow behind; brighter windows glow more.
      if (cl.flyer >= 0 || !(cl.raw || cl.filler || cl.drawn) || !night.level[i]) return;
      g.globalAlpha = Math.min(1, 0.25 + night.level[i] * 1.3);
      g.drawImage(dot, (cl.c - c0 + pad) * P + P / 2 - P * 2, (cl.r - r0 + pad) * P + P / 2 - P * 2);
    });
  });
  const o = (morph2Qr.size - 1) / 2;
  const cell = living.cell;
  const w = (W / P) * cell, h = (H / P) * cell;
  const geo = new THREE.PlaneGeometry(w, h);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, color: nightC("city_glow", "#FFC978"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false, fog: true,
  });
  const m = new THREE.Mesh(geo, mat);
  m.name = "NightCityGlow";
  m.position.set(((c0 + c1) / 2 - o) * cell, morph2.H0 + cell * 0.02, ((r0 + r1) / 2 - o) * cell);
  m.renderOrder = 2;
  m.frustumCulled = false;
  return m;
}

/** Billboard halos that follow the flying cubes (one instance per cube). */
function nightHalos() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: 2.6 }, uStrength: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vCol;
      uniform float uSize;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
        vCol = instanceColor;
        #else
        vCol = vec3(1.0);
        #endif
        vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float s = length(instanceMatrix[0].xyz);
        c.xy += position.xy * s * uSize;
        gl_Position = projectionMatrix * c;
      }`,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vCol;
      uniform float uStrength;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = exp(-d * d * 3.5) * (1.0 - smoothstep(0.75, 1.0, d));
        gl_FragColor = vec4(vCol * a * uStrength, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, MORPH2_MAX_FLY);
  mesh.name = "NightCubeHalos";
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.setColorAt(0, new THREE.Color(1, 1, 1));
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  return mesh;
}

/** Wet asphalt: dark, glossy, with puddle patches (rougher and smoother areas), soft edge into the night. */
function nightRoad() {
  const R = Math.max(2, NIGHT_CFG.road_radius ?? 12);
  const rnd = m2rng(9091);
  const rough = nightSoftTex([256, 256], (g, W, H) => {
    g.fillStyle = "rgb(150,150,150)";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i += 1) {
      const x = rnd() * W, y = rnd() * H, r = 8 + rnd() * 34;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(10,10,10,0.9)");
      gr.addColorStop(1, "rgba(10,10,10,0)");
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 2600; i += 1) {
      const v = 90 + Math.floor(rnd() * 120);
      g.fillStyle = `rgba(${v},${v},${v},0.25)`;
      g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  });
  rough.colorSpace = THREE.NoColorSpace;
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(R / 2.2, R / 2.2);
  const edge = nightSoftTex([128, 128], (g, W, H) => {
    // Soft far edge (top of the texture) and soft ends left and right.
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const ex = Math.min(x, W - 1 - x) / (W * 0.18);
        const ey = y / (H * 0.12);
        const a = Math.round(255 * m1smooth(Math.min(ex, ey)));
        const i = (y * W + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = a;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
  edge.colorSpace = THREE.NoColorSpace;
  const mat = new THREE.MeshStandardMaterial({
    color: nightC("asphalt", "#0B0E13"), roughness: NIGHT_CFG.road_roughness ?? 0.16, metalness: 0.0, roughnessMap: rough,
    alphaMap: edge, transparent: true, opacity: 1, envMapIntensity: 0.1, fog: true,
  });
  // A wide strip from just behind the unit toward the camera; the field behind stays as city lights.
  const back = NIGHT_CFG.road_behind ?? 1.1;
  const geo = new THREE.PlaneGeometry(R * 2.4, R + back);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, (R - back) / 2);
  const m = new THREE.Mesh(geo, mat);
  m.name = "NightWetRoad";
  m.renderOrder = 3;
  m.scale.setScalar(1e-3);
  m.frustumCulled = false;
  return m;
}

/** Streak reflection of one light on the wet road: a flat additive strip running toward the camera. */
let nightStreakTex = null;
function nightStreak(name) {
  if (!nightStreakTex) {
    const rnd = m2rng(4711);
    nightStreakTex = nightSoftTex([64, 256], (g, W, H) => {
      const img = g.createImageData(W, H);
      const ripple = [];
      for (let y = 0; y < H; y += 1) ripple.push(0.65 + 0.35 * rnd());
      for (let y = 0; y < H; y += 1) {
        // y = 0 is the far end (at the unit), y = H the near end (toward the camera).
        const v = y / H;
        const along = Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.15)), 0.8) * (1 - 0.55 * v);
        for (let x = 0; x < W; x += 1) {
          const u = (x / (W - 1)) * 2 - 1;
          const wob = 0.12 * Math.sin(v * 38 + ripple[y] * 3);
          const across = Math.exp(-((u - wob) ** 2) * 9);
          const a = Math.max(0, Math.min(1, along * across * ripple[y]));
          const i = (y * W + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(255 * a);
          img.data[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    });
  }
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: nightStreakTex, color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.renderOrder = 4;
  m.frustumCulled = false;
  return m;
}

function nightEnsure() {
  if (night.built || night.failed || !morph1.restReady || !morph2.ready || !morph1.env || !boom) return;
  try {
    night.cells = nightCellColours();
    const group = new THREE.Group();
    group.name = "NightScene";
    night.glow = nightGlowPlane();
    night.halos = nightHalos();
    night.road = nightRoad();
    group.add(night.glow, night.halos, night.road);
    // Light positions at the unit's final pose (it never moves after the morph; only the arm turns).
    morph2Park();
    boom.updateMatrixWorld(true);
    const lens = morph1LensInfo();
    night.lensC = lens ? lens.center.clone() : new THREE.Vector3(0, 1.5, 0);
    night.lensR = lens?.box ? Math.max(0.03, (lens.box.max.x - lens.box.min.x) / 2) : 0.1;
    night.lamps = {};
    for (const k of ["red", "amber", "green"]) {
      let p = null;
      boom.traverse((o) => { if (!p && o.isMesh && lampMats[k] && o.material === lampMats[k]) p = worldBox(o).getCenter(new THREE.Vector3()); });
      night.lamps[k] = { pos: p || night.lensC.clone(), streak: nightStreak(`NightStreak_${k}`) };
      group.add(night.lamps[k].streak);
    }
    night.flashers = [];
    boom.traverse((o) => {
      if (o.name !== "PortaboomFaceLed") return;
      const pos = o.getWorldPosition(new THREE.Vector3());
      const light = new THREE.PointLight(0xffffff, 0, NIGHT_CFG.flasher_range ?? 5, 1.6);
      light.name = "NightFlasherLight";
      light.position.copy(pos).add(new THREE.Vector3(0, 0, 0.12));
      const streak = nightStreak("NightStreak_flasher");
      group.add(light, streak);
      night.flashers.push({ mesh: o, pos, light, streak });
    });
    night.wash = new THREE.PointLight(0xffffff, 0, NIGHT_CFG.wash_range ?? 9, 1.4);
    night.wash.name = "NightWashLight";
    night.wash.position.copy(night.lensC).add(new THREE.Vector3(0, 0.05, 0.45));
    group.add(night.wash);
    scene.add(group);
    night.group = group;
    // Day lights we dim (kept, so no shader changes): hemisphere, key, fill, rim.
    night.hemi = scene.children.find((o) => o.isHemisphereLight) || null;
    night.day = { hemi: night.hemi ? night.hemi.intensity : 0, key: key.intensity, fill: fill.intensity, rim: rim.intensity, keyC: key.color.clone(), rimC: rim.color.clone() };
    const env = morph1.env;
    night.env0 = { cream: env.cream.clone(), top: env.top.clone(), horizon: env.horizon.clone(), ground: env.groundC.clone(), bg: morph1.bg.clone() };
    night.env1 = {
      paper: nightC("paper", "#070A12"), top: nightC("sky_top", "#03050B"), horizon: nightC("horizon", "#1D2645"), ground: nightC("ground", "#05070C"),
    };
    night.aspectC = { red: new THREE.Color(CFG.colours.lens_red), amber: new THREE.Color(CFG.colours.lens_amber), green: new THREE.Color(CFG.colours.lens_green) };
    // Compile every night program now, while the still is up, then keep them invisible until the scan.
    try { renderer.compile(scene, morph1Cam); } catch (e) { console.warn("night compile:", e && e.message); }
    night.glow.visible = false;
    night.road.visible = false;
    night.halos.visible = false;
    for (const k in night.lamps) night.lamps[k].streak.visible = false;
    for (const f of night.flashers) f.streak.visible = false;
    night.built = true;
    night.stats = { glowTex: [night.glow.material.map.image.width, night.glow.material.map.image.height], flashers: night.flashers.length };
  } catch (e) {
    night.failed = true;
    console.warn("night scene unavailable:", e && e.message);
  }
}

/** Night palette for the sky, paper, ground and fog: k = 0 is the morph3 day look, 1 is full night. */
function nightEnv(k) {
  const env = morph1.env;
  const a = night.env0, b = night.env1;
  const kp = m1smooth(k / 0.55);
  env.cream.lerpColors(a.cream, b.paper, kp);
  env.top.lerpColors(a.top, b.top, kp);
  env.horizon.lerpColors(a.horizon, b.horizon, kp);
  env.groundC.lerpColors(a.ground, b.ground, kp);
  morph1.bg.lerpColors(a.bg, b.paper, kp);
  // The light cycle washes the low sky with the active aspect.
  if (night.washC && night.washK > 0) env.horizon.lerp(night.washC, (NIGHT_CFG.sky_wash ?? 0.02) * night.washK);
  env.mix = -1;
  morph1EnvMix(morph1.lastEm ?? 0);
  scene.background = morph1.bg;
  renderer.setClearColor(morph1.bg, 1);
  const keep = THREE.MathUtils.lerp(1, THREE.MathUtils.clamp(NIGHT_CFG.scene_light ?? 0.3, 0, 1), k);
  if (night.hemi) night.hemi.intensity = night.day.hemi * keep;
  key.intensity = night.day.key * keep;
  key.color.copy(night.day.keyC).lerp(_nc.set(0x9db4ff), k * 0.6);
  fill.intensity = night.day.fill * keep;
  rim.intensity = night.day.rim * THREE.MathUtils.lerp(1, 1.6, k);
  rim.color.copy(night.day.rimC).lerp(_nc.set(0xa8c0ff), k * 0.7);
  scene.environmentIntensity *= THREE.MathUtils.lerp(1, Math.max(0.15, keep), k);
}

/** QR modules as lights: every cell takes its warm light colour (flat, unlit) as the night comes in. */
function nightCellOn(i, k) {
  // Each module switches on at its own moment inside the second half of the fade.
  return m1smooth((k - 0.35 - 0.45 * night.onAt[i]) / 0.2);
}
function nightFloor(k) {
  const floor = morph2.floor;
  const u = floor.material.userData.u;
  u.uFlat.value = 1;
  u.uTintMix.value = 0;
  const kk = Math.round(k * 400) / 400;
  if (kk === night.colK && !night.refreshCells) return;
  night.colK = kk;
  night.refreshCells = false;
  const navy = _nc2.set(MORPH_PALETTE.navy);
  const dark = night.env1.paper;
  morph2.cells.forEach((cl, i) => {
    // Print colour -> unlit window (dark) -> its light.
    _nc.copy(cl.flyer >= 0 || !cl.drawn ? navy : cl.drawn).lerp(dark, 0.75 * m1smooth(kk / 0.4)).lerp(night.cells[i], nightCellOn(i, kk));
    floor.setColorAt(i, _nc);
  });
  floor.instanceColor.needsUpdate = true;
}

/** Flying modules glow: QR light colour on the ground, then the unit's colours, always unlit; halos follow. */
function nightFly(T, k) {
  const fly = morph2.fly;
  fly.material.userData.u.uFlat.value = 1;
  if (morph2.shadow) morph2.shadow.count = 0;
  const rv = m1span(T, MORPH2_REVEAL_S);
  const lift = THREE.MathUtils.clamp(NIGHT_CFG.cube_brighten ?? 0.25, 0, 1);
  for (let i = 0; i < morph2.flyers.length; i += 1) {
    const f = morph2.flyers[i];
    const u = m1clamp01((T - f.t0) / f.dur);
    _nc.copy(f.c0).lerp(night.env1.paper, 0.75 * m1smooth(k / 0.4)).lerp(night.cells[f.cellIdx], nightCellOn(f.cellIdx, k));
    if (u > 0) {
      // The unit's own colours, lifted a little so they read as lit cubes.
      _nc2.setRGB(Math.min(1, f.c3.r * (1 + lift) + lift * 0.25), Math.min(1, f.c3.g * (1 + lift) + lift * 0.2), Math.min(1, f.c3.b * (1 + lift) + lift * 0.15));
      _nc.lerp(_nc2, m1smooth((u - CFG.flight.recolour_from) / Math.max(0.05, CFG.flight.recolour_over)));
    }
    if (rv > 0 && CFG.resolve.style === "shimmer") {
      const kk = morph3K(f.yv, rv);
      _nc.lerp(_m3sh, 0.42 * Math.sin(Math.PI * m1clamp01(kk / 0.28)));
    }
    fly.setColorAt(i, _nc);
  }
  if (fly.instanceColor) fly.instanceColor.needsUpdate = true;
  // Halos: same matrices and colours as the cubes.
  const h = night.halos;
  h.count = fly.count;
  h.visible = fly.count > 0 && fly.visible;
  if (h.visible) {
    h.instanceMatrix.array.set(fly.instanceMatrix.array.subarray(0, fly.count * 16));
    h.instanceMatrix.needsUpdate = true;
    if (fly.instanceColor) {
      h.instanceColor.array.set(fly.instanceColor.array.subarray(0, fly.count * 3));
      h.instanceColor.needsUpdate = true;
    }
    h.material.uniforms.uStrength.value = (NIGHT_CFG.cube_glow ?? 0.55) * k;
  }
}

/** Lamp on-level (0..1) from its emissive intensity (8.8 on, 0.07 off). */
function nightLampOn(k) {
  const m = lampMats[k];
  return m ? m1clamp01((m.emissiveIntensity - 0.07) / 8.7) : 0;
}

function nightLights(road) {
  // Light cycle wash: one point light in front of the head in the colour of the lit lens.
  let best = "red", bestOn = 0;
  for (const k of ["red", "amber", "green"]) {
    const on = nightLampOn(k);
    if (on > bestOn) { bestOn = on; best = k; }
  }
  night.washC = night.aspectC[best];
  night.washK = bestOn * road;
  night.wash.color.copy(night.washC);
  night.wash.intensity = (NIGHT_CFG.wash ?? 3.2) * bestOn * Math.max(0.25, road);
  const camZ = morph1Cam.position.z;
  const ground = morph2.H0 * 1.4 + 0.001;
  const SL = THREE.MathUtils.clamp(NIGHT_CFG.streak_length ?? 0.85, 0.2, 1.5);
  const SS = (NIGHT_CFG.streaks ?? 0.9) * road;
  const place = (s, p, w, col, on) => {
    const z0 = p.z + 0.05;
    const len = Math.max(0.2, (camZ - z0) * SL);
    s.position.set(p.x, ground + 0.0008, z0 + len / 2);
    s.scale.set(w, 1, len);
    s.material.color.copy(col).multiplyScalar(on * SS);
    s.visible = on * SS > 0.004;
  };
  for (const k of ["red", "amber", "green"]) {
    const L = night.lamps[k];
    place(L.streak, L.pos, night.lensR * 2.4, night.aspectC[k], nightLampOn(k));
  }
  // Cabinet flashers: their own colour and blink, a small light each and a narrower streak.
  for (const f of night.flashers) {
    const mat = f.mesh.material;
    const on = mat ? m1clamp01(mat.emissiveIntensity / 8) : 0;
    const col = mat ? _nc.copy(mat.emissive) : _nc.set(0xffffff);
    f.light.color.copy(col);
    f.light.intensity = (NIGHT_CFG.flasher_light ?? 1.2) * on * road;
    place(f.streak, f.pos, night.lensR * 1.5, col, on * 0.75);
  }
}

function nightTick() {
  if (!morph1Wanted || morph1.phase === "fallback") return;
  nightEnsure();
  if (!night.built) return;
  const ph = morph1.phase;
  if (ph !== "rise" && ph !== "hold" && ph !== "show") return;
  const now = performance.now();
  const tn = (now - morph1.riseAt) / 1000;
  const T = tn - MORPH3_FILL_S;
  const k = m1smooth(tn / NIGHT_FADE_S);
  night.k = k;
  const road = m1smooth((T - NIGHT_ROAD_AT) / NIGHT_ROAD_S);
  night.roadK = road;
  // Light levels first (the sky wash reads them), then the palette.
  nightLights(road);
  nightEnv(k);
  nightFloor(k);
  // Clearer night air: the city lights behind the unit stay visible to the horizon.
  if (scene.fog) {
    const d = morph1Cam.position.distanceTo(_m1t);
    scene.fog.near = Math.max(scene.fog.near, d + (NIGHT_CFG.haze_near ?? 1.0) * k);
    scene.fog.far = Math.max(scene.fog.far, d + (NIGHT_CFG.haze_far ?? 10) * k);
  }
  night.glow.visible = k > 0.001;
  night.glow.material.opacity = m1smooth((k - 0.4) / 0.6) * (NIGHT_CFG.city_glow ?? 0.35);
  if (ph === "rise" && morph2.fly.count) nightFly(Math.max(0, T), k);
  else night.halos.visible = false;
  // Refill: cells left by the flyers come back as lights.
  if (ph === "rise" && T > MORPH2_REFILL_S[0] && !night.refilled) { night.refilled = true; night.refreshCells = true; }
  night.road.visible = road > 0.001;
  const rr = 0.35 + 0.65 * m1smooth(road);
  night.road.scale.setScalar(Math.max(1e-3, rr * road));
  const pv = morph1.doorPose?.pivot;
  night.road.position.set(pv ? pv.x : 0, morph2.H0 * 1.4, pv ? pv.z : 0);
  night.road.material.opacity = road;
  // The contact shadow sits on the road.
  if (morph1.env?.contact?.visible) morph1.env.contact.position.y = morph2.H0 * 1.4 + 0.002;
}

function nightSnapshot() {
  return {
    built: night.built,
    failed: night.failed,
    k: +night.k.toFixed(3),
    road: +(night.roadK || 0).toFixed(3),
    wash: night.wash ? +night.wash.intensity.toFixed(3) : null,
    washAspect: night.washC ? night.washC.getHexString() : null,
    flashers: night.flashers ? night.flashers.length : 0,
    halos: night.halos ? night.halos.count : 0,
    ...night.stats,
  };
}

/* ------------------------------------------------------------------ *
 * morph2: frame 0 is the QR with the PORTABOOM drawn in modules
 * (morph2-art.js). Every module is an instanced cube on this canvas. After
 * the scan the modules lift in a wave from the centre; the art modules and
 * the nearest data modules fly on curved, staggered paths and assemble a
 * voxel PORTABOOM sampled from the GLB surface, taking its colours on the
 * way, while the camera comes down to eye level. The real GLB then resolves
 * inside the voxels from the ground up (voxels shrink into its surface) and
 * the rest of the QR settles as the navy tile floor.
 * ------------------------------------------------------------------ */
const MORPH2_SCAN_S = Math.max(0.3, CFG.scan.duration_s);
const MORPH2_TILT_S = [CFG.camera.tilt_start_s, Math.max(CFG.camera.tilt_start_s + 0.1, CFG.camera.tilt_end_s)];
const MORPH2_FLAT_FADE_S = [0.05, 0.05 + Math.max(0.05, CFG.lift.print_fade_s)];
const MORPH2_REVEAL_S = [CFG.resolve.start_s, CFG.resolve.start_s + Math.max(0.2, CFG.resolve.duration_s)];
const MORPH2_REFILL_S = [MORPH2_REVEAL_S[0] + 0.05, MORPH2_REVEAL_S[1] + 0.15];
const MORPH2_END_S = Math.max(MORPH2_REVEAL_S[1] + 0.2, CFG.morph_end_s);
const MORPH2_TARGET_VOXELS = Math.round(THREE.MathUtils.clamp(CFG.assembly.voxel_count, 300, 1500));
const MORPH2_MAX_FLY = 1700;
const MORPH2_SAMPLES = 60000;
const MORPH2_LENS = [CFG.colours.lens_red, CFG.colours.lens_amber, CFG.colours.lens_green]; // top, middle, bottom
const MORPH2_BOOM = [CFG.colours.boom_red, CFG.colours.boom_white];

const morph2 = {
  ready: false,
  floor: null,
  fly: null,
  cells: [],
  flyers: [],
  voxels: [],
  voxel: 0,
  H0: 0,
  reveal: new THREE.Plane(new THREE.Vector3(0, -1, 0), -1e4),
  revealFx: new THREE.Plane(new THREE.Vector3(0, -1, 0), -1e4),
  clipMats: new Set(),
  fxMats: new Map(),
  yMin: 0,
  yMax: 1,
  stats: {},
  scanBuzzed: false,
};
const _m2m = new THREE.Matrix4();
const _m2p = new THREE.Vector3();
const _m2s = new THREE.Vector3();
const _m2q = new THREE.Quaternion();
const _m2c = new THREE.Color();
const _m2a = new THREE.Vector3();
const _m2b = new THREE.Vector3();
const _m2d = new THREE.Vector3();
const _m2qi = new THREE.Quaternion();

function m2rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Module material: lit standard shading, blended with the exact print colour
 * (uFlat = 1 on frame 0, so the canvas matches the still), plus an optional
 * tint toward the floor navy for the end scene.
 */
function morph2Material(fog) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.04, fog });
  const u = {
    uFlat: { value: 1 },
    uTint: { value: new THREE.Color(MORPH1_TILE_END) },
    uTintMix: { value: 0 },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = "uniform float uFlat;\nuniform vec3 uTint;\nuniform float uTintMix;\n" + sh.fragmentShader
      .replace("#include <color_fragment>", "#include <color_fragment>\n\tdiffuseColor.rgb = mix(diffuseColor.rgb, uTint, uTintMix);")
      .replace("#include <colorspace_fragment>", "#include <colorspace_fragment>\n\tgl_FragColor.rgb = mix(gl_FragColor.rgb, sRGBTransferOETF(vec4(mix(vColor, uTint, uTintMix), 1.0)).rgb, uFlat);");
  };
  mat.customProgramCacheKey = () => "morph2mod" + (fog ? "f" : "");
  mat.userData.u = u;
  return mat;
}

function morph2Init() {
  const q = morph2Qr;
  const n = q.size;
  const cell = living.cell;
  const o = (n - 1) / 2;
  morph2.H0 = cell * 0.07;
  const navy = new THREE.Color(MORPH_PALETTE.navy);
  const maxD = Math.hypot(o, o);
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const drawn = q.colors[r][c];
      const raw = q.matrix[r][c] === 1;
      if (!drawn && !raw) continue;
      const role = q.roles[r * n + c];
      morph2.cells.push({
        r, c, x: (c - o) * cell, z: (r - o) * cell,
        drawn: drawn ? new THREE.Color(drawn) : null,
        raw, role, art: role >= 2, ch: q.chars[r * n + c],
        d: Math.hypot(c - o, r - o) / maxD,
        flyer: -1,
      });
    }
  }
  if (morph3Wanted) {
    // Field that the QR grows into after the scan: plain random modules through the quiet zone
    // and above and below the code, enough to fill a tall portrait screen edge to edge.
    const { w, h } = morph1ViewSize();
    const R = Math.min(56, Math.ceil((n * Math.max(1, h / w) - n) / 2) + 6);
    const rf = m2rng(77013);
    morph2.fillR = R;
    for (let r = -R; r < n + R; r += 1) {
      for (let c = -16; c < n + 16; c += 1) {
        if (r >= 0 && r < n && c >= 0 && c < n) continue;
        if (rf() >= 0.5) continue;
        const dr = r < 0 ? -r : (r >= n ? r - n + 1 : 0);
        const dc = c < 0 ? -c : (c >= n ? c - n + 1 : 0);
        morph2.cells.push({
          r, c, x: (c - o) * cell, z: (r - o) * cell, drawn: null, raw: false, role: 0, art: false, ch: "",
          d: Math.hypot(c - o, r - o) / maxD, dq: Math.max(dr, dc) / R, filler: true, flyer: -1,
        });
      }
    }
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const floor = new THREE.InstancedMesh(geo, morph2Material(true), morph2.cells.length);
  // Lit tile tops would read pale blue; keep the lit floor close to print navy.
  floor.material.color.setScalar(0.5);
  floor.name = "Morph2Floor";
  floor.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  floor.frustumCulled = false;
  morph2.cells.forEach((cl, i) => floor.setColorAt(i, cl.drawn || navy));
  const fly = new THREE.InstancedMesh(geo, morph2Material(false), MORPH2_MAX_FLY);
  fly.name = "Morph2Fly";
  fly.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fly.frustumCulled = false;
  fly.count = 0;
  fly.setColorAt(0, navy);
  // Soft drop shadows under lifted modules: from the top-down start they show the lift.
  const shGeo = new THREE.PlaneGeometry(1, 1);
  shGeo.rotateX(-Math.PI / 2);
  const shMat = new THREE.MeshBasicMaterial({ color: 0x0b1222, transparent: true, depthWrite: false, toneMapped: false });
  shMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n\tdiffuseColor = vec4(diffuse, opacity * vColor.r);");
  };
  shMat.customProgramCacheKey = () => "morph2shadow";
  const shadow = new THREE.InstancedMesh(shGeo, shMat, MORPH2_MAX_FLY);
  shadow.name = "Morph2Shadow";
  shadow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shadow.frustumCulled = false;
  shadow.renderOrder = 2;
  shadow.count = 0;
  shadow.setColorAt(0, new THREE.Color(0, 0, 0));
  scene.add(floor, fly, shadow);
  morph2.floor = floor;
  morph2.fly = fly;
  morph2.shadow = shadow;
  morph2Flat();
  morph2ScanFxInit();
}

/** Unit materials keep the reveal plane from the start (no recompiles mid-morph). */
function morph2Clip(root) {
  if (!root) return;
  root.traverse((o) => {
    const list = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const mat of list) {
      if (morph2.clipMats.has(mat)) continue;
      // Glow cards, halos and decals (transparent, unlit) wait until the cubes have gone,
      // so they never wash over the voxel shell.
      const fx = mat.isMeshBasicMaterial || mat.blending === THREE.AdditiveBlending || (mat.transparent && mat.opacity < 0.95);
      mat.clippingPlanes = [fx ? morph2.revealFx : morph2.reveal];
      mat.clipShadows = true;
      if (morph3Wanted && fx) {
        // morph3: glows, halos and the decal fade in with the voxel shrink, so they need blending.
        mat.transparent = true;
        morph2.fxMats.set(mat, { objs: [], y: null, base: mat.opacity, last: -1 });
      }
      mat.needsUpdate = true;
      morph2.clipMats.add(mat);
    }
    if (morph3Wanted && o.isMesh) {
      for (const mat of list) morph2.fxMats.get(mat)?.objs.push(o);
    }
  });
}

function morph2SetCell(mesh, i, x, y, z, sx, sy, sz, quat) {
  _m2p.set(x, y, z);
  _m2s.set(sx, sy, sz);
  _m2m.compose(_m2p, quat || _m2qi, _m2s);
  mesh.setMatrixAt(i, _m2m);
}

/** Frame 0: every drawn module flat on the paper, exactly where the still has it. */
function morph2Flat() {
  const cell = living.cell;
  const H0 = morph2.H0;
  const { floor, fly } = morph2;
  morph2.cells.forEach((cl, i) => {
    const on = cl.drawn && cl.flyer < 0;
    morph2SetCell(floor, i, cl.x, H0 / 2, cl.z, on ? cell : 0, on ? H0 : 0, on ? cell : 0);
  });
  floor.instanceMatrix.needsUpdate = true;
  for (let k = 0; k < fly.count; k += 1) {
    const f = morph2.flyers[k];
    morph2SetCell(fly, k, f.p0.x, H0 / 2, f.p0.z, cell, H0, cell);
    fly.setColorAt(k, f.c0);
  }
  if (fly.count) {
    fly.instanceMatrix.needsUpdate = true;
    fly.instanceColor.needsUpdate = true;
  }
  floor.material.userData.u.uFlat.value = 1;
  fly.material.userData.u.uFlat.value = 1;
  floor.material.userData.u.uTintMix.value = 0;
  if (morph2.shadow) morph2.shadow.count = 0;
}

/**
 * Voxel PORTABOOM: area-weighted samples of the standing unit's surface
 * (boom up, the pose the GLB resolves in), binned into cubes; hidden inner
 * cubes dropped; the cube size is tuned to about MORPH2_TARGET_VOXELS.
 */
function morph2Voxels() {
  const rnd = m2rng(20261009);
  morph1UnitPose(1, 1);
  morph1ArmAt(MORPH1_ARM_S[1]);
  boom.visible = true;
  boom.updateMatrixWorld(true);
  const head = findSignalHead(boom);
  const headSet = new Set();
  if (head) head.traverse((o) => headSet.add(o));
  const armSet = new Set();
  if (boomRig?.pivot) boomRig.pivot.traverse((o) => armSet.add(o));
  const lens = morph1LensInfo();
  const meshes = [];
  const cabBox = new THREE.Box3();
  let triTotal = 0;
  boom.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position || !isVisibleInTree(o)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some((m) => m && (m.isMeshBasicMaterial || m.opacity < 0.5))) return;
    const mat = mats[0];
    const isLens = /HeroLens|SignalLens|Lens_|灯罩/i.test(ancestorBlob(o));
    const cls = armSet.has(o) || mat?.userData?.stripe ? "boom" : isLens ? "lens" : headSet.has(o) ? "head" : "body";
    if (cls === "body" && mat?.color) {
      const cs = mat.color.clone().convertLinearToSRGB();
      if (cs.r > 0.7 && cs.g > 0.3 && cs.g < 0.62 && cs.b < 0.25) cabBox.union(new THREE.Box3().setFromObject(o));
    }
    const pos = o.geometry.attributes.position;
    const idx = o.geometry.index;
    const nt = idx ? idx.count / 3 : pos.count / 3;
    const wp = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i += 1) {
      _m2a.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      wp[i * 3] = _m2a.x; wp[i * 3 + 1] = _m2a.y; wp[i * 3 + 2] = _m2a.z;
    }
    const cum = new Float32Array(nt);
    let acc = 0;
    for (let t = 0; t < nt; t += 1) {
      const a = idx ? idx.getX(t * 3) : t * 3;
      const b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
      const c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      _m2a.set(wp[b * 3] - wp[a * 3], wp[b * 3 + 1] - wp[a * 3 + 1], wp[b * 3 + 2] - wp[a * 3 + 2]);
      _m2b.set(wp[c * 3] - wp[a * 3], wp[c * 3 + 1] - wp[a * 3 + 1], wp[c * 3 + 2] - wp[a * 3 + 2]);
      acc += _m2d.crossVectors(_m2a, _m2b).length() * 0.5;
      cum[t] = acc;
    }
    if (acc <= 0) return;
    triTotal += nt;
    meshes.push({ o, cls, color: mat?.color ? mat.color.clone() : new THREE.Color(0.5, 0.5, 0.5), idx, wp, cum, area: acc });
  });
  const totalArea = meshes.reduce((s, m) => s + m.area, 0);
  const meshCum = [];
  let ma = 0;
  for (const m of meshes) { ma += m.area; meshCum.push(ma); }
  const bsearch = (arr, v) => {
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < v) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const S = MORPH2_SAMPLES;
  const sx = new Float32Array(S), sy = new Float32Array(S), sz = new Float32Array(S);
  const sm = new Uint16Array(S);
  for (let k = 0; k < S; k += 1) {
    const mi = bsearch(meshCum, rnd() * totalArea);
    const m = meshes[mi];
    const t = bsearch(m.cum, rnd() * m.area);
    const a = m.idx ? m.idx.getX(t * 3) : t * 3;
    const b = m.idx ? m.idx.getX(t * 3 + 1) : t * 3 + 1;
    const c = m.idx ? m.idx.getX(t * 3 + 2) : t * 3 + 2;
    let u = rnd(), v = rnd();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    sx[k] = m.wp[a * 3] * w + m.wp[b * 3] * u + m.wp[c * 3] * v;
    sy[k] = m.wp[a * 3 + 1] * w + m.wp[b * 3 + 1] * u + m.wp[c * 3 + 1] * v;
    sz[k] = m.wp[a * 3 + 2] * w + m.wp[b * 3 + 2] * u + m.wp[c * 3 + 2] * v;
    sm[k] = mi;
  }
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  for (let k = 0; k < S; k += 1) { minX = Math.min(minX, sx[k]); minY = Math.min(minY, sy[k]); minZ = Math.min(minZ, sz[k]); }
  const bin = (s) => {
    const map = new Map();
    for (let k = 0; k < S; k += 1) {
      const ix = Math.floor((sx[k] - minX) / s), iy = Math.floor((sy[k] - minY) / s), iz = Math.floor((sz[k] - minZ) / s);
      const key = ix + iy * 2048 + iz * 4194304;
      let e = map.get(key);
      if (!e) { e = { ix, iy, iz, n: 0, ks: [] }; map.set(key, e); }
      e.n += 1;
      e.ks.push(k);
    }
    // Drop cubes hidden on all six sides.
    for (const [key, e] of map) {
      e.inner = map.has(key + 1) && map.has(key - 1) && map.has(key + 2048) && map.has(key - 2048)
        && map.has(key + 4194304) && map.has(key - 4194304);
    }
    return [...map.values()].filter((e) => !e.inner);
  };
  let s = living.cell * 1.5;
  let cubes = bin(s);
  for (let it = 0; it < 4; it += 1) {
    const ratio = cubes.length / MORPH2_TARGET_VOXELS;
    if (Math.abs(ratio - 1) < 0.06) break;
    s *= Math.sqrt(ratio);
    cubes = bin(s);
  }
  const lensY = lens?.box ? [lens.box.min.y, lens.box.max.y] : null;
  const armBase = boomRig?.pivot ? boomRig.pivot.getWorldPosition(new THREE.Vector3()).y : 0;
  const voxels = cubes.map((e) => {
    const votes = { boom: 0, lens: 0, head: 0, body: 0 };
    const col = new THREE.Color(0, 0, 0);
    for (const k of e.ks) {
      const m = meshes[sm[k]];
      votes[m.cls] += 1;
      if (m.cls === "body" || m.cls === "head") col.r += m.color.r, col.g += m.color.g, col.b += m.color.b;
    }
    let cls = Object.keys(votes).reduce((a, b) => (votes[b] > votes[a] ? b : a));
    // Lenses sit recessed under their visors: any real share of lens surface makes it a lens cube.
    if (votes.lens >= 0.2 * e.n && cls !== "boom") cls = "lens";
    const x = minX + (e.ix + 0.5) * s, y = minY + (e.iy + 0.5) * s, z = minZ + (e.iz + 0.5) * s;
    let color;
    let part = cls;
    if (cls === "boom") {
      color = new THREE.Color(MORPH2_BOOM[Math.floor((y - armBase) / (s * 2)) & 1 ? 1 : 0]);
    } else if (cls === "lens" && lensY) {
      const f = (lensY[1] - y) / Math.max(1e-6, lensY[1] - lensY[0]);
      const li = Math.max(0, Math.min(2, Math.floor(f * 3)));
      color = new THREE.Color(MORPH2_LENS[li]);
      part = ["lensR", "lensA", "lensG"][li];
    } else {
      const nb = votes.body + votes.head;
      color = nb ? col.multiplyScalar(1 / nb) : new THREE.Color(0.2, 0.2, 0.2);
    }
    // Body splits into the orange cabinet and the base (wheels, outrigger legs, feet) below it.
    if (part === "body") part = !cabBox.isEmpty() && y < cabBox.min.y + s * 0.5 ? "base" : "cabinet";
    return { x, y, z, color, part, flyer: -1 };
  });
  // Lens discs: colour every front cube over a lens (the visors hide most of the lens surface).
  if (lensY) {
    const cl3 = [0, 1, 2].map(() => ({ x: 0, y: 0, z: 0, n: 0, d: [] }));
    const third = (y) => Math.max(0, Math.min(2, Math.floor(((lensY[1] - y) / Math.max(1e-6, lensY[1] - lensY[0])) * 3)));
    for (let k = 0; k < S; k += 1) {
      if (meshes[sm[k]].cls !== "lens") continue;
      const c = cl3[third(sy[k])];
      c.x += sx[k]; c.y += sy[k]; c.z += sz[k]; c.n += 1;
    }
    for (const c of cl3) if (c.n) { c.x /= c.n; c.y /= c.n; c.z /= c.n; }
    for (let k = 0; k < S; k += 1) {
      if (meshes[sm[k]].cls !== "lens") continue;
      const c = cl3[third(sy[k])];
      c.d.push(Math.hypot(sx[k] - c.x, sy[k] - c.y));
    }
    cl3.forEach((c, li) => {
      if (!c.n) return;
      c.d.sort((a, b) => a - b);
      const r = c.d[Math.floor(c.d.length * 0.85)] || 0;
      for (const v of voxels) {
        if (v.part === "boom") continue;
        if (Math.hypot(v.x - c.x, v.y - c.y) <= r && v.z >= c.z - s * 1.2) {
          v.part = ["lensR", "lensA", "lensG"][li];
          v.color = new THREE.Color(MORPH2_LENS[li]);
        }
      }
    });
  }
  morph2.voxel = s;
  morph2.voxels = voxels;
  morph2.yMin = Math.min(...voxels.map((v) => v.y)) - s;
  morph2.yMax = Math.max(...voxels.map((v) => v.y)) + s;
  morph2.stats = { tris: triTotal, samples: S, voxels: voxels.length, voxelSize: +s.toFixed(4), voxelCells: +(s / living.cell).toFixed(2) };
}

/**
 * Unit part of an art cell, from its letter in the GLB-derived art grid:
 * housing and mast to the head, lenses to their lens, cabinet, flashers and
 * decal to the cabinet, wheels, feet and legs to the base, boom and STOP disc
 * to the arm.
 */
function morph2ArtPart(cl) {
  switch (cl.ch) {
    case "R": return "lensR";
    case "A": return "lensA";
    case "G": return "lensG";
    case "H": return "head";
    case "O": case "F": case "D": return "cabinet";
    case "K": return "base";
    case "r": case "W": case "S": return "boom";
    case "N": return cl.r < morph2.cabTop ? "head" : (cl.r > morph2.cabBottom - 2 ? "base" : "cabinet");
    default: return "cabinet";
  }
}

/**
 * Who flies where. Each voxel takes the art module of the same part at the
 * same relative spot (the drawn unit becomes the 3D unit); once a part's art
 * modules are used up, the nearest plain data modules join. Leftover art
 * modules fly in too and melt into the unit on arrival.
 */
function morph2Assign() {
  const rnd = m2rng(4242);
  const parts = ["boom", "lensR", "lensA", "lensG", "head", "cabinet", "base"];
  const oc = morph2.cells.filter((cl) => cl.ch === "O");
  morph2.cabTop = Math.min(...oc.map((cl) => cl.r));
  morph2.cabBottom = Math.max(...oc.map((cl) => cl.r));
  const vox = morph2.voxels;
  const cells = morph2.cells;
  const art = cells.map((cl, i) => ({ cl, i })).filter(({ cl }) => cl.art);
  const data = cells.map((cl, i) => ({ cl, i })).filter(({ cl }) => !cl.art && cl.raw && cl.drawn);
  const used = new Uint8Array(cells.length);
  for (const cl of cells) cl.flyer = -1;
  const box2 = (pts) => {
    const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    for (const [x, y] of pts) { b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); }
    b.w = Math.max(1e-6, b.x1 - b.x0); b.h = Math.max(1e-6, b.y1 - b.y0);
    return b;
  };
  const flyers = [];
  const addFlyer = (cellIdx, v, dissolve) => {
    const cl = cells[cellIdx];
    used[cellIdx] = 1;
    cl.flyer = flyers.length;
    flyers.push({ cellIdx, v, dissolve, p0: new THREE.Vector3(cl.x, 0, cl.z), c0: (cl.drawn || new THREE.Color(MORPH_PALETTE.navy)).clone() });
  };
  for (const part of parts) {
    const tv = vox.map((v, i) => ({ v, i })).filter(({ v }) => (part === "head" ? v.part === "head" || v.part === "lens" : v.part === part));
    const src = art.filter(({ cl }) => morph2ArtPart(cl) === part);
    if (!tv.length && !src.length) continue;
    // Normalised coordinates: across x / down from the top; the boom runs along its length.
    const isBoom = part === "boom";
    const tb = box2(tv.map(({ v }) => (isBoom ? [v.y, 0] : [v.x, -v.y])));
    const sb = box2(src.map(({ cl }) => (isBoom ? [cl.c, 0] : [cl.c, cl.r])));
    const tN = ({ v }) => (isBoom ? [(v.y - tb.x0) / tb.w, 0.5] : [(v.x - tb.x0) / tb.w, (-v.y - tb.y0) / tb.h]);
    const sN = ({ cl }) => (isBoom ? [(cl.c - sb.x0) / sb.w, 0.5 + (cl.r - (sb.y0 + sb.y1) / 2) * 0.02] : [(cl.c - sb.x0) / sb.w, (cl.r - sb.y0) / sb.h]);
    const order = tv.slice();
    for (let i = order.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const srcN = src.map((s) => ({ ...s, n: sN(s) }));
    for (const t of order) {
      const [u, w] = tN(t);
      let best = -1, bd = Infinity;
      for (let k = 0; k < srcN.length; k += 1) {
        if (used[srcN[k].i]) continue;
        const d = (srcN[k].n[0] - u) ** 2 + (srcN[k].n[1] - w) ** 2;
        if (d < bd) { bd = d; best = k; }
      }
      if (best >= 0) { addFlyer(srcN[best].i, t.i, false); continue; }
      // Art used up: nearest plain data module to where this spot sits in the drawing.
      const gc = sb.x0 + u * sb.w;
      const gr = isBoom ? (sb.y0 + sb.y1) / 2 : sb.y0 + w * sb.h;
      let bi = -1, bdd = Infinity;
      for (const d of data) {
        if (used[d.i]) continue;
        const dd = (d.cl.c - gc) ** 2 + (d.cl.r - gr) ** 2;
        if (dd < bdd) { bdd = dd; bi = d.i; }
      }
      if (bi >= 0) addFlyer(bi, t.i, false);
    }
    // Art modules with no voxel left: fly in and melt into the nearest voxel of the part.
    for (const s of srcN) {
      if (used[s.i] || !tv.length) continue;
      let best = 0, bd = Infinity;
      tv.forEach((t, k) => { const [u, w] = tN(t); const d = (s.n[0] - u) ** 2 + (s.n[1] - w) ** 2; if (d < bd) { bd = d; best = k; } });
      addFlyer(s.i, tv[best].i, true);
    }
  }
  // Any art cell still unassigned (no voxels at all for its part) melts at the unit centre.
  for (const { i } of art) if (!used[i] && vox.length) addFlyer(i, Math.floor(rnd() * vox.length), true);
  // Flight timing and paths.
  const yr = Math.max(1e-6, morph2.yMax - morph2.yMin);
  const cx = morph1.finalPos ? morph1.finalPos.x : 0;
  const cz = morph1.finalPos ? morph1.finalPos.z : 0;
  const headV = vox.filter((v) => v.part === "head" || v.part === "lens" || v.part.startsWith("lens"));
  const headB = box2(headV.length ? headV.map((v) => [v.x, v.y]) : [[0, 0], [1, 1]]);
  for (const f of flyers) {
    const v = vox[f.v];
    const cl = cells[f.cellIdx];
    const h = (v.y - morph2.yMin) / yr;
    f.p3 = new THREE.Vector3(v.x, v.y, v.z);
    f.c3 = v.color.clone();
    f.axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    if (morph3Wanted && (v.part === "head" || v.part === "lens" || v.part.startsWith("lens"))) {
      // morph3: the light head builds like the boom, in order: row by row from its base,
      // left to right in a row, each module rising into its slot from just below and in front.
      const hh = (v.y - headB.y0) / headB.h;
      const xx = (v.x - headB.x0) / headB.w;
      const P = CFG.flight.head;
      // Start time is set below from the module's place in the build order (row by row, bottom up).
      f.headKey = Math.round(hh * 40) + 0.9 * xx;
      f.t0 = P.start_s + P.stagger_dist * cl.d + rnd() * P.jitter_s;
      f.dur = P.duration_s + rnd() * P.duration_jitter_s;
      f.lift = P.arc + rnd() * 0.04;
      // Approach from just in front of and under the slot: modules funnel up into the head face.
      f.p2 = f.p3.clone().add(new THREE.Vector3(0, -0.22, 0.16 + rnd() * 0.02));
      f.spin = (P.spin + rnd() * 0.1) * (rnd() < 0.5 ? -1 : 1);
    } else if (v.part === "boom") {
      // The boom builds as a line: modules leave in order along the drawn boom and
      // stack straight up the arm, base first, on a shallow arc with almost no spin.
      const P = CFG.flight.boom;
      f.t0 = P.start_s + P.stagger_dist * cl.d + P.stagger_height * h + rnd() * P.jitter_s;
      f.dur = P.duration_s + rnd() * P.duration_jitter_s;
      f.lift = P.arc + rnd() * 0.06;
      f.p2 = f.p3.clone().add(new THREE.Vector3(0, -0.12 - 0.1 * h, 0.05 + rnd() * 0.03));
      f.spin = (P.spin + rnd() * 0.2) * (rnd() < 0.5 ? -1 : 1);
    } else {
      const P = CFG.flight.body;
      f.t0 = P.start_s + P.stagger_dist * cl.d + P.stagger_height * h + rnd() * P.jitter_s;
      f.dur = P.duration_s + rnd() * P.duration_jitter_s;
      f.lift = P.arc + rnd() * 0.15;
      // Arrive from slightly above and in front, with a little sideways sweep: curved, not a swarm.
      const out = new THREE.Vector3(v.x - cx, 0, 0);
      out.x = Math.sign(out.x || 1) * (0.03 + rnd() * 0.06);
      f.p2 = f.p3.clone().add(out).add(new THREE.Vector3(0, 0.16 + rnd() * 0.1, 0.06 + rnd() * 0.08));
      f.spin = (P.spin + rnd() * 0.8) * (rnd() < 0.5 ? -1 : 1);
    }
    f.yv = v.y;
  }
  if (morph3Wanted) {
    // Light head: an even stream, one row after another, so only a few modules are in the air at once.
    const hf = flyers.filter((f) => f.headKey != null).sort((a, b) => a.headKey - b.headKey);
    const span = CFG.flight.head.stagger_height + CFG.flight.head.stagger_across;
    hf.forEach((f, i) => { f.t0 += span * (i / Math.max(1, hf.length - 1)); });
  }
  morph2.flyers = flyers;
  morph2.fly.count = flyers.length;
  morph2.stats.flyers = flyers.length;
  morph2.stats.artFlyers = flyers.filter((f) => cells[f.cellIdx].art).length;
  morph2.stats.dataFlyers = flyers.filter((f) => !cells[f.cellIdx].art).length;
  morph2.stats.melters = flyers.filter((f) => f.dissolve).length;
  morph2.stats.floorInstances = cells.length;
  morph2.stats.parts = Object.fromEntries(parts.map((pt) => [pt, {
    voxels: vox.filter((v) => v.part === pt || (pt === "head" && v.part === "lens")).length,
    art: art.filter(({ cl }) => morph2ArtPart(cl) === pt).length,
    artFlyers: flyers.filter((f) => cells[f.cellIdx].art && morph2ArtPart(cells[f.cellIdx]) === pt).length,
  }]));
  morph2.stats.lastArrival = +Math.max(...flyers.map((f) => f.t0 + f.dur)).toFixed(2);
  if (morph3Wanted) {
    // Where and when the base is complete: the floor ripple starts there.
    const bf = flyers.filter((f) => vox[f.v].part === "base");
    const bv = vox.filter((v) => v.part === "base");
    morph2.landT = bf.length ? Math.max(...bf.map((f) => f.t0 + f.dur)) : 2;
    morph2.landX = bv.length ? bv.reduce((a, v) => a + v.x, 0) / bv.length : cx;
    morph2.landZ = bv.length ? bv.reduce((a, v) => a + v.z, 0) / bv.length : cz;
    morph2.stats.landT = +morph2.landT.toFixed(2);
    const lens = morph1LensInfo();
    morph2.lensCY = lens ? lens.center.y : morph2.yMax;
    morph2.stats.headLastArrival = +Math.max(...flyers.filter((f) => headV.includes(vox[f.v])).map((f) => f.t0 + f.dur)).toFixed(2);
  }
}

/** After the GLB and the rest pose are ready: voxels, assignment, unit parked fully clipped in its final pose. */
function morph2Prepare() {
  if (!boom || !morph1.restReady) return;
  const t0 = performance.now();
  morph2Clip(boom);
  morph2.reveal.constant = -1e4;
  morph2.revealFx.constant = -1e4;
  morph2Voxels();
  if (morph3Wanted) {
    if (!morph2.ring) morph3RingInit();
    morph3RingBins();
  }
  morph2Assign();
  morph2Park();
  morph2.ready = true;
  morph2.stats.prepareMs = Math.round(performance.now() - t0);
  morph2Flat();
}

function morph2Park() {
  morph1UnitPose(1, 1);
  morph1ArmAt(MORPH1_ARM_S[1]);
  boom.visible = true;
  boom.updateMatrixWorld(true);
}

const _m2bez = (p0, p1, p2, p3, t, out) => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return out.set(
    a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    a * p0.z + b * p1.z + c * p2.z + d * p3.z
  );
};
const _m2p1 = new THREE.Vector3();

/** One morph frame at T seconds after the scan. */
function morph2Frame(T) {
  const cell = living.cell;
  const H0 = morph2.H0;
  const { floor, fly } = morph2;
  const flat = 1 - m1smooth(m1span(T, MORPH2_FLAT_FADE_S));
  fly.material.userData.u.uFlat.value = flat;
  // The floor wakes up lit for the wave, then settles back to the flat print navy of the end scene.
  floor.material.userData.u.uFlat.value = Math.max(flat, m1smooth(m1span(T, [2.4, 4.0])));
  const sh = morph2.shadow;
  const tiltK = m1span(T, MORPH2_TILT_S);
  sh.count = morph2.flyers.length;
  const s3 = morph2.voxel * 0.95;
  // Resolve: the whole GLB switches on at once inside the voxel shell (no slicing plane
  // crossing the unit), while the cubes shrink into its surface from the base up.
  const rv = m1span(T, MORPH2_REVEAL_S);
  morph2.reveal.constant = T >= MORPH2_REVEAL_S[0] ? 1e4 : -1e4;
  morph2.revealFx.constant = (morph3Wanted ? rv > 0 : rv >= 0.8) ? 1e4 : -1e4;
  const yr = Math.max(1e-6, morph2.yMax - morph2.yMin);
  if (morph3Wanted) {
    morph3Fx(rv);
    morph3Ring(rv);
  }
  for (let k = 0; k < morph2.flyers.length; k += 1) {
    const f = morph2.flyers[k];
    const u = m1clamp01((T - f.t0) / f.dur);
    let x, y, z, sx, sy, sz;
    if (u <= 0) {
      x = f.p0.x; y = H0 / 2; z = f.p0.z; sx = cell; sy = H0; sz = cell;
      _m2q.identity();
      _m2c.copy(f.c0);
    } else {
      const e = m1smooth(u);
      _m2p1.set(f.p0.x, f.lift, f.p0.z);
      _m2bez(f.p0, _m2p1, f.p2, f.p3, e, _m2a);
      x = _m2a.x; y = Math.max(_m2a.y, H0 / 2); z = _m2a.z;
      const g = m1smooth(m1clamp01(u * 1.6));
      sx = sz = THREE.MathUtils.lerp(cell, s3, m1smooth(u));
      sy = THREE.MathUtils.lerp(H0, s3, g);
      _m2q.setFromAxisAngle(f.axis, f.spin * Math.sin(Math.PI * e));
      // Modules stay QR navy for the first half of the flight, then take the unit's colours.
      _m2c.copy(f.c0).lerp(f.c3, m1smooth((u - CFG.flight.recolour_from) / Math.max(0.05, CFG.flight.recolour_over)));
      if (f.dissolve) {
        const m = 1 - m1smooth((u - 0.7) / 0.3);
        sx *= m; sy *= m; sz *= m;
      }
    }
    // Resolve: the GLB appears below the rising plane; cubes shrink into its surface as it passes.
    if (rv > 0 && morph3Wanted) {
      const kk = morph3K(f.yv, rv);
      if (CFG.resolve.style === "shimmer") {
        // A light wave climbs the unit: each cube flares as it arrives, flips on its axis
        // and sinks into the real surface behind it.
        // Only the leading edge of the wave lights up; the cubes keep their own colour as they turn.
        const glow = Math.sin(Math.PI * m1clamp01(kk / 0.28));
        _m2c.lerp(_m3sh, 0.42 * glow);
        const m = 1 - m1smooth((kk - 0.15) / 0.85);
        sx *= m; sy *= m; sz *= m;
        _m3fq.setFromAxisAngle(_m3xa, THREE.MathUtils.degToRad(CFG.resolve.flip_deg) * m1smooth(kk));
        _m2q.premultiply(_m3fq);
      } else {
        const m = 1 - m1smooth(kk);
        sx *= m; sy *= m; sz *= m;
      }
    } else if (rv > 0) {
      const kk = m1clamp01((rv - 0.5 * ((f.yv - morph2.yMin) / yr)) / 0.5);
      const m = 1 - m1smooth(kk);
      sx *= m; sy *= m; sz *= m;
    }
    morph2SetCell(fly, k, x, y, z, sx, sy, sz, _m2q);
    fly.setColorAt(k, _m2c);
    // Shadow on the paper, offset with height (key light from the upper left).
    const hgt = Math.max(0, y - H0 / 2);
    const hk = m1clamp01(hgt / 0.9);
    const a = 0.2 * m1smooth(hgt / (cell * 0.6)) * (1 - 0.6 * hk) * (1 - m1smooth(tiltK / 0.45)) * (1 - m1smooth((u - 0.75) / 0.25));
    const ss = sx * (1 + 0.8 * hk);
    morph2SetCell(sh, k, x + hgt * 0.32, H0 + 0.0006, z + hgt * 0.42, a > 0.002 ? ss : 0, 1, a > 0.002 ? ss : 0);
    sh.setColorAt(k, _m2c.setRGB(a, a, a, THREE.LinearSRGBColorSpace));
  }
  sh.instanceMatrix.needsUpdate = true;
  if (sh.instanceColor) sh.instanceColor.needsUpdate = true;
  fly.instanceMatrix.needsUpdate = true;
  if (fly.instanceColor) fly.instanceColor.needsUpdate = true;
  // Floor: a low wave runs out from the centre; vacated cells fill back in as plain QR navy.
  const rf = m1span(T, MORPH2_REFILL_S);
  morph2.cells.forEach((cl, i) => {
    const stays = cl.drawn && cl.flyer < 0;
    const endOn = cl.raw;
    let s = 0;
    let lift = 0;
    let sy = H0;
    if (stays || cl.filler) {
      s = cl.filler ? morph3FillerScale(cl) : 1;
      const LW = CFG.lift;
      const w = (T - (LW.start_s + LW.spread_s * cl.d)) / Math.max(0.05, LW.duration_s);
      if (w > 0 && w < 1) {
        const hump = Math.sin(Math.PI * w);
        lift = hump * cell * LW.height_cells;
        sy = H0 * (1 + 4 * hump);
        // Tip each tile away from the centre as the wave passes, so the shading ripples outward.
        const rx = cl.z, rz = -cl.x;
        const rl = Math.hypot(rx, rz) || 1;
        _m2a.set(rx / rl, 0, rz / rl);
        _m2q.setFromAxisAngle(_m2a, LW.tilt * hump);
      } else _m2q.identity();
      if (!endOn && !cl.filler) s = 1 - m1smooth((rf - 0.2) / 0.5); // drawn but not data (art left behind): fades out
    } else if (endOn) {
      const w = m1clamp01((rf - 0.45 * cl.d) / 0.55);
      s = w > 0 ? Math.max(0, m1outBack(w)) : 0;
    }
    if (!stays && !cl.filler) _m2q.identity();
    if (morph3Wanted && CFG.assembly.floor_ripple && s > 0 && T > morph2.landT) {
      // Faint ring through the floor as the base completes: a few module heights, fading as it spreads.
      const dd = Math.hypot(cl.x - morph2.landX, cl.z - morph2.landZ) / cell;
      const ring = (T - morph2.landT) * CFG.assembly.ripple_speed_cells - dd;
      if (ring > 0 && ring < 5) {
        const k = Math.sin(Math.PI * ring / 5) * Math.max(0, 1 - dd / 30);
        lift += cell * CFG.assembly.ripple_height_cells * k;
        sy += H0 * 1.5 * k;
      }
    }
    morph2SetCell(floor, i, cl.x, lift + sy / 2, cl.z, cell * s, sy * (s > 0 ? 1 : 0), cell * s, _m2q);
  });
  floor.instanceMatrix.needsUpdate = true;
}

const _m3sh = new THREE.Color(CFG.resolve.shimmer_color);
const _m3xa = new THREE.Vector3(1, 0, 0);
const _m3fq = new THREE.Quaternion();
/** Resolve wave at height y: 0 before the wave reaches it, 1 once it has passed. */
function morph3K(y, rv) {
  const yr = Math.max(1e-6, morph2.yMax - morph2.yMin);
  const w = THREE.MathUtils.clamp(CFG.resolve.shimmer_band, 0.05, 1);
  return m1clamp01((rv * (1 + w) - (y - morph2.yMin) / yr) / w);
}
/** Resolve share at height y: the same curve the cubes go on, so effects come in as the cubes leave. */
function morph3FadeAt(y, rv) {
  return m1smooth(morph3K(y, rv));
}

/** Glowing ring riding the resolve wave, sized to the unit's cross-section at that height. */
function morph3RingInit() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.5, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 64);
  const tex = new THREE.CanvasTexture(c);
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 48, 1, true),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(CFG.resolve.shimmer_color), alphaMap: tex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false,
    })
  );
  ring.name = "Morph3Ring";
  ring.renderOrder = 4;
  ring.visible = false;
  ring.frustumCulled = false;
  scene.add(ring);
  morph2.ring = ring;
}
function morph3RingBins() {
  const s = morph2.voxel;
  const bins = new Map();
  for (const v of morph2.voxels) {
    const k = Math.floor((v.y - morph2.yMin) / s);
    let b = bins.get(k);
    if (!b) { b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }; bins.set(k, b); }
    b.x0 = Math.min(b.x0, v.x); b.x1 = Math.max(b.x1, v.x); b.z0 = Math.min(b.z0, v.z); b.z1 = Math.max(b.z1, v.z);
  }
  morph2.ringBins = bins;
}
function morph3Ring(rv) {
  const ring = morph2.ring;
  if (!ring) return;
  const a = CFG.resolve.style === "shimmer" ? CFG.resolve.sweep_ring * Math.sin(Math.PI * rv) : 0;
  ring.visible = a > 0.01 && !!morph2.ringBins;
  if (!ring.visible) return;
  const yr = morph2.yMax - morph2.yMin;
  const w = THREE.MathUtils.clamp(CFG.resolve.shimmer_band, 0.05, 1);
  const y = morph2.yMin + (rv * (1 + w) - 0.1 * w) * yr;
  const s = morph2.voxel;
  let b = null;
  const k0 = Math.floor((y - morph2.yMin) / s);
  for (let d = 0; d < 4 && !b; d += 1) b = morph2.ringBins.get(k0 - d) || morph2.ringBins.get(k0 + d);
  if (!b) { ring.visible = false; return; }
  ring.position.set((b.x0 + b.x1) / 2, y, (b.z0 + b.z1) / 2);
  ring.scale.set((b.x1 - b.x0) / 2 + s * 0.9, s * 1.1, (b.z1 - b.z0) / 2 + s * 0.9);
  ring.material.opacity = Math.min(1, a * 0.7);
}

/** Brief lens flash as the wave locks the light head (0 outside the moment). */
function morph3Flash(rv) {
  if (CFG.resolve.style !== "shimmer" || !CFG.resolve.lens_flash) return 0;
  const kL = morph3K(morph2.lensCY ?? morph2.yMax, rv);
  return CFG.resolve.lens_flash * Math.sin(Math.PI * m1clamp01((kL - 0.55) / 0.45));
}

/** morph3: lens glow, halos, decal and the STOP face fade in progressively with the voxel shrink. */
function morph3Fx(rv) {
  for (const [mat, e] of morph2.fxMats) {
    if (e.y == null) {
      let ys = 0;
      let n = 0;
      for (const o of e.objs) { ys += new THREE.Box3().setFromObject(o).getCenter(_m2d).y; n += 1; }
      e.y = n ? ys / n : morph2.yMax;
    }
    // Someone else (the signal aspect) set the opacity since our last write: that is the new base.
    if (mat.opacity !== e.last) e.base = mat.opacity;
    const halo = Object.values(lampHalos).includes(mat);
    mat.opacity = Math.min(1, e.base * morph3FadeAt(e.y, rv) * (halo ? 1 + 1.4 * morph3Flash(rv) : 1));
    e.last = mat.opacity;
  }
  const fl = morph3Flash(rv);
  const lf = morph3FadeAt(morph2.lensCY ?? morph2.yMax, rv) * (1 + 2.5 * fl);
  for (const k of ["red", "amber", "green"]) {
    const m = lampMats[k];
    if (m) m.emissiveIntensity = 0.07 + Math.max(0, m.emissiveIntensity - 0.07) * lf;
    const l = lampLights[k];
    if (l) l.intensity *= lf;
  }
  const hero = boom?.userData?.heroHead;
  if (hero) {
    for (const k of ["red", "amber", "green"]) {
      const lens = hero.getObjectByName(`HeroLens_${k}`);
      if (lens?.material) lens.material.emissiveIntensity = 0.08 + Math.max(0, lens.material.emissiveIntensity - 0.08) * lf;
    }
  }
  const face = signGroup?.getObjectByName("PortaboomStopFace");
  if (face?.material) {
    if (face.userData.m3emi == null) face.userData.m3emi = face.material.emissiveIntensity;
    if (face.userData.m3y == null) face.userData.m3y = face.getWorldPosition(_m2d).y;
    face.material.emissiveIntensity = face.userData.m3emi * morph3FadeAt(face.userData.m3y, rv);
  }
}

const _m3up = new THREE.Vector3(0, 1, 0);
const _m3q = new THREE.Quaternion();
const _m3f = new THREE.Vector3();
/**
 * morph3: as the boom comes down, ease back to a slightly wider frame so the
 * lowered arm and its STOP disc land in shot (after the light cycle, so the
 * lenses still face the viewer square-on while they change).
 */
function morph3BoomDownCamera() {
  const a = morph1.doorPose;
  const b = morph1.doorPoseDown;
  if (!a || !b || !boomRig) return;
  const k = m1ease(1 - THREE.MathUtils.clamp(boomRig.shownPct, 0, 100) / 100);
  if (k <= 0) return;
  const lg = (x, y) => Math.exp(THREE.MathUtils.lerp(Math.log(x), Math.log(y), k));
  morph1.doorPose = {
    ...a, target: a.target.clone().lerp(b.target, k), height: lg(a.height, b.height),
    shiftX: THREE.MathUtils.lerp(a.shiftX, b.shiftX, k), shiftY: THREE.MathUtils.lerp(a.shiftY, b.shiftY, k),
  };
  morph1ApplyCamera(1);
  morph1.doorPose = a;
}

/** morph3 field cells: pop in outward from the code's edges while the QR grows to fill the screen. */
function morph3FillerScale(cl) {
  const F = MORPH3_FILL_S;
  const pop = Math.max(0.05, CFG.fill.pop_s);
  const t = morph2.fillT ?? 0;
  if (t >= F + pop) return 1;
  const tp = 0.05 + cl.dq * Math.max(0, F - pop - 0.05);
  const u = m1clamp01((t - tp) / pop);
  return u > 0 ? Math.max(0, m1outBack(u)) : 0;
}

/** morph3 camera after the morph clock T: hero glide (yaw) plus a slight push-in on the resolve. */
function morph3CameraFx(T) {
  morph3Orbit(morph3YawAt(T));
  const pose = morph1.doorPose;
  const P = CFG.resolve.push_in;
  if (!pose?.pivot || !P) return;
  const rv = m1smooth(m1span(T, MORPH2_REVEAL_S));
  const back = m1smooth((T - MORPH2_REVEAL_S[1]) / Math.max(0.3, MORPH3_GLIDE_AT + MORPH3_GLIDE_S - MORPH2_REVEAL_S[1]));
  const k = THREE.MathUtils.clamp(P, 0, 0.2) * rv * (1 - back);
  if (k <= 0) return;
  _m3f.set(pose.pivot.x, morph1Cam.position.y, pose.pivot.z);
  morph1Cam.position.lerp(_m3f, k);
  morph1Cam.updateMatrixWorld(true);
  morph1.pushIn = +k.toFixed(3);
}

/** morph3 hero glide: yaw (deg) at T seconds after the scan; eases from the full arc back to square-on. */
function morph3YawAt(T) {
  return MORPH3_GLIDE_YAW_DEG * (1 - m1ease((T - MORPH3_GLIDE_AT) / MORPH3_GLIDE_S));
}
/**
 * Orbit the camera round the unit's vertical axis. The arc only comes in as the
 * camera leaves top-down (so frame 0 and the scan are untouched) and never pitches.
 */
function morph3Orbit(yawDeg) {
  const pose = morph1.doorPose;
  if (!pose?.pivot || !yawDeg) return;
  _m3f.set(0, 0, -1).applyQuaternion(morph1Cam.quaternion);
  const w = Math.pow(1 - Math.abs(_m3f.y), 1.5);
  const a = THREE.MathUtils.degToRad(yawDeg * w);
  if (Math.abs(a) < 1e-6) return;
  _m3q.setFromAxisAngle(_m3up, a);
  morph1Cam.position.sub(pose.pivot).applyQuaternion(_m3q).add(pose.pivot);
  morph1Cam.quaternion.premultiply(_m3q);
  morph1Cam.updateMatrixWorld(true);
  if (morph1.env?.sky) morph1.env.sky.position.copy(morph1Cam.position);
  morph1.yawDeg = +(yawDeg * w).toFixed(2);
}

/** End state: GLB fully shown, voxels gone, floor = the plain QR. */
function morph2Final() {
  morph2.reveal.constant = 1e4;
  morph2.revealFx.constant = 1e4;
  if (morph3Wanted) {
    morph3Fx(1);
    if (morph2.ring) morph2.ring.visible = false;
  }
  const { floor, fly } = morph2;
  fly.count = 0;
  if (morph2.shadow) morph2.shadow.count = 0;
  const cell = living.cell;
  const H0 = morph2.H0;
  morph2.cells.forEach((cl, i) => {
    const on = cl.raw || cl.filler;
    morph2SetCell(floor, i, cl.x, H0 / 2, cl.z, on ? cell : 0, on ? H0 : 0, on ? cell : 0);
  });
  floor.instanceMatrix.needsUpdate = true;
  floor.material.userData.u.uFlat.value = 0;
}

function morph2StartMorph() {
  morph1.phase = "rise";
  morph1.riseAt = performance.now();
  morph1.marks.riseAt = morph1.riseAt - morph1.bootAt;
  morph1.marks.unit = usingGlb ? "glb" : "stand-in";
  morph1.doorPose = morph1DoorPose();
  if (morph3Wanted) morph1.doorPoseDown = morph1DoorPose(CFG.camera.unit_height_boom_down);
  morph1.riseEnd = MORPH2_END_S;
  const navy = new THREE.Color(MORPH_PALETTE.navy);
  // Cells the art leaves behind come back as plain navy data modules.
  morph2.cells.forEach((cl, i) => { if (cl.flyer >= 0 || !cl.drawn) morph2.floor.setColorAt(i, navy); });
  morph2.floor.instanceColor.needsUpdate = true;
  if (morph1.shadow) morph1.shadow.visible = false;
  document.body.classList.add("morph1-rising");
}

function morph2Rise(tr) {
  morph1Look();
  if (morph3Wanted) {
    morph2.fillT = tr;
    if (tr < MORPH3_FILL_S) {
      // The QR grows to fill the screen: zoom in top-down while the field pops in round it.
      const k = m1ease(tr / Math.max(1e-3, MORPH3_FILL_S));
      const a = morph1.scanPose;
      const b = morph1.fillPose || a;
      const sp = morph1.scanPose;
      morph1.scanPose = { ...a, height: Math.exp(THREE.MathUtils.lerp(Math.log(a.height), Math.log(b.height), k)) };
      morph1ApplyCamera(0);
      morph1.scanPose = sp;
      morph2Park();
      setSignalAspect("red");
      morph2Frame(0);
      return;
    }
    tr -= MORPH3_FILL_S;
    const sp = morph1.scanPose;
    if (morph1.fillPose) morph1.scanPose = morph1.fillPose;
    morph1ApplyCamera(Math.pow(m1span(tr, MORPH2_TILT_S), CFG.camera.tilt_curve), 2.2);
    morph1.scanPose = sp;
    morph3CameraFx(tr);
  } else
  // Starts moving sooner than morph1 so the lift reads in perspective early.
  // The sideways lens shift comes in late so the assembling unit stays in frame.
  morph1ApplyCamera(Math.pow(m1span(tr, MORPH2_TILT_S), 0.72), 2.2);
  // Floor navy calms toward the end-scene tile colour with the environment.
  morph2.floor.material.userData.u.uTintMix.value = morph1.env ? morph1.env.mix : 0;
  morph2Park();
  setSignalAspect("red");
  morph2Frame(tr);
  const rv = m1span(tr, MORPH2_REVEAL_S);
  morph1Contact(1);
  if (morph1.env?.contact) morph1.env.contact.material.opacity *= m1smooth(rv);
  if (tr >= MORPH2_END_S) {
    morph2Final();
    morph1FinishRise();
  }
}

/* Scan: two passes of the line over the code, then a lock pulse on the three finders and a buzz. */
function morph2ScanFxInit() {
  const fx = document.getElementById("morph1ScanFx");
  if (!fx || fx.querySelector(".fp")) return;
  const n = morph2Qr.size;
  const dim = n + 8;
  const pad = 0.8;
  const size = ((7 + pad * 2) / dim) * 100;
  const at = (m) => ((m - pad) / dim) * 100;
  for (const [l, t] of [[4, 4], [4 + n - 7, 4], [4, 4 + n - 7]]) {
    const el = document.createElement("i");
    el.className = "fp";
    Object.assign(el.style, {
      position: "absolute", left: `${at(l)}%`, top: `${at(t)}%`, width: `${size}%`, height: `${size}%`,
      border: "4px solid #EE7202", borderRadius: "8px", boxSizing: "border-box", opacity: "0",
      boxShadow: "0 0 14px 3px rgba(238,114,2,.45), inset 0 0 10px 2px rgba(238,114,2,.25)",
    });
    fx.appendChild(el);
  }
}

function morph2ScanFx(p) {
  const fx = document.getElementById("morph1ScanFx");
  const btn = document.getElementById("morph1Scan");
  if (btn) {
    if (p > 0.08) btn.classList.remove("pressed");
    btn.style.opacity = String(1 - m1clamp01((p - 0.04) / 0.16));
    if (p >= 1) btn.hidden = true;
  }
  if (p >= 0.8 && !morph2.scanBuzzed) {
    morph2.scanBuzzed = true;
    morph1.marks.lockAt = performance.now() - morph1.bootAt;
    try {
      if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([16, 45, 26]);
    } catch (err) {
      // vibration is optional
    }
  }
  if (!fx) return;
  fx.style.opacity = String(m1clamp01(p / 0.06) * (1 - m1clamp01((p - 0.92) / 0.08)));
  const side = fx.clientHeight || 1;
  // Line passes over the code (down, up, down ...) in the first three quarters of the scan.
  const NP = Math.max(1, Math.min(6, Math.round(CFG.scan.passes)));
  const PL = 0.72 / NP;
  const pi = Math.max(0, Math.min(NP - 1, Math.floor((p - 0.04) / PL)));
  const loc = m1smooth(m1clamp01((p - 0.04 - pi * PL) / (PL - (NP > 1 ? 0.04 : 0))));
  const goingDown = pi % 2 === 0;
  const y = (goingDown ? loc : 1 - loc) * side;
  const lineA = 1 - m1clamp01((p - 0.76) / 0.05);
  const line = fx.querySelector(".line");
  const glow = fx.querySelector(".glow");
  if (line) {
    line.style.transform = `translateY(${y.toFixed(1)}px)`;
    line.style.opacity = String(lineA);
  }
  if (glow) {
    // The glow trails the line: above it on the way down, below it on the way up.
    glow.style.transform = goingDown
      ? `translateY(calc(${y.toFixed(1)}px - 100%))`
      : `translateY(${y.toFixed(1)}px) scaleY(-1)`;
    glow.style.transformOrigin = "top";
    glow.style.opacity = String(lineA);
  }
  const lock = m1clamp01((p - 0.78) / 0.07);
  const pulse = Math.sin(Math.PI * m1clamp01((p - 0.78) / 0.14));
  const k = (1.06 - 0.06 * m1smooth(p / 0.2)) * (1 - 0.035 * pulse);
  for (const br of fx.querySelectorAll(".br")) br.style.transform = `scale(${k.toFixed(4)})`;
  for (const fp of fx.querySelectorAll(".fp")) {
    fp.style.opacity = String(m1smooth(lock) * (1 - m1clamp01((p - 0.9) / 0.1)));
    fp.style.transform = `scale(${(1.3 - 0.3 * m1smooth(lock) + 0.06 * pulse).toFixed(4)})`;
  }
  if (p >= 1) document.body.classList.remove("morph1-scanning");
}

/**
 * Build-time hook for scripts/bake-morph2-art.mjs: the lying unit (on its
 * back, boom down along the ground) rendered alone, orthographic top-down,
 * on a magenta key. mode "color": flat base colours (decal kept);
 * mode "id": one flat colour per part class, for quantising to modules.
 */
const MORPH2_ID = {
  housing: 0x101010, lensR: 0xff0000, lensA: 0xffaa00, lensG: 0x00ff00, boom: 0xffffff, stop: 0xaa0000,
  cabinet: 0xff7700, decal: 0xffffaa, steel: 0x0000ff, dark: 0x333333, flasher: 0x00ffff,
};
function morph2Bake(ppw, mode = "id") {
  if (!morph1.restReady || !boom) return null;
  morph1UnitPose(0, 0);
  morph1ArmAt(0);
  setSignalAspect("red");
  boom.visible = true;
  boom.updateMatrixWorld(true);
  const box = m1Box(boom);
  const head = findSignalHead(boom);
  const headSet = new Set();
  if (head) head.traverse((o) => headSet.add(o));
  const headBox = head ? worldBox(head) : null;
  const armSet = new Set();
  if (boomRig?.pivot) boomRig.pivot.traverse((o) => armSet.add(o));
  const lens = morph1LensInfo();
  const tagOf = (c) => {
    const hexes = { cabinet: LIVERY.Y, steel: LIVERY.S, dark: LIVERY.K, red: LIVERY.R };
    let best = "steel", bd = Infinity;
    const cs = c.clone().convertLinearToSRGB();
    for (const [k, h] of Object.entries(hexes)) {
      const t = new THREE.Color(h);
      const d = (t.r - cs.r) ** 2 + (t.g - cs.g) ** 2 + (t.b - cs.b) ** 2;
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  };
  const saved = [];
  const counts = {};
  boom.traverse((o) => {
    if (!o.isMesh && !o.isSprite) return;
    const m0 = Array.isArray(o.material) ? o.material[0] : o.material;
    saved.push([o, o.material, o.visible, o.layers.mask]);
    if (!m0 || m0.opacity < 0.5 || (m0.isMeshBasicMaterial && m0.transparent) || o.isSprite) {
      o.visible = false;
      return;
    }
    const blob = ancestorBlob(o);
    const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    let cls;
    const isLens = /HeroLens|SignalLens|Lens_|灯罩/i.test(blob);
    if (armSet.has(o) || m0.userData?.stripe) cls = /stop/i.test(blob) ? "stop" : "boom";
    else if (isLens && headBox && headBox.containsPoint(c) && lens?.box) {
      // Lying on its back the top of the unit points to -Z: the red lens has the smallest z.
      const f = (c.z - lens.box.min.z) / Math.max(1e-6, lens.box.max.z - lens.box.min.z);
      cls = f < 1 / 3 ? "lensR" : f < 2 / 3 ? "lensA" : "lensG";
    } else if (isLens) cls = "flasher";
    else if (headSet.has(o)) cls = "housing";
    else if (m0.map) cls = "decal";
    else {
      const t = tagOf(m0.color || new THREE.Color(0.5, 0.5, 0.5));
      cls = t === "red" ? "stop" : t;
    }
    counts[cls] = (counts[cls] || 0) + 1;
    const col = mode === "id" ? new THREE.Color(MORPH2_ID[cls]) : (m0.color ? m0.color.clone() : new THREE.Color(1, 1, 1));
    o.material = new THREE.MeshBasicMaterial({
      color: col, map: mode === "id" ? null : (m0.map || null), side: THREE.DoubleSide, toneMapped: false, fog: false,
    });
    o.layers.set(7);
  });
  const margin = living.cell * 2;
  const x0 = box.min.x - margin, x1 = box.max.x + margin, z0 = box.min.z - margin, z1 = box.max.z + margin;
  const cam = new THREE.OrthographicCamera((x0 - x1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, (z0 - z1) / 2, 0.01, 100);
  cam.position.set((x0 + x1) / 2, 30, (z0 + z1) / 2);
  cam.up.set(0, 0, -1);
  cam.lookAt((x0 + x1) / 2, 0, (z0 + z1) / 2);
  cam.layers.set(7);
  cam.updateProjectionMatrix();
  const W = Math.round((x1 - x0) * ppw), H = Math.round((z1 - z0) * ppw);
  const savedPR = renderer.getPixelRatio();
  const savedSize = renderer.getSize(new THREE.Vector2());
  const savedBg = scene.background;
  const savedTM = renderer.toneMapping;
  const savedClip = renderer.localClippingEnabled;
  scene.background = new THREE.Color(0xff00ff);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.localClippingEnabled = false;
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL("image/png");
  for (const [o, m, v, l] of saved) { o.material = m; o.visible = v; o.layers.mask = l; }
  scene.background = savedBg;
  renderer.toneMapping = savedTM;
  renderer.localClippingEnabled = savedClip;
  renderer.setPixelRatio(savedPR);
  renderer.setSize(savedSize.x, savedSize.y, false);
  if (morph2Wanted && morph2.ready) morph2Park();
  return { url, W, H, ppw, x0, x1, z0, z1, cell: living.cell, counts, ids: MORPH2_ID };
}

morph1Init();

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  // The fallback video owns the screen: stop drawing the hidden 3D scene.
  if (morph1Wanted && morph1.phase === "fallback") return;
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  tickCamGlide(dt);
  grid.visible = viewMode !== "preview5" && viewMode !== "motion2";
  studioGroup.visible = !scanOpen && !showtimeWanted && !motion1Wanted && !motion2Wanted && !motion3Wanted;
  if (boom) boom.visible = motion3Wanted ? true : !scanOpen;
  if ((showtimeWanted || motion1Wanted || motion2Wanted || motion3Wanted) && living.apron) living.apron.visible = false;
  if ((showtimeWanted || motion1Wanted || motion2Wanted || motion3Wanted) && living.ring) living.ring.visible = false;
  if ((motion1Wanted || motion2Wanted || motion3Wanted) && magicPhase === "hold") {
    magicHoldMs = performance.now() - magicHoldStartedAt;
    magicModulesStable = magicHoldMs >= MAGIC_HOLD_MS;
    freezeLivingModules();
    if (motion3Wanted) flattenMotion3Modules();
  }
  const fieldLife = lifeOn && !reduced && !scanOpen
    && magicPhase !== "hold" && magicPhase !== "flattening"
    && showtimePhase !== "playing" && showtimePhase !== "settled"
    && !motion2Wanted
    && !morph1Wanted
    && (!showtimeWanted || motion1Wanted || motion3Wanted);
  if (fieldLife) {
    const movingField = motion1Wanted || motion3Wanted;
    const amp = living.cell * (motion3Wanted ? MOTION3_AMP_CELL : (motion1Wanted ? MOTION1_AMP_CELL : 0.01));
    const speed = movingField ? 2.4 : 1.05;
    for (const m of mods) {
      const k = m.userData.kind === "finder" ? 0.22 : 1;
      m.position.y = (m.userData.baseY || 0) + Math.sin(t * speed + m.userData.phase) * amp * k;
      if (movingField && m.userData.kind !== "finder") {
        m.rotation.y = Math.sin(t * 1.7 + m.userData.phase) * 0.14;
      }
    }
    living.ledMats.forEach((mat, i) => {
      mat.emissiveIntensity = movingField
        ? 0.7 + Math.sin(t * 3.4 + i * 0.35) * 1.05
        : 0.85 + Math.sin(t * 1.6 + i * 0.4) * 0.35;
    });
  }
  if (!scanOpen) {
    tickBoom(dt);
    tickSignUpright();
    tickShow(dt);
    updateLeds();
  }
  if (controls && !scanOpen) {
    if (showtimeHudHidden()) controls.enabled = false;
    if (!spin) controls.autoRotate = false;
    if (controls.enabled) controls.update();
  }
  if (morph1Wanted) morph1Tick(dt, t);
  renderer.autoClear = true;
  renderer.setScissorTest(false);
  renderer.render(scene, camera);
  if (morph1Wanted && !morph1.handedOver && morph1.phase === "flat" && morph1.unitReady && morph1.restReady && boom?.visible) {
    morph1HandOver();
  }
}
tick();

const scanBtn = document.getElementById("scanBtn");
if (scanBtn) scanBtn.addEventListener("click", () => toggleScan());
if (canvas) {
  canvas.addEventListener("click", (ev) => {
    if (ev.target !== canvas) return;
  });
  let tapStart = 0;
  let tapX = 0;
  let tapY = 0;
  canvas.addEventListener("pointerdown", (ev) => {
    tapStart = performance.now();
    tapX = ev.clientX;
    tapY = ev.clientY;
  });
  canvas.addEventListener("pointerup", (ev) => {
    if (performance.now() - tapStart > 280) return;
    if (Math.hypot(ev.clientX - tapX, ev.clientY - tapY) > 10) return;
    if (motion2Wanted) {
      if (showtimePhase === "door") startShowtime();
      return;
    }
    if (morph1Wanted) {
      morph1Tap();
      return;
    }
    if (motion3Wanted) {
      if (showtimePhase === "door") startShowtime();
      return;
    }
    if (motion1Wanted) {
      if (showtimePhase === "playing" || showtimePhase === "settled") return;
      if (magicPhase === "hold") {
        if (magicModulesStable) startShowtime();
        return;
      }
      beginMagicHold();
      return;
    }
    if (showtimePhase === "door") {
      startShowtime();
      return;
    }
    toggleScan();
  });
}
const printBtn = document.getElementById("printBtn");
if (printBtn) printBtn.addEventListener("click", () => exportPrintPng());
const lifeBtn = document.getElementById("lifeBtn");
if (lifeBtn) {
  lifeBtn.addEventListener("click", () => {
    lifeOn = !lifeOn;
    syncModeHud();
  });
}

const solarBtn = document.getElementById("solarBtn");
if (solarBtn) solarBtn.addEventListener("click", () => setSolar(!optsVisible.solar));

const lightsBtn = document.getElementById("lightsBtn");
if (lightsBtn) lightsBtn.addEventListener("click", () => setTrafficLights(!optsVisible.traffic));

const spinBtn = document.getElementById("spinBtn");
if (spinBtn) spinBtn.addEventListener("click", () => setSpin(!spin));

const boomBtn = document.getElementById("boomBtn");
if (boomBtn) {
  boomBtn.addEventListener("click", () => {
    if (!boomRig) return;
    if (showMode === "up") beginAmberThenClose();
    else if (showMode === "amber" || boomRig.shownPct >= 50) beginCloseSequence();
    else beginRaiseSequence();
  });
}

const signRoundBtn = document.getElementById("signRoundBtn");
if (signRoundBtn) signRoundBtn.addEventListener("click", () => setSignType("round"));
const signOctagonBtn = document.getElementById("signOctagonBtn");
if (signOctagonBtn) signOctagonBtn.addEventListener("click", () => setSignType("octagon"));
const signInBtn = document.getElementById("signInBtn");
if (signInBtn) signInBtn.addEventListener("click", () => nudgeSign(-1));
const signOutBtn = document.getElementById("signOutBtn");
if (signOutBtn) signOutBtn.addEventListener("click", () => nudgeSign(1));
const signAlongEl = document.getElementById("signAlong");
if (signAlongEl) {
  signAlongEl.addEventListener("input", (e) => setSignAlong(Number(e.target.value) / 100));
}

syncDock();
syncModeHud();

window.__iqr = {
  get morph1() { return morph1Snapshot(); },
  morph1Bake: (px, bg) => morph1Bake(px, bg),
  morph2Bake: (ppw, mode) => morph2Bake(ppw, mode),
  get scene() { return scene; },
  morph1Measure: () => morph1Measure(),
  startShowtime,
  settleShowtime,
  leaveToDest,
  beginMagicHold,
  endMagicHold,
  beginMotion2FlattenThenDest,
  applyMotion2Pose,
  beginMotion3MorphInPlace,
  applyMotion3HoldLook,
  get boom() { return boom; },
  get camera() {
    return {
      pos: camera.position.toArray(),
      target: controls ? controls.target.toArray() : null,
      autoRotate: !!(controls && controls.autoRotate),
      damping: !!(controls && controls.enableDamping),
    };
  },
  get snap() {
    const logo = boom?.getObjectByName?.("PortaboomLogoFace")
      || boom?.getObjectByName?.("PortaboomLogoDecal");
    const logoOpp = boom?.getObjectByName?.("PortaboomLogoOpposite");
    const faces = [];
    boom?.traverse?.((o) => { if (o.name === "PortaboomFaceLed") faces.push(o.name); });
    const pivot = boom?.userData?.signalPivot;
    let solarVisible = 0;
    let extraHeads = 0;
    let productLeds = 0;
    let trafficHeads = 0;
    boom?.traverse?.((o) => {
      const n = o.name || "";
      if (/太阳能板|太阳能板支架|^太阳能|solar/i.test(n) && isVisibleInTree(o) && !/灯条/.test(n)) solarVisible += 1;
      if (/ProductLed/i.test(n) && o.visible) productLeds += 1;
      if (/灯条/.test(n)) return;
      if (/Traffic[_\s.-]*Light|HeroSignal/i.test(n) && isVisibleInTree(o) && !/Traffic[_\s.-]*Light|HeroSignal/i.test(o.parent?.name || "")) {
        trafficHeads += 1;
      }
      if (/PED_|TL2_|行人|人行|pedestrian/i.test(n) && isVisibleInTree(o)) extraHeads += 1;
    });
    return {
      usingGlb,
      showMode,
      signalAspect,
      showConfig: SHOW_CONFIG,
      viewMode,
      scanOpen,
      living: true,
      icqrDoor: viewMode === "door",
      dest: DEST,
      leaveDest,
      leaveDestDefault: SHOWTIME_DEST_DEFAULT,
      leaveDestSource,
      destParam,
      ecc: ECC,
      matrixN: destQr.size,
      qrVersion: destQr.version,
      darkCount: living.darkCount,
      moduleMeshGroups: mods.length,
      texturedQuad: false,
      scanPlanePresent: false,
      product: motion3Wanted
        ? "motion3-icqr-door"
        : motion2Wanted
          ? "motion2-hero-lock"
          : motion1Wanted
            ? "motion1-icqr-door"
            : preview5Wanted
              ? "preview5-hero-lock"
              : (showtimeWanted ? "living10-icqr-door" : "living2-brand-world"),
      preview5: preview5Wanted,
      motion1: motion1Wanted,
      motion2: motion2Wanted,
      motion3: motion3Wanted,
      motion2AutoFlow: motion2Wanted,
      motion2HeroFrame: measureMotion2HeroFrame(),
      motion2BoomFrame: measureMotion2BoomFrame(),
      motion2BoomDownFrame: measureMotion2BoomDownFrame(),
      motion2BoomInFrame: (() => {
        const f = measureMotion2BoomDownFrame() || measureMotion2BoomFrame();
        return !!(f && (f.widthFrac >= 0.28 || f.heightFrac >= 0.16));
      })(),
      motion2HeroLeft: (() => {
        const f = measureMotion2HeroFrame();
        return !!(f && f.midX != null && f.midX <= 0.18);
      })(),
      motion2FramedLeft: motion2Wanted && viewMode === "motion2",
      motion3UnitLeft: (() => {
        const f = measureDoorHeroFrame();
        return !!(motion3Wanted && f && f.midX != null && f.midX < 0);
      })(),
      motion3HeroMidX: (() => {
        const f = measureDoorHeroFrame();
        return f && f.midX != null ? f.midX : null;
      })(),
      motion3BoomInField: (() => {
        const f = measureDoorBoomFrame();
        return !!(motion3Wanted && f && (f.widthFrac >= 0.16 || f.heightFrac >= 0.10));
      })(),
      morphInPlace: motion3Wanted
        && magicPhase === "hold"
        && viewMode === "door"
        && scanOpen === false,
      cutawayScan: scanOpen === true && viewMode === "scan",
      p113: motion3Wanted,
      p113Brief: motion3Wanted
        ? "one living Incredible tip, Magic Tree class"
        : null,
      twinSot: null,
      sameField: motion3Wanted && viewMode === "door" && scanOpen === false,
      heroThenDifferentQrScreen: scanOpen === true && viewMode === "scan",
      blackStudioVoid: !!(studioGroup.visible && (motion3Wanted || showtimeWanted || motion1Wanted)),
      magicPhase,
      magicHoldMs: magicPhase === "hold"
        ? +(Math.max(magicHoldMs, performance.now() - magicHoldStartedAt)).toFixed(1)
        : +magicHoldMs.toFixed(1),
      magicHoldRequiredMs: MAGIC_HOLD_MS,
      modulesStable: magicPhase === "hold"
        && (magicModulesStable || (performance.now() - magicHoldStartedAt) >= MAGIC_HOLD_MS),
      modulesStableMs: magicPhase === "hold"
        ? +(Math.max(magicHoldMs, performance.now() - magicHoldStartedAt)).toFixed(1)
        : 0,
      fieldMotionOn: (motion1Wanted || motion3Wanted)
        && magicPhase === "idle"
        && !scanOpen
        && showtimePhase !== "playing"
        && showtimePhase !== "settled",
      fieldMotionAmpCell: motion3Wanted
        ? MOTION3_AMP_CELL
        : (motion1Wanted ? MOTION1_AMP_CELL : 0.01),
      scanHoldPayload: (motion1Wanted || motion2Wanted || motion3Wanted) ? DEST : null,
      miniCabinetSource: living.miniCabinetSource ?? null,
      miniClonedFromTwin: living.miniClonedFromTwin === true,
      miniFieldKind: living.miniFieldKind ?? living.group?.userData?.miniFieldKind ?? null,
      modulePalette: living.group?.userData?.modulePalette ?? null,
      showtime: showtimeWanted,
      showtimePhase,
      showtimeDoorS: SHOWTIME_DOOR_S,
      showtimeElapsed: +showtimeElapsed.toFixed(3),
      showtimeBudget: SHOWTIME_TOTAL_S,
      showtimeGreenS: SHOWTIME_GREEN_S,
      showtimeAmberS: SHOWTIME_AMBER_S,
      showtimeRedHoldS: SHOWTIME_RED_HOLD_S,
      showtimeLowerS: SHOWTIME_LOWER_S,
      showtimeTeaserS: TEASER_LOOP_S,
      longerThanTeaser: SHOWTIME_TOTAL_S > TEASER_LOOP_S,
      timingBeat: "0.5+1+0.5+boom",
      showtimeHudHidden: showtimeHudHidden(),
      showtimeLeaveS: SHOWTIME_LEAVE_S,
      destLeave,
      destLeft: !!destLeave,
      destLeaveUrl: destLeave?.dest ?? null,
      destLeaveReason: destLeave?.reason ?? null,
      boomAngle: boomRig?.pivot?.rotation?.z ?? null,
      lampIntensity: {
        red: lampMats.red?.emissiveIntensity ?? null,
        amber: lampMats.amber?.emissiveIntensity ?? null,
        green: lampMats.green?.emissiveIntensity ?? null,
      },
      cameraIsPerspective: camera.isPerspectiveCamera === true,
      cameraIsOrtho: camera.isOrthographicCamera === true,
      doorOrthoWorldW: viewMode === "door" ? +(doorCam.right - doorCam.left).toFixed(4) : null,
      doorOrthoWorldH: viewMode === "door" ? +(doorCam.top - doorCam.bottom).toFixed(4) : null,
      doorHeroFrame: measureDoorHeroFrame(),
      doorCabinetFrame: measureDoorCabinetFrame(),
      doorSignalFrame: measureDoorSignalFrame(),
      doorBoomFrame: measureDoorBoomFrame(),
      doorSubjectFrame: measureDoorSubjectFrame(),
      doorBoomHidden: (() => {
        const p = boom?.getObjectByName?.("BoomPivot");
        return !!(p && p.visible === false);
      })(),
      doorBoomVisible: (() => {
        const p = findBoomArm(boom);
        return !!(p && p.visible === true && isVisibleInTree(p));
      })(),
      doorSignalInFrame: (() => {
        const f = measureDoorSignalFrame();
        return !!(f && f.heightFrac >= 0.06 && (f.mostlyIn || f.heightFrac >= 0.10));
      })(),
      doorBoomInFrame: (() => {
        const f = measureDoorBoomFrame();
        return !!(f && f.heightFrac >= 0.12);
      })(),
      doorCamElevationDeg: viewMode === "door" ? doorCamElevationDeg() : null,
      doorCamElevatedField: viewMode === "door"
        && doorCamElevationDeg() <= -12
        && doorCamElevationDeg() >= -38,
      doorCamFrontFacing: viewMode === "door"
        && doorCamElevationDeg() <= -12
        && doorCamElevationDeg() >= -38,
      ghostBoomCount: countUprightBoomGhosts(),
      ghostBoom: boom?.userData?.ghostBoom || null,
      singleBoom: countUprightBoomGhosts() === 0,
      miniTrafficLights: countMiniTrafficLights(),
      miniHasTrafficLight: countMiniTrafficLights() > 0 || living.miniHasTrafficLight === true,
      stripeModules: living.stripeModules ?? 0,
      miniCabinetCount: living.miniCabinetCount ?? 0,
      fieldPadInView: viewMode === "door"
        ? +((living.padSize / Math.max(0.01, (doorCam.top - doorCam.bottom))).toFixed(3))
        : null,
      backLogoVisible: !!(brandBack && brandBack.visible && brandBack.getObjectByName("PortaboomBackLogo")),
      backLogoInFrame: (() => {
        const logo = brandBack?.getObjectByName("PortaboomBackLogo");
        if (!logo || !brandBack?.visible || viewMode !== "door") return false;
        const f = projectBoxViewportFrac(worldBox(logo), doorCam);
        return !!(f && f.areaFrac > 0.04);
      })(),
      backLogoFrame: (() => {
        const logo = brandBack?.getObjectByName("PortaboomBackLogo");
        if (!logo || viewMode !== "door") return null;
        return projectBoxViewportFrac(worldBox(logo), doorCam);
      })(),
      scanEnvelope: "tap-to-scan ortho top-down of XZ plaza",
      defaultShowsTwin: !!(boom && !scanOpen),
      twinInQrField: !!(boom && boom.visible && viewMode === "door"),
      studioVisible: !!studioGroup.visible,
      apronVisible: !!(living.apron && living.apron.visible),
      websiteChrome: !showtimeHudHidden(),
      icqrFirstPaint: ((showtimeWanted && showtimePhase === "door") || ((motion1Wanted || motion3Wanted) && magicPhase === "idle"))
        && viewMode === "door",
      flattenBtnPresent: !!document.getElementById("flattenBtn"),
      unitDockPresent: !!document.getElementById("unitDock"),
      primaryControls: document.querySelectorAll("#liveDock .btn").length,
      moreOpen: false,
      printClaimReady: false,
      lifeOn,
      kinds: living.kinds,
      vocabs: living.vocabs,
      flat,
      scanOpacity: 0,
      gridVisible: !!grid.visible,
      solarOn: optsVisible.solar,
      trafficOn: optsVisible.traffic,
      spin,
      autoRotate: !!(controls && controls.autoRotate),
      damping: !!(controls && controls.enableDamping),
      cam: camera.position.toArray(),
      target: controls ? controls.target.toArray() : null,
      solarVisible,
      trafficHeads,
      extraHeads,
      productLeds,
      plantedYaw: boom?.userData?.plantedYaw ?? null,
      rotY: boom?.rotation?.y ?? null,
      signalName: findSignalHead(boom)?.name ?? null,
      signalYaw: pivot?.rotation?.y ?? null,
      signalFaced: !!findSignalHead(boom)?.userData?.signalFaced,
      boomPct: boomRig?.shownPct ?? null,
      boomTarget: boomRig?.targetPct ?? null,
      liveDockHidden: document.getElementById("liveDock")?.hidden === true,
      faceLeds: faces.length,
      hasStrip: !!ledRig.stripMat,
      hasFace: !!ledRig.faceMat,
      faceHex: ledRig.faceMat ? ledRig.faceMat.emissive.getHexString() : null,
      faceIntensity: ledRig.faceMat?.emissiveIntensity ?? null,
      faceHexes: (ledRig.faceMats || []).map((m) => m.emissive.getHexString()),
      faceIntensities: (ledRig.faceMats || []).map((m) => m.emissiveIntensity),
      faceGlowHex: ledRig.faceGlows[0] ? ledRig.faceGlows[0].color.getHexString() : null,
      stripHex: ledRig.stripMat ? ledRig.stripMat.emissive.getHexString() : null,
      logoLocalW: boom?.userData?.logoLocalW ?? null,
      classifyHidden: boom?.userData?.classifyHidden || null,
      signType,
      signMounted: !!(signGroup && signGroup.parent),
      signRadius: signRadiusLocal,
      signDiameterM: plantedProof?.signDiameterM ?? REAL.signDM,
      signDiameterWorld: plantedProof?.signDiameterWorld ?? null,
      boomLengthM: plantedProof?.boomLengthM ?? REAL.boomM,
      boomLengthWorld: plantedProof?.boomLengthWorld ?? null,
      boomLengthCad: plantedProof?.boomLengthCad ?? null,
      scaleFactor: plantedProof?.scaleFactor ?? (boom?.scale?.x ?? null),
      metresPerWorld: plantedProof?.metresPerWorld ?? null,
      doorHeightWorld: plantedProof?.doorHeightWorld ?? null,
      doorWidthWorld: plantedProof?.doorWidthWorld ?? null,
      signDerived: plantedProof?.derived ?? null,
      signWorldDiameter: measureSignWorldDiameter(),
      signImpliedM: (() => {
        const d = measureSignWorldDiameter();
        const m = plantedProof?.metresPerWorld;
        return d != null && m ? +(d * m).toFixed(4) : null;
      })(),
      pivotWorldScale: plantedProof?.pivotWorldScale ?? null,
      meshWorldScale: plantedProof?.meshWorldScale ?? null,
      impliedBoomM: plantedProof?.impliedBoomM ?? null,
      plantedProof,
      signAlong,
      stripePeriod: stripePeriodLocal,
      stripePeriodM: REAL.stripePeriodM,
      stripeRedDuty: STRIPE.redDuty,
      strayGlow: (() => {
        let n = 0;
        boom?.traverse?.((o) => {
          if (!isVisibleInTree(o)) return;
          if (o.userData?.tag === "G" || o.isSprite) n += 1;
        });
        return n;
      })(),
      strayGlowKilled: boom?.userData?.strayGlowKilled || [],
      bezelHex: (() => {
        let hex = null;
        boom?.traverse?.((o) => {
          if (o.name === "PortaboomLedBezel" && firstMat(o)?.color) {
            hex = firstMat(o).color.getHexString();
          }
        });
        return hex;
      })(),
      poleStainless: (() => {
        let n = 0;
        boom?.traverse?.((o) => {
          if (!o.isMesh || !isTrafficPoleMesh(o) || !isVisibleInTree(o)) return;
          const c = firstMat(o)?.color?.getHex?.();
          if (c === LIVERY.S) n += 1;
        });
        return n;
      })(),
      livery: (() => {
        let y = 0, k = 0, b = 0, stripe = 0, gVis = 0;
        let mastVis = 0, clampVis = 0, socketVis = 0;
        boom?.traverse?.((o) => {
          const n = o.name || "";
          if (o.userData?.tag === "Y") y += 1;
          if (o.userData?.tag === "K") k += 1;
          if (o.userData?.tag === "B") b += 1;
          if (o.userData?.tag === "G" && isVisibleInTree(o)) gVis += 1;
          if (o.material?.userData?.stripe) stripe += 1;
          if (/AK-XLH-D115C-03/i.test(n) && isVisibleInTree(o)) mastVis += 1;
          if (/快速夹具|^夹具$/i.test(n) && isVisibleInTree(o)) clampVis += 1;
          if (/AK-XLH-D115C-01-01-11/i.test(n) && o.isMesh && isVisibleInTree(o)) socketVis += 1;
        });
        return { y, k, b, stripe, gVis, mastVis, clampVis, socketVis };
      })(),
      logo: logo ? {
        name: logo.name,
        world: logo.getWorldPosition(new THREE.Vector3()).toArray(),
        parent: logo.parent?.name || null,
        worldW: boom?.userData?.logoWorldW ?? null,
        localW: boom?.userData?.logoLocalW ?? null,
      } : null,
      logoOpposite: logoOpp ? {
        name: logoOpp.name,
        world: logoOpp.getWorldPosition(new THREE.Vector3()).toArray(),
      } : null,
    };
  },
  captureWorld() {
    if (showtimeWanted) {
      if (viewMode !== "door") applyDoorPose();
      renderer.render(scene, camera);
      return canvas.toDataURL("image/png");
    }
    if (scanOpen) applyWorldPose();
    renderer.render(scene, unitCam);
    return canvas.toDataURL("image/png");
  },
  captureDoor() {
    applyDoorPose();
    renderer.render(scene, doorCam);
    return canvas.toDataURL("image/png");
  },
  frameMiniCloseup() {
    applyDoorPose();
    const pick = mods.find((m) => m.userData?.vocab === "cabinet")
      || mods.find((m) => m.userData?.vocab === "led")
      || mods[Math.floor(mods.length * 0.62)];
    if (!pick) return false;
    const p = pick.getWorldPosition(new THREE.Vector3());
    const h = pick.userData.bodyH || 0.2;
    const span = Math.max(h * 3.4, living.cell * 8);
    const aspect = Math.max(0.4, (canvas.clientWidth || 390) / (canvas.clientHeight || 844));
    let worldH = span;
    let worldW = worldH * aspect;
    if (aspect >= 1) {
      worldW = span;
      worldH = worldW / aspect;
    }
    doorCam.left = -worldW / 2;
    doorCam.right = worldW / 2;
    doorCam.top = worldH / 2;
    doorCam.bottom = -worldH / 2;
    doorCam.updateProjectionMatrix();
    doorCam.position.set(p.x + h * 0.55, p.y + h * 1.15, p.z + h * 2.1);
    doorCam.lookAt(p.x, p.y + h * 0.45, p.z);
    renderer.render(scene, doorCam);
    return true;
  },
  captureScan() {
    if (motion3Wanted) {
      if (magicPhase !== "hold") applyMotion3HoldLook();
      renderer.render(scene, doorCam);
      return canvas.toDataURL("image/png");
    }
    if (!scanOpen) applyScanPose();
    renderer.render(scene, scanCam);
    return canvas.toDataURL("image/png");
  },
  enterScan() {
    if (motion3Wanted) {
      beginMotion3MorphInPlace();
      renderer.render(scene, doorCam);
      return true;
    }
    applyScanPose();
    renderer.render(scene, scanCam);
    return true;
  },
  exitScan() {
    if (motion3Wanted) {
      applyDoorPose();
      renderer.render(scene, doorCam);
      return true;
    }
    if (motion2Wanted) {
      applyMotion2Pose();
      renderer.render(scene, unitCam);
      return true;
    }
    if (showtimeWanted) {
      applyDoorPose();
      renderer.render(scene, doorCam);
      return true;
    }
    applyWorldPose();
    renderer.render(scene, unitCam);
    return true;
  },
  get living() {
    return {
      dest: DEST,
      ecc: ECC,
      size: destQr.size,
      dark: living.darkCount,
      kinds: living.kinds,
      vocabs: living.vocabs,
      texturedQuad: false,
      viewMode,
      scanOpen,
      miniHasTrafficLight: living.miniHasTrafficLight === true,
      miniCabinetSource: living.miniCabinetSource ?? null,
      miniClonedFromTwin: living.miniClonedFromTwin === true,
      miniFieldKind: living.miniFieldKind ?? null,
      modulePalette: living.group?.userData?.modulePalette ?? null,
      stripeModules: living.stripeModules ?? 0,
    };
  },
  nudgeScan(x = 0, y = 0) {
    if (!scanOpen) applyScanPose();
    scanCam.position.set(SCAN_POSE.pos.x + x * 0.12, SCAN_POSE.pos.y, SCAN_POSE.pos.z + y * 0.12);
    scanCam.lookAt(SCAN_POSE.tgt);
    scanCam.updateProjectionMatrix();
    renderer.render(scene, scanCam);
    return true;
  },
  resetScan() {
    applyScanPose();
    renderer.render(scene, scanCam);
  },
};
