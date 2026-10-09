# PORTABOOM QR

Scan the PORTABOOM QR code with a phone camera. The code shows the PORTABOOM PB4000 lying on its back, drawn in QR modules: the signal housing with its red, amber and green lenses, the orange cabinet, the wheels and legs, and the red and white boom with its STOP disc. The page opens on that exact picture. After a short scan the modules themselves lift off in a wave, fly together and build a 3D module PORTABOOM while the camera rises to eye level; the real PB4000 model resolves inside it and the rest of the code settles as the floor. The signal runs green, amber, red, the boom comes down, and the page opens the PB4000 product page.

- Live: https://tas-fdnxt.github.io/portaboom-qr/?v=morph2 (the bare site root runs the same sequence).
- QR still: `portaboom-morph2-qr.png` (print / send) and `portaboom-morph2-qr.svg` (vector modules). Both encode the live link above (QR version 13, error correction H). The drawing comes from a top-down render of the PB4000 model, quantised to the module grid.
- Leave destination: set in `dest-config.mjs`. Default is the Traffic Access PB4000 page. Add `&dest=<URL-encoded https link>` to the page link to send people somewhere else.
- Earlier version (photo of the unit inside the QR, the unit hinges up to standing): https://tas-fdnxt.github.io/portaboom-qr/?v=morph1, still `portaboom-morph-qr.png` / `.svg`.

Files: `index.html` (loader), `app.js` (scene and timeline), `morph2-art.js` + `morph2-art-grid.js` (the module drawing of the unit), `living-qr.js` (QR field), `qr-url.js` + `qr-vendor.js` (QR encoder, MIT, qrcode-generator by Kazuhiko Arase), `morph-mask.js` (QR cells under the lying unit), `qr-encode.js`, `dest-config.mjs`, `pb4000_named.glb` (PB4000 model), `morph2.mp4` / `morph1.mp4` (fallback videos when 3D is unavailable), logo images.

PORTABOOM is a registered trade mark. QR Code is a registered trade mark of DENSO WAVE INCORPORATED.

Alternative cut for comparison: https://tas-fdnxt.github.io/portaboom-qr/?v=morph3 starts from the same QR and scan, grows the code to fill the screen, builds the unit with a light wave that turns the blocks into the real PB4000, and frames the whole unit with more of the boom in shot after a slow camera glide (`app3.js`, fallback video `morph3.mp4`). Its timings, camera and colours are in `morph-config.json`; edit them in https://tas-fdnxt.github.io/portaboom-qr/editor.html (see `EDITING.md`).

Starting: the page starts by itself. Once the 3D scene has drawn the QR it holds the code for a moment (0.8 s), runs the double scan sweep and carries on into the morph, so nobody has to press anything. For testing, add `&test=1` (or `?test=1`) to the link: a "Tap to scan" button appears under the code and the page waits for a tap. `autoplay=1` is accepted and behaves like the default. If 3D is not available the recorded video plays in the same place, muted, by itself.

Domino cut: https://tas-fdnxt.github.io/portaboom-qr/?v=domino starts from the same QR, scan and full-screen code; the modules topple like dominoes from the corners to the middle, the fallen modules along an aisle flip up as little PORTABOOMs in straight rows either side, the camera comes down into the aisle and travels along it while each row raises its booms, the big unit assembles at the end of the aisle, and its boom drop ripples down the rows (`app-domino.js`, fallback video `domino.mp4`, settings in the `domino` section of `morph-config.json`).
