"""Hand-written recipe spec: the steps, what they do, and which code implements them.
Line numbers are NOT written here; build_recipe.py resolves every function / constant
against the code at the pinned commit, so they are always exact.

impl entries:
  ("fn", name)              function in the version's own app file (app.js, app3.js, app-<v>.js)
  ("fn", name, file)        function in a named file (road-scene.js, morph2-art.js, ...)
  ("const", NAME)           top-level constant in the version's app file
  ("const", NAME, file)
  ("grep", file, regex, label)   first line matching regex (for index.html / json / html)
  ("tool", name, what)      build tool that is not published in this repo (named, not linked)
"""

VERSIONS = {
    "morph1":   {"file": "app.js", "label": "morph1 - the photo unit hinges up", "url": "?v=morph1", "video": "morph1.mp4", "still": "portaboom-morph-qr.png", "parent": None, "config": False,
                 "summary": "The first cut. The QR still shows a rendered PB4000 lying on its back inside the code. After one scan sweep the real 3D unit hinges upright on its back edge while the QR modules ripple, the camera drops to eye level, then green, amber, red, boom down, DEST."},
    "morph2":   {"file": "app.js", "label": "morph2 - modules fly into the unit (site root)", "url": "?v=morph2 (and the bare root)", "video": "morph2.mp4", "still": "portaboom-morph2-qr.png", "parent": "morph1", "config": False,
                 "summary": "The default the printed QR opens. The unit is drawn in QR modules (no photo). After a double scan with finder lock the drawn modules lift off, fly and build a voxel PB4000, the real GLB resolves inside the cubes, then the light and boom cycle and DEST. Its timings are hard-coded constants in app.js; morph-config.json does not change it."},
    "morph3":   {"file": "app3.js", "label": "morph3 - full-screen QR, shimmer, glide", "url": "?v=morph3", "video": "morph3.mp4", "still": "portaboom-morph2-qr.png", "parent": "morph2", "config": True,
                 "summary": "morph2 made editable: every timing, camera and colour comes from morph-config.json. Adds the QR growing to fill the screen, the shimmer light-wave resolve with a glowing ring and lens flash, a slow camera glide round the unit, and a wider frame when the boom comes down. Every later version is a copy of this file plus its own code."},
    "road":     {"file": "app-road.js", "extra_files": ["road-scene.js"], "label": "road - worksite road and traffic", "url": "?v=road", "video": "road.mp4", "still": "portaboom-morph2-qr.png", "parent": "morph3", "config": True,
                 "summary": "morph3 plus a procedural worksite (road, kerbs, trees, cone taper, A-frame signs, parked ute, traffic controllers, 4 queued cars) built outward from the unit as the QR tiles sink into asphalt. The boom lowers, waits and rises, then the cars leave on green, amber, red, boom down with the next car stopping."},
    "minions":  {"file": "app-minions.js", "label": "minions - crowd of little PORTABOOMs", "url": "?v=minions", "video": "minions.mp4", "still": "portaboom-morph2-qr.png", "parent": "morph3", "config": True,
                 "summary": "morph3 plus ~60 little PORTABOOMs popping out of dark QR modules lying on their backs, standing up, bobbing, running their own light and boom cycles, ducking out of the camera's way and lining up in rows behind the hero to follow its lights and boom."},
    "minions2": {"file": "app-minions.js", "label": "minions2 - crowd fills the whole floor", "url": "?v=minions2", "video": "minions2.mp4", "still": "portaboom-morph2-qr.png", "parent": "minions", "config": True,
                 "summary": "Same file as minions with minions2Mode on: ~220 minis cover the whole visible floor from the horizon to the bottom edge, keep the whole hero clear, and follow the hero's lights and boom in a ripple outward."},
    "night":    {"file": "app-night.js", "label": "night - city lights and wet road", "url": "?v=night", "video": "night.mp4", "still": "portaboom-morph2-qr.png", "parent": "morph3", "config": True,
                 "summary": "morph3 plus a fade to night: the QR modules glow like city windows, the modules fly in as glowing cubes, a wet asphalt strip spreads in front of the unit and the lenses and cabinet flashers light it with coloured washes and streak reflections."},
    "blueprint": {"file": "app-blueprint.js", "label": "blueprint - drawing to wireframe to unit", "url": "?v=blueprint", "video": "blueprint.mp4", "still": "portaboom-morph2-qr.png", "parent": "morph3", "config": True,
                 "summary": "morph3 with the flight replaced: the QR inverts into a blue blueprint sheet with dimensioned drawings measured from the GLB, the front elevation draws itself, lifts off as a glowing wireframe and stands up, then the real unit scans in part by part (cabinet, head, lenses, boom, wheels)."},
    "rain":     {"file": "app-rain.js", "label": "rain - cubes rain down and stack", "url": "?v=rain", "video": "rain.mp4", "still": "portaboom-morph2-qr.png", "parent": "morph3", "config": True,
                 "summary": "morph3 with the flight replaced: modules shoot up out of frame, orange and navy cubes fall back on ballistic paths, bounce into their voxel slots and stack bottom-up; the shimmer resolves the unit later than morph3; a dust puff and camera shake when the boom lands."},
    "domino":   {"file": "app-domino.js", "label": "domino - topple and guard of honour", "url": "?v=domino", "video": "domino.mp4", "still": "portaboom-morph2-qr.png", "parent": "minions", "config": True,
                 "summary": "Built from the minions file. The full-screen QR topples like dominoes from the corners to the middle; along an aisle the fallen modules flip up as rows of little PORTABOOMs; the camera comes down into the aisle and dollies along it while each row salutes; the hero assembles at the end (1.7 s later than morph3) and its boom drop ripples down the rows."},
    "domino2":  {"file": "app-domino2.js", "label": "domino2 - topple into a full-floor crowd", "url": "?v=domino2", "video": "domino2.mp4", "still": "portaboom-morph2-qr.png", "parent": "domino", "config": True,
                 "summary": "domino with the straight rows replaced by a ~240-strong crowd covering the whole floor (varied spots, turns and sizes, like minions2). Booms rise in a ripple as the camera glides through; the hero stays clear; the boom drop ripples back out."},
    "drone":    {"file": "app-drone.js", "extra_files": ["drone-scene.js"], "label": "drone - top-down worksite then swoop", "url": "?v=drone", "video": "drone.mp4", "still": "portaboom-morph2-qr.png", "parent": "road", "config": True,
                 "summary": "Built from the road file. The camera rises to a top-down drone view, the QR turns tile by tile into the worksite seen from above, the hero assembles on the road, then one long banked swoop brings the camera down to road's eye-level shot and road's traffic cycle runs."},
}

