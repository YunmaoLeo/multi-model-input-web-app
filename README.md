# Pose Interaction Frontend - Percussion MVP

A real-time gesture-based percussion system using pose detection. Play virtual drums by moving your hands in front of the camera!

## 🎯 Features

### Core Functionality
- **Real-time Pose Detection**: Uses TensorFlow.js MoveNet (Lightning/Thunder) for accurate body tracking
- **Gesture-Based Drumming**: Stroke-based detection for natural drumming interaction
  - **Left hand downward stroke** → Hi-Hat sound
  - **Right hand downward stroke** → Snare drum
  - **Both hands simultaneously** → Kick drum
- **Visual Feedback**: 
  - Animated drum pads on screen with hit flash effects
  - Real-time skeleton overlay
  - Hit statistics display
- **Audio System**: WebAudio API with velocity-mapped volume and pitch variation
- **Performance Optimized**: Frame-rate independent velocity calculation with EMA smoothing

### Technical Features
- **GPU Acceleration**: Automatic backend selection (WebGPU → WebGL → WASM → CPU)
- **Adaptive Processing**: Frame-rate independent gesture detection
- **Smart Smoothing**: EMA (Exponential Moving Average) with alpha=0.7 for responsive yet stable tracking
- **Stroke-Based Detection**: Accumulates vertical displacement over time (like real drumming)
- **Privacy-Conscious**: Camera feed with blur filter (configurable)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **ML Framework**: TensorFlow.js + @tensorflow-models/pose-detection
- **Audio**: WebAudio API with dynamic compression
- **Styling**: Modern CSS with Dartmouth Green theme
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + TypeScript strict mode

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** or **pnpm**
- **Modern browser** with:
  - WebGL/WebGPU support
  - WebAudio API support
  - Webcam access
- **Good lighting** for optimal pose detection

## 🚀 Quick Start

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

**Option B: Use Professional Samples**
Place the following WAV files in `public/assets/drums/`:
- `kick.wav` - Kick drum (bass drum)
- `snare.wav` - Snare drum
- `hihat.wav` - Hi-hat cymbal

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## 🎮 How to Use

### Getting Started
1. **Start Camera**: Click "Start Camera" to enable webcam
2. **Grant Permission**: Allow camera access when prompted
3. **Start Detection**: Click "Start" button to begin pose detection
4. **Audio Initialization**: Audio system activates automatically on first start

### Playing the Drums
1. **Position yourself**: Stand 1-2 meters from the camera
2. **Raise your hands**: Position them comfortably at chest/shoulder height
3. **Make downward strokes**: Quick downward hand motions trigger drum sounds
   - **Left hand** → Hi-Hat (high-pitched cymbal)
   - **Right hand** → Snare (crisp drum)
   - **Both hands together** → Kick (deep bass)

### Tips for Best Experience
- ✅ Ensure good, even lighting
- ✅ Make clear, decisive downward motions
- ✅ Keep upper body visible to camera
- ✅ Stroke distance: ~15-20cm minimum vertical movement
- ✅ Stroke timeout: Complete motion within 500ms
- ⚠️ Avoid slow, gradual movements
- ⚠️ Don't stand too close to the camera

## 📁 Project Structure

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

## ⚙️ Configuration

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
- **MoveNet Lightning**: Faster, lower latency (recommended)
- **MoveNet Thunder**: More accurate, slightly slower

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🏗️ Build & Deploy

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

## 🌐 Browser Compatibility

| Browser | Version | WebGPU | WebGL | WebAudio |
|---------|---------|--------|-------|----------|
| Chrome  | 90+     | ✅     | ✅    | ✅       |
| Edge    | 90+     | ✅     | ✅    | ✅       |
| Firefox | 88+     | ⚠️     | ✅    | ✅       |
| Safari  | 14.5+   | ❌     | ✅    | ✅       |

**Recommended**: Chrome 90+ for best performance (WebGPU support)

## 🐛 Troubleshooting

### Audio Not Playing
**Symptoms**: Gesture detected but no sound
- ✅ Check browser console for audio loading errors
- ✅ Ensure audio files exist in `public/assets/drums/`
- ✅ Verify audio context is initialized (look for "✅ Audio system activated!" log)
- ✅ Check browser audio permissions
- ✅ Try refreshing the page and clicking "Start" again

### Gestures Not Detected
**Symptoms**: Hand movement doesn't trigger sounds
- ✅ Check lighting - ensure your upper body is well-lit
- ✅ Ensure wrist keypoints have >20% confidence (check console logs)
- ✅ Make faster, more pronounced downward strokes
- ✅ Complete strokes within 500ms
- ✅ Move hand at least 8-10% of screen height
- ⚠️ If only lower body visible, wrist detection may fail

### Low FPS / Lag
- ✅ Switch to MoveNet Lightning model
- ✅ Close other browser tabs
- ✅ Check GPU acceleration is enabled in browser settings
- ✅ Lower camera resolution (edit `CameraFeed.tsx`)

### Camera Feed Issues
- ✅ Grant camera permissions when prompted
- ✅ Check if camera is used by another application
- ✅ Try refreshing the page
- ✅ Adjust blur effect in `CameraFeed.tsx` (`filter: blur(8px)`)

## 📚 Key Implementation Details

### Gesture Detection Algorithm
1. **Keypoint Tracking**: Extract left/right wrist positions from MoveNet
2. **EMA Smoothing**: Apply alpha=0.7 smoothing for noise reduction
3. **Velocity Calculation**: Frame-rate independent (displacement / deltaTime)
4. **Stroke Detection**: 
   - Start: Detect downward motion (velocity > threshold)
   - Track: Accumulate downward displacement
   - Trigger: When accumulated distance > threshold AND within timeout
   - Reset: On upward motion or timeout

### Audio Pipeline
1. **Initialization**: Create AudioContext on user interaction
2. **Sample Loading**: Preload all WAV files using `fetch()` + `decodeAudioData()`
3. **Playback**: 
   - Map hand velocity to volume (logarithmic curve)
   - Apply random pitch variation (±2%)
   - Route through compressor for consistent loudness
4. **Performance**: Buffer pooling, no GC pressure during playback

### Visual Feedback
1. **Drum Pads**: Two elliptical pads rendered on canvas
2. **Hit Flash**: Intensity decays from 1.0 to 0 over ~17 frames (at 60fps)
3. **Color Mapping**: Green gradient → bright green on hit
4. **Mirroring**: Labels and positions correctly mirrored for camera view

## 📖 Additional Documentation

- **[Research_Note.md](./Research_Note.md)** - Technical research and requirements
- **[BACKEND_PROMPT.md](./BACKEND_PROMPT.md)** - Backend integration guide (optional)
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and updates

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**YunmaoLeo**
- GitHub: [@YunmaoLeo](https://github.com/YunmaoLeo)

## 🙏 Acknowledgments

- TensorFlow.js team for MoveNet model
- WebAudio API specification contributors
- React and Vite communities

---

**Made with ❤️ and TypeScript**
