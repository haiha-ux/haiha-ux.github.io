---
title: "ByteTrack and BoT-SORT on MOT17"
summary: "YOLO11 n and s with ByteTrack and BoT-SORT, scored with TrackEval (HOTA, MOTA, IDF1) on five MOT17 train sequences, PyTorch against TensorRT FP16, plus a per-track speed output."
domain: edge-ai
repo: object-tracking-bench
metrics:
  - { label: "Best HOTA", value: "45.47, YOLO11s with BoT-SORT on TensorRT FP16", hero: "45.5 HOTA" }
  - { label: "ID switches", value: "20 to 25% fewer with BoT-SORT" }
  - { label: "TensorRT FP16 vs PyTorch", value: "within 1 HOTA" }
star: { planet: sun }
year: 2026
featured: false
order: 8
---
## What didn't work

Scoring uses MOT17 train ground truth, not the official test server, and the trackers run with default settings. Pixel speed is not metric speed; I describe the homography step but did not demonstrate it.