# ---------------------------------------------------------------- BUILD (how the assets were made)
BUILD = [
    {"id": "b_art_bake", "label": "Art bake: GLB to module drawing",
     "purpose": "Render the real PB4000 model lying on its back, top-down and orthographic, then quantise it to QR-module letters (H housing, R/A/G lenses, O cabinet, K wheels, r/W boom stripes, S STOP...). The result is the frozen grid in morph2-art-grid.js. morph1 instead bakes a mask of the QR cells covered by the rendered unit (morph-mask.js).",
     "impl": [("fn", "morph2Bake", "app.js"), ("grep", "morph2-art-grid.js", r"export const MORPH2_GRID", "MORPH2_GRID (the baked letters)"), ("fn", "morph1Bake", "app.js"), ("grep", "morph-mask.js", r"export const MORPH_MASK", "MORPH_MASK (morph1 covered cells)"),
              ("tool", "scripts/morph2_art/*.py (style, quant, grid, search)", "renders the GLB top-down and quantises colours to module letters"), ("tool", "scripts/bake-morph-unit.mjs", "morph1: renders the lying unit and writes morph-mask.js")],
     "change": ["To redraw the unit in the QR (different pose, bigger or smaller drawing): re-run the art bake and regenerate morph2-art-grid.js; never hand-edit it (it says so at the top).",
                "Bigger drawing means more art cells to hide; error-correction H recovers up to ~30% so keep the art share near the current ~25-30%, and the decode check (next step) must still pass."],
     "versions": "all except morph1 use MORPH2_GRID; morph1 uses MORPH_MASK"},
    {"id": "b_qr_encode", "label": "QR encode: URL + art into one code",
     "purpose": "Encode the tip URL at error correction H, version 13 (69x69), pick mask 6, place the art at row 11 / col 8 with a one-module light halo, keep finder/timing/alignment/format cells as real QR. Writes the print still (PNG + SVG).",
     "impl": [("fn", "encodeMorph2", "morph2-art.js"), ("fn", "artRoles", "morph2-art.js"), ("fn", "functionCells", "morph2-art.js"), ("grep", "morph2-art-grid.js", r"version: 13", "version / row0 / col0 / mask"), ("fn", "encodeUrlMatrix", "qr-url.js"),
              ("tool", "scripts/make-morph2-qr.mjs", "writes portaboom-morph2-qr.png/.svg from encodeMorph2 (18 px per module, cream paper, 4-module quiet zone)")],
     "change": ["To change where the printed QR sends people: the URL is the --url argument of make-morph2-qr.mjs (default https://tas-fdnxt.github.io/portaboom-qr/?v=morph2). The runtime draws its frame 0 from './?v=morph2' (MORPH1_TIP_URL), so if you print a different URL the page's frame 0 must be updated to match or frame 0 will not equal the still.",
                "Every version (morph3, road, minions...) draws this same morph2 code on frame 0; the ?v= in the link only picks which animation runs.",
                "Art colours for the print are ART_COLORS in morph2-art.js (cabinet orange #F28C28, lenses, boom red)."],
     "versions": "morph2 and every later version; morph1 uses encodeTipMatrix (qr-url.js) and portaboom-morph-qr.png"},
    {"id": "b_decode_check", "label": "Decode check (gate)",
     "purpose": "Prove the art QR still scans: jsQR at native size and 1176 down to 200 px, then zxing-cpp and OpenCV at 1176 down to 240 px. Fails the build if any of the first 12 sizes misses. Receipt: morph2-qr-verify.json.",
     "impl": [("tool", "scripts/make-morph2-qr.mjs decode()", "jsQR at 14 sizes, writes morph2-qr-verify.json with ok, mask, artCells, artFrac, artMismatch"), ("tool", "scripts/morph2_art/verify_still.py", "zxing-cpp + OpenCV at 12 sizes")],
     "change": ["If you enlarge the drawing or change colours and this fails, shrink the art or pick dark/light colours so art cells agree with the data (artMismatch goes down)."],
     "versions": "all (one still serves every version)"},
    {"id": "b_frame0_match", "label": "Frame-0 match (gate)",
     "purpose": "The page's first WebGL frame must be the still, cell for cell: morph2Init builds one floor instance per drawn module from the same encodeMorph2 output and morph2Flat lays them flat exactly where the still has them; then morph1HandOver removes the HTML still. A headless check screenshots frame 0, compares every module colour to the still and decodes it.",
     "impl": [("fn", "morph2Init"), ("fn", "morph2Flat"), ("fn", "morph1HandOver"), ("const", "MORPH1_TIP_URL"), ("tool", "frame0_m2.mjs / f0cmp.mjs", "headless Chromium 390x844@2x: per-module colour check, mean abs diff, jsQR decode")],
     "change": ["Anything that changes frame 0 (QR size on screen, colours, art) must change the still too, or people see a jump when the canvas takes over."],
     "versions": "all"},
    {"id": "b_version_scaffold", "label": "Make the version file",
     "purpose": "Each version is a full copy of a parent app file plus its own code: app3.js is app.js + config + morph3; road, minions, night, blueprint, rain copy app3.js; domino copies app-minions.js; domino2 copies app-domino.js; drone copies app-road.js. night/blueprint/rain were generated by a script that inserts blocks/<mode>.js before the morph2 section, adds the per-version base override and wraps morph1Tick so the mode's tick runs after the shared morph tick.",
     "impl": [("grep", "index.html", r"const src = rain", "index.html: ?v= picks the app file"), ("fn", "cfgMerge"), ("fn", "loadMorphConfig"), ("tool", "make_mode.py", "builds app-<mode>.js from app3.js for night / blueprint / rain"), ("tool", "export_edges.mjs", "blueprint only: exports the GLB feature edges to blueprint-edges.bin")],
     "change": ["A fix to a shared step (scan, flight, resolve, camera, light cycle) in app3.js does NOT reach the other versions: each app-<v>.js has its own copy. Make the same change in every app file that has that function (the recipe viewer lists them per version)."],
     "versions": "all"},
    {"id": "b_config_editor", "label": "Settings file + editor",
     "purpose": "morph-config.json holds every tunable number and colour for morph3 and later versions (one section per version on top of the shared ones). editor.html shows a live phone preview (?editor=1 clock), sliders, step markers and Copy JSON / Download. Precedence: built-in defaults < morph-config.json < ?config=<url> < browser-saved edits.",
     "impl": [("fn", "loadMorphConfig"), ("grep", "editor.html", r"const RANGES", "slider ranges"), ("grep", "editor.html", r"function steps\(\)", "timeline markers"), ("grep", "morph-config.json", r'"scan"', "the settings file")],
     "change": ["To change a version for everyone: edit the value in the editor, Download, replace morph-config.json, commit. It is live as soon as Pages redeploys (no build step).",
                "morph1 and morph2 (the site root) ignore this file; their numbers are constants in app.js."],
     "versions": "morph3 and later"},
    {"id": "b_video_render", "label": "Fallback video render",
     "purpose": "Deterministic render of the live page: a virtual clock in fixed 1/30 s steps, one canvas capture per step at 390x844 @2x (780x1688), 1.5 s flat hold first, then encoded to <version>.mp4. index.html plays it in place when WebGL, the GLB or app.js fails (15 s watchdog), then leaves to DEST.",
     "impl": [("grep", "index.html", r"window.__morph1Fallback = ", "fallback picker (mp4 per version)"), ("grep", "index.html", r"__iqrBooted\) window.__morph1Fallback", "15 s watchdog"), ("tool", "render_frames.mjs", "Playwright + SwiftShader, virtual performance.now/rAF, FPS=30, DPR 2"), ("tool", "ffmpeg", "frames to H.264 mp4")],
     "change": ["After changing a version, re-render its mp4 or the fallback shows the old animation."],
     "versions": "all (one mp4 each)"},
    {"id": "b_device_tests", "label": "Device and geometry tests (gate)",
     "purpose": "iPhone 13 (WebKit) and Pixel 7 (Chromium) runs: normal, GLB blocked (must fall back to video), and ?test=1 idle (button shows, nothing starts). End-frame geometry is measured in-page: camera pitch and yaw, lens normal vs view direction, unit height and lens position on screen. Page weight and editor smoke tests too.",
     "impl": [("fn", "morph1Measure"), ("tool", "devcheck.mjs", "iPhone 13 / Pixel 7, failed-GLB and test=1"), ("tool", "weight.mjs", "bytes per request"), ("tool", "edcheck.mjs", "editor loads each version and lists its step markers")],
     "change": ["Framing changes (camera.unit_height, lens_y, left_margin, pitch_deg) should be re-checked here: lenses must stay head-on (<10 degrees) and pitch near 0."],
     "versions": "all"},
    {"id": "b_security_sweep", "label": "Public-safety sweep (gate)",
     "purpose": "Before every push to the public repo: gitleaks over the staged tree and git history, plus a text sweep for private hosts, IPs and private repo names. The public repo is tip-only (no build scripts, no receipts).",
     "impl": [("tool", "gitleaks", "detect on the stage and on git history"), ("tool", "rg sweep", "tailnet hosts, private IPs, tokens, private repo names")],
     "change": ["Keep build tools and receipts out of this repo; publish only what the page loads."],
     "versions": "all"},
    {"id": "b_publish", "label": "Publish to GitHub Pages",
     "purpose": "Commit to main; GitHub Pages serves https://tas-fdnxt.github.io/portaboom-qr/. Every asset URL carries a ?b=<hash> cache-buster so phones get the new file, then the live URLs are checked for HTTP 200.",
     "impl": [("grep", "index.html", r"const src = rain", "cache-busted app file per version"), ("grep", "index.html", r"portaboom-morph2-qr.png\?b=", "cache-busted still")],
     "change": ["When you change an app file, bump its ?b= value in index.html, or phones may keep the old copy."],
     "versions": "all"},
]

