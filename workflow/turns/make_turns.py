import json
R="https://github.com/tas-fdnxt/portaboom-qr/commit/"
T=[]

V="PORTABOOM_QR/01_versions/"
MOVES=[("04_minions/minions2",V+"05_minions2/minions2"),("04_minions/minions.mp4 (6.2 MB checkpoint, superseded)","PORTABOOM_QR/90_archive/minions_checkpoint (deleted after approval)"),
 ("04_minions/",V+"04_minions/"),("05_road/road.mp4 (v1, superseded)","PORTABOOM_QR/90_archive/road_v1/road.mp4"),("05_road/road-contact-sheet.png (v1)","PORTABOOM_QR/90_archive/road_v1/road-contact-sheet.png"),
 ("05_road/",V+"06_road/"),("08_domino/domino2",V+"09_domino2/domino2"),("08_domino/",V+"08_domino/"),("09_blueprint/",V+"10_blueprint/"),("10_drone/",V+"12_drone/"),
 ("11_rain/",V+"11_rain/"),("07_night/",V+"07_night/"),("01_morph1/",V+"01_morph1/"),("02_morph2_main/",V+"02_morph2_main/"),("03_morph3/",V+"03_morph3/"),
 ("00_QR_codes/","PORTABOOM_QR/00_QR_codes/"),("06_worksite_sim/","PORTABOOM_QR/04_worksite_sim/"),("06_workflow/SUPERSEDED - *.png (9)","(9 superseded graph PNGs, deleted after approval)"),("06_workflow/","PORTABOOM_QR/02_workflow/"),
 ("PORTABOOM_QR/ (folder)","PORTABOOM_QR/"),("PORTABOOM QR - Index (doc, now stale)","PORTABOOM_QR/00_INDEX (rewritten)"),("My Drive/PORTABOOM_QR_morph_2026-10-08.mp4 (22:41)","My Drive root morph1 copy (22:41; deleted later as a duplicate)")]
def mv(p):
    for a,b in MOVES:
        if p.startswith(a): return b+p[len(a):]
    return p
def t(id,when,track,parent,ask,change,commits=(),drive=(),box=(),outcome="delivered",kind="build"):
    T.append(dict(id=id,when_aedt=when,track=track,parent=parent,kind=kind,ask=ask,change=change,
      commits=[{"sha":c,"url":R+c} for c in commits],
      drive=[mv(d) for d in drive],outcome=outcome))
t("T00","2026-09-06..09-08","A0",None,"(earlier) Incredible QR / living QR doors for the PB4000",
  "Predecessor project (private repo, now archived): living1-10 ICQR doors, MOTION previews, Magic Tree send-still. Source of the GLB, STOP/stripe fixes and QR tooling.",
  [],outcome="superseded (archived)",kind="predecessor")
t("T01","2026-10-08 14:54","A","T00","Diagnose PORTABOOM Incredible QR (Pages 404 + local bake); scan a static QR -> flat unit hinges upright, eye level, green/amber/red, boom drops, go to URL",
  "New public tip-only repo portaboom-qr (morph1) published on GitHub Pages",["75150cb"],outcome="delivered")
t("T02","2026-10-08 14:57","A","T01","Show something instantly on scan","QR still shows instantly while WebGL loads, then hands over to the flat frame",["71610d7"],outcome="fixed")
t("T03","2026-10-08 15:33","A","T02","Unit lying flat inside the QR, traffic-light lenses up, hinge gradually upright",
  "Unit starts on its back, lenses up, hinges upright over 3.2 s while the field rises",["24c8696"],outcome="fixed")
t("T04","2026-10-08 16:17","A","T03","No logo on the QR; large lying unit (25-30%); Tap to scan below the QR",
  "Still = PB4000 lying on the QR, tap-to-scan sweep + haptics, eye-level finish",["e3a1b12"],outcome="fixed")
t("T05","2026-10-08 16:54","A","T04","Camera ends at lens height, ~0 deg pitch, lenses head-on (<10 deg); no white glint",
  "Centred eye-level finish on tile floor with sky/horizon; no one-frame flash; contact shadow follows footprint",["73141e7","d87d9cc","3709e8e"],outcome="fixed")
t("T06","2026-10-08 20:02","A","T05","Shift unit left so 70%+ of the lowered boom shows (4-6% margin); keep STOP visible",
  "Horizontal lens shift slides the unit left",["0eca9f8"],drive=["My Drive/PORTABOOM_QR_morph_2026-10-08.mp4 (22:41)"],outcome="approved for morph1")
t("T07","2026-10-09 15:31","A","T06","No website screenshot at the end; one clean surface",
  "Remove still once canvas draws QR, scan after hand-over, inline video fallback, cache-busted assets",["d915c5a"],drive=["01_morph1/morph1.mp4","01_morph1/morph1-contact-sheet.png"],outcome="fixed")
t("T08","2026-10-09 20:04","A","T07","'True morph': pure QR with PORTABOOM drawn in module style; squares lift, fly, rearrange into a voxel PORTABOOM, resolve into the real GLB; longer scan",
  "morph2: GLB-derived v13 QR art, modules fly/assemble, resolve to real model, boom cycle. Root now runs morph2; morph1 kept at ?v=morph1",["fbf3605"],
  drive=["00_QR_codes/portaboom-morph2-qr.png/.svg (main printable QR)","02_morph2_main/*"],outcome="approved: root/printed QR")
t("T09","2026-10-09 21:53","A","T08","Bigger centred unit (60-70% vh, lens stack 35-42% from top), QR fills screen, no cream gap; human-editable workflow (one config + editor + EDITING.md)",
  "morph3 cut (?v=morph3) + morph-config.json + editor.html + EDITING.md",["1eca1bb"],drive=["03_morph3/*","00_QR_codes/morph3-plain-qr.png"],outcome="delivered")
t("T10","2026-10-09 22:31","A","T09","Auto-start for real users after a brief hold; Tap to scan only with ?test=1",
  "0.8 s hold then auto scan+morph; ?test=1 restores button; autoplay=1 alias; scan.auto_start_delay_s",["b55f87e"],outcome="approved")
t("T11","2026-10-09 23:06","A","T10","'I don't want you saving anything on your computer' - deliverables to Drive/GitHub; recover Worksite Simulator for mobile",
  "Drive PORTABOOM_QR tree (00-06) + Index doc; recovered Worksite Simulator build kept in a private repo (built output only); worksite findings doc",[],
  drive=["PORTABOOM_QR/ (folder)","PORTABOOM QR - Index (doc, now stale)","06_worksite_sim/*"],outcome="delivered; mobile rebuild waiting on M5 source",kind="ops")
t("T12","2026-10-09 23:21","A","T10","Worksite road scene behind the morph (?v=road): road, kerbs, cones, signs, 3-5 queued cars, 2-3 hi-vis controllers",
  "road mode: procedural worksite built outward from the unit; road section in config/editor; road.mp4",["43c1729"],drive=["05_road/road.mp4 (v1, superseded)","05_road/road-contact-sheet.png (v1)"],outcome="REJECTED: cars going the wrong way")
t("T13","2026-10-10 00:51","A","T10","?v=minions: after QR fills screen, many little PORTABOOMs pop up, cycle lights, raise/lower booms; hero forms among them",
  "minions checkpoint -> video -> crowd pops out of dark modules, ducks camera, lines up behind hero",["d32c777","ec3b577","3d27f39"],
  drive=["04_minions/minions.mp4 (9.5 MB current)","04_minions/minions.mp4 (6.2 MB checkpoint, superseded)","04_minions/minions-contact-sheet.png x2"],outcome="delivered")
t("T14","2026-10-10 01:38","A","T13","minions2: fill the entire visible floor horizon to front, small clear zone around hero",
  "220 minis cover the floor in a wave from the hero",["42ffb75"],outcome="needed fix (minis overlapped hero wheels)")
t("T15","2026-10-10 01:49","A","T12","'You've got the cars going the wrong way' - approach from camera side, queue at lowered boom, drive away past unit on green",
  "road v2: traffic from camera side, stop line, boom down-wait-rise, new road.mp4",["4180081"],drive=["05_road/road-v2.mp4","05_road/road-v2-contact-sheet.png"],outcome="fixed")
t("T16","2026-10-10 01:54","A","T14","Keep the whole hero clear of foreground minis",
  "minions2 clear zone (head, cabinet, wheels, legs); minions2.mp4",["91517b7"],drive=["04_minions/minions2.mp4","04_minions/minions2-contact-sheet.png"],outcome="fixed")
t("T17","2026-10-10 ~02:10","A","T10","Approve five new versions: Night, Domino, Blueprint, Rain, Drone (built one at a time by two executors)",
  "Fork into two build lanes (lane 1: night/blueprint/rain; lane 2: domino/drone/domino2)",[],outcome="approved",kind="fork")
t("T18","2026-10-10 02:53","A","T17","Domino: modules topple like dominoes and flip up as an aisle of little PORTABOOMs",
  "?v=domino",["af85a3a"],drive=["08_domino/domino.mp4","08_domino/domino-contact-sheet.png"])
t("T19","2026-10-10 03:01","A","T17","Night: glowing modules, wet road, light cycle washes the scene","?v=night",["2281859"],drive=["07_night/*"])
t("T20","2026-10-10 03:17","A","T17","Drone: top-down worksite reveal tile by tile, bezier swoop to eye level","?v=drone (drone-scene.js copy of road-scene.js)",["ac84a01"],drive=["10_drone/*"])
t("T21","2026-10-10 03:30","A","T17","Blueprint: QR inverts to blueprint sheet, wireframe stands up, unit scans in part by part","?v=blueprint (+ blueprint-edges.bin)",["4e7952a"],drive=["09_blueprint/*"])
t("T22","2026-10-10 03:33","A","T18","domino2: domino topple but the crowd covers the whole floor like minions2","?v=domino2",["f299987"],drive=["08_domino/domino2.mp4","08_domino/domino2-contact-sheet.png"])
t("T23","2026-10-10 03:34","A","T17","Rain: cubes rain down on ballistic paths and stack, dust puff on boom drop","?v=rain",["74ff5ac"],drive=["11_rain/*"])
t("T24","2026-10-10 ~04:00","A","T23","Look at what the Learning bot is doing (LangGraph + React Flow console)",
  "Read-only study of the Learning bot's LangGraph pipeline and console; proposed the QR build-as-graph pattern",[],outcome="research only",kind="research")
t("T25","2026-10-10 04:38","A","T24","'I want to know exactly what you did to create them... as a workflow, so I know exactly what areas change the code and the end product'",
  "workflow/: recipe.json (287 config keys traced), RECIPE.md, React Flow recipe viewer, LangGraph StateGraph per version, graph PNGs",["5b4c5ad","6058568","b02b4d1","5e3b31d","3815da9","efc75fd"],
  drive=["06_workflow/PORTABOOM QR recipe (doc)","06_workflow/graph_*.png (13 current)","06_workflow/SUPERSEDED - *.png (9)","Drive bin: 3 old graph PNGs trashed without asking"],outcome="delivered; trash slip owned")
t("T26","2026-10-10 ~05:00-10:00","B","T25","Run through headline steps with flowcharts; thoughts on building this into a paid prompt-driven app",
  "8 headline steps with mermaid charts; product shape (prompt->settings, customer model, pricing); pre-reqs (single engine, sliders, safe model loading)",[],outcome="agreed: product plan to follow",kind="fork")
t("T27","2026-10-10 10:35","B","T26","Open-source repos can make a 3D model from a photo or photos so we control it",
  "Photo-to-3D research: TRELLIS.2, Step1X-3D, TripoSR, Meshroom, Hunyuan3D licences/costs",[],drive=["QR_PRODUCT/01_research/photo to 3D research (doc)"],outcome="delivered",kind="research")
t("T28","2026-10-10 ~11:00","B","T27","Use my photo; don't cheat; TRELLIS.2, Step1X-3D, TripoSR (not Meshroom yet); give me a plan",
  "8-step test plan from Fabian's single photo",[],outcome="plan given",kind="plan")
t("T29","2026-10-10 ~11:20","B","T28","'Go and check before you start so you can categorically tell me it will work'",
  "Preflight: TripoSR HF space live; TRELLIS.2 on fal live ($0.30); Step1X-3D not hosted anywhere; standing rule saved",[],outcome="Step1X-3D parked",kind="preflight")
t("T30","2026-10-10 12:05","B","T29","Gave the fal key - run it",
  "TRELLIS.2 x3 (fal) + TripoSR (HF Space after fal endpoint missing); normalise, render, scorecard (TRELLIS 32/45, TripoSR 11/45), cost US$0.95; phone viewer",[],
  drive=["QR_PRODUCT/02_photo_to_3d_test/* (scorecard doc, GLBs x8, renders, prep)"],outcome="delivered; correction owned (TripoSR fell back to public HF page)")
t("T31","2026-10-10 ~12:40","B","T30","Width too wide; must add real logos so it isn't AI slop - what improvement loop?",
  "Refinement loop design: generate -> fix proportions to real dims -> split parts -> clean -> apply real artwork -> check vs photo -> loop -> shrink -> approve",[],outcome="design only; needs PB4000 dims + vector logo/STOP",kind="design")
t("T32","2026-10-10 14:20","A+B","T31","Build a LangGraph of every key turn; organise files: PORTABOOM QR vs QR-as-a-product; clean up",
  "Inventory, proposed structure and this turn graph; approved and executed: private tools and product repos, Drive split into PORTABOOM_QR and QR_PRODUCT, test viewer removed from public history",[],drive=["PORTABOOM_QR/02_workflow/turn_graph","QR_PRODUCT/"],outcome="approved and executed",kind="ops")
json.dump({"title":"PORTABOOM QR - key turns (2026-10-08 to 2026-10-10, AEDT)","fork":{"node":"T26","from":"T25","note":"QR-as-a-product branch spins off after the recipe viewer"},"turns":T},open("turns.json","w"),indent=1)
print(len(T))
