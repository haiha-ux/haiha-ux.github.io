---
title: "Multi-camera RTSP to batched TensorRT"
summary: "Several RTSP cameras go in, tracked detections come out, on one GPU: GStreamer decode, one batched TensorRT FP16 YOLO11n call across all streams and one ByteTrack instance per stream. The benchmark gives per-stage and end-to-end latency for 1 to 12 streams over the real RTSP path."
domain: edge-ai
repo: multistream-trt-pipeline
metrics:
  - { label: "Real-time up to", value: "4 streams at 30 fps" }
  - { label: "End to end, 4 streams", value: "62.5 ms median" }
  - { label: "12 streams", value: "235 fps aggregate, 51.5% dropped" }
star: { planet: sun }
year: 2026
featured: true
order: 2
---
## What didn't work

The GPU was a shared GB10, not a Jetson, and about 88% busy before each run, so the numbers are only comparable to each other. Each point ran once. NVDEC decode took about 35 ms against about 8 ms on the CPU, and I did not investigate why.