# ---------------------------------------------------------------- RUNTIME (what happens on the phone)
R = []
def node(**k): R.append(k); return k

node(id="r_boot", label="Boot: pick version, load settings",
     purpose="index.html reads ?v=, shows the right still instantly, hides the Tap to scan button unless ?test=1, and loads the version's app file. The app loads morph-config.json (morph3+) and, for night/blueprint/rain, applies that version's 'base' overrides to the shared settings.",
     impl=[("grep", "index.html", r"const src = rain", "index.html: version -> app file"), ("grep", "index.html", r"const autoStart = morph2", "auto-start unless ?test=1"), ("fn", "loadMorphConfig"), ("const", "CFG")],
     keys=["dest"], change=["?v=<name> picks the version; ?test=1 brings back the Tap to scan button; ?dest=<url> overrides where it ends; ?config=<url> loads another settings file."])
node(id="r_frame0", label="Frame 0: the still, then the canvas takes over",
     purpose="The HTML still (portaboom-morph2-qr.png) paints first. When WebGL has drawn the identical QR from the same encoder, the still is removed so only one surface is ever on screen. The GLB loads behind it; morph2Prepare samples the unit into voxels and decides which module flies where.",
     impl=[("fn", "morph2Init"), ("fn", "morph2Flat"), ("fn", "morph1HandOver"), ("fn", "morph2Prepare"), ("fn", "morph1FlatFrame"), ("const", "MORPH1_SCAN_FRAC")],
     keys=[], change=["QR size on screen at frame 0 is MORPH1_SCAN_FRAC (90% of width, a constant). Change it and the still's CSS (--m1q in index.html) together."])
node(id="r_hold", label="Hold on the QR, then auto-start",
     purpose="Once the canvas is live, the GLB is ready and the voxels are prepared, the QR holds still for a beat and the scan starts by itself (no button for real users).",
     impl=[("fn", "morph1Tick"), ("fn", "morph1TickBase"), ("const", "MORPH1_AUTO_DELAY_S"), ("const", "MORPH1_FLAT_MIN_S"), ("fn", "morph1Tap")],
     keys=["scan.auto_start_delay_s"], change=["Longer pause before the scan: raise scan.auto_start_delay_s (clamped 0-3 s)."])
node(id="r_scan", label="Scan sweep + finder lock + buzz",
     purpose="Orange focus brackets, a scan line sweeping down and up over the code, then the three finder squares lock with a pulse and the phone buzzes (16-45-26 ms) at 80% of the scan. morph1 uses a single 0.8 s sweep with the buzz at the tap.",
     impl=[("fn", "morph2ScanFxInit"), ("fn", "morph2ScanFx"), ("fn", "morph1BeginScan"), ("fn", "morph1ScanFx"), ("const", "MORPH2_SCAN_S"), ("const", "MORPH1_SWEEP_S")],
     keys=["scan.duration_s", "scan.passes"], change=["Longer or shorter scan: scan.duration_s (min 0.3 s). More sweeps: scan.passes (1-6). The lock pulse always sits at 78-92% of the scan."])
node(id="r_fill", label="QR grows to fill the screen",
     purpose="Top-down zoom from the framed QR to a full-screen code; random filler modules pop in outward from the code's edges so the portrait screen is covered. The morph clock (T = 0) starts after this.",
     impl=[("fn", "morph2Rise"), ("fn", "morph3FillerScale"), ("fn", "morph1Resize"), ("const", "MORPH3_FILL_S")],
     keys=["fill.duration_s", "fill.pop_s"], change=["Slower zoom to full screen: fill.duration_s. Snappier filler pop: lower fill.pop_s. Everything after it shifts by the same amount."])
node(id="r_lift", label="Lift wave: modules lift off the page",
     purpose="A wave runs out from the centre through the floor modules: each tile humps up, stretches and tips away from the centre. The flat print look fades into lit 3D cubes over lift.print_fade_s.",
     impl=[("fn", "morph2Frame"), ("const", "MORPH2_FLAT_FADE_S")],
     keys=["lift.start_s", "lift.spread_s", "lift.duration_s", "lift.height_cells", "lift.tilt", "lift.print_fade_s"],
     change=["Higher wave: lift.height_cells. Wave reaches the edges sooner: lower lift.spread_s. Flatter, calmer tiles: lower lift.tilt."])
