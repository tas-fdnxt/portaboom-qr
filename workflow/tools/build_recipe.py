"""Builds workflow/recipe.json, workflow/RECIPE.md and workflow/graphs/*.mmd from the code.
Every file:line in the output is resolved here against the code at the pinned commit; nothing is typed by hand.
Usage: python3 workflow/tools/build_recipe.py [repo_dir]"""
import json, os, re, subprocess, sys, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import jsfuncs, keyuse, recipe_spec as S, key_notes

REPO = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", ".."))
OUT = os.path.join(REPO, "workflow")
GH = "https://github.com/tas-fdnxt/portaboom-qr"
PAGES = "https://tas-fdnxt.github.io/portaboom-qr/"
def git(*a): return subprocess.check_output(["git", "-C", REPO, *a], text=True).strip()
# Pin to the last commit that touched code (not workflow/), so links match the line numbers.
COMMIT = git("log", "-1", "--format=%H", "--", ".", ":(exclude)workflow")
SHORT = COMMIT[:7]
CODE_FILES = ["app.js", "app3.js", "app-road.js", "app-minions.js", "app-night.js", "app-blueprint.js", "app-rain.js", "app-domino.js", "app-domino2.js", "app-drone.js",
              "road-scene.js", "drone-scene.js", "morph2-art.js", "qr-url.js", "living-qr.js", "dest-config.mjs"]
# Read the files as they are at COMMIT (the working tree may carry workflow/ only).
def at_commit(f): return subprocess.check_output(["git", "-C", REPO, "show", f"{COMMIT}:{f}"], text=True)
TMP = os.path.join(OUT, ".tmp_src"); os.makedirs(TMP, exist_ok=True)
for f in CODE_FILES + ["index.html", "editor.html", "morph-config.json", "morph2-art-grid.js", "morph-mask.js"]:
    open(os.path.join(TMP, f), "w").write(at_commit(f))
FUN = {f: jsfuncs.analyse(os.path.join(TMP, f)) for f in CODE_FILES}
FMAP = {f: {x["name"]: x for x in v["funcs"]} for f, v in FUN.items()}
LINES = {f: open(os.path.join(TMP, f)).read().split("\n") for f in CODE_FILES + ["index.html", "editor.html", "morph-config.json", "morph2-art-grid.js", "morph-mask.js"]}
CFG = json.load(open(os.path.join(TMP, "morph-config.json")))
USES, HIDDEN = keyuse.key_uses(TMP, {f: FUN[f] for f in FUN})

def blob(f, a, b=None): return f"{GH}/blob/{COMMIT}/{f}#L{a}" + (f"-L{b}" if b and b != a else "")
FILE_PARENT = {"app3.js": "app.js", "app-road.js": "app3.js", "app-minions.js": "app3.js", "app-night.js": "app3.js", "app-blueprint.js": "app3.js",
               "app-rain.js": "app3.js", "app-domino.js": "app-minions.js", "app-domino2.js": "app-domino.js", "app-drone.js": "app-road.js"}
def const_line(f, name):
    pat = re.compile(r"^(?:export\s+)?(?:const|let)\s+" + re.escape(name) + r"\b")
    for i, l in enumerate(LINES[f]):
        if pat.match(l): return i + 1
    return None
def status(f, name):
    p = FILE_PARENT.get(f)
    if not p: return "original"
    if name not in FMAP[p]: return f"new in {f}"
    return "same as " + p if FMAP[p][name]["sha"] == FMAP[f][name]["sha"] else f"changed from {p}"
