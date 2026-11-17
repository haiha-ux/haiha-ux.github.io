---
title: "YOLO11n from PyTorch to TensorRT"
summary: "I took YOLO11n from PyTorch to ONNX to TensorRT at FP32, FP16 and INT8 and measured speed and COCO accuracy with the same scripts for every backend. FP16 ran 1175 FPS at batch 1 with no accuracy loss. INT8 lost 2.0 mAP points and was slower."
domain: edge-ai
repo: yolo-tensorrt-edge
metrics:
  - { label: "TensorRT FP16, batch 1", value: "1175 FPS" }
  - { label: "mAP50-95, FP16 and FP32", value: "0.424 both" }
  - { label: "INT8", value: "-2.0 mAP points, slower than FP16" }
demo: { kind: iframe, src: "https://haiha-ux.github.io/yolo-tensorrt-edge/" }
star: { planet: sun }
year: 2026
featured: true
order: 1
---
## What didn't work

INT8 lost 2.0 mAP50-95 points and was slower than FP16 for this small model. A second study with larger models, batch 8 and 512 calibration images did not change that. I did not try hardware with dedicated INT8 paths (Jetson Orin DLA) or quantization-aware training, and the browser demo's WebGPU path is untested.