node(id="r_fly", label="Flight: drawn modules fly to the unit",
     purpose="morph2Assign matches every voxel of the 3D unit to the art module of the same part at the same relative spot (boom to boom, lenses to lenses, cabinet to cabinet); spare data modules make up the rest; leftover art melts in. Each flyer follows a cubic Bezier with an arc and spin, shrinks to voxel size and changes from QR navy to the unit's colour half-way. Boom builds as a line base-first, the light head row by row bottom-up, the body with a sideways sweep.",
     impl=[("fn", "morph2Assign"), ("fn", "morph2ArtPart"), ("fn", "morph2Frame")],
     keys=["flight.boom.start_s", "flight.boom.stagger_dist", "flight.boom.stagger_height", "flight.boom.jitter_s", "flight.boom.duration_s", "flight.boom.duration_jitter_s", "flight.boom.arc", "flight.boom.spin",
           "flight.head.start_s", "flight.head.stagger_dist", "flight.head.stagger_height", "flight.head.stagger_across", "flight.head.jitter_s", "flight.head.duration_s", "flight.head.duration_jitter_s", "flight.head.arc", "flight.head.spin",
           "flight.body.start_s", "flight.body.stagger_dist", "flight.body.stagger_height", "flight.body.jitter_s", "flight.body.duration_s", "flight.body.duration_jitter_s", "flight.body.arc", "flight.body.spin",
           "flight.recolour_from", "flight.recolour_over"],
     change=["A part arrives earlier or later: flight.<part>.start_s. Taller arcs: .arc. More tumbling: .spin. Cubes take the unit's colours earlier: lower flight.recolour_from."])
node(id="r_assemble", label="Voxel PORTABOOM assembles",
     purpose="The standing unit's surface is sampled (60,000 area-weighted points), binned into about 1,100 cubes with hidden inner cubes dropped, coloured by part (lens and boom-stripe colours from settings). As the base completes, a faint ring ripples through the floor; vacated cells refill as plain QR navy.",
     impl=[("fn", "morph2Voxels"), ("fn", "morph2Frame"), ("const", "MORPH2_TARGET_VOXELS"), ("const", "MORPH2_LENS"), ("const", "MORPH2_BOOM")],
     keys=["assembly.voxel_count", "assembly.floor_ripple", "assembly.ripple_speed_cells", "assembly.ripple_height_cells", "colours.lens_red", "colours.lens_amber", "colours.lens_green", "colours.boom_red", "colours.boom_white"],
     change=["Chunkier or finer cubes: assembly.voxel_count (300-1500; fewer = bigger cubes). colours.lens_* and boom_* colour the cubes only, not the real model."])
node(id="r_resolve", label="Blocks turn into the real unit",
     purpose="At resolve.start_s the real GLB switches on inside the voxel shell. In 'shimmer' style a light band climbs the unit: each cube flares, flips on its axis and shrinks into the surface; a glowing ring sized to the unit's cross-section rides the band; lens glow, halos, decal and STOP face fade in with it and the lenses flash as the band passes them. 'shrink' style just shrinks the cubes.",
     impl=[("fn", "morph2Frame"), ("fn", "morph3K"), ("fn", "morph3Ring"), ("fn", "morph3RingInit"), ("fn", "morph3Flash"), ("fn", "morph3Fx"), ("fn", "morph2Final"), ("const", "MORPH2_REVEAL_S"), ("const", "MORPH2_END_S")],
     keys=["resolve.style", "resolve.start_s", "resolve.duration_s", "resolve.shimmer_color", "resolve.shimmer_band", "resolve.flip_deg", "resolve.sweep_ring", "resolve.lens_flash", "morph_end_s"],
     change=["Real unit appears later: resolve.start_s. Slower wave: resolve.duration_s. No ring: resolve.sweep_ring 0. Plain version: resolve.style 'shrink'."])
node(id="r_camera", label="Camera: top-down to eye level, glide, framing",
     purpose="One perspective camera goes from a near-orthographic top-down view to eye level at the lens height (zero pitch), framed with an off-axis lens shift (never by tilting): the unit fills camera.unit_height of the screen, the lens stack sits at lens_y, the leftmost part at left_margin so the boom has the rest of the width. morph3 adds a glide that ends the rise 18 degrees round the unit and eases back square-on, and a slight push-in during the resolve.",
     impl=[("fn", "morph1DoorPose"), ("fn", "morph1ApplyCamera"), ("fn", "morph2Rise"), ("fn", "morph3CameraFx"), ("fn", "morph3YawAt"), ("fn", "morph3Orbit"), ("const", "MORPH2_TILT_S"), ("const", "MORPH3_END_UNIT_H")],
     keys=["camera.tilt_start_s", "camera.tilt_end_s", "camera.tilt_curve", "camera.fov_portrait", "camera.fov_wide", "camera.unit_height", "camera.lens_y", "camera.left_margin", "camera.pitch_deg", "camera.glide_yaw_deg", "camera.glide_start_s", "camera.glide_s", "camera.glide_hold_s", "resolve.push_in"],
     change=["Bigger unit on screen: camera.unit_height. Lights higher or lower: camera.lens_y. More boom in shot: lower camera.left_margin. No orbit: camera.glide_yaw_deg 0. Faster drop to eye level: lower camera.tilt_end_s."])
node(id="r_env", label="Sky, horizon, ground and floor colours",
     purpose="The cream page blends into a sky gradient, horizon at eye level and a ground plane as the camera comes down; the QR floor calms to the end tile colour.",
     impl=[("fn", "morph1BuildEnv"), ("fn", "morph1EnvMix"), ("fn", "morph1EnvFollow"), ("const", "MORPH1_SKY_TOP")],
     keys=["colours.sky_top", "colours.horizon", "colours.ground", "colours.floor"], change=["Change the end backdrop: colours.sky_top / horizon / ground; the QR tiles' end colour: colours.floor."])
node(id="r_lights", label="Light cycle: green, amber, red",
     purpose="After the hold (and the glide in morph3) showtime starts: green, then amber, then red hold, with the lens materials, halos and lamp lights switched by setSignalAspect.",
     impl=[("fn", "startShowtime"), ("fn", "tickShow"), ("fn", "setSignalAspect"), ("const", "SHOWTIME_GREEN_S")],
     keys=["lights.green_s", "lights.amber_s", "lights.red_hold_s"], change=["Longer green: lights.green_s; amber: lights.amber_s; pause on red before the boom moves: lights.red_hold_s."])
node(id="r_boom", label="Boom comes down",
     purpose="The boom lowers with a smoothstep over boom.lower_s while red. In morph3+ the camera eases back to a slightly wider frame (unit_height_boom_down) so the lowered arm and STOP disc land in shot.",
     impl=[("fn", "tickShow"), ("fn", "applyBoomShown"), ("fn", "morph3BoomDownCamera"), ("const", "SHOWTIME_LOWER_S")],
     keys=["boom.lower_s", "camera.unit_height_boom_down"], change=["Slower boom: boom.lower_s. More of the lowered boom in frame: lower camera.unit_height_boom_down."])
node(id="r_dest", label="Leave to the DEST page",
     purpose="A short beat after the boom is fully down, the page opens DEST: ?dest= if given, else morph-config.json dest, else the Traffic Access PB4000 product page.",
     impl=[("fn", "settleShowtime"), ("fn", "leaveToDest"), ("const", "SHOWTIME_LEAVE_S"), ("const", "leaveDest"), ("fn", "resolveLeaveDest", "dest-config.mjs")],
     keys=["boom.leave_after_s", "dest"], change=["Different landing page for everyone: dest. For one printed link only: add &dest=<url-encoded link>. Longer final hold: boom.leave_after_s."])