def resolve(entry, vfile, strict=True):
    kind = entry[0]
    if kind == "fn":
        name = entry[1]; f = entry[2] if len(entry) > 2 else vfile
        x = FMAP.get(f, {}).get(name)
        if not x:
            if strict: raise SystemExit(f"missing function {name} in {f}")
            return None
        return {"kind": "function", "symbol": name + "()", "file": f, "start": x["start"], "end": x["end"], "url": blob(f, x["start"], x["end"]), "status": status(f, name) if f == vfile else "shared file"}
    if kind == "const":
        name = entry[1]; f = entry[2] if len(entry) > 2 else vfile
        ln = const_line(f, name)
        if not ln:
            if strict: raise SystemExit(f"missing const {name} in {f}")
            return None
        return {"kind": "constant", "symbol": name, "file": f, "start": ln, "end": ln, "url": blob(f, ln), "code": LINES[f][ln - 1].strip()[:200]}
    if kind == "grep":
        _, f, rx, label = entry
        for i, l in enumerate(LINES[f]):
            if re.search(rx, l): return {"kind": "line", "symbol": label, "file": f, "start": i + 1, "end": i + 1, "url": blob(f, i + 1)}
        raise SystemExit(f"grep miss {rx} in {f}")
    if kind == "tool":
        return {"kind": "build tool (not in this public repo)", "symbol": entry[1], "what": entry[2]}
    raise SystemExit(entry)

# ---- config keys
def flat(d, pre=""):
    for k, v in d.items():
        if k.startswith("_"): continue
        if isinstance(v, dict): yield from flat(v, pre + k + ".")
        else: yield pre + k, v
ALLK = dict(flat(CFG))
RANGES = []
for m in re.finditer(r"\[/(.+?)/, ([-\d.]+), ([-\d.]+), ([-\d.]+)\]", "\n".join(LINES["editor.html"])):
    RANGES.append((re.compile(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4))))
def erange(key, v):
    leaf = key.split(".")[-1]
    if isinstance(v, bool) or not isinstance(v, (int, float)): return None
    for rx, lo, hi, st in RANGES:
        if rx.search(leaf): return [lo, max(hi, v), st]
    return [0, max(1, v * 3), 0.01]
KEY_NOTE = {
 "dest": "Where the page goes at the end (a full https link). ?dest= in the link wins over this.",
 "scan.auto_start_delay_s": "Pause on the still QR before the scan starts itself (0-3 s).",
 "scan.duration_s": "Length of the whole scan animation; raise for a slower, more deliberate scan.",
 "scan.passes": "How many times the scan line sweeps (1-6).",
 "fill.duration_s": "Time for the QR to zoom to full screen; everything after shifts with it.",
 "fill.pop_s": "How long each filler module takes to pop in.",
 "lift.start_s": "When the lift wave starts (s after the fill).", "lift.spread_s": "How long the wave takes to travel from the centre to the edge.",
 "lift.duration_s": "How long one tile stays up.", "lift.height_cells": "Wave height in module sizes.", "lift.tilt": "How far tiles tip away from the centre.",
 "lift.print_fade_s": "How long the flat print look takes to turn into lit cubes.",
 "flight.recolour_from": "Share of the flight (0-1) when cubes start taking the unit's colours.", "flight.recolour_over": "Share of the flight the colour change takes.",
 "assembly.voxel_count": "Target cube count for the voxel unit (300-1500). Fewer = chunkier cubes.",
 "assembly.floor_ripple": "Ring through the floor when the base lands (true/false).", "assembly.ripple_speed_cells": "Ring speed in modules per second.", "assembly.ripple_height_cells": "Ring height in module sizes.",
 "resolve.style": "'shimmer' (light wave, flip, ring) or 'shrink' (plain).", "resolve.start_s": "When the real unit starts to appear.", "resolve.duration_s": "How long the wave takes to climb the unit.",
 "resolve.shimmer_color": "Colour of the light wave and ring.", "resolve.shimmer_band": "Thickness of the wave (share of the unit height).", "resolve.flip_deg": "How far each cube flips as it goes.",
 "resolve.sweep_ring": "Strength of the glowing ring (0 = none).", "resolve.lens_flash": "Strength of the lens flash as the wave passes the lights.", "resolve.push_in": "How far the camera pushes in during the resolve (0-0.2).",
 "morph_end_s": "When the morph phase ends and the hold starts.",
 "camera.tilt_start_s": "When the camera starts leaving top-down.", "camera.tilt_end_s": "When it reaches eye level.", "camera.tilt_curve": "Shape of the tilt (lower = leaves top-down sooner).",
 "camera.fov_portrait": "Lens angle on phones (degrees).", "camera.fov_wide": "Lens angle on landscape screens.", "camera.unit_height": "Share of screen height the unit fills at the end.",
 "camera.unit_height_boom_down": "Same, once the boom is down (smaller = more boom in shot).", "camera.lens_y": "Where the lens stack sits, from the top (0-1).", "camera.left_margin": "Gap from the left edge to the unit (share of width).",
 "camera.pitch_deg": "Downward look (0 = eye level, max 6).", "camera.glide_yaw_deg": "How far round the unit the glide starts (0 = no orbit).", "camera.glide_start_s": "When the glide back to square-on starts.",
 "camera.glide_s": "How long the glide takes.", "camera.glide_hold_s": "Pause after the glide before green.",
 "lights.green_s": "Green time.", "lights.amber_s": "Amber time.", "lights.red_hold_s": "Red before the boom moves.", "boom.lower_s": "Boom travel time.", "boom.leave_after_s": "Pause after the boom is down before DEST.",
}
def key_note(k):
    if k in KEY_NOTE: return KEY_NOTE[k]
    if k in key_notes.NOTES: return key_notes.NOTES[k]
    leaf = k.split(".")[-1]
    if ".colours." in k or (isinstance(ALLK.get(k), str) and str(ALLK.get(k)).startswith("#")): return f"Colour ({leaf.replace('_', ' ')})."
    if ".base." in k: return "Overrides the shared setting " + k.split(".base.", 1)[1] + " for this version only."
    if k.startswith("flight."):
        part = k.split(".")[1]; m = {"start_s": "when this part's first modules leave", "stagger_dist": "extra delay for modules further from the centre", "stagger_height": "extra delay for higher voxels (builds bottom-up)",
              "stagger_across": "spread of the head build across its width", "jitter_s": "random start variation", "duration_s": "flight time", "duration_jitter_s": "random flight-time variation", "arc": "height of the flight arc", "spin": "tumble during flight"}
        return f"{part}: {m.get(leaf, leaf)}."
    if leaf.endswith("_start_s"): return "When it starts (seconds after the QR fills the screen)."
    if leaf.endswith("_s"): return "Duration in seconds (larger = slower)."
    if leaf in ("count",): return "How many."
    return leaf.replace("_", " ") + "."
