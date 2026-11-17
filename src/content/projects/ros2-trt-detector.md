---
title: "ROS 2 node with a TensorRT detector"
summary: "A ROS 2 Jazzy node runs a TensorRT FP16 YOLO11n detector on a camera topic and publishes vision_msgs/Detection2DArray. A benchmark measures latency on the real ROS 2 message path."
domain: edge-ai
repo: ros2-trt-detector
metrics:
  - { label: "Rate held", value: "30 Hz at 640 and 1280 input", hero: "30 Hz" }
  - { label: "Image stamp to detections, 640", value: "14.1 ms median" }
  - { label: "Image stamp to detections, 1280", value: "19.4 ms median" }
star: { planet: sun }
year: 2026
featured: false
order: 7
---
## What didn't work

With the default Fast DDS transports, 2.7 MB images were mostly dropped at 30 Hz (about 5 to 10 Hz received). A shared-memory profile with a larger segment fixed it. One stream, batch 1, detections only.