# morph1-only
node(id="m1_hinge", label="morph1: unit hinges upright",
     purpose="The rendered unit lying on its back hinges up on its bottom-back edge over 3.2 s and slides to its standing spot while the QR tiles ripple; the boom arm swings up from 2.5 to 4.1 s (red until up, then green); the camera comes down from top-down to eye level 0.1-3.5 s.",
     impl=[("fn", "morph1StartRise"), ("fn", "morph1Tick"), ("fn", "morph1UnitPose"), ("fn", "morph1ArmAt"), ("fn", "morph1TileFloor"), ("fn", "morph1FinishRise"), ("const", "MORPH1_HINGE_S"), ("const", "MORPH1_ARM_S"), ("const", "MORPH1_TILT_S")],
     keys=[], change=["All timings are constants in app.js (MORPH1_HINGE_S, MORPH1_ARM_S, MORPH1_TILT_S, MORPH1_RIPPLE_S, MORPH1_WAVE_AMP); edit them there, not in morph-config.json."])

# road
node(id="road_build", label="road: worksite builds outward",
     purpose="From road.build_start_s after the fill, the QR tiles inside a growing radius ripple up and sink into asphalt; first ~9 m round the unit, then the world races out to build_radius. Sky and horizon blend to the road palette. The scene itself (sealed road, kerbs, lane lines, grass, trees, hills, cone taper, A-frame signs, parked work ute with beacon, blob shadows) is procedural, no image files.",
     impl=[("fn", "roadEnsure"), ("fn", "roadTiles"), ("fn", "roadTick"), ("fn", "buildRoadScene", "road-scene.js")],
     keys=["road.build_start_s", "road.build_s", "road.build_radius", "road.colours.sky_top", "road.colours.horizon", "road.colours.asphalt", "road.colours.grass", "road.colours.line", "road.colours.kerb", "road.colours.cone", "road.colours.sign", "road.colours.tree_a", "road.colours.tree_b", "road.colours.tree_c", "road.colours.hills", "road.colours.work_ute", "road.colours.build_glow"],
     change=["Road appears sooner: road.build_start_s. Faster spread: road.build_s. Recolour any part: road.colours.*."])
node(id="road_fog", label="road: haze",
     purpose="Fog set relative to the subject so the far road fades into the horizon.",
     impl=[("fn", "morph1EnvFollow")], keys=["road.fog_near", "road.fog_far"], change=["Clearer distance: raise road.fog_far."])
node(id="road_preshow", label="road: boom down, wait, up before green",
     purpose="When showtime starts the boom first lowers (red), waits, and rises, then the light cycle runs. Lower and raise use boom.lower_s unless road.boom_lower_s / road.boom_raise_s are added.",
     impl=[("fn", "roadPreShow"), ("fn", "startShowtime"), ("fn", "tickShow"), ("const", "ROAD_PRE_S")],
     keys=["road.boom_down_wait_s", "boom.lower_s"], change=["Longer wait with the boom down: road.boom_down_wait_s."])
node(id="road_traffic", label="road: cars, controllers, light cycle",
     purpose="Up to 5 cars approach from the camera side facing the lights, queue at a stop line before the lowered boom (car-following model with a stop line), drive away past the unit on green; up to 3 hi-vis traffic controllers turn their STOP/SLOW bats with the lights. road overrides the light timings and the leave delay.",
     impl=[("fn", "buildRoadScene", "road-scene.js"), ("grep", "road-scene.js", r"function update\(dt, sig\)", "update(): traffic follows signal"), ("grep", "road-scene.js", r"function idm\(", "idm(): car following"), ("const", "SHOWTIME_GREEN_S")],
     keys=["road.cars", "road.car_speed", "road.car_accel", "road.workers", "road.colours.hivis", "road.green_s", "road.amber_s", "road.red_hold_s", "road.leave_after_s"],
     change=["More or fewer cars: road.cars (0-5). Faster departures: road.car_speed / car_accel. Longer green for the queue to clear: road.green_s."])

# minions
node(id="minis_spawn", label="minions: build the mini PORTABOOMs",
     purpose="One low-poly PB4000 (cabinet with flashers and label band, wheels, mast, signal head with three lenses, boom with STOP disc) in the hero's proportions measured from the hero's voxels; drawn as instanced meshes (body, arm, lenses). Spots are picked on dark QR modules across the screen-filling code, never on the unit's drawing.",
     impl=[("fn", "minisInit"), ("fn", "minisCfg"), ("fn", "mergeBoxes"), ("fn", "morph2Prepare")],
     keys=["minions.count", "minions.spacing_cells", "minions.size", "minions.arm_length"], change=["More minis: minions.count (30-80). Bigger: minions.size (share of hero height). Closer together: lower spacing_cells."])
node(id="minis_life", label="minions: pop up, stand, bob, own cycle",
     purpose="Minis pop out of their modules lying on their backs in a wave from the hero, stand up, bob, and run their own green/amber/red and boom cycle out of sync; the ones between the camera and the hero duck back into their modules.",
     impl=[("fn", "minisFrame"), ("fn", "miniCycle"), ("fn", "morph2Rise")],
     keys=["minions.pop_start_s", "minions.pop_spread_s", "minions.pop_s", "minions.stand_up_s", "minions.stand_up_spread_s", "minions.bob", "minions.bob_hz", "minions.cycle_s", "minions.duck_s"],
     change=["Earlier crowd: minions.pop_start_s. Calmer: lower minions.bob. Faster own cycle: lower minions.cycle_s."])
node(id="minis_lineup", label="minions: line up behind the hero and follow it",
     purpose="At line_up_s the minis hop into rows behind the hero, turn to face front and from then on copy the hero's light and boom.",
     impl=[("fn", "minisFrame")], keys=["minions.line_up_s", "minions.line_up_duration_s", "minions.rows", "minions.row_gap", "minions.col_gap"],
     change=["More rows: minions.rows. Wider spacing: row_gap / col_gap."])
node(id="minis2_spots", label="minions2: cover the whole floor, keep the hero clear",
     purpose="Spots are tried from the horizon to the bottom edge, more spread out with distance, clear of a ring round the hero's feet, the strip the boom lands on, and anything that would cover the hero's head, lenses, cabinet, wheels or legs in the end shot (minis right in front shrink or are dropped).",
     impl=[("fn", "minis2Spots"), ("fn", "minis2PoseCam"), ("fn", "minis2Rect"), ("fn", "minis2MiniPts")],
     keys=["minions2.count", "minions2.size", "minions2.pop_spread_s", "minions2.ring", "minions2.hero_clear", "minions2.depth_grow", "minions2.max_depth", "minions2.reach_cells", "minions2.bob"],
     change=["Denser crowd: minions2.count. More room round the hero: minions2.ring / hero_clear. Crowd reaches further back: max_depth / reach_cells."])
node(id="minis2_ripple", label="minions2: crowd follows the hero in a ripple",
     purpose="The hero's light and boom are recorded over time; each mini plays them back a little later the further out it stands.",
     impl=[("fn", "minis2Hist"), ("fn", "minis2HeroAt"), ("fn", "minisFrame")], keys=["minions2.ripple_s"], change=["Slower ripple: minions2.ripple_s."])

