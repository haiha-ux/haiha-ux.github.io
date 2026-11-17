---
title: "Connect Four self-play model, AlphaZero style"
summary: "An AlphaZero-style agent for Connect Four written from scratch in PyTorch: bitboard game, residual network, PUCT search and self-play from random weights, scored against minimax depth 1 to 6 at every checkpoint. The final network runs in the browser."
domain: robot-learning
repo: alphazero-connect4
metrics:
  - { label: "Against minimax depth 6", value: "36 wins, 4 losses in 40 games" }
  - { label: "Training", value: "120 iterations of self-play, 90 minutes" }
  - { label: "Elo against iteration 0", value: "688" }
demo: { kind: iframe, src: "https://haiha-ux.github.io/alphazero-connect4/" }
star: { planet: jupiter }
year: 2026
featured: true
order: 4
---
## What didn't work

One training run, 40 games per cell, so differences of a game or two are noise. The minimax opponents are mine, not an external engine, and I make no claim of perfect play.
