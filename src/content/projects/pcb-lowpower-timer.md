---
title: "2xAA timer board with a soft-latch power button"
summary: "A 50 x 40 mm two-layer KiCad 10 board that runs from two AA cells. One button turns it on, the firmware holds power through a pin and turns itself off on a long press, and a leakage budget covers every part."
domain: pcb
repo: pcb-lowpower-timer
metrics:
  - { label: "Off current", value: "about 0.5 uA typical" }
  - { label: "Off current, worst case", value: "about 2.8 uA" }
  - { label: "Board", value: "50 x 40 mm, 2 layers" }
demo: { kind: pcb3d, props: { src: "/projects/pcb-lowpower-timer/board.glb", fallback: "/projects/pcb-lowpower-timer/fallback.webp", title: "Low-power timer board" } }
star: { planet: neptune }
year: 2026
featured: false
order: 16
---
## What didn't work

Nothing has been built or measured. The off-current figure is a sum of datasheet typicals, and no datasheet bounds one of its terms lower.