# night
node(id="night_fade", label="night: fade to night, QR becomes city lights",
     purpose="The page fades to night; every QR module takes a warm window colour (some bright, a third dark) as flat unlit light, with a blurred glow map laid on the paper. Sky, paper, ground and fog follow a night palette.",
     impl=[("fn", "nightEnv"), ("fn", "nightFloor"), ("fn", "nightCellColours"), ("fn", "nightGlowPlane"), ("fn", "nightTick"), ("fn", "nightEnsure")],
     keys=["night.fade_s", "night.city_glow", "night.light_min", "night.bright_share", "night.dark_share", "night.scene_light", "night.haze_near", "night.haze_far",
           "night.colours.paper", "night.colours.sky_top", "night.colours.horizon", "night.colours.ground", "night.colours.city_light", "night.colours.city_warm", "night.colours.city_cool", "night.colours.city_glow", "night.colours.window_off"],
     change=["Faster nightfall: night.fade_s. More dark windows: night.dark_share. Brighter city: night.city_glow."])
node(id="night_fly", label="night: glowing cubes",
     purpose="The flying modules are drawn unlit and glowing (QR light colour on the ground, then the unit's colours) with billboard halos following each cube.",
     impl=[("fn", "nightFly"), ("fn", "nightHalos")], keys=["night.cube_glow", "night.cube_brighten"], change=["Stronger cube glow: night.cube_glow."])
node(id="night_road", label="night: wet road spreads",
     purpose="A dark glossy asphalt patch with puddles spreads in front of the resolved unit.",
     impl=[("fn", "nightRoad"), ("fn", "nightTick")], keys=["night.road_start_s", "night.road_s", "night.road_radius", "night.road_behind", "night.road_roughness", "night.colours.asphalt"],
     change=["Road appears sooner: night.road_start_s. Shinier: lower night.road_roughness."])
node(id="night_lights", label="night: lenses and flashers light the scene",
     purpose="Point lights at the lens and the two cabinet flashers wash the scene in the current aspect colour, with coloured streak reflections on the wet road.",
     impl=[("fn", "nightLights"), ("fn", "nightStreak"), ("fn", "nightLampOn")],
     keys=["night.wash", "night.wash_range", "night.sky_wash", "night.flasher_light", "night.flasher_range", "night.streaks", "night.streak_length"],
     change=["Stronger colour wash: night.wash. Longer reflections: night.streak_length."])

# blueprint
node(id="bp_sheet", label="blueprint: QR inverts into a blueprint sheet",
     purpose="The cream print inverts to blueprint blue with a faint grid; the sheet carries a side elevation, dimension lines and a title, every number measured from the GLB bounding boxes at load time. Nothing flies: every module stays on the paper.",
     impl=[("fn", "bpSheet"), ("fn", "bpEnv"), ("fn", "bpFloor"), ("fn", "bpTick")],
     keys=["blueprint.invert_start_s", "blueprint.invert_s", "blueprint.paper_alpha", "blueprint.label_size", "blueprint.colours.paper", "blueprint.colours.grid", "blueprint.colours.ink", "blueprint.colours.module", "blueprint.colours.sky_top", "blueprint.colours.horizon", "blueprint.colours.ground", "blueprint.base.camera.tilt_start_s"],
     change=["Bigger dimension text: blueprint.label_size. Different blue: blueprint.colours.paper."])
node(id="bp_wire", label="blueprint: elevation draws, lifts off as wireframe, stands up",
     purpose="The front elevation (the GLB's own feature edges, precomputed into blueprint-edges.bin) draws itself, lifts off the paper as a glowing wireframe and stands up into the unit's place.",
     impl=[("fn", "bpLoadEdges"), ("fn", "bpBuild"), ("fn", "bpSegGeometry"), ("fn", "bpTick")],
     keys=["blueprint.draw_start_s", "blueprint.draw_s", "blueprint.lift_start_s", "blueprint.lift_s", "blueprint.lift_height_cells", "blueprint.wire_glow", "blueprint.colours.wire"],
     change=["Slower drawing: blueprint.draw_s. Higher lift: lift_height_cells."])
node(id="bp_fill", label="blueprint: real unit scans in part by part",
     purpose="Cabinet, head, lenses, boom and wheels each scan in bottom-up behind a glowing ring, with a flash, while the wireframe and the ink fade away.",
     impl=[("fn", "bpPartAt"), ("fn", "bpPartOf"), ("fn", "bpTick")],
     keys=["blueprint.fill_cabinet_s", "blueprint.fill_head_s", "blueprint.fill_lenses_s", "blueprint.fill_boom_s", "blueprint.fill_wheels_s", "blueprint.fill_part_s", "blueprint.scan_glow", "blueprint.flash", "blueprint.wire_fade_start_s", "blueprint.wire_fade_s", "blueprint.wire_fill_fade", "blueprint.ink_fade_start_s", "blueprint.ink_fade_s"],
     change=["Reorder the parts: change the fill_<part>_s start times. Slower per part: fill_part_s."])

# rain
node(id="rain_fall", label="rain: shoot up, rain down, bounce, stack",
     purpose="After the fill the modules shoot straight up out of frame; orange and navy cubes then fall on hand-rolled ballistic paths (gravity, drift, tumble), hit their exact voxel slot, bounce with damping and snap in; the unit stacks bottom-up. rain shifts the shared resolve and glide later (its 'base' block) so the stack finishes first.",
     impl=[("fn", "rainEnsure"), ("fn", "rainFly"), ("fn", "rainTick"), ("const", "CFG")],
     keys=["rain.shoot_start_s", "rain.shoot_spread_s", "rain.shoot_speed", "rain.rain_start_s", "rain.rain_s", "rain.drop_height", "rain.gravity", "rain.drift", "rain.tumble", "rain.layer_mix", "rain.bounce_cells", "rain.bounce_hz", "rain.bounce_damping", "rain.settle_s", "rain.colours.orange", "rain.colours.navy",
           "rain.base.resolve.start_s", "rain.base.morph_end_s", "rain.base.camera.tilt_end_s", "rain.base.camera.glide_start_s"],
     change=["Longer downpour: rain.rain_s. Heavier fall: rain.gravity. Bigger bounce: rain.bounce_cells."])
node(id="rain_impact", label="rain: dust puff and camera shake on boom drop",
     purpose="When the boom lands, a small dust puff comes out round the wheels (or at the tip) and the camera shakes for 0.2 s.",
     impl=[("fn", "rainDust"), ("fn", "rainDustTick"), ("fn", "rainTick")],
     keys=["rain.dust", "rain.dust_count", "rain.dust_size", "rain.dust_s", "rain.dust_at_tip", "rain.shake", "rain.shake_s", "rain.colours.dust"],
     change=["No shake: rain.shake 0. Dust at the boom tip: rain.dust_at_tip true."])

