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
