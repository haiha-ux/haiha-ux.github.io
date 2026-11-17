---
title: "Synthetic data for YOLO11n with Isaac Sim"
summary: "Synthetic tabletop data from Isaac Sim Replicator for a YOLO11n detector, with one experiment: does domain randomization help when the test images look different from the training images?"
domain: edge-ai
repo: isaac-synthetic-yolo
metrics:
  - { label: "Shifted test set, mAP50-95", value: "0.894 randomized vs 0.583 fixed" }
  - { label: "Same-distribution set, mAP50-95", value: "0.982 randomized vs 0.987 fixed" }
  - { label: "Data", value: "2000 train images per set, 2 seeds" }
star: { planet: sun }
year: 2026
featured: false
order: 11
---
## What didn't work

The detector is trained and scored on rendered images only. There are no real photos in this study.