# domino
node(id="dom_delay", label="domino: hero starts later",
     purpose="All of the hero's flight, lift, resolve, tilt and glide start domino.delay_s later than morph3 so the dominoes fall and the camera reaches the aisle first; the glide is a straight dolly unless domino.glide_yaw_deg is set.",
     impl=[("const", "DOMINO_DL")], keys=["domino.delay_s", "domino.glide_yaw_deg"], change=["Hero builds sooner: lower domino.delay_s."])
node(id="dom_topple", label="domino: QR topples corners to centre",
     purpose="Each module tips onto its leading edge and falls one cell towards the middle with a small bounce, in a wave from the corners.",
     impl=[("fn", "dominoToppleAt"), ("fn", "dominoTiles"), ("fn", "dominoTile"), ("fn", "morph2Frame")],
     keys=["domino.topple_start_s", "domino.topple_spread_s", "domino.topple_s", "domino.overshoot"], change=["Slower wave: domino.topple_spread_s. Bouncier landing: domino.overshoot."])
node(id="dom_aisle", label="domino: guard of honour flips up",
     purpose="Along an aisle from the bottom of the screen to the hero, fallen modules flip up as little PORTABOOMs in straight lines either side (reuses the minions mini model).",
     impl=[("fn", "dominoBuild"), ("fn", "minisInit"), ("fn", "dominoApron")],
     keys=["domino.size", "domino.aisle_width", "domino.lines_per_side", "domino.line_gap", "domino.row_gap", "domino.first_row", "domino.max_rows", "domino.stand_delay_s", "domino.flip_s"],
     change=["Wider aisle: domino.aisle_width. More lines each side: lines_per_side (1-4)."])
node(id="dom_camera", label="domino: camera down into the aisle and along it",
     purpose="The camera swoops down behind the bottom edge into the aisle at low height and dollies along it to the hero's end frame.",
     impl=[("fn", "dominoCamera"), ("fn", "dominoAislePose"), ("fn", "morph2Rise")],
     keys=["domino.swoop_start_s", "domino.swoop_s", "domino.dolly_s", "domino.dolly_start", "domino.camera_height", "domino.look_height"], change=["Lower camera: domino.camera_height. Slower trip: domino.dolly_s."])
node(id="dom_salute", label="domino: rows salute, boom drop ripples down the rows",
     purpose="Each row raises its booms just before the camera passes; at the end the hero's lights and boom drop ripple back down the rows; the hero is kept clear in the end shot.",
     impl=[("fn", "dominoFrame")], keys=["domino.salute_lead", "domino.salute_s", "domino.ripple_s", "domino.hero_clear"], change=["Salute earlier: domino.salute_lead. Slower ripple: domino.ripple_s."])
node(id="dom2_crowd", label="domino2: full-floor crowd instead of rows",
     purpose="Spots across the whole visible floor with a lane kept for the camera, a ring round the hero, mixed sizes and slight turns; minis in front of the hero shrink to stay under it. Booms rise in a ripple with jitter as the camera passes; the drop ripples back out.",
     impl=[("fn", "domino2Spots"), ("fn", "dominoBuild"), ("fn", "dominoFrame")],
     keys=["domino2.count", "domino2.size", "domino2.size_mix", "domino2.yaw_jitter", "domino2.grid", "domino2.reach_x", "domino2.reach_back", "domino2.max_depth", "domino2.depth_grow", "domino2.ring", "domino2.path_clear", "domino2.front_min_scale", "domino2.hero_clear", "domino2.ripple_spread", "domino2.salute_jitter_s", "domino2.salute_lead"],
     change=["Denser: domino2.count. More size variety: size_mix. Wider camera lane: path_clear."])

# drone
node(id="drone_delay", label="drone: hero later, glide replaced by the swoop",
     purpose="Flight, lift, resolve and tilt start drone.delay_s later; the morph3 glide is replaced by the swoop (glide_start_s/glide_s are taken from drone.swoop_*).",
     impl=[("const", "DRONE_DL")], keys=["drone.delay_s"], change=["Hero assembles sooner: lower drone.delay_s."])
node(id="drone_pull", label="drone: rise to a top-down drone view",
     purpose="The camera rises straight up from the full-screen code to a hover over the worksite with a wider field of view.",
     impl=[("fn", "droneCamera"), ("fn", "droneHoverPose"), ("fn", "droneFog")],
     keys=["drone.pull_start_s", "drone.pull_s", "drone.height", "drone.centre_x", "drone.centre_z", "drone.fov"], change=["Higher hover: drone.height. Shift what is under the drone: centre_x / centre_z."])
node(id="drone_tiles", label="drone: QR turns into the worksite tile by tile",
     purpose="Every QR cell gets a threshold; once progress passes it, the module flips up and away and the worksite (drone-scene.js, a copy of road-scene.js that reveals per cell) shows in its place. Far cells go first; the drawing of the unit goes last as its modules fly into the hero.",
     impl=[("fn", "droneCells"), ("fn", "droneTile"), ("fn", "droneProgress"), ("fn", "buildDroneScene", "drone-scene.js")],
     keys=["drone.transform_start_s", "drone.transform_s", "drone.tile_flip_s", "drone.random"], change=["Slower reveal: drone.transform_s. More random order: drone.random."])
node(id="drone_swoop", label="drone: one long banked swoop to eye level",
     purpose="A single eased Bezier from the hover, round to the side and in low behind the queue, banking gently, landing exactly on road's eye-level end frame.",
     impl=[("fn", "droneCamera"), ("fn", "droneSetCam"), ("fn", "_drB"), ("fn", "morph2Rise")],
     keys=["drone.swoop_start_s", "drone.swoop_s", "drone.swoop_side", "drone.swoop_back", "drone.bank_deg"], change=["Wider arc: drone.swoop_side (sign picks the side). No bank: drone.bank_deg 0."])

RUNTIME = R

SPINE = ["r_boot", "r_frame0", "r_hold", "r_scan"]
M3 = SPINE + ["r_fill", "r_lift", "r_fly", "r_assemble", "r_resolve", "r_camera", "r_env", "r_lights", "r_boom", "r_dest"]
def ins(seq, after, new):
    i = seq.index(after) + 1
    return seq[:i] + new + seq[i:]
