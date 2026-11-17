---
title: "PPO from scratch against Stable-Baselines3"
summary: "PPO written from scratch in PyTorch for MuJoCo Hopper, HalfCheetah and Walker2d, measured against Stable-Baselines3 over 3 seeds with 1M steps per run, plus an ablation on Hopper."
domain: robot-learning
repo: ppo-mujoco-control
metrics:
  - { label: "Hopper-v5", value: "3395 vs 2933 for SB3" }
  - { label: "Walker2d-v5", value: "3827 vs 3231 for SB3" }
  - { label: "Hopper without observation normalisation", value: "2602" }
star: { planet: jupiter }
year: 2026
featured: false
order: 14
---
## What didn't work

With 3 seeds the standard deviations are as large as the gaps, so I cannot say either implementation is better. The ablation covers two components on one environment.
