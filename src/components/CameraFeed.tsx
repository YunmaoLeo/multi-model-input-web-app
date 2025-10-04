import { useRef, useEffect, useState, useCallback } from 'react'
import type { CameraStatus } from '@/types/pose'

interface CameraFeedProps {
  onVideoReady: (video: HTMLVideoElement) => void
  onError: (error: string) => void
  onStatusChange?: (status: CameraStatus) => void
}

export default function CameraFeed({ onVideoReady, onError, onStatusChange }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string>('')

  // Notify parent component of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status)
    }
  }, [status, onStatusChange])

  const startCamera = useCallback(async () => {
    try {
      setStatus('requesting')
      setError('')

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front-facing camera
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        
        videoRef.current.onloadedmetadata = () => {
          setStatus('capturing')
          onVideoReady(videoRef.current!)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access failed'
      setError(errorMessage)
      setStatus('error')
      onError(errorMessage)
    }
  }, [onVideoReady, onError])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setStatus('idle')
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className={`camera-feed ${status === 'capturing' ? 'camera-feed-active' : ''}`}>
      <video
        ref={videoRef}
        className="camera-video"
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: 'auto',
          transform: 'scaleX(-1)', // Mirror display
          borderRadius: '8px',
          display: status === 'capturing' ? 'block' : 'none'
        }}
      />
      
      {status === 'idle' && (
        <div className="camera-placeholder">
          <div className="camera-icon"></div>
          <p className="camera-hint">Camera not started. Click the button to begin.</p>
          <button 
            onClick={startCamera}
            className="start-camera-btn pulse-btn"
          >
            Start Camera
          </button>
        </div>
      )}

      {status === 'requesting' && (
        <div className="camera-placeholder">
          <div className="loading">
            <div className="spinner"></div>
            <span>Requesting camera permission...</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="camera-placeholder camera-error">
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
          <button onClick={startCamera} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {status === 'capturing' && (
        <div className="camera-controls">
          <button onClick={stopCamera} className="stop-camera-btn">
            Stop Camera
          </button>
        </div>
      )}
    </div>
  )
}
