import { useRef, useEffect, useState, useCallback } from 'react'
import type { MicrophoneStatus } from '@/types/pose'

interface AudioWaveformProps {
  onStatusChange?: (status: MicrophoneStatus) => void
  onError: (error: string) => void
}

export default function AudioWaveform({ onStatusChange, onError }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<MicrophoneStatus>('idle')
  const [error, setError] = useState<string>('')
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Notify parent component of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status)
    }
  }, [status, onStatusChange])

  const setupCanvas = useCallback(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // Set canvas actual drawing size
    canvas.width = rect.width
    canvas.height = rect.height
    
    console.log('Canvas size set:', canvas.width, 'x', canvas.height)
  }, [])

  const startDrawing = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!analyserRef.current) return

      animationFrameRef.current = requestAnimationFrame(draw)

      analyser.getByteTimeDomainData(dataArray)

      // Draw background - dark gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      bgGradient.addColorStop(0, '#001a0f')      // Deep green-black
      bgGradient.addColorStop(0.5, '#000a05')    // Very deep green-black
      bgGradient.addColorStop(1, '#001410')      // Deep green-black
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add grid lines effect
      ctx.strokeStyle = 'rgba(0, 105, 62, 0.08)'
      ctx.lineWidth = 1
      const gridLines = 5
      for (let i = 1; i < gridLines; i++) {
        const y = (canvas.height / gridLines) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      const sliceWidth = canvas.width / bufferLength
      let x = 0

      // Draw waveform shadow (outer glow effect)
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(0, 166, 81, 0.6)'
      ctx.lineWidth = 3
      
      // Create waveform gradient
      const waveGradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      waveGradient.addColorStop(0, '#00A651')    // Green
      waveGradient.addColorStop(0.5, '#00FF7F')  // Bright green
      waveGradient.addColorStop(1, '#00A651')    // Green
      
      ctx.strokeStyle = waveGradient
      ctx.beginPath()

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()

      // Reset shadow
      ctx.shadowBlur = 0

      // Draw center line
      ctx.strokeStyle = 'rgba(0, 166, 81, 0.25)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Add top and bottom border highlights
      const topGradient = ctx.createLinearGradient(0, 0, 0, 20)
      topGradient.addColorStop(0, 'rgba(0, 166, 81, 0.15)')
      topGradient.addColorStop(1, 'rgba(0, 166, 81, 0)')
      ctx.fillStyle = topGradient
      ctx.fillRect(0, 0, canvas.width, 20)

      const bottomGradient = ctx.createLinearGradient(0, canvas.height - 20, 0, canvas.height)
      bottomGradient.addColorStop(0, 'rgba(0, 166, 81, 0)')
      bottomGradient.addColorStop(1, 'rgba(0, 166, 81, 0.15)')
      ctx.fillStyle = bottomGradient
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20)
    }

    draw()
  }, [])

  const startMicrophone = useCallback(async () => {
    try {
      setStatus('requesting')
      setError('')

      // Get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream

      // Create Audio Context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      // Create analyser
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser

      // Connect audio stream
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      setStatus('recording')
      
      // Wait for CSS transition to complete before setting canvas size and starting drawing
      // Use setTimeout to wait long enough (500ms > CSS transition 400ms)
      setTimeout(() => {
        setupCanvas()
        startDrawing()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Microphone access failed'
      setError(errorMessage)
      setStatus('error')
      onError(errorMessage)
    }
  }, [onError, setupCanvas, startDrawing])

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    analyserRef.current = null
    setStatus('idle')

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      stopMicrophone()
    }
  }, [stopMicrophone])

  return (
    <div className={`audio-waveform ${status === 'recording' ? 'audio-waveform-active' : ''}`}>
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        style={{
          display: status === 'recording' ? 'block' : 'none'
        }}
      />
      
      {status === 'idle' && (
        <div className="audio-placeholder">
          <button 
            onClick={startMicrophone}
            className="start-mic-btn"
          >
            Start Microphone
          </button>
        </div>
      )}

      {status === 'requesting' && (
        <div className="audio-placeholder">
          <div className="loading">
            <div className="spinner"></div>
            <span>Requesting microphone permission...</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="audio-placeholder audio-error">
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
          <button onClick={startMicrophone} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {status === 'recording' && (
        <div className="audio-controls">
          <button onClick={stopMicrophone} className="stop-mic-btn">
            Stop Microphone
          </button>
        </div>
      )}
    </div>
  )
}