NODES_ALL = S.BUILD + S.RUNTIME
KEY_NODE = {}
for n in S.RUNTIME:
    for k in n.get("keys", []):
        if k not in ALLK: raise SystemExit(f"node {n['id']} lists unknown key {k}")
        KEY_NODE.setdefault(k, []).append(n["id"])
unassigned = [k for k in ALLK if k not in KEY_NODE]
if unassigned: raise SystemExit(f"keys not on any node: {unassigned}")
keys = {}
for k, v in ALLK.items():
    keys[k] = {"value": v, "editor_range": erange(k, v), "what": key_note(k), "nodes": KEY_NODE[k],
               "read_at": [{"file": f, "line": ln, "function": fn, "url": blob(f, ln)} for f, ln, fn in USES.get(k, [])]}
code_only = {k: [{"file": f, "line": ln, "function": fn, "url": blob(f, ln)} for f, ln, fn in v] for k, v in HIDDEN.items()
             if not (k.split(".")[0] in ("minions", "domino") and (k.split(".")[1] in CFG.get(k.split(".")[0] + "2", {})))}

# every symbol named in the spec must exist somewhere
for n in NODES_ALL:
    for e in n["impl"]:
        if e[0] in ("fn", "const"):
            files = [e[2]] if len(e) > 2 else sorted({m["file"] for m in S.VERSIONS.values()})
            if not any(resolve(e if len(e) > 2 else (e[0], e[1], f), f, strict=False) for f in files): raise SystemExit(f"{n['id']}: {e} not found in {files}")
# ---- versions
HIST = {"morph1": ["75150cb", "71610d7", "24c8696", "e3a1b12", "73141e7", "d87d9cc", "3709e8e", "0eca9f8", "d915c5a"], "morph2": ["fbf3605", "b55f87e"], "morph3": ["1eca1bb", "b55f87e"],
        "road": ["43c1729", "4180081"], "minions": ["d32c777", "ec3b577", "3d27f39"], "minions2": ["42ffb75", "91517b7"], "night": ["2281859"], "blueprint": ["4e7952a"], "rain": ["74ff5ac"],
        "domino": ["af85a3a"], "domino2": ["f299987"], "drone": ["ac84a01"]}
