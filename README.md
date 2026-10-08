# PORTABOOM QR

Scan the flat PORTABOOM QR code with a phone camera. The page opens on the same flat QR, the modules rise into a 3D field, the PORTABOOM PB4000 rises out of the logo box, the signal runs green, amber, red, the boom comes down, and the page opens the PB4000 product page.

- Live: https://tas-fdnxt.github.io/portaboom-qr/?v=morph1
- QR still: `portaboom-morph-qr.png` (print / send) and `portaboom-morph-qr.svg` (vector). Both encode the live link above.
- Leave destination: set in `dest-config.mjs`. Default is the Traffic Access PB4000 page. Add `&dest=<URL-encoded https link>` to the page link to send people somewhere else.
- The bare site root runs the same sequence.

Files: `index.html` (loader), `app.js` (scene and timeline), `living-qr.js` (QR field), `qr-url.js` + `qr-vendor.js` (QR encoder, MIT, qrcode-generator by Kazuhiko Arase), `qr-encode.js`, `dest-config.mjs`, `pb4000_named.glb` (PB4000 model), logo images.

PORTABOOM is a registered trade mark. QR Code is a registered trade mark of DENSO WAVE INCORPORATED.
