---
title: "What KiCad keeps when it imports Altium and Eagle"
summary: "Two public boards, one Altium and one Eagle, imported into KiCad 10 and compared with the maker's own Gerbers: what the import keeps, what it changes and what it loses, with fixes."
domain: pcb
repo: pcb-review-crossformat
metrics:
  - { label: "Eagle wire length, top and bottom", value: "214.12 and 79.95 mm, identical after import" }
  - { label: "Eagle top copper only in the original", value: "137.0 to 0.0 mm2 after the fixes" }
  - { label: "Altium track width rule", value: "lost on import" }
star: { planet: neptune }
year: 2026
featured: false
order: 18
---
## What didn't work

The Altium board's track width rule is lost in the import and its polygon connect rule changes. The repo ends with a list of what to ask a client for and a section of things not checked yet.