def commit_info(h):
    full, date, subj = git("show", "-s", "--format=%H|%aI|%s", h).split("|", 2)
    return {"commit": full[:7], "date": date, "subject": subj, "url": f"{GH}/commit/{full}"}
versions = {}
for v, meta in S.VERSIONS.items():
    vf = meta["file"]
    steps = []
    for nid in S.PATHS[v]:
        n = next(x for x in S.RUNTIME if x["id"] == nid)
        refs = []
        for e in n["impl"]:
            r = resolve(e, vf, strict=False)
            if r: refs.append(r)
        if not refs: raise SystemExit(f"{v}/{nid}: no code found")
        ks = [] if not meta["config"] else [k for k in n.get("keys", [])]
        steps.append({"node": nid, "code": refs, "keys": ks, "note": S.OVERRIDES.get((v, nid), "")})
    own_new = [f"{n}()" for n, x in FMAP[vf].items() if FILE_PARENT.get(vf) and n not in FMAP[FILE_PARENT[vf]]]
    own_chg = [f"{n}()" for n, x in FMAP[vf].items() if FILE_PARENT.get(vf) and n in FMAP[FILE_PARENT[vf]] and FMAP[FILE_PARENT[vf]][n]["sha"] != x["sha"]]
    versions[v] = {**meta, "path": S.PATHS[v], "steps": steps, "history": [commit_info(h) for h in HIST[v]], "live": PAGES + ("?v=" + v),
                   "file_url": f"{GH}/blob/{COMMIT}/{vf}", "file_lines": len(LINES[vf]), "parent_file": FILE_PARENT.get(vf),
                   "functions_new_vs_parent_file": own_new, "functions_changed_vs_parent_file": own_chg,
                   "config_sections": ([] if not meta["config"] else sorted({k.split(".")[0] for s in steps for k in s["keys"]}))}
# ---- nodes
nodes = []
for n in S.BUILD:
    nodes.append({"id": n["id"], "group": "build", "label": n["label"], "purpose": n["purpose"], "change": n["change"], "versions_note": n["versions"],
                  "code": [r for r in (resolve(e, "app3.js", strict=False) for e in n["impl"]) if r], "keys": [], "used_by": list(S.VERSIONS)})
for n in S.RUNTIME:
    used = [v for v, p in S.PATHS.items() if n["id"] in p]
    impl_by_version = {}
    for v in used:
        vf = S.VERSIONS[v]["file"]
        refs = [r for r in (resolve(e, vf, strict=False) for e in n["impl"]) if r]
        impl_by_version[v] = [{"symbol": r["symbol"], "file": r["file"], "start": r["start"], "end": r["end"], "url": r["url"], "status": r.get("status")} for r in refs if "start" in r]
    nodes.append({"id": n["id"], "group": "runtime", "label": n["label"], "purpose": n["purpose"], "change": n.get("change", []), "keys": n.get("keys", []),
                  "used_by": used, "code_by_version": impl_by_version,
                  "overrides": {v: S.OVERRIDES[(v, n["id"])] for v in used if S.OVERRIDES.get((v, n["id"]))}})
# ---- edges
edges = {}
B = [n["id"] for n in S.BUILD]
for a, b in zip(B, B[1:]): edges[(a, b)] = {"from": a, "to": b, "group": "build", "versions": list(S.VERSIONS)}
edges[(B[-1], "r_boot")] = {"from": B[-1], "to": "r_boot", "group": "handoff", "versions": list(S.VERSIONS)}
for v, p in S.PATHS.items():
    for a, b in zip(p, p[1:]):
        edges.setdefault((a, b), {"from": a, "to": b, "group": "runtime", "versions": []})["versions"].append(v)
