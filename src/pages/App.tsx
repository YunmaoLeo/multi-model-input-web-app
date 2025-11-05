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
  ModelType, 
  CameraStatus,
  InferenceStatus
} from '@/types/pose'

// Rhythm game imports
import { RhythmGameEngine } from '@/lib/rhythm/RhythmGameEngine'
import { ChartLoader } from '@/lib/rhythm/ChartLoader'
import ProgressBar from '@/components/rhythm/ProgressBar'
import NoteTrack from '@/components/rhythm/NoteTrack'
import JudgeFeedback from '@/components/rhythm/JudgeFeedback'
import SongSelector from '@/components/rhythm/SongSelector'
import type { SongConfig, JudgeInfo, GameStats, VisibleNote } from '@/types/rhythm'

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
  
  // Gesture and audio state
  const [drumHits, setDrumHits] = useState<{ left: number; right: number }>({ left: 0, right: 0 })
  
  // Rhythm game state
  const [showSongSelector, setShowSongSelector] = useState(false)
  const [selectedSong, setSelectedSong] = useState<SongConfig | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')
  const [isLoadingSong, setIsLoadingSong] = useState(false)
  const [rhythmGameStats, setRhythmGameStats] = useState<GameStats>({
    perfect: 0,
    good: 0,
    miss: 0,
    combo: 0,
    maxCombo: 0,
    score: 0,
    accuracy: 1.0
  })
  const [visibleNotes, setVisibleNotes] = useState<VisibleNote[]>([])
  const [currentJudge, setCurrentJudge] = useState<JudgeInfo | null>(null)
  const [gameCurrentTime, setGameCurrentTime] = useState(0)
  const [gameDuration, setGameDuration] = useState(0)

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
  
  // Rhythm game refs
  const rhythmEngineRef = useRef<RhythmGameEngine | null>(null)
  const chartLoaderRef = useRef<ChartLoader>(new ChartLoader())
  
  // Available songs
  const availableSongs: SongConfig[] = [
    {
      id: 'test-demo',
      name: 'Test Demo Drums',
      artist: 'Alge',
      audioPath: '/assets/soundtracks/test demo_drums - Alge.mp3',
      bpm: 161.5,
      duration: 102,
      charts: {
        easy: '/charts/test-demo-easy.json',
        normal: '/charts/test-demo-normal.json',
        hard: '/charts/test-demo-hard.json'
      }
    }
  ]

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
      smootherRef.current = new EMASmoother(0.7)
    }
    
    // Initialize gesture detector
    if (!gestureDetectorRef.current) {
      gestureDetectorRef.current = new GestureDetector()
    }
    
    // Initialize audio manager
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager()
    }
  }, [])
  
  // Initialize audio (requires user interaction)
  const initializeAudio = useCallback(async () => {
    console.log('🎵 initializeAudio called', {
      hasAudioManager: !!audioManagerRef.current
    })
    
    if (audioManagerRef.current?.isInitialized) {
      console.log('⏭️ Audio already initialized')
      return
    }
    
    if (!audioManagerRef.current) {
      console.error('❌ Audio manager not created')
      return
    }
    
    try {
      console.log('🔄 Initializing audio...')
      await audioManagerRef.current.initialize()
      console.log('✅ Audio system activated!')
    } catch (error) {
      console.error('❌ Audio initialization failed:', error)
    }
  }, [])
  
  // Load and start rhythm game
  const startRhythmGame = useCallback(async () => {
    if (!selectedSong) {
      console.error('❌ Cannot start game: No song selected')
      return
    }
    
    setIsLoadingSong(true)
    
    try {
      // Ensure audio system is initialized
      if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager()
      }
      
      if (!audioManagerRef.current.isInitialized) {
        await audioManagerRef.current.initialize()
      }
      
      // Get AudioContext
      const audioContext = (audioManagerRef.current as any).context
      if (!audioContext) {
        throw new Error('AudioContext not available')
      }
      
      console.log('🎮 Loading song...', {
        song: selectedSong.name,
        difficulty: selectedDifficulty
      })
      
      // Load chart and audio
      const { chart, audioBuffer } = await chartLoaderRef.current.loadSong(
        audioContext,
        selectedSong,
        selectedDifficulty
      )
      
      // Create game engine
      if (rhythmEngineRef.current) {
        rhythmEngineRef.current.dispose()
      }
      
      rhythmEngineRef.current = new RhythmGameEngine(chart, audioBuffer, audioContext)
      
      // Set up callbacks
      rhythmEngineRef.current.onJudge((judgeInfo) => {
        setCurrentJudge(judgeInfo)
        // Feedback auto-clears
        setTimeout(() => setCurrentJudge(null), 800)
      })
      
      rhythmEngineRef.current.onStatsUpdate((stats) => {
        setRhythmGameStats(stats)
      })
      
      rhythmEngineRef.current.onGameEnd((stats) => {
        console.log('🏁 Game ended', stats)
        setInferenceStatus('stopped')
        isInferringRef.current = false
        
        // Show results
        alert(`Game Over!\n\nScore: ${stats.score}\nPerfect: ${stats.perfect}\nGood: ${stats.good}\nMiss: ${stats.miss}\nMax Combo: ${stats.maxCombo}\nAccuracy: ${(stats.accuracy * 100).toFixed(1)}%`)
      })
      
      setGameDuration(audioBuffer.duration)
      setIsLoadingSong(false)
      setShowSongSelector(false)
      
      console.log('✅ Game ready')
      
      // Check if camera and detector are ready before starting
      if (!videoRef.current || !detectorRef.current) {
        alert('Camera not ready. Please start camera first.')
        setIsLoadingSong(false)
        throw new Error('Camera not ready')
      }
      
      // Start the game engine
      rhythmEngineRef.current.start()
      
      // Set inference status
      setInferenceStatus('running')
      isInferringRef.current = true
      inferFpsRef.current.reset()
      renderFpsRef.current.reset()
      
      // Reset gesture detector
      if (gestureDetectorRef.current) {
        gestureDetectorRef.current.reset()
      }
      
      console.log('🎬 Starting inference loop...')
      
      // Start inference loop
      const runInferenceForGame = async () => {
        if (!videoRef.current || !detectorRef.current || !isInferringRef.current) {
          console.warn('⚠️ Inference loop condition failed:', {
            hasVideo: !!videoRef.current,
            hasDetector: !!detectorRef.current,
            isInferring: isInferringRef.current
          })
          return
        }

        try {
          const currentTime = performance.now()
          
          // Pose inference
          const inferStart = performance.now()
          const rawKeypoints = await detectorRef.current.estimatePoses(videoRef.current)
          const inferEnd = performance.now()
          const inferTime = inferEnd - inferStart
          
          setInferenceTime(inferTime)
          
          // Apply smoothing
          const smoothedKeypoints = processKeypoints(
            rawKeypoints,
            smootherRef.current!,
            scoreThreshold
          )
          
          setKeypoints(smoothedKeypoints)

          // Update rhythm game engine
          if (rhythmEngineRef.current) {
            rhythmEngineRef.current.update()
            setVisibleNotes(rhythmEngineRef.current.getVisibleNotes())
            setGameCurrentTime(rhythmEngineRef.current.getCurrentTime())
          }

          // Gesture detection
          if (gestureDetectorRef.current && rhythmEngineRef.current) {
            const gestureResult = gestureDetectorRef.current.detect(smoothedKeypoints, currentTime)
            
            if (gestureResult.event) {
              const gameTime = rhythmEngineRef.current.getCurrentTime()
              const judgeInfo = rhythmEngineRef.current.onUserInput(gestureResult.event, gameTime)
              
              if (judgeInfo) {
                console.log(`🎯 ${judgeInfo.result?.toUpperCase()}:`, {
                  timing: judgeInfo.timingError.toFixed(0) + 'ms',
                  note: judgeInfo.note.type
                })
              }
              
              // Trigger drum flash effect
              if (gestureResult.event === 'hit_left' || gestureResult.event === 'hit_both') {
                drumFlashRef.current.left = 1.0
              }
              if (gestureResult.event === 'hit_right' || gestureResult.event === 'hit_both') {
                drumFlashRef.current.right = 1.0
              }
            }
            
            // Update drum flash decay
            drumFlashRef.current.left = Math.max(0, drumFlashRef.current.left - 0.06)
            drumFlashRef.current.right = Math.max(0, drumFlashRef.current.right - 0.06)
            
            setDrumHits({
              left: drumFlashRef.current.left,
              right: drumFlashRef.current.right
            })
          }

          // Update FPS
          const inferFps = inferFpsRef.current.update(currentTime)
          const renderFps = renderFpsRef.current.update(currentTime)
          setFps({ infer: inferFps, render: renderFps })

          // Continue to next frame
          animationFrameRef.current = requestAnimationFrame(runInferenceForGame)
        } catch (error) {
          console.error('Inference error:', error)
          setInferenceStatus('stopped')
          isInferringRef.current = false
        }
      }

      console.log('🎮 About to start inference loop with:', {
        hasVideo: !!videoRef.current,
        hasDetector: !!detectorRef.current,
        isInferring: isInferringRef.current
      })
      
      runInferenceForGame()
      
      console.log('🎮 Inference loop started!')
      
    } catch (error) {
      console.error('❌ Failed to start game:', error)
      alert('Failed to start game. Please check if audio files and charts exist.')
      setIsLoadingSong(false)
    }
  }, [selectedSong, selectedDifficulty, scoreThreshold])

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

  // Start inference (rhythm game mode only)
  const handleStart = useCallback(async () => {
    console.log('🚀 handleStart called')
    
    if (!videoRef.current || !detectorRef.current) {
      console.warn('Cannot start: video or detector not ready')
      return
    }

    // Initialize audio
    await initializeAudio()

    // Show song selector if no song is selected
    if (!selectedSong) {
      setShowSongSelector(true)
      return
    }

    // If song is selected, start the rhythm game
    await startRhythmGame()
  }, [initializeAudio, selectedSong, startRhythmGame])

  // Stop inference
  const handleStop = useCallback(() => {
    console.log('Stopping...')
    setInferenceStatus('stopped')
    isInferringRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Stop rhythm game if running
    if (rhythmEngineRef.current) {
      rhythmEngineRef.current.stop()
      rhythmEngineRef.current.dispose()
      rhythmEngineRef.current = null
      console.log('Rhythm game stopped')
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
  }, [])

  // Initialize detector (only runs once on mount or when model changes)
  useEffect(() => {
    initializeDetector(currentModel)
  }, [initializeDetector, currentModel])
  
  // Auto show song selector when camera is ready
  useEffect(() => {
    if (cameraStatus === 'capturing' && !selectedSong && !showSongSelector && inferenceStatus === 'stopped') {
      setShowSongSelector(true)
    }
  }, [cameraStatus, selectedSong, showSongSelector, inferenceStatus])
  
  // Cleanup on unmount
  useEffect(() => {
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
  }, [])
  
  // Handle page visibility change (resume audio context)
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
            
            {/* Note Track */}
            {inferenceStatus === 'running' && videoRef.current && (
              <NoteTrack
                visibleNotes={visibleNotes}
                videoWidth={videoRef.current.videoWidth || 640}
                videoHeight={videoRef.current.videoHeight || 480}
              />
            )}
            
            {/* Drum Mode Indicator */}
            {cameraStatus === 'capturing' && inferenceStatus !== 'running' && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                padding: '12px 24px',
                borderRadius: '30px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(255, 107, 157, 0.5)',
                zIndex: 15
              }}>
                🥁 Drum Mode
              </div>
            )}
            
            {/* Song Selector */}
            {showSongSelector && (
              <SongSelector
                songs={availableSongs}
                selectedSong={selectedSong}
                selectedDifficulty={selectedDifficulty}
                onSelectSong={setSelectedSong}
                onSelectDifficulty={setSelectedDifficulty}
                onStart={startRhythmGame}
                onClose={() => setShowSongSelector(false)}
                isLoading={isLoadingSong}
              />
            )}
          </div>
        </div>

        <div className="control-section">
          {/* Select Song Button */}
          {cameraStatus === 'capturing' && inferenceStatus !== 'running' && !showSongSelector && (
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowSongSelector(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #ff6b9d 0%, #ff9a76 100%)',
                  border: '2px solid #ff6b9d',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255, 107, 157, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 157, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 157, 0.4)'
                }}
              >
                🎮 Select Song & Start Game
              </button>
            </div>
          )}
          
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
      
      {/* Progress Bar */}
      {inferenceStatus === 'running' && selectedSong && (
        <ProgressBar
          currentTime={gameCurrentTime}
          duration={gameDuration}
          stats={rhythmGameStats}
          songName={selectedSong?.name}
          difficulty={selectedDifficulty}
        />
      )}
      
      {/* Judgment Feedback */}
      {currentJudge && currentJudge.result && (
        <JudgeFeedback
          result={currentJudge.result}
          timingError={currentJudge.timingError}
        />
      )}

    </div>
  )
}
