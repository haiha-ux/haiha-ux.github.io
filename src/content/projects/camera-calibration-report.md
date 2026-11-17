---
title: "Camera calibration judged on held-out views"
summary: "Pinhole, fisheye and stereo calibration with OpenCV on public data. I calibrate on about 70% of the images and score error on the other 30%, repeated over 20 random splits."
domain: edge-ai
repo: camera-calibration-report
metrics:
  - { label: "Pinhole, held-out RMS", value: "0.442 px mean over 20 splits" }
  - { label: "Fisheye, held-out RMS", value: "0.274 px mean over 20 splits" }
  - { label: "Stereo epipolar mean |dy|, held-out", value: "0.135 px" }
demo: { kind: undistort, props: { src: "/projects/camera-calibration-report/calib.json" } }
star: { planet: sun }
year: 2026
featured: false
order: 9
---
## What didn't work

With 13 pinhole images a single split is noisy, which is why I repeat the split 20 times. The square size is not stated with the pinhole images, so I assume 25 mm and the baseline in millimetres scales with that assumption.