recipe = {"title": "PORTABOOM QR morph recipe", "code_commit_date": git("show", "-s", "--format=%cI", COMMIT),
          "repo": GH, "pages": PAGES, "code_commit": COMMIT, "code_commit_short": SHORT,
          "how_to_read": "BUILD nodes are how the assets were made (once, off the phone). RUNTIME nodes are what plays on the phone, in order. Each version is a path through the shared RUNTIME nodes plus its own. Every code reference is a GitHub link pinned to the commit the line numbers were read from. Keys are paths in morph-config.json (morph3 and later only).",
          "lineage": {"app.js": "morph1 + morph2 (hard-coded)", **{k: f"copy of {v}" for k, v in FILE_PARENT.items()}},
          "versions": versions, "nodes": nodes, "edges": list(edges.values()), "keys": keys, "code_only_keys": code_only,
          "facts": {"morph-config.json leaf keys": len(ALLK), "keys traced to code": sum(1 for k in ALLK if USES.get(k)), "versions": len(S.VERSIONS)}}
json.dump(recipe, open(os.path.join(OUT, "recipe.json"), "w"), indent=1)

# ---- Mermaid per version
os.makedirs(os.path.join(OUT, "graphs"), exist_ok=True)
LBL = {n["id"]: n["label"] for n in NODES_ALL}
SHARED = set(S.PATHS["morph3"])
def mmd(v):
    p = S.PATHS[v]
    out = ["---", f"title: PORTABOOM QR {v} ({S.VERSIONS[v]['file']})", "---", "flowchart TD"]
    for nid in p:
        lab = LBL[nid].replace('"', "'")
        shape = f'{nid}["{lab}"]' if nid in SHARED else f'{nid}(["{lab}"])'
        out.append("  " + shape)
    out.append("  __start__((start)) --> " + p[0])
    for a, b in zip(p, p[1:]): out.append(f"  {a} --> {b}")
    out.append(f"  {p[-1]} --> __end__((DEST))")
    own = [n for n in p if n not in SHARED]
    if own: out.append("  classDef own fill:#FFE2C2,stroke:#EE7202,color:#1B2A4A"); out.append("  class " + ",".join(own) + " own")
    out.append("  classDef default fill:#EEF2FA,stroke:#1B2A4A,color:#1B2A4A")
    return "\n".join(out) + "\n"
for v in S.VERSIONS: open(os.path.join(OUT, "graphs", f"{v}.mmd"), "w").write(mmd(v))
bm = ["flowchart LR"] + [f'  {n["id"]}["{n["label"]}"]' for n in S.BUILD] + [f"  {a} --> {b}" for a, b in zip(B, B[1:])]
open(os.path.join(OUT, "graphs", "build.mmd"), "w").write("\n".join(bm) + "\n")

# ---- RECIPE.md
md = [f"# PORTABOOM QR: how each version is made",
      "",
      f"Generated from the code at commit [`{SHORT}`]({GH}/commit/{COMMIT}) by `workflow/tools/build_recipe.py`. Every file and line below was read from that commit; re-run the script after a code change and the numbers update themselves.",
      f"Interactive map: {PAGES}workflow/  |  Machine-readable: `workflow/recipe.json`.",
      "",
      "## Read this first",
      "",
      "- **One file per version.** Each `?v=` loads its own app file, and each file is a full copy of its parent plus its own code (lineage below). A fix in `app3.js` does not reach `app-road.js` or the others; make it in every file listed for that step.",
      "- **Settings.** morph3 and every later version read `morph-config.json` (edit it in `editor.html`). **morph1 and morph2 (the site root, what the printed QR opens) ignore it:** their numbers are constants in `app.js`.",
      "- **The printed QR is the same for all versions.** It encodes `?v=morph2`; every version draws that same code on frame 0. `?v=` only picks the animation.",
      "- **Shared settings, version on top.** road, minions2, domino2, night, blueprint, rain and drone read their own section; minions2 sits on top of minions, domino2 on top of domino, drone uses road for its traffic and light cycle, and blueprint/rain carry a `base` block that overrides shared timings for that version only.",
      "",
      "Lineage: " + "; ".join(f"`{k}` = {v}" for k, v in recipe["lineage"].items()),
      "",
      "## The build (done once, off the phone)",
      ""]
