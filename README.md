# Pose Interaction Frontend - Percussion MVP

Real-time gesture-based percussion system using pose detection and WebAudio API.

## Features

### Core Functionality
- **Real-time Pose Detection**: TensorFlow.js MoveNet (Lightning/Thunder) for body tracking
- **Gesture-Based Drumming**: Stroke-based detection for drumming interaction
  - Left hand downward stroke → Hi-Hat sound
  - Right hand downward stroke → Snare drum
  - Both hands simultaneously → Kick drum
- **Visual Feedback**: 
  - Animated drum pads with hit flash effects
  - Real-time skeleton overlay
  - Hit statistics display
- **Audio System**: WebAudio API with velocity-mapped volume and pitch variation
- **Performance**: Frame-rate independent velocity calculation with EMA smoothing

### Technical Features
- **GPU Acceleration**: Automatic backend selection (WebGPU → WebGL → WASM → CPU)
- **Adaptive Processing**: Frame-rate independent gesture detection
- **Smoothing**: EMA (Exponential Moving Average) with alpha=0.7
- **Stroke-Based Detection**: Accumulates vertical displacement over time
- **Privacy**: Camera feed with blur filter (configurable)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **ML Framework**: TensorFlow.js + @tensorflow-models/pose-detection
- **Audio**: WebAudio API with dynamic compression
- **Styling**: Modern CSS with Dartmouth Green theme
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + TypeScript strict mode

## Prerequisites

- Node.js >= 18.x
- npm or pnpm
- Modern browser with:
  - WebGL/WebGPU support
  - WebAudio API support
  - Webcam access

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/YunmaoLeo/multi-model-input-web-app.git
cd PoseInteractionFrontEnd

# Install dependencies
npm install
```

### 2. Prepare Audio Files

**Option A: Generate Test Samples**
```bash
cd public/assets/drums
pip install numpy scipy
python generate_drums.py
cd ../../..
```

**Option B: Use Custom Samples**
Place the following WAV files in `public/assets/drums/`:
- `kick.wav` - Kick drum
- `snare.wav` - Snare drum
- `hihat.wav` - Hi-hat cymbal

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## How to Use

### Getting Started
1. Click "Start Camera" to enable webcam
2. Allow camera access when prompted
3. Click "Start" button to begin pose detection
4. Audio system activates automatically on first start

### Playing the Drums
1. Stand 1-2 meters from the camera
2. Position hands at chest/shoulder height
3. Make downward strokes to trigger drum sounds
   - Left hand → Hi-Hat
   - Right hand → Snare
   - Both hands together → Kick

### Usage Notes
- Ensure adequate lighting
- Make clear downward motions
- Keep upper body visible to camera
- Minimum vertical movement: ~15-20cm
- Complete motion within 500ms
- Avoid slow, gradual movements

## Project Structure

```
src/
├── components/              # React components
│   ├── AudioWaveform.tsx   # (Deprecated - kept for compatibility)
│   ├── CameraFeed.tsx      # Webcam capture with blur effect
│   ├── ControlPanel.tsx    # Model & threshold controls
│   ├── PoseOverlay.tsx     # Skeleton + drum pad visualization
│   └── StatusBar.tsx       # Performance metrics
│
├── lib/                     # Core business logic
│   ├── audio.ts            # WebAudio manager (playback, velocity mapping)
│   ├── fps.ts              # Performance monitoring
│   ├── gesture.ts          # Stroke-based gesture detection
│   ├── pose.ts             # MoveNet wrapper
│   └── smooth.ts           # EMA keypoint smoothing
│
├── pages/
│   └── App.tsx             # Main application orchestrator
│
├── styles/
│   └── global.css          # Global styles & theme
│
└── types/
    └── pose.d.ts           # TypeScript type definitions

public/
└── assets/
    └── drums/              # Audio samples
        ├── generate_drums.py
        ├── kick.wav
        ├── snare.wav
        └── hihat.wav
```

## Configuration

### Gesture Detection Parameters
Located in `src/lib/gesture.ts`:

```typescript
{
  speedThreshold: 0.00015,        // (Deprecated) velocity threshold
  displacementThreshold: 0.08,    // Stroke distance (8% of screen height)
  strokeTimeoutMs: 500,           // Max time to complete stroke
  dualHitWindowMs: 120,           // Window for dual hand detection
  deadTimeMs: 150,                // Debounce time between hits
  medianFilterSize: 5             // Velocity smoothing filter size
}
```

### Audio Settings
Located in `src/lib/audio.ts`:

```typescript
{
  masterVolume: 0.6,              // Overall volume (0-1)
  velocitySensitivity: 1.0,       // Velocity to volume mapping
  pitchVariation: 0.02,           // Random pitch variation (±2%)
  useCompressor: true             // Enable dynamics compression
}
```

### Model Selection
- MoveNet Lightning: Faster, lower latency (recommended)
- MoveNet Thunder: More accurate, slightly slower

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Build & Deploy

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

Deployment URL: `https://yunmaoleo.github.io/multi-model-input-web-app/`

## Browser Compatibility

| Browser | Version | WebGPU | WebGL | WebAudio |
|---------|---------|--------|-------|----------|
| Chrome  | 90+     | Yes    | Yes   | Yes      |
| Edge    | 90+     | Yes    | Yes   | Yes      |
| Firefox | 88+     | Partial | Yes   | Yes      |
| Safari  | 14.5+   | No     | Yes   | Yes      |

Recommended: Chrome 90+ for best performance (WebGPU support)

## Troubleshooting

### Audio Not Playing
**Symptoms**: Gesture detected but no sound
- Check browser console for audio loading errors
- Ensure audio files exist in `public/assets/drums/`
- Verify audio context is initialized (check console logs)
- Check browser audio permissions
- Refresh the page and click "Start" again

### Gestures Not Detected
**Symptoms**: Hand movement doesn't trigger sounds
- Check lighting - ensure upper body is well-lit
- Ensure wrist keypoints have >20% confidence (check console logs)
- Make faster, more pronounced downward strokes
- Complete strokes within 500ms
- Move hand at least 8-10% of screen height
- If only lower body visible, wrist detection may fail

### Low FPS / Lag
- Switch to MoveNet Lightning model
- Close other browser tabs
- Check GPU acceleration is enabled in browser settings
- Lower camera resolution (edit `CameraFeed.tsx`)

### Camera Feed Issues
- Grant camera permissions when prompted
- Check if camera is used by another application
- Refresh the page
- Adjust blur effect in `CameraFeed.tsx` (`filter: blur(8px)`)

## Implementation Details

### Gesture Detection Algorithm
1. Keypoint Tracking: Extract left/right wrist positions from MoveNet
2. EMA Smoothing: Apply alpha=0.7 smoothing for noise reduction
3. Velocity Calculation: Frame-rate independent (displacement / deltaTime)
4. Stroke Detection: 
   - Start: Detect downward motion (velocity > threshold)
   - Track: Accumulate downward displacement
   - Trigger: When accumulated distance > threshold AND within timeout
   - Reset: On upward motion or timeout