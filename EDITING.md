# Editing the PORTABOOM QR sequence

All the timings, camera moves and colours of the morph3 version live in one file, `morph-config.json`. The page reads it every time it opens, so a change to that file is live as soon as it is committed. There is no build step.

## 1. Open the editor

Open https://tas-fdnxt.github.io/portaboom-qr/editor.html on a laptop (it also works on a tablet).

- Left: a live phone preview of the sequence.
- Right: every setting, grouped (Scan, QR fills the screen, Lift wave, Flight, Assembly, Blocks to real unit, Camera, Light cycle, Boom, Colours, DEST link).
- Under the preview: Play / Pause, Replay, the timeline with a label for each step (Scan, QR fills, Lift, Flight, Assembly, Resolve, Glide, Green, Amber, Red, Boom down, DEST), Reset, Copy JSON, Download.

## 2. Change values

- Drag a slider, type a number, or pick a colour. When you let go, the preview reloads and jumps back to about where you were.
- Click a step label (for example "Resolve") to jump straight to that moment, paused. Press Play to continue.
- Drag the timeline to any time; the preview jumps there and pauses.
- Your edits are kept in this browser while you work, so closing the tab does not lose them.
- Reset puts every value back to the published file.

Useful settings:

- Scan: `auto_start_delay_s` (how long the QR holds still before the scan starts by itself, 0.8 s by default), `duration_s` (how long the scan runs) and `passes` (how many times the line sweeps).
- QR fills the screen: how long the code takes to grow to full screen.
- Flight: start time, stagger, duration, arc and spin for the boom, the light head and the body.
- Blocks to real unit: `style` (`shimmer` is the light wave, `shrink` is the plain version), start, duration, colour and width of the wave, cube flip angle, glowing ring strength, lens flash strength, camera push-in.
- Camera: framing at the end (`unit_height` is the share of the screen height the unit fills, `unit_height_boom_down` the slightly wider frame once the boom is down, `lens_y` where the lights sit, `left_margin`), `pitch_deg` (0 = eye level), and the glide round the unit (`glide_yaw_deg`, `glide_start_s`, `glide_s`).
- Light cycle and Boom: green, amber and red times, how long the boom takes to come down, and the pause before the page opens the DEST link.
- DEST link: the web page that opens at the end.
- Minions (only used by ?v=minions; pick "minions" in the editor's Version menu): `count` (how many little PORTABOOMs, 30 to 80), `spacing_cells` (how far apart they pop up, in QR squares), `size` (their height as a share of the big unit), `pop_start_s`, `pop_spread_s` and `pop_s` (when they start popping up, how long the wave takes and how long one pop takes), `stand_up_s` and `stand_up_spread_s` (when they get up off their backs), `bob` and `bob_hz` (how high and how fast they bob), `cycle_s` (each one's own green, amber, red and boom cycle), `arm_length`, `duck_s` (when the ones between the camera and the big unit duck away), `line_up_s` and `line_up_duration_s` (when they fall into rows behind the big unit), and `rows`, `row_gap`, `col_gap` for the rows.
- Domino (only used by ?v=domino; pick "domino" in the editor's Version menu): `delay_s` (how much later than morph3 the big unit's modules fly, so the dominoes and the camera go first), `topple_start_s`, `topple_spread_s` and `topple_s` (when the QR starts toppling, how long the wave takes from the corners to the middle, and how long one module takes to fall), `overshoot` (the little bounce as a module lands), `size` (the little PORTABOOMs' height as a share of the big unit), `aisle_width`, `lines_per_side`, `line_gap`, `row_gap`, `first_row` and `max_rows` (the guard of honour: aisle width, how many lines each side and how far apart, in big-unit heights), `stand_delay_s` and `flip_s` (when a fallen module flips up and how long it takes), `swoop_start_s`, `swoop_s`, `dolly_s`, `dolly_start`, `camera_height`, `look_height` (the camera coming down into the aisle and travelling along it), `salute_lead` and `salute_s` (how far ahead of the camera the rows raise their booms and how fast), `ripple_s` (how long the big unit's lights and boom drop take to ripple down the rows) and `hero_clear` (the space kept clear round the big unit in the end shot).
- Night (only used by ?v=night; pick "night" in the editor's Version menu): `fade_s` (how long the fade to night takes), `city_glow` (soft glow over the QR lights), `light_min`, `bright_share` and `dark_share` (how dim the dimmest lights are, how many are bright and how many windows stay dark), `cube_glow` and `cube_brighten` (glow round the flying cubes), `road_start_s`, `road_s`, `road_radius` and `road_roughness` (when the wet road appears, how fast, how big and how glossy), `wash` and `wash_range` (how strongly the lit lens colours the road and unit), `sky_wash`, `haze_near` and `haze_far`, `flasher_light` and `flasher_range` (the two cabinet flashers), `streaks` and `streak_length` (the light streaks on the wet road), `scene_light` (how much daylight is left), and the night colours.
- Drone (only used by ?v=drone; pick "drone" in the editor's Version menu; the light cycle, boom and traffic come from the `road` section): `delay_s` (how much later than morph3 the big unit's modules fly), `pull_start_s` and `pull_s` (the camera rising from the full-screen QR to the drone view), `height`, `fov`, `centre_x` and `centre_z` (how high the drone hovers as a multiple of the full-screen view, its lens, and where it looks, in metres from the big unit), `transform_start_s`, `transform_s`, `tile_flip_s` and `random` (when the QR starts turning into the worksite, how long that takes, how long one tile flips, and how much the far-to-near order is shuffled), `swoop_start_s` and `swoop_s` (when the long swoop down to eye level starts and how long it takes), `swoop_side`, `swoop_back` and `bank_deg` (how far the curve swings out to the side and back, and how much the camera banks).
- Blueprint (only used by ?v=blueprint; pick "blueprint" in the editor's Version menu): `invert_start_s` and `invert_s` (when and how fast the QR turns into blue paper), `paper_alpha` (how much of the QR shows through the paper), `label_size` (size of the writing on the sheet), `draw_start_s` and `draw_s` (when the drawing sketches itself), `lift_start_s`, `lift_s` and `lift_height_cells` (when the wireframe lifts off the paper and stands up, and how high it floats), `wire_glow`, `fill_cabinet_s`, `fill_head_s`, `fill_lenses_s`, `fill_boom_s`, `fill_wheels_s` and `fill_part_s` (when each part of the real unit scans in, and how long each takes), `scan_glow` (the scan ring), `flash` (how much a freshly filled part glows), `wire_fade_start_s`, `wire_fade_s` and `wire_fill_fade` (when the wireframe goes), `ink_fade_start_s` and `ink_fade_s` (when the drawings fade off the paper), and the blueprint colours. The measurements on the sheet are read from the 3D model, not typed in. `base` holds this version's own changes to the shared timing.

The page starts on its own (no button), and so does the preview. To get the old "Tap to scan" button for testing, add `&test=1` to the page link, for example https://tas-fdnxt.github.io/portaboom-qr/?v=morph3&test=1.

## 3. Export

- Download saves a file called `morph-config.json`, or Copy JSON puts the same text on the clipboard.
- "Use in this browser" plays your settings on the normal page in this browser only (handy for checking on your own phone browser). "Clear browser" removes that.

## 4. Publish

1. Go to the repository on GitHub: https://github.com/tas-fdnxt/portaboom-qr
2. Open `morph-config.json`, click the pencil (Edit), select all, paste your copied settings (or use "Add file > Upload files" and upload the downloaded file).
3. Commit the change to `main`.
4. GitHub Pages republishes in a minute or two. Open https://tas-fdnxt.github.io/portaboom-qr/?v=morph3 to see it.

To try a settings file without publishing it, add `&config=<link to a JSON file>` to the page link.

If the file has a mistake (for example a missing comma), the page ignores it and plays the built-in settings, so the live page never breaks. Check the file with the editor's Copy JSON or any JSON checker before committing.

The morph2 page and the main link are not affected by this file.
