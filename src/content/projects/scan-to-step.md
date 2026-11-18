---
title: "Scan to STEP: three scans rebuilt as parametric solids"
summary: "Three simulated scans with 0.03 mm noise, holes in the mesh and random rotation, each rebuilt blind as a parametric STEP of planes, cylinders and fillets, then scored once against a hidden reference."
domain: cad
repo: scan-to-step
metrics:
  - { label: "Worst deviation from the reference", value: "0.0069, 0.0023 and 0.0051 mm, all three pass", hero: "0.0069 mm" }
  - { label: "Declared dimensions and volume", value: "within 0.01 mm and 0.05%" }
  - { label: "Analytic faces", value: "100% of the surface area" }
star: { planet: saturn }
year: 2026
featured: false
order: 24
---
## What didn't work

The scans are simulated, not from a real scanner. The noise is the clean 0.03 mm Gaussian kind, so a real scan with reflections, a warped part or a poor registration would be harder than this. I only know the method works on parts built from simple analytic shapes.
