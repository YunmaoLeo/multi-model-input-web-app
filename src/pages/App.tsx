import { useState, useRef, useCallback, useEffect } from 'react'
import CameraFeed from '@/components/CameraFeed'
import PoseOverlay from '@/components/PoseOverlay'
import ControlPanel from '@/components/ControlPanel'
import { PoseDetector } from '@/lib/pose'
import { EMASmoother, processKeypoints } from '@/lib/smooth'
import { FPSCounter } from '@/lib/fps'
import { GestureDetector } from '@/lib/gesture'
import { AudioManager } from '@/lib/audio'
import type { 
  Keypoint, 
  Calibration, 
  ModelType, 
  CameraStatus,
  InferenceStatus, 
  FramePayload,
  HitStats
} from '@/types/pose'

export default function App() {
  // State management
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [inferenceStatus, setInferenceStatus] = useState<InferenceStatus>('stopped')
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])
  const [scoreThreshold, setScoreThreshold] = useState(0.3)
  const [currentModel, setCurrentModel] = useState<ModelType>('movenet-lightning')
  const [fps, setFps] = useState({ infer: 0, render: 0 })
  const [tfBackend, setTfBackend] = useState<string>('loading...')
  const [inferenceTime, setInferenceTime] = useState<number>(0)
  
  // 手势和音频相关状态
  const [hitStats, setHitStats] = useState<HitStats>({ left: 0, right: 0, both: 0, total: 0 })
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [drumHits, setDrumHits] = useState<{ left: number; right: number }>({ left: 0, right: 0 })

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const smootherRef = useRef<EMASmoother | null>(null)
  const gestureDetectorRef = useRef<GestureDetector | null>(null)
  const audioManagerRef = useRef<AudioManager | null>(null)
  const inferFpsRef = useRef<FPSCounter>(new FPSCounter())
  const renderFpsRef = useRef<FPSCounter>(new FPSCounter())
  const animationFrameRef = useRef<number | null>(null)
  const isInferringRef = useRef<boolean>(false)
  const drumFlashRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 })

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
      // Use alpha=0.7 for fast response with light smoothing
      // 70% new value, 30% old value = responsive but stable
      smootherRef.current = new EMASmoother(0.7)
    }
    
    // 初始化手势检测器
    if (!gestureDetectorRef.current) {
      gestureDetectorRef.current = new GestureDetector()
    }
    
    // 初始化音频管理器
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager()
    }
  }, [])
  
  // 初始化音频（需要用户交互）
  const initializeAudio = useCallback(async () => {
    console.log('🎵 initializeAudio called', {
      hasAudioManager: !!audioManagerRef.current
    })
    
    // 使用 ref 检查状态，避免依赖 state
    if (audioManagerRef.current?.isInitialized) {
      console.log('⏭️ Audio already initialized (checked via ref)')
      return
    }
    
    if (!audioManagerRef.current) {
      console.error('❌ Audio manager not created')
      return
    }
    
    try {
      console.log('🔄 Initializing audio...')
      await audioManagerRef.current.initialize()
      setAudioInitialized(true)
      console.log('✅ Audio system activated!', {
        isInitialized: audioManagerRef.current.isInitialized
      })
    } catch (error) {
      console.error('❌ Audio initialization failed:', error)
    }
  }, []) // 移除 audioInitialized 依赖

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

  // Start inference
  const handleStart = useCallback(async () => {
    console.log('🚀 handleStart called')
    
    if (!videoRef.current || !detectorRef.current) {
      console.warn('Cannot start inference: video or detector not ready')
      return
    }

    // 首次启动时初始化音频
    console.log('🔄 About to initialize audio...')
    await initializeAudio()
    console.log('✅ Audio initialization completed (or skipped)')

    console.log('Starting inference...')
    setInferenceStatus('running')
    isInferringRef.current = true
    inferFpsRef.current.reset()
    renderFpsRef.current.reset()
    
    // 重置手势检测器和统计
    if (gestureDetectorRef.current) {
      gestureDetectorRef.current.reset()
    }
    setHitStats({ left: 0, right: 0, both: 0, total: 0 })
    drumFlashRef.current = { left: 0, right: 0 }
    setDrumHits({ left: 0, right: 0 })

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
        
        // Apply fast EMA smoothing (alpha=0.7) - responsive yet stable
        const smoothedKeypoints = processKeypoints(
          rawKeypoints,
          smootherRef.current!,
          scoreThreshold
        )
        
        setKeypoints(smoothedKeypoints)

        // Gesture detection - use smoothed keypoints (fast EMA ensures accuracy)
        if (gestureDetectorRef.current) {
          const gestureResult = gestureDetectorRef.current.detect(smoothedKeypoints, currentTime)
          
          // Handle gesture events
          if (gestureResult.event) {
            // Update statistics
            setHitStats(prev => {
              const newStats = { ...prev, total: prev.total + 1 }
              if (gestureResult.event === 'hit_left') newStats.left++
              if (gestureResult.event === 'hit_right') newStats.right++
              if (gestureResult.event === 'hit_both') newStats.both++
              return newStats
            })
            
            // Trigger drum flash effect
            if (gestureResult.event === 'hit_left' || gestureResult.event === 'hit_both') {
              drumFlashRef.current.left = 1.0
            }
            if (gestureResult.event === 'hit_right' || gestureResult.event === 'hit_both') {
              drumFlashRef.current.right = 1.0
            }
            
            // Play audio
            console.log('🔊 Audio check:', {
              hasAudioManager: !!audioManagerRef.current,
              audioInitialized: audioInitialized,
              event: gestureResult.event
            })
            
            if (audioManagerRef.current) {
              const velocity = gestureResult.event === 'hit_left' 
                ? Math.abs(gestureResult.leftVelocity.y)
                : gestureResult.event === 'hit_right'
                ? Math.abs(gestureResult.rightVelocity.y)
                : Math.max(Math.abs(gestureResult.leftVelocity.y), Math.abs(gestureResult.rightVelocity.y))
              
              console.log('🔊 Playing audio:', { event: gestureResult.event, velocity: velocity.toFixed(4) })
              
              // Normalize velocity for audio (threshold: 0.0015, fast: ~0.004-0.006 normalized coords/ms)
              audioManagerRef.current.playGestureSound(gestureResult.event, velocity / 0.004)
            } else {
              console.warn('⚠️ Audio not ready:', {
                hasManager: !!audioManagerRef.current,
                initialized: audioInitialized
              })
            }
          }
          
          // Update drum flash decay
          drumFlashRef.current.left = Math.max(0, drumFlashRef.current.left - 0.06)
          drumFlashRef.current.right = Math.max(0, drumFlashRef.current.right - 0.06)
          
          // Update drum hits state for rendering
          setDrumHits({
            left: drumFlashRef.current.left,
            right: drumFlashRef.current.right
          })
        }

        // Update FPS
        const inferFps = inferFpsRef.current.update(currentTime)
        const renderFps = renderFpsRef.current.update(currentTime)
        setFps({ infer: inferFps, render: renderFps })

        // Generate and print payload (if needed for debugging)
        const calibration: Calibration = { distance: 1.0, azimuth: 0, elevation: 0 }
        const payload: FramePayload = {
          sourceId: 'local-debug',
          ts: performance.timeOrigin + performance.now() / 1000,
          fps: { infer: inferFps, render: renderFps },
          keypoints: smoothedKeypoints,
          calibration,
          meta: {
            ua: navigator.userAgent,
            platform: navigator.platform,
            version: '1.0.0'
          }
        }

        // Uncomment for debugging: console.log('Frame Payload:', payload)
        void payload // Suppress unused variable warning

        // Continue to next frame
        animationFrameRef.current = requestAnimationFrame(runInference)
      } catch (error) {
        console.error('Inference error:', error)
        setInferenceStatus('stopped')
        isInferringRef.current = false
      }
    }

    runInference()
  }, [scoreThreshold, initializeAudio])

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

  // Handle score threshold change
  const handleScoreThresholdChange = useCallback((threshold: number) => {
    setScoreThreshold(threshold)
    // Note: Don't change EMA alpha! It's fixed at 0.3 for smooth visualization
    // Gesture detection uses raw keypoints anyway
  }, [])

  // Initialize
  useEffect(() => {
    initializeDetector(currentModel)
    
    return () => {
      isInferringRef.current = false
      if (detectorRef.current) {
        detectorRef.current.dispose()
      }
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [initializeDetector, currentModel])
  
  // 处理页面可见性变化（恢复音频上下文）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioManagerRef.current) {
        audioManagerRef.current.resume()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <div className="app">
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
              drumHits={drumHits}
            />
          </div>
        </div>

        <div className="control-section">
          <ControlPanel
            onStart={handleStart}
            onStop={handleStop}
            onModelChange={handleModelChange}
            onScoreThresholdChange={handleScoreThresholdChange}
            isRunning={inferenceStatus === 'running'}
            currentModel={currentModel}
            scoreThreshold={scoreThreshold}
            cameraStatus={cameraStatus}
            inferenceStatus={inferenceStatus}
            fps={fps}
            keypointCount={keypoints.length}
            tfBackend={tfBackend}
            inferenceTime={inferenceTime}
          />
        </div>
      </main>

      {/* Hit Statistics Display */}
      {inferenceStatus === 'running' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '10px',
          fontFamily: 'monospace',
          fontSize: '13px',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          minWidth: '180px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', textAlign: 'center' }}>
            🥁 Hit Stats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Left:</span>
              <span style={{ color: '#4facfe', fontWeight: 'bold' }}>{hitStats.left}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Right:</span>
              <span style={{ color: '#ff6b9d', fontWeight: 'bold' }}>{hitStats.right}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Both:</span>
              <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{hitStats.both}</span>
            </div>
            <div style={{ 
              borderTop: '1px solid rgba(255, 255, 255, 0.3)', 
              paddingTop: '4px', 
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Total:</span>
              <span style={{ fontWeight: 'bold' }}>{hitStats.total}</span>
            </div>
          </div>
          {!audioInitialized && (
            <div style={{ 
              marginTop: '8px', 
              padding: '6px', 
              background: 'rgba(255, 165, 0, 0.2)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#ffa500',
              textAlign: 'center'
            }}>
              ⚠️ Audio not ready
            </div>
          )}
        </div>
      )}

      {/* Cleanup the footer, keep minimal if needed */}
      <div style={{ display: 'none' }}>
        {/* Hit Statistics Display - moved to floating overlay */}
      </div>
    </div>
  )
}
