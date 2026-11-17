---
title: "ESP32-S3 e-paper board with a LiPo charger"
summary: "A 72 x 48 mm four-layer KiCad 10 board that drives a bare SPI e-paper panel from an ESP32-S3 module, with USB-C, a LiPo charger with load sharing and a 3.3 V LDO that draws 2 uA."
domain: pcb
repo: pcb-esp32s3-epaper
metrics:
  - { label: "Board", value: "72 x 48 mm, 4 layers" }
  - { label: "Sleep current on paper", value: "about 13 uA typical" }
  - { label: "Runtime on paper", value: "about 5 weeks, one fetch every 10 minutes" }
star: { planet: neptune }
year: 2026
featured: true
order: 5
---
## What didn't work

Nothing has been built, powered or measured. The battery estimate rests on datasheet typicals plus two assumptions marked in the README.
