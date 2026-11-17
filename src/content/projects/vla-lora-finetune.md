---
title: "LoRA fine-tuning of SmolVLA on one weak task"
summary: "A LoRA adapter fine-tuned on SmolVLA for one weak LIBERO-Spatial task. The result is null on that task, and a side check shows the adapters hurt at least one other task."
domain: robot-learning
repo: vla-lora-finetune
metrics:
  - { label: "Target task 5", value: "44.4% pretrained, 43.3% and 47.8% with LoRA" }
  - { label: "Task 7, forgetting check", value: "7/10 pretrained, 1/10 and 0/10 after LoRA" }
  - { label: "Trainable parameters", value: "3,276,800, 0.54%" }
demo: { kind: iframe, src: "https://haiha-ux.github.io/vla-lora-finetune/" }
star: { planet: jupiter }
year: 2026
featured: false
order: 12
---
## What didn't work

No gain on the target task, and validation loss went up while training loss stayed flat. Two of the 128 adapter layers can never train, and my first evaluation script aborted all six runs on that. Task 7 collapsed, and I did not investigate why.
