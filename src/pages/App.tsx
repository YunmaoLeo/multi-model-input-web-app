import { useState, useRef, useCallback, useEffect } from 'react'
import CameraFeed from '@/components/CameraFeed'
import PoseOverlay from '@/components/PoseOverlay'
import ControlPanel from '@/components/ControlPanel'
import StatusBar from '@/components/StatusBar'
import AudioWaveform from '@/components/AudioWaveform'
import { PoseDetector } from '@/lib/pose'
import { EMASmoother, processKeypoints } from '@/lib/smooth'
import { FPSCounter } from '@/lib/fps'
import type { 
  Keypoint, 
  Calibration, 
  ModelType, 
  CameraStatus,
  MicrophoneStatus,
  InferenceStatus, 
  FramePayload 
} from '@/types/pose'

export default function App() {
  // State management
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>('idle')
  const [inferenceStatus, setInferenceStatus] = useState<InferenceStatus>('stopped')
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])
  const [calibration, setCalibration] = useState<Calibration>({
    distance: 1.0,
    azimuth: 0,
    elevation: 0
  })
  const [scoreThreshold, setScoreThreshold] = useState(0.3)
  const [currentModel, setCurrentModel] = useState<ModelType>('movenet-lightning')
  const [fps, setFps] = useState({ infer: 0, render: 0 })
  const [tfBackend, setTfBackend] = useState<string>('loading...')
  const [inferenceTime, setInferenceTime] = useState<number>(0)

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const smootherRef = useRef<EMASmoother | null>(null)
  const inferFpsRef = useRef<FPSCounter>(new FPSCounter())
  const renderFpsRef = useRef<FPSCounter>(new FPSCounter())
  const animationFrameRef = useRef<number | null>(null)
  const isInferringRef = useRef<boolean>(false)

  // Initialize detector
  const initializeDetector = useCallback(async (modelType: ModelType) => {
    if (detectorRef.current) {
      detectorRef.current.dispose()
    }
    
    detectorRef.current = new PoseDetector()
    await detectorRef.current.initialize(modelType)
    
    // Get and display backend info
    const backend = detectorRef.current.getBackend()
    setTfBackend(backend.toUpperCase())
    
    if (!smootherRef.current) {
      smootherRef.current = new EMASmoother(0.3)
    }
  }, [])

  // Handle video ready
  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video
  }, [])

  // Handle camera error
  const handleCameraError = useCallback((error: string) => {
    console.error('Camera error:', error)
  }, [])

  // Handle camera status change
  const handleCameraStatusChange = useCallback((status: CameraStatus) => {
    setCameraStatus(status)
  }, [])

  // Handle microphone status change
  const handleMicrophoneStatusChange = useCallback((status: MicrophoneStatus) => {
    setMicrophoneStatus(status)
  }, [])

  // Handle microphone error
  const handleMicrophoneError = useCallback((error: string) => {
    console.error('Microphone error:', error)
  }, [])

  // Start inference
  const handleStart = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) {
      console.warn('Cannot start inference: video or detector not ready')
      return
    }

    console.log('Starting inference...')
    setInferenceStatus('running')
    isInferringRef.current = true
    inferFpsRef.current.reset()
    renderFpsRef.current.reset()

    const runInference = async () => {
      if (!videoRef.current || !detectorRef.current || !isInferringRef.current) {
        return
      }

      try {
        const currentTime = performance.now()
        
        // Inference (measure time)
        const inferStart = performance.now()
        const rawKeypoints = await detectorRef.current.estimatePoses(videoRef.current)
        const inferEnd = performance.now()
        const inferTime = inferEnd - inferStart
        
        setInferenceTime(inferTime)
        
        // Smooth and filter
        const processedKeypoints = processKeypoints(
          rawKeypoints,
          smootherRef.current!,
          scoreThreshold
        )
        
        setKeypoints(processedKeypoints)

        // Update FPS
        const inferFps = inferFpsRef.current.update(currentTime)
        const renderFps = renderFpsRef.current.update(currentTime)
        setFps({ infer: inferFps, render: renderFps })

        // Generate and print payload
        const payload: FramePayload = {
          sourceId: 'local-debug',
          ts: performance.timeOrigin + performance.now() / 1000,
          fps: { infer: inferFps, render: renderFps },
          keypoints: processedKeypoints,
          calibration,
          meta: {
            ua: navigator.userAgent,
            platform: navigator.platform,
            version: '1.0.0'
          }
        }

        console.log('Frame Payload:', payload)

        // Continue to next frame
        animationFrameRef.current = requestAnimationFrame(runInference)
      } catch (error) {
        console.error('Inference error:', error)
        setInferenceStatus('stopped')
        isInferringRef.current = false
      }
    }

    runInference()
  }, [scoreThreshold, calibration])

  // Stop inference
  const handleStop = useCallback(() => {
    console.log('Stopping inference...')
    setInferenceStatus('stopped')
    isInferringRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Handle model change
  const handleModelChange = useCallback(async (model: ModelType) => {
    setCurrentModel(model)
    await initializeDetector(model)
  }, [initializeDetector])

  // Handle calibration change
  const handleCalibrationChange = useCallback((newCalibration: Calibration) => {
    setCalibration(newCalibration)
  }, [])

  // Handle score threshold change
  const handleScoreThresholdChange = useCallback((threshold: number) => {
    setScoreThreshold(threshold)
    if (smootherRef.current) {
      smootherRef.current.setAlpha(threshold)
    }
  }, [])

  // Initialize
  useEffect(() => {
    initializeDetector(currentModel)
    
    return () => {
      isInferringRef.current = false
      if (detectorRef.current) {
        detectorRef.current.dispose()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [initializeDetector, currentModel])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            Pose & Voice Interaction System
            <span className="version-badge">v1.0</span>
          </h1>
          <p className="subtitle">Real-time Pose Detection & Voice Analysis</p>
        </div>
      </header>

      <main className="app-main">
        <div className="video-section">
          <div className={`video-container ${cameraStatus === 'capturing' ? 'video-container-active' : ''}`}>
            <CameraFeed
              onVideoReady={handleVideoReady}
              onError={handleCameraError}
              onStatusChange={handleCameraStatusChange}
            />
            <PoseOverlay
              videoElement={videoRef.current}
              keypoints={keypoints}
              isVisible={inferenceStatus === 'running' && cameraStatus === 'capturing'}
            />
          </div>

          <div className={`audio-container ${microphoneStatus === 'recording' ? 'audio-container-active' : ''}`}>
            <AudioWaveform
              onStatusChange={handleMicrophoneStatusChange}
              onError={handleMicrophoneError}
            />
          </div>
        </div>

        <div className="control-section">
          <ControlPanel
            onStart={handleStart}
            onStop={handleStop}
            onModelChange={handleModelChange}
            onCalibrationChange={handleCalibrationChange}
            onScoreThresholdChange={handleScoreThresholdChange}
            isRunning={inferenceStatus === 'running'}
            currentModel={currentModel}
            calibration={calibration}
            scoreThreshold={scoreThreshold}
          />
        </div>
      </main>

      <footer className="app-footer">
        <StatusBar
          cameraStatus={cameraStatus}
          microphoneStatus={microphoneStatus}
          inferenceStatus={inferenceStatus}
          fps={fps}
          keypointCount={keypoints.length}
          tfBackend={tfBackend}
          inferenceTime={inferenceTime}
        />
      </footer>
    </div>
  )
}