for i, n in enumerate(nodes[:len(S.BUILD)], 1):
    md.append(f"{i}. **{n['label']}.** {n['purpose']}")
    for r in n["code"]:
        md.append(f"   - " + (f"[`{r['file']}:{r['start']}-{r['end']}`]({r['url']}) {r['symbol']}" if "url" in r else f"{r['kind']}: `{r['symbol']}` ({r['what']})"))
    for c in n["change"]: md.append(f"   - To change: {c}")
md += ["", "## The shared spine (what every version has)", "",
       "Boot (pick version, load settings) -> frame 0 (still, canvas takes over) -> hold -> scan with finder lock and buzz -> [morph3+: QR fills the screen] -> the version's own build of the unit -> camera to eye level -> green, amber, red -> boom down -> DEST. The middle is where versions differ.", ""]
for v, vd in versions.items():
    md += [f"## {vd['label']}", "", f"Live: {vd['live']}  |  File: [`{vd['file']}`]({vd['file_url']}) ({vd['file_lines']} lines" + (f", copy of `{vd['parent_file']}`" if vd['parent_file'] else "") + f")  |  Fallback video: `{vd['video']}`  |  Settings: " + ("`morph-config.json` sections " + ", ".join(f"`{s}`" for s in vd["config_sections"]) if vd["config"] else "none (constants in app.js)"), "", vd["summary"], ""]
    ref_steps = {st["node"]: i for i, st in enumerate(versions["morph3"]["steps"], 1)}
    full = v in ("morph1", "morph2", "morph3")
    def coderefs(st):
        by = {}
        for r in st["code"]:
            if "url" in r: by.setdefault(r["file"], []).append(f"[`{r['symbol']}` {r['start']}" + (f"-{r['end']}" if r['end'] != r['start'] else "") + f"]({r['url']})")
        return "; ".join(f"{f}: " + ", ".join(x) for f, x in by.items())
    for i, s in enumerate(vd["steps"], 1):
        n = next(x for x in S.RUNTIME if x["id"] == s["node"])
        shared = s["node"] in SHARED
        if shared and not full:
            md.append(f"{i}. **{n['label']}** - as morph3 step {ref_steps[s['node']]}" + (f". **In {v}:** {s['note']}" if s["note"] else " (same settings keys).") )
            md.append("   - Code in this version: " + coderefs(s))
            continue
        own = "" if shared else " *(this version's own step)*"
        md.append(f"{i}. **{n['label']}**{own}. {n['purpose']}" + (f" **In {v}:** {s['note']}" if s["note"] else ""))
        md.append("   - Code: " + coderefs(s))
        if s["keys"]:
            md.append("   - Settings (`morph-config.json`): " + "; ".join(f"`{k}` = {json.dumps(ALLK[k])} ({keys[k]['what'].rstrip('.')})" for k in s["keys"]))
        elif not vd["config"]:
            md.append("   - To change it: edit the constants/functions linked above in `app.js` (no settings file for this version).")
        for c in n.get("change", []):
            if vd["config"] or "constants" in c: md.append(f"   - To change: {c}")
    md.append("")
    md.append("History: " + "; ".join(f"[{h['commit']}]({h['url']}) {h['date'][:16].replace('T', ' ')} {h['subject'][:90]}" for h in vd["history"]))
    md.append("")
md += ["## Settings that exist in code but not yet in morph-config.json", "", "Add them to the version's section to use them:", ""]
for k, refs in code_only.items(): md.append(f"- `{k}`: read at " + ", ".join(f"[{r['file']}:{r['line']}]({r['url']})" for r in refs[:2]))
md += ["", f"_{len(ALLK)} settings in morph-config.json; {sum(1 for k in ALLK if USES.get(k))} traced to the exact code line that reads them (see recipe.json `keys[...].read_at`)._", ""]
open(os.path.join(OUT, "RECIPE.md"), "w").write("\n".join(md))
import shutil; shutil.rmtree(TMP)
print("ok", COMMIT[:7], len(nodes), "nodes", len(edges), "edges", len(ALLK), "keys", "code-only", list(code_only))
