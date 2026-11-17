---
title: "Marker-ring alignment for a tube-mounted camera"
summary: "A USB camera looks at a ring of eight ArUco markers and the software turns them into live alignment numbers: tilt, distance and offset from the optical axis. The benchmark uses 500 rendered frames with known ground truth."
domain: edge-ai
repo: marker-alignment-demo
metrics:
  - { label: "Tilt error, 8-marker board", value: "0.029 deg median", hero: "0.029 deg" }
  - { label: "Tilt error, single marker", value: "0.702 deg median" }
  - { label: "Focal length 5% off", value: "distance shifts by about 14 mm" }
star: { planet: sun }
year: 2026
featured: false
order: 10
---
## What didn't work

Everything was measured on rendered images; nothing has been tried on a physical phantom or a real camera. The risk curve in the app is made up for demonstration.
