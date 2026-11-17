---
title: "Diffusion Policy against behaviour cloning on the PushT benchmark"
summary: "Diffusion Policy written in plain PyTorch and compared with two behaviour-cloning baselines on state-based PushT, 3 seeds and 50 episodes per seed. Action chunks are sampled live in the browser through ONNX."
domain: robot-learning
repo: diffusion-policy-pusht
metrics:
  - { label: "Coverage, diffusion DDIM-10", value: "0.866 vs 0.640 and 0.544 for BC" }
  - { label: "Success, coverage above 0.95", value: "0.55 vs 0.25 and 0.27" }
  - { label: "DDPM-100", value: "0.854 coverage" }
demo: { kind: iframe, src: "https://haiha-ux.github.io/diffusion-policy-pusht/" }
star: { planet: jupiter }
year: 2026
featured: true
order: 6
---
## What didn't work

My multimodality measurement is weak: it does not show clearly separate modes on held-out demo states. Training ran 40k steps, far shorter than the paper's schedule, so this is not a reproduction claim.
