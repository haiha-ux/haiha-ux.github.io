---
title: "3D-printed enclosure for the ESP32-S3 e-paper board"
summary: "A two-part FDM case, base and lid, for my e-paper board. It is parametric in build123d, takes every position from the KiCad files, and a script checks the fit against the exported board, with A3 drawings and a sliced print."
domain: cad
repo: pcb-enclosure-esp32s3
metrics:
  - { label: "Case", value: "87.58 x 96.54 mm, thinnest wall 1.665 mm", hero: "87.58 x 96.54 mm" }
  - { label: "Interference", value: "0 mm3 between every pair of parts, 412 board solids included" }
  - { label: "USB-C plug", value: "overmold 6.30 mm from the mating datum, limit 6.5 mm" }
demo: { kind: pcb3d, props: { src: "/projects/pcb-enclosure-esp32s3/enclosure.glb", fallback: "/projects/pcb-enclosure-esp32s3/fallback.webp", title: "Enclosure around the ESP32-S3 e-paper board", caption: "Base, board and lid, with the lid lifted 22 mm so the board shows." } }
star: { planet: saturn }
year: 2026
featured: true
order: 7
---
## What didn't work

Nothing has been printed or assembled. Every fit statement is a CAD check against the exported board, not a part in my hand.

The e-paper panel has to lie across the right half of the board, so it covers part of the ESP32 antenna. Espressif asks for 15 mm of clearance and this case cannot give it. I have not measured range, so compare RSSI with the case open and closed before trusting the radio. The same panel position hides the BOOT button, which is a layout problem on the [board](/projects/pcb-esp32s3-epaper/), not something the case can fix.
