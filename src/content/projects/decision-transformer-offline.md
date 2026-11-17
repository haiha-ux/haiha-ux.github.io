---
title: "Decision Transformer against BC on offline MuJoCo"
summary: "A Decision Transformer in plain PyTorch against BC and %BC on five offline MuJoCo datasets, 45 training runs over 3 seeds. In this setup the Decision Transformer did not beat plain behaviour cloning."
domain: robot-learning
repo: decision-transformer-offline
metrics:
  - { label: "Winner", value: "BC or %BC on all 5 datasets", hero: "BC wins 5/5" }
  - { label: "hopper-medium score", value: "BC 103.7, %BC 104.5, DT 70.5" }
  - { label: "Runs", value: "45, 3 seeds each" }
demo: { kind: iframe, src: "https://haiha-ux.github.io/decision-transformer-offline/" }
star: { planet: jupiter }
year: 2026
featured: false
order: 13
---
## What didn't work

Return conditioning barely works: on hopper-medium the score stays at 70.5, 70.2, 70.8, 70.5 and 66.6 as the target rises. I ruled out an implementation bug and a learning-rate or length problem on one dataset, but I cannot explain the result.
