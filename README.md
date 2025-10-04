# Multi-Model Input Web App

A real-time pose detection and voice interaction system built with React, TypeScript, and TensorFlow.js.

## Features

- **Real-time Pose Detection**: Uses MoveNet (Lightning/Thunder) models for accurate pose estimation
- **Voice Analysis**: Real-time audio waveform visualization
- **GPU Acceleration**: Automatic backend selection (WebGPU → WebGL → CPU fallback)
- **Modern UI**: Dartmouth Green-themed responsive interface
- **Performance Monitoring**: FPS tracking and inference time display

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **ML Models**: TensorFlow.js + @tensorflow-models/pose-detection
- **Styling**: CSS with Dartmouth Green theme
- **Testing**: Vitest
- **Code Quality**: ESLint + Prettier + EditorConfig

## Prerequisites

- Node.js >= 18
- npm or pnpm
- Modern browser with WebGL/WebGPU support
- Webcam and microphone access

## Installation

```bash
# Clone the repository
git clone https://github.com/YunmaoLeo/multi-model-input-web-app.git
cd multi-model-input-web-app

# Install dependencies
npm install
# or
pnpm install
```

## Running the App

### Development Mode

```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
pnpm build
```

### Preview Production Build

```bash
npm run preview
# or
pnpm preview
```

### Deploy to GitHub Pages

```bash
npm run deploy
# or
pnpm deploy
```

The app will be deployed to: `https://yunmaoleo.github.io/multi-model-input-web-app/`

## Usage

1. **Start Camera**: Click "Start Camera" to enable webcam access
2. **Start Microphone**: Click "Start Microphone" to enable audio input
3. **Start Inference**: Click "Start Inference" to begin pose detection
4. **Adjust Settings**:
   - Model Selection: Switch between MoveNet Lightning (faster) and Thunder (more accurate)
   - Confidence Threshold: Adjust keypoint filtering threshold (0-1)
   - Calibration Parameters: Set distance, azimuth, and elevation

## Project Structure

```
src/
├── components/        # React components
│   ├── AudioWaveform.tsx
│   ├── CameraFeed.tsx
│   ├── ControlPanel.tsx
│   ├── PoseOverlay.tsx
│   └── StatusBar.tsx
├── lib/              # Core logic
│   ├── fps.ts        # FPS counter
│   ├── pose.ts       # Pose detection wrapper
│   └── smooth.ts     # Keypoint smoothing
├── pages/            # Page components
│   └── App.tsx       # Main app
├── styles/           # Global styles
│   └── global.css
└── types/            # TypeScript definitions
    └── pose.d.ts
```

## Configuration

Copy `.env.example` to `.env` and adjust settings as needed:

```bash
cp .env.example .env
```

## Browser Compatibility

- Chrome/Edge 90+ (recommended for WebGPU support)
- Firefox 88+
- Safari 14+

## License

MIT

## Author

YunmaoLeo
