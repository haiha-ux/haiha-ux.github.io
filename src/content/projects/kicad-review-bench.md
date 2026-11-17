---
title: "Automated pre-fab review for KiCad boards"
summary: "An automated review that runs KiCad's own ERC and DRC and adds custom rules read from the board file, with a fault-injection benchmark on 14 open-hardware boards."
domain: pcb
repo: kicad-review-bench
metrics:
  - { label: "Injected faults found", value: "114 of 118 by either checker, 91 by the custom rules", hero: "114 faults" }
  - { label: "Custom findings on 14 real boards", value: "26: 8 real, 18 borderline, 0 false positives" }
  - { label: "Review time", value: "3.8 s median per board" }
star: { planet: neptune }
year: 2026
featured: false
order: 20
---
## What didn't work

The faults are synthetic and chosen where the rules can see them, so recall is not an estimate of real mistakes. The control, a wrong component value, is caught 0 of 24 times by the custom rules.
