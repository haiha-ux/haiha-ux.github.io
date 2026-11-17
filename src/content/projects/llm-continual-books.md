---
title: "Teaching an LLM books in steps and measuring forgetting"
summary: "Qwen2.5-7B-Instruct learns three obscure public-domain books in steps while I measure what it forgets: naive LoRA, self-replay with a KL term and a knowledge-insulated expert with a router."
domain: other
repo: llm-continual-books
metrics:
  - { label: "Naive training", value: "book 1 falls from 40.7% to 6.0%" }
  - { label: "Self-replay plus KL", value: "keeps 32 of 61 book-1 answers" }
  - { label: "Insulated expert, soft gate", value: "keeps 26 of 61" }
demo: { kind: chart, props: { variant: continual, src: "/projects/llm-continual-books/forgetting.json" } }
star: { planet: moon }
year: 2026
featured: false
order: 23
---
## What didn't work

Finished for book 2 on one seed; book 3 was not run. The main result is negative: no method kept book 1 well while learning book 2 without the book-1 text.
