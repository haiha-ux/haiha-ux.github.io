---
title: "SmolVLA and pi0-FAST on LIBERO"
summary: "I re-ran two pretrained robot policies, SmolVLA and pi0-FAST, on LIBERO-Spatial through LeRobot's evaluator: 100 episodes each, with confidence intervals and per-call latency."
domain: robot-learning
repo: libero-vla-repro
metrics:
  - { label: "SmolVLA 0.6B", value: "66/100, 95% CI 56.3 to 74.5" }
  - { label: "SmolVLA 0.45B", value: "63/100" }
  - { label: "pi0-FAST", value: "79/100" }
star: { planet: jupiter }
year: 2026
featured: true
order: 3
---
## What didn't work

SmolVLA scored 24 to 27 points below its paper's LIBERO-Spatial number, outside the interval, so I did not reproduce the published figure. One seed and 100 episodes mean that differences of a few points are not meaningful.