PATHS = {
    "morph1": SPINE + ["m1_hinge", "r_camera", "r_env", "r_lights", "r_boom", "r_dest"],
    "morph2": SPINE + ["r_lift", "r_fly", "r_assemble", "r_resolve", "r_camera", "r_env", "r_lights", "r_boom", "r_dest"],
    "morph3": M3,
    "road": ins(ins(ins(M3, "r_resolve", ["road_build", "road_fog"]), "r_env", ["road_preshow"]), "r_lights", ["road_traffic"]),
    "minions": ins(ins(M3, "r_fill", ["minis_spawn", "minis_life"]), "r_env", ["minis_lineup"]),
    "minions2": ins(ins(M3, "r_fill", ["minis_spawn", "minis2_spots", "minis_life"]), "r_env", ["minis_lineup", "minis2_ripple"]),
    "night": ins(ins(ins(M3, "r_fill", ["night_fade"]), "r_fly", ["night_fly"]), "r_resolve", ["night_road"])[:-3] + ["r_lights", "night_lights", "r_boom", "r_dest"],
    "blueprint": SPINE + ["r_fill", "bp_sheet", "bp_wire", "bp_fill", "r_camera", "r_env", "r_lights", "r_boom", "r_dest"],
    "rain": SPINE + ["r_fill", "r_lift", "rain_fall", "r_assemble", "r_resolve", "r_camera", "r_env", "r_lights", "r_boom", "rain_impact", "r_dest"],
    "domino": SPINE + ["r_fill", "dom_delay", "dom_topple", "dom_aisle", "dom_camera", "r_lift", "r_fly", "r_assemble", "r_resolve", "r_camera", "r_env", "r_lights", "r_boom", "dom_salute", "r_dest"],
    "domino2": SPINE + ["r_fill", "dom_delay", "dom_topple", "dom2_crowd", "dom_camera", "r_lift", "r_fly", "r_assemble", "r_resolve", "r_camera", "r_env", "r_lights", "r_boom", "dom_salute", "r_dest"],
    "drone": SPINE + ["r_fill", "drone_delay", "drone_pull", "drone_tiles", "r_fly", "r_assemble", "r_resolve", "road_build", "drone_swoop", "r_camera", "r_env", "road_preshow", "r_lights", "road_traffic", "r_boom", "r_dest"],
}

# Per-version notes on shared steps (what this version does differently there).
OVERRIDES = {
    ("morph1", "r_scan"): "Single 0.8 s sweep (MORPH1_SWEEP_S, morph1ScanFx); buzz 18-40-28 ms at the start of the scan.",
    ("morph1", "r_hold"): "Holds MORPH1_FLAT_MIN_S (1.4 s) after boot instead of scan.auto_start_delay_s.",
    ("morph1", "r_frame0"): "Still is portaboom-morph-qr.png: a version-10 QR (encodeTipMatrix) with the rendered unit lying on it; MORPH_MASK marks the 421 cells it covers.",
    ("morph1", "r_camera"): "End framing constants: MORPH1_END_UNIT_H 0.66, MORPH1_END_LENS_Y 0.38 (kept within 0.35-0.42), MORPH1_END_LEFT_MARGIN 0.045. No glide.",
    ("morph1", "r_lights"): "Hard-coded: green 0.5 s, amber 1.0 s, red hold 0.5 s (SHOWTIME_* in app.js).",
    ("morph1", "r_boom"): "Hard-coded: SHOWTIME_LOWER_S 1.0 s; no wider boom-down frame.",
    ("morph1", "r_dest"): "Hard-coded SHOWTIME_LEAVE_S 0.4 s; DEST from ?dest= or the default product page (no config file).",
    ("morph1", "r_env"): "Hard-coded colours MORPH1_SKY_TOP / HORIZON / TILE_END / GROUND in app.js.",
    ("morph2", "r_hold"): "Holds MORPH1_AUTO_DELAY_S = 0.8 s (constant, not from config).",
    ("morph2", "r_scan"): "MORPH2_SCAN_S = 1.8 s and 2 passes, constants in app.js.",
    ("morph2", "r_lift"): "Hard-coded wave in morph2Frame (no lift.* settings); print fade MORPH2_FLAT_FADE_S [0.05, 0.8].",
    ("morph2", "r_fly"): "Same matching as morph3 but the timings are literals inside morph2Assign (no flight.* settings, no row-by-row light head).",
    ("morph2", "r_assemble"): "MORPH2_TARGET_VOXELS = 1100; no floor ripple ring.",
    ("morph2", "r_resolve"): "Plain shrink from the base up (MORPH2_REVEAL_S [3.3, 4.2], end 4.4 s); no shimmer, ring or lens flash.",
    ("morph2", "r_camera"): "Tilt MORPH2_TILT_S [0.05, 3.55] with curve 0.72; framing MORPH1_END_* constants; no glide, no push-in.",
    ("morph2", "r_lights"): "Hard-coded: green 0.5 s, amber 1.0 s, red hold 0.5 s.",
    ("morph2", "r_boom"): "Hard-coded 1.0 s; no wider boom-down frame.",
    ("morph2", "r_dest"): "Hard-coded 0.4 s beat; DEST from ?dest= or the default product page.",
    ("morph2", "r_env"): "Hard-coded colours in app.js.",
    ("road", "r_lights"): "road.green_s / amber_s / red_hold_s replace lights.* (green 2.4 s so the queue can clear).",
    ("road", "r_dest"): "road.leave_after_s (1.6 s) replaces boom.leave_after_s.",
    ("road", "r_env"): "Sky and horizon blend to road.colours.sky_top / horizon as the road builds; the studio ground hides once the road covers it.",
    ("drone", "r_lights"): "Uses road.green_s / amber_s / red_hold_s (drone is built on the road file).",
    ("drone", "r_dest"): "Uses road.leave_after_s.",
    ("drone", "r_camera"): "Only the end framing (morph1DoorPose) is used: the tilt and glide are replaced by the drone pull-up and swoop; glide_yaw_deg forced to 0.",
    ("drone", "road_build"): "drone-scene.js reveals the worksite cell by cell from above (droneCells) instead of the radius build.",
    ("drone", "r_fly"): "Starts drone.delay_s (1.7 s) later.",
    ("domino", "r_lift"): "Modules marked for toppling skip the lift wave (dominoTile); the rest lift as morph3, 1.7 s later.",
    ("domino2", "r_lift"): "Modules marked for toppling skip the lift wave (dominoTile); the rest lift as morph3, 1.7 s later.",
    ("domino", "r_fly"): "Starts domino.delay_s (1.7 s) later.",
    ("domino2", "r_fly"): "Starts domino.delay_s (1.7 s) later (domino2 overlays domino).",
    ("domino", "r_camera"): "The rise camera is dominoCamera (aisle swoop and dolly), not the morph3 tilt; end framing still morph1DoorPose; glide_yaw_deg = domino.glide_yaw_deg (0).",
    ("domino2", "r_camera"): "The rise camera is dominoCamera, not the morph3 tilt; end framing still morph1DoorPose.",
    ("domino", "dom_aisle"): "",
    ("rain", "r_assemble"): "The voxel targets come from morph2Voxels / morph2Assign as usual; rainFly moves the cubes instead of the Bezier flight.",
    ("rain", "r_resolve"): "rain.base moves resolve.start_s to 4.0 and morph_end_s to 5.5 so the stack finishes first.",
    ("rain", "r_camera"): "rain.base: camera.tilt_end_s 3.9 and glide_start_s 4.3.",
    ("blueprint", "r_camera"): "blueprint.base: camera.tilt_start_s 0.7 (the camera waits while the sheet draws).",
    ("blueprint", "r_env"): "bpEnv turns the cream page, sky and ground blueprint blue (blueprint.colours.*).",
    ("night", "r_env"): "nightEnv blends sky, paper, ground and fog to night.colours.* over night.fade_s.",
    ("night", "r_fly"): "Same flight; nightFly redraws the cubes unlit and glowing.",
    ("minions2", "minis_spawn"): "minisCfg() = minions settings with minions2 on top (count 220, size 0.2).",
    ("minions2", "minis_lineup"): "In minions2 the crowd does not move into rows: it stays where it is and follows the hero (with a ripple).",
}
