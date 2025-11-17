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

// New drum system imports (simplified for testing)
import { SimpleDrumPlayer } from '@/lib/drums/SimpleDrumPlayer'
import DrumPadDisplay from '@/components/drums/DrumPadDisplay'
import HandPositionDebug from '@/components/drums/HandPositionDebug'
import type { DrumPad } from '@/types/drum'

// LLM chart generation and accompaniment imports
import { DrumGameEngine } from '@/lib/drums/DrumGameEngine'
import { AccompanimentGenerator } from '@/lib/openai/AccompanimentGenerator'
import { AccompanimentPlayer } from '@/lib/accompaniment/AccompanimentPlayer'
import ChartGeneratorPanel from '@/components/ChartGeneratorPanel'
import DrumChartGuide from '@/components/drums/DrumChartGuide'
import type { DrumChart, VisibleDrumNote } from '@/types/drum'
import type { AccompanimentPattern, AccompanimentInstrument } from '@/types/accompaniment'

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
  
  // Game mode selection
  const [gameMode, setGameMode] = useState<'rhythm' | 'drum'>('drum')  // Default to drum mode for testing
  
  // Simple drum test state
  const [drumPads, setDrumPads] = useState<DrumPad[]>([])
  const [currentHitDrumId, setCurrentHitDrumId] = useState<string | null>(null)
  const [showHandDebug, setShowHandDebug] = useState(true)  // Enable debug by default
  const [mirrorX, setMirrorX] = useState(true)  // Mirror X coordinate (default true for front camera)
  const [leftHandDebugPos, setLeftHandDebugPos] = useState<{ x: number; y: number } | null>(null)
  const [rightHandDebugPos, setRightHandDebugPos] = useState<{ x: number; y: number } | null>(null)
  
  // LLM-generated chart state
  const [currentChart, setCurrentChart] = useState<DrumChart | null>(null)
  const [isGeneratingChart, setIsGeneratingChart] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [showChartDebug, setShowChartDebug] = useState(false)
  const [chartDebugText, setChartDebugText] = useState<string | null>(null)
  
  // Accompaniment state (declare before using in effects)
  const [accompanimentPatterns, setAccompanimentPatterns] = useState<Map<AccompanimentInstrument, AccompanimentPattern>>(new Map())
  const [accompanimentEnabled, setAccompanimentEnabled] = useState(true)
  const [accompanimentVolume, setAccompanimentVolume] = useState(0.5)
  
  // Generation progress state
  const [generationProgress, setGenerationProgress] = useState<{
    drumChart: 'idle' | 'generating' | 'completed' | 'error'
    bass: 'idle' | 'generating' | 'completed' | 'error'
    piano: 'idle' | 'generating' | 'completed' | 'error'
  }>({
    drumChart: 'idle',
    bass: 'idle',
    piano: 'idle'
  })
  const [isReadyToStart, setIsReadyToStart] = useState(false)
  
  // Use effect to update isReadyToStart when generation progress changes
  useEffect(() => {
    const drumReady = generationProgress.drumChart === 'completed'
    const bassReady = !accompanimentEnabled || generationProgress.bass === 'completed' || generationProgress.bass === 'error' || generationProgress.bass === 'idle'
    const pianoReady = !accompanimentEnabled || generationProgress.piano === 'completed' || generationProgress.piano === 'error' || generationProgress.piano === 'idle'
    
    if (drumReady && bassReady && pianoReady) {
      setIsReadyToStart(true)
      console.log('All generation complete! Ready to start.', { generationProgress })
    } else {
      setIsReadyToStart(false)
    }
  }, [generationProgress, accompanimentEnabled])
  
  // Drum chart notes for visualization
  const [visibleDrumNotes, setVisibleDrumNotes] = useState<VisibleDrumNote[]>([])
  
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
  const currentChartRef = useRef<DrumChart | null>(null)
  const autoPlayRef = useRef<boolean>(false)
  
  // Rhythm game refs
  const rhythmEngineRef = useRef<RhythmGameEngine | null>(null)
  const chartLoaderRef = useRef<ChartLoader>(new ChartLoader())
  
  // Simple drum player ref
  const simpleDrumPlayerRef = useRef<SimpleDrumPlayer | null>(null)
  const hitDrumFlashRef = useRef<string | null>(null)
  
  // Drum game engine ref (for LLM-generated charts)
  const drumGameEngineRef = useRef<DrumGameEngine | null>(null)
  const accompanimentGeneratorRef = useRef<AccompanimentGenerator | null>(null)
  const accompanimentPlayerRef = useRef<AccompanimentPlayer | null>(null)
  
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

  // Initialize simple drum player
  const initializeDrumPlayer = useCallback(async () => {
    if (!audioManagerRef.current?.isInitialized) {
      await initializeAudio()
    }

    const audioContext = (audioManagerRef.current as any).context
    if (!audioContext) {
      throw new Error('AudioContext not available')
    }

    if (!simpleDrumPlayerRef.current) {
      simpleDrumPlayerRef.current = new SimpleDrumPlayer(audioContext, mirrorX)
      await simpleDrumPlayerRef.current.loadSamples()
      
      const pads = simpleDrumPlayerRef.current.getAllPads()
      setDrumPads(pads)
      console.log('✅ Simple drum player initialized with', pads.length, 'drums')
    } else {
      // Update mirror setting if changed
      simpleDrumPlayerRef.current.setMirrorX(mirrorX)
    }
  }, [initializeAudio, mirrorX])

  // Initialize drum game engine (for LLM-generated charts)
  const initializeDrumGameEngine = useCallback(async () => {
    if (!audioManagerRef.current?.isInitialized) {
      await initializeAudio()
    }

    const audioContext = (audioManagerRef.current as any).context
    if (!audioContext) {
      throw new Error('AudioContext not available')
    }

    if (!drumGameEngineRef.current) {
      drumGameEngineRef.current = new DrumGameEngine(audioContext)
      await drumGameEngineRef.current.loadSamples()
      
      // Get drum pads from DrumGameEngine for UI display
      const pads = drumGameEngineRef.current.getPadManager().getAllPads()
      setDrumPads(pads)
      
      console.log('DrumGameEngine initialized')
    }

    // Initialize accompaniment generator and player
    if (!accompanimentGeneratorRef.current) {
      accompanimentGeneratorRef.current = new AccompanimentGenerator()
    }

    if (!accompanimentPlayerRef.current) {
      accompanimentPlayerRef.current = new AccompanimentPlayer(audioContext)
      accompanimentPlayerRef.current.setVolume(accompanimentVolume)
    }
  }, [initializeAudio, accompanimentVolume])

  // Handle chart generation
  const handleChartGenerated = useCallback(async (chart: DrumChart) => {
    // Check if this is a test chart (theme starts with "test")
    const isTestChart = chart.theme.startsWith('test')
    
    if (isTestChart) {
      console.log('🧪 Test chart detected - skipping accompaniment generation')
    }
    
    // Reset progress state
    setGenerationProgress({
      drumChart: 'completed',
      bass: (!isTestChart && accompanimentEnabled) ? 'generating' : 'idle',
      piano: (!isTestChart && accompanimentEnabled) ? 'generating' : 'idle'
    })
    
    setCurrentChart(chart)
    currentChartRef.current = chart  // Sync ref for use in callbacks
    // Store raw chart JSON for debugging
    try {
      setChartDebugText(JSON.stringify(chart, null, 2))
    } catch {
      setChartDebugText(null)
    }
    
    // Initialize drum game engine if not already initialized
    await initializeDrumGameEngine()
    
    // Set chart in drum game engine
    if (drumGameEngineRef.current) {
      drumGameEngineRef.current.setChart(chart)
      drumGameEngineRef.current.setAutoPlay(autoPlay)
      autoPlayRef.current = autoPlay  // Sync ref
    }

    // Generate accompaniment patterns if enabled AND not a test chart
    if (!isTestChart && accompanimentEnabled && accompanimentGeneratorRef.current) {
      // Generate bass accompaniment
      accompanimentGeneratorRef.current.generatePattern('bass', chart.theme, chart.duration, chart.bpm || 120)
        .then((bassPattern) => {
          if (accompanimentPlayerRef.current) {
            accompanimentPlayerRef.current.loadPattern(bassPattern)
          }
          setAccompanimentPatterns(prev => {
            const updated = new Map(prev)
            updated.set('bass', bassPattern)
            return updated
          })
          setGenerationProgress(prev => ({ ...prev, bass: 'completed' as const }))
        })
        .catch((err) => {
          console.error('Failed to generate bass accompaniment:', err)
          setGenerationProgress(prev => ({ ...prev, bass: 'error' as const }))
        })
      
      // Generate piano accompaniment
      accompanimentGeneratorRef.current.generatePattern('piano', chart.theme, chart.duration, chart.bpm || 120)
        .then((pianoPattern) => {
          if (accompanimentPlayerRef.current) {
            accompanimentPlayerRef.current.loadPattern(pianoPattern)
          }
          setAccompanimentPatterns(prev => {
            const updated = new Map(prev)
            updated.set('piano', pianoPattern)
            return updated
          })
          setGenerationProgress(prev => ({ ...prev, piano: 'completed' as const }))
        })
        .catch((err) => {
          console.error('Failed to generate piano accompaniment:', err)
          setGenerationProgress(prev => ({ ...prev, piano: 'error' as const }))
        })
    } else {
      // No accompaniment needed (test chart or accompaniment disabled), ready to start immediately
      setIsReadyToStart(true)
      console.log('✅ Chart ready to start (no accompaniment).')
    }
  }, [initializeDrumGameEngine, autoPlay, accompanimentEnabled])
  
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

  // Drum mode inference loop
  const runDrumInference = useCallback(() => {
    const loop = async () => {
      if (!videoRef.current || !detectorRef.current || !isInferringRef.current) {
        console.warn('⚠️ Drum inference loop condition failed')
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

        // Gesture detection
        let gestureResult: any = null
        let leftPos: { x: number; y: number } | null = null
        let rightPos: { x: number; y: number } | null = null
        
        if (gestureDetectorRef.current) {
          gestureResult = gestureDetectorRef.current.detect(smoothedKeypoints, currentTime)
          
          // Get hand positions
          const leftHandPos = gestureDetectorRef.current.getLeftHandPosition()
          const rightHandPos = gestureDetectorRef.current.getRightHandPosition()
          
          leftPos = leftHandPos.hasPosition ? { x: leftHandPos.x, y: leftHandPos.y } : null
          rightPos = rightHandPos.hasPosition ? { x: rightHandPos.x, y: rightHandPos.y } : null
          
          // Update debug positions
          setLeftHandDebugPos(leftPos)
          setRightHandDebugPos(rightPos)
        }

        // Update DrumGameEngine if we have a chart
        if (currentChartRef.current && drumGameEngineRef.current && isInferringRef.current) {
          // Update game engine first (this updates currentTime)
          drumGameEngineRef.current.update()
          
          // Update visible drum notes for visualization
          const visibleNotes = drumGameEngineRef.current.getVisibleNotes()
          setVisibleDrumNotes(visibleNotes)
          
          // Debug: Log visible notes state
          if (Math.random() < 0.05) {
            console.log('📝 Visible notes state:', {
              count: visibleNotes.length,
              stateCount: visibleDrumNotes.length,
              firstNote: visibleNotes[0] ? {
                drum: visibleNotes[0].drum,
                time: visibleNotes[0].time.toFixed(2),
                progress: visibleNotes[0].progress.toFixed(2)
              } : null
            })
          }
          
          // Debug: Log gesture result occasionally
          if (Math.random() < 0.02) {
            console.log('🎮 Drum game loop debug:', {
              hasGestureResult: !!gestureResult,
              gestureEvent: gestureResult?.event,
              autoPlay: autoPlayRef.current,
              currentTime: drumGameEngineRef.current.getCurrentTime().toFixed(3),
              visibleNotes: visibleNotes.length
            })
          }
          
          // Process user input if not in auto-play mode
          if (!autoPlayRef.current && gestureDetectorRef.current && gestureResult && gestureResult.event) {
            // Get current game time (in seconds, relative to game start)
            const gameTime = drumGameEngineRef.current.getCurrentTime()
            
            console.log('Processing user input:', {
              gestureEvent: gestureResult.event,
              gameTime,
              leftPos,
              rightPos,
              gameState: drumGameEngineRef.current.getState()
            })
            
            const hit = drumGameEngineRef.current.onUserInput(
              gestureResult.event,
              leftPos,
              rightPos,
              gameTime
            )
            
            if (hit) {
              console.log('Drum hit detected:', hit)
              // Flash effect
              setCurrentHitDrumId(hit.drumId)
              setTimeout(() => setCurrentHitDrumId(null), 200)
              
              // Update drum hits for visual feedback
              if (hit.hand === 'left' || hit.hand === 'both') {
                drumFlashRef.current.left = 1.0
              }
              if (hit.hand === 'right' || hit.hand === 'both') {
                drumFlashRef.current.right = 1.0
              }
            }
          }
          
          // Update drum flash decay (for visual feedback)
          drumFlashRef.current.left = Math.max(0, drumFlashRef.current.left - 0.06)
          drumFlashRef.current.right = Math.max(0, drumFlashRef.current.right - 0.06)
          
          setDrumHits({
            left: drumFlashRef.current.left,
            right: drumFlashRef.current.right
          })
        } else if (simpleDrumPlayerRef.current) {
          // Simple drum mode: process hit
          if (gestureResult?.event && videoRef.current) {
            const { width: screenWidth, height: screenHeight } = getVideoDisplaySize()
            
            // Debug: Log hand positions occasionally
            if (Math.random() < 0.05) {
              console.log('Hand positions:', {
                left: leftPos ? `(${leftPos.x.toFixed(2)}, ${leftPos.y.toFixed(2)})` : 'null',
                right: rightPos ? `(${rightPos.x.toFixed(2)}, ${rightPos.y.toFixed(2)})` : 'null',
                screenSize: `${screenWidth}x${screenHeight}`
              })
            }
            
            const hitDrum = simpleDrumPlayerRef.current.processHit(
              gestureResult.event,
              leftPos,
              rightPos,
              currentTime,
              screenWidth,
              screenHeight
            )
            
            if (hitDrum) {
              // Flash effect
              setCurrentHitDrumId(hitDrum.id)
              hitDrumFlashRef.current = hitDrum.id
              setTimeout(() => {
                if (hitDrumFlashRef.current === hitDrum.id) {
                  setCurrentHitDrumId(null)
                  hitDrumFlashRef.current = null
                }
              }, 200)
              
              // Update drum hits for visual feedback
              if (gestureResult.event === 'hit_left' || gestureResult.event === 'hit_both') {
                drumFlashRef.current.left = 1.0
              }
              if (gestureResult.event === 'hit_right' || gestureResult.event === 'hit_both') {
                drumFlashRef.current.right = 1.0
              }
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
        animationFrameRef.current = requestAnimationFrame(loop)
      } catch (error) {
        console.error('Drum inference error:', error)
        setInferenceStatus('stopped')
        isInferringRef.current = false
      }
    }
    
    loop()
  }, [scoreThreshold])  // Only scoreThreshold needed, others use refs

  // Get video display size (actual rendered size, not video resolution)
  const getVideoDisplaySize = useCallback(() => {
    if (!videoRef.current) {
      return { width: 640, height: 480 }
    }
    return {
      width: videoRef.current.clientWidth || 640,
      height: videoRef.current.clientHeight || 480
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

  // Start inference
  const handleStart = useCallback(async () => {
    console.log('handleStart called', { 
      gameMode, 
      hasChart: !!currentChart,
      isReadyToStart,
      hasDrumGameEngine: !!drumGameEngineRef.current,
      hasSimpleDrumPlayer: !!simpleDrumPlayerRef.current
    })
    
    if (!videoRef.current || !detectorRef.current) {
      console.warn('Cannot start: video or detector not ready')
      return
    }

    if (gameMode === 'drum') {
      // Check if we have a generated chart
      if (currentChart) {
        // Check if generation is complete
        if (!isReadyToStart) {
          alert('Please wait for chart generation to complete before starting.')
          return
        }
        console.log('Chart mode: Initializing drum game engine...')
        // Start DrumGameEngine with chart
        try {
          // Ensure drum game engine is initialized
          if (!drumGameEngineRef.current) {
            await initializeDrumGameEngine()
          }
          
          if (!drumGameEngineRef.current) {
            throw new Error('Failed to initialize DrumGameEngine')
          }
          
          // Ensure chart is set (in case it wasn't set during generation)
          if (!drumGameEngineRef.current.getChart()) {
            drumGameEngineRef.current.setChart(currentChart)
            drumGameEngineRef.current.setAutoPlay(autoPlay)
          }
          
          // Ensure audio context is resumed (required for autoplay policy)
          if (audioManagerRef.current?.isInitialized) {
            const audioContext = (audioManagerRef.current as any).context
            if (audioContext && audioContext.state === 'suspended') {
              await audioContext.resume()
              console.log('Audio context resumed')
            }
          }
          
          // Start drum game engine first
          console.log('Starting drum game engine...')
          drumGameEngineRef.current.start()
          
          // Get the audio context start time for synchronization
          const audioContext = (audioManagerRef.current as any).context
          const gameStartTime = audioContext ? audioContext.currentTime : 0
          
          // Start accompaniment if enabled and patterns are loaded (after drum game starts)
          if (accompanimentEnabled && accompanimentPlayerRef.current) {
            // Start patterns immediately (startTime = 0 means start at currentTime)
            const startTime = 0
            console.log('Starting accompaniment at audio context time:', gameStartTime)
            // Only start patterns that have been loaded
            if (accompanimentPatterns.has('bass')) {
              console.log('Starting bass accompaniment...')
              accompanimentPlayerRef.current.startPattern('bass', startTime)
            }
            if (accompanimentPatterns.has('piano')) {
              console.log('Starting piano accompaniment...')
              accompanimentPlayerRef.current.startPattern('piano', startTime)
            }
          }
          
          setInferenceStatus('running')
          isInferringRef.current = true
          inferFpsRef.current.reset()
          renderFpsRef.current.reset()
          
          // Reset gesture detector
          if (gestureDetectorRef.current) {
            gestureDetectorRef.current.reset()
          }
          
          console.log('Starting drum game engine with chart - inference loop starting')
          runDrumInference()
        } catch (error) {
          console.error('Failed to start drum game engine:', error)
          alert('Failed to start drum game. Please check console for details.')
        }
      } else {
        // Simple drum mode: initialize drum player and start inference
        console.log('Simple drum mode: Initializing drum player...')
        try {
          await initializeDrumPlayer()
          setInferenceStatus('running')
          isInferringRef.current = true
          inferFpsRef.current.reset()
          renderFpsRef.current.reset()
          
          // Reset gesture detector
          if (gestureDetectorRef.current) {
            gestureDetectorRef.current.reset()
          }
          
          console.log('Starting simple drum mode inference...')
          runDrumInference()
        } catch (error) {
          console.error('Failed to start drum mode:', error)
          alert('Failed to initialize drum player. Please check console for details.')
        }
      }
    } else {
      // Rhythm game mode
      // Initialize audio
      await initializeAudio()

      // Show song selector if no song is selected
      if (!selectedSong) {
        setShowSongSelector(true)
        return
      }

      // If song is selected, start the rhythm game
      await startRhythmGame()
    }
  }, [
    gameMode,
    initializeAudio,
    initializeDrumPlayer,
    initializeDrumGameEngine,
    runDrumInference,
    selectedSong,
    startRhythmGame,
    currentChart,
    accompanimentEnabled,
    isReadyToStart
  ])

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
    
    // Stop drum game engine if running
    if (drumGameEngineRef.current) {
      drumGameEngineRef.current.stop()
      console.log('Drum game engine stopped')
    }
    
    // Stop accompaniment
    if (accompanimentPlayerRef.current) {
      accompanimentPlayerRef.current.stopAll()
    }
    
    // Reset drum player
    if (simpleDrumPlayerRef.current) {
      simpleDrumPlayerRef.current.reset()
      setCurrentHitDrumId(null)
      hitDrumFlashRef.current = null
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
  
  // Auto show song selector when camera is ready (rhythm mode only)
  useEffect(() => {
    if (gameMode === 'rhythm' && cameraStatus === 'capturing' && !selectedSong && !showSongSelector && inferenceStatus === 'stopped') {
      setShowSongSelector(true)
    }
  }, [gameMode, cameraStatus, selectedSong, showSongSelector, inferenceStatus])
  
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
            
            {/* Note Track (Rhythm Mode) */}
            {gameMode === 'rhythm' && inferenceStatus === 'running' && videoRef.current && (() => {
              const { width, height } = getVideoDisplaySize()
              return (
                <NoteTrack
                  visibleNotes={visibleNotes}
                  videoWidth={width}
                  videoHeight={height}
                />
              )
            })()}
            
            {/* Drum Pad Display (Drum Mode) */}
            {gameMode === 'drum' && inferenceStatus === 'running' && videoRef.current && (() => {
              const { width, height } = getVideoDisplaySize()
              return (
                <>
                  {drumPads.length > 0 && (
                    <DrumPadDisplay
                      pads={drumPads}
                      videoWidth={width}
                      videoHeight={height}
                      hitDrumId={currentHitDrumId}
                    />
                  )}
                  {/* Drum Chart Guide - shows falling notes */}
                  {currentChart && drumGameEngineRef.current && drumPads.length > 0 ? (
                    <DrumChartGuide
                      notes={visibleDrumNotes}
                      pads={drumPads}
                      videoWidth={width}
                      videoHeight={height}
                    />
                  ) : (
                    // Debug: Log why DrumChartGuide is not rendering
                    (() => {
                      console.log('❌ DrumChartGuide not rendering:', {
                        hasChart: !!currentChart,
                        hasEngine: !!drumGameEngineRef.current,
                        padsCount: drumPads.length,
                        inferenceStatus
                      })
                      return null
                    })()
                  )}
                  {/* Hand Position Debug */}
                  {showHandDebug && (
                    <HandPositionDebug
                      leftHandPos={leftHandDebugPos}
                      rightHandPos={rightHandDebugPos}
                      videoWidth={width}
                      videoHeight={height}
                      enabled={showHandDebug}
                      mirrorX={mirrorX}
                    />
                  )}
                </>
              )
            })()}
            
            {/* Mode Indicator */}
            {cameraStatus === 'capturing' && inferenceStatus !== 'running' && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                zIndex: 100
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                  border: gameMode === 'drum' 
                    ? '2px solid rgba(79, 172, 254, 0.5)' 
                    : '2px solid rgba(255, 107, 157, 0.5)'
                }}>
                  {gameMode === 'drum' ? '🥁 Drum Mode' : '🎵 Rhythm Mode'}
                </div>
                
                {/* Mode Toggle Button */}
                <button
                  onClick={() => setGameMode(gameMode === 'drum' ? 'rhythm' : 'drum')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Switch Mode
                </button>
              </div>
            )}
            
            {/* Old Mode Indicator (removed) */}
            {false && cameraStatus === 'capturing' && inferenceStatus !== 'running' && (
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
            
            {/* Song Selector (Rhythm Mode Only) */}
            {gameMode === 'rhythm' && showSongSelector && (
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
          {/* Chart Generator Panel (Drum Mode Only) */}
          {gameMode === 'drum' && cameraStatus === 'capturing' && inferenceStatus !== 'running' && (
            <ChartGeneratorPanel
              onChartGenerated={handleChartGenerated}
              isGenerating={isGeneratingChart}
              onGeneratingChange={setIsGeneratingChart}
              generationProgress={generationProgress}
              isReadyToStart={isReadyToStart}
            />
          )}
          
          {/* Chart Controls & Debug (Drum Mode Only) */}
          {gameMode === 'drum' && currentChart && (
            <>
              <div style={{
                padding: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                marginBottom: '16px'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Chart Controls</h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoPlay}
                      onChange={(e) => {
                        const newValue = e.target.checked
                        setAutoPlay(newValue)
                        autoPlayRef.current = newValue  // Sync ref
                        if (drumGameEngineRef.current) {
                          drumGameEngineRef.current.setAutoPlay(newValue)
                        }
                      }}
                    />
                    <span>Auto-Play Mode</span>
                  </label>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={accompanimentEnabled}
                      onChange={(e) => setAccompanimentEnabled(e.target.checked)}
                    />
                    <span>Enable Accompaniment</span>
                  </label>
                </div>
                {accompanimentEnabled && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px' }}>
                      Accompaniment Volume: {(accompanimentVolume * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={accompanimentVolume}
                      onChange={(e) => {
                        const vol = parseFloat(e.target.value)
                        setAccompanimentVolume(vol)
                        if (accompanimentPlayerRef.current) {
                          accompanimentPlayerRef.current.setVolume(vol)
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
                <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
                  Chart: {currentChart.theme} ({currentChart.difficulty}) - {currentChart.notes.length} notes
                </div>
              </div>

              {/* Chart Debug Panel (collapsible) */}
              {chartDebugText && (
                <div style={{
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f5f5f5',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>Chart Debug (Raw JSON)</h4>
                    <button
                      onClick={() => setShowChartDebug(prev => !prev)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {showChartDebug ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showChartDebug && (
                    <pre style={{
                      maxHeight: '200px',
                      overflow: 'auto',
                      backgroundColor: '#1e1e1e',
                      color: '#dcdcdc',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      margin: 0
                    }}>
{chartDebugText}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Select Song Button (Rhythm Mode Only) */}
          {gameMode === 'rhythm' && cameraStatus === 'capturing' && inferenceStatus !== 'running' && !showSongSelector && (
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
          
          {/* Drum Mode Info */}
          {gameMode === 'drum' && cameraStatus === 'capturing' && inferenceStatus !== 'running' && (
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                🥁 Drum Mode
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '12px' }}>
                Click "Start Inference" to begin playing drums!
                <br />
                Move your hands to different drum positions and hit down.
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={showHandDebug}
                    onChange={(e) => setShowHandDebug(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Show hand position debug (red=L, blue=R)
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={mirrorX}
                    onChange={(e) => {
                      setMirrorX(e.target.checked)
                      if (simpleDrumPlayerRef.current) {
                        simpleDrumPlayerRef.current.setMirrorX(e.target.checked)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  Mirror X coordinate (fix left/right swap)
                </label>
              </div>
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
            disableStart={gameMode === 'drum' && !!currentChart && !isReadyToStart}
            disableStartReason={gameMode === 'drum' && !!currentChart && !isReadyToStart ? 'Waiting for chart generation to complete...' : undefined}
            inferenceTime={inferenceTime}
          />
        </div>
      </main>
      
      {/* Progress Bar (Rhythm Mode Only) */}
      {gameMode === 'rhythm' && inferenceStatus === 'running' && selectedSong && (
        <ProgressBar
          currentTime={gameCurrentTime}
          duration={gameDuration}
          stats={rhythmGameStats}
          songName={selectedSong?.name}
          difficulty={selectedDifficulty}
        />
      )}
      
      {/* Judgment Feedback (Rhythm Mode Only) */}
      {gameMode === 'rhythm' && currentJudge && currentJudge.result && (
        <JudgeFeedback
          result={currentJudge.result}
          timingError={currentJudge.timingError}
        />
      )}

    </div>
  )
}
