---
title: "Two-channel phantom-powered mic preamp"
summary: "A two-channel microphone preamp around the TI INA163 in KiCad 10, checked against the datasheet, with hand-routed inputs on a 100 x 78 mm two-layer board and fab files."
domain: pcb
repo: pcb-sample-preamp
metrics:
  - { label: "Gain", value: "40.0 dB, G = 100.3" }
  - { label: "ERC", value: "0 errors, 0 warnings" }
  - { label: "DRC", value: "0 errors, 4 waived silkscreen warnings" }
demo: { kind: pcb3d, props: { src: "/projects/pcb-sample-preamp/board.glb", fallback: "/projects/pcb-sample-preamp/fallback.png", title: "Sample preamp board" } }
star: { planet: neptune }
year: 2026
featured: false
order: 17
---
## What didn't work

Version 1 had the wrong input network because I read only the extracted text of a datasheet page and not its figure. Version 2 fixes it. Gain is fixed at 40 dB, although the brief said one resistor should set it.
