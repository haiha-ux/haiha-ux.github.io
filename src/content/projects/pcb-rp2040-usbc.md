---
title: "RP2040 USB-C board, 4 layers"
summary: "A small RP2040 board in KiCad 10 for the JLCPCB 4-layer stackup, with fabrication and assembly files and a 2x2 panel. It has a USB-C port, 16 MB flash, a 3.3 V LDO and two 1x20 headers."
domain: pcb
repo: pcb-rp2040-usbc
metrics:
  - { label: "Board", value: "30 x 58 mm, 4 layers" }
  - { label: "USB pair, 90 ohm", value: "0.27 mm wide, 0.15 mm gap" }
  - { label: "ERC and DRC", value: "0 errors, 54 nets checked pin by pin" }
demo: { kind: pcb3d, props: { src: "/projects/pcb-rp2040-usbc/board.glb", fallback: "/projects/pcb-rp2040-usbc/fallback.png", title: "RP2040 USB-C board" } }
star: { planet: neptune }
year: 2026
featured: false
order: 15
---
## What didn't work

The board has not been manufactured or tested. The 90 ohm figure comes from closed-form formulas, good to about 10%, and I did not run a field solver.
