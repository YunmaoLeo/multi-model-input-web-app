# Human Gesture Recognition Pipeline

## Research Project overview
Online Collective Music Interaction is an experimental browser-based digital concert system that transforms body movement into collaborative sound.
Each participant acts as a performer: by moving their hands in front of their webcam, the system detects gestures in real time and translates them into musical events. These events are transmitted to a centralized host server, which merges and synchronizes all participants into a shared performance — a kind of collective online jam session.

Core Features
	•	Browser-based participation — no installation required; each user performs through their webcam.
	•	Real-time gesture recognition powered by TensorFlow.js and MoveNet.
	•	WebSocket-based event transmission to synchronize gestures across the network.
	•	Server-side quantization and merging ensure all performers stay in rhythm despite network delays.
	•	Generative-AI-assisted score design, transforming existing melodies or chord progressions into “playable maps” that define rhythmic sections.
	•	Centralized audio synthesis — the host server composes, mixes, and broadcasts the final unified audio stream.
	•	Visual feedback layer for stage or installation projection, showing energy, rhythm density, and crowd interaction in real time.

Technical Architecture
	•	Frontend (Performer)
	•	MoveNet gesture tracking (17 keypoints)
	•	Local sound feedback for tactile latency compensation
	•	Lightweight WebSocket event streaming
	•	Backend (Host Server)
	•	Global tempo synchronization and beat quantization
	•	Event aggregation, concurrency control, and AI-based pattern assignment
	•	Sound synthesis, live mixing, and visualization data broadcast
	•	AI Integration
	•	Generative models convert MIDI or score data into dynamic “strike maps”
	•	LLM summarization layer for section naming and live subtitle generation

Artistic Vision

This project explores how distributed participants can co-create rhythm and harmony through gesture-based interaction.
It merges backend engineering, real-time systems, and digital arts aesthetics — turning collective motion into a shared sonic experience that challenges the boundary between performer and audience.



## Overview
A real-time human pose estimation system built with TensorFlow.js and MoveNet, deployed as a web application for interactive gesture recognition and voice analysis.

## Technical Stack

### Core Framework
- **Frontend**: React 18 + TypeScript + Vite
- **ML Model**: TensorFlow.js with MoveNet (Lightning & Thunder variants)
- **Acceleration**: WebGL/WebGPU backend with automatic fallback
- **Rendering**: HTML5 Canvas 2D for skeleton visualization

### Key Components
1. **Pose Detection**: MoveNet model detects 17 keypoints per frame
2. **Smoothing**: EMA (Exponential Moving Average) algorithm for temporal consistency
3. **Visualization**: Real-time skeleton overlay with confidence-based filtering
4. **Audio Analysis**: Web Audio API with waveform visualization

## Implementation

### Pose Estimation Pipeline
```
Video Input → MoveNet Inference → Keypoint Extraction → 
EMA Smoothing → Confidence Filtering → Canvas Rendering
```

### Performance Optimization
- Keypoint coordinates normalized to [0, 1] range
- Confidence threshold filtering (default: 0.3)
- Upper body focus (excludes lower limbs for clarity)
- Real-time FPS monitoring (inference + render)

### Visualization Features
- **Skeleton Drawing**: Enhanced with gradients and glow effects
- **Keypoint Categorization**: Face (blue), torso/arms (green)
- **Dual-layer Lines**: Shadow + gradient for depth perception
- **Status Display**: FPS, inference time, backend type, keypoint count

## Deployment
- **Platform**: GitHub Pages
- **URL**: https://yunmaoleo.github.io/multi-model-input-web-app/
- **Access**: Browser-based, requires webcam/microphone permissions

## Results
The system achieves real-time performance (~30-60 FPS) on standard hardware with WebGL acceleration, providing smooth and accurate pose tracking suitable for interactive applications.

---


