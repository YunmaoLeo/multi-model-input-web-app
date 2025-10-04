import type { CameraStatus, MicrophoneStatus, InferenceStatus, FPSInfo } from '@/types/pose'

interface StatusBarProps {
  cameraStatus: CameraStatus
  microphoneStatus: MicrophoneStatus
  inferenceStatus: InferenceStatus
  fps: FPSInfo
  keypointCount: number
  tfBackend: string
  inferenceTime: number
}

export default function StatusBar({ 
  cameraStatus,
  microphoneStatus,
  inferenceStatus, 
  fps, 
  keypointCount,
  tfBackend,
  inferenceTime
}: StatusBarProps) {
  const getStatusText = (status: CameraStatus | MicrophoneStatus | InferenceStatus): string => {
    const statusMap = {
      idle: 'Idle',
      requesting: 'Requesting',
      capturing: 'Capturing',
      recording: 'Recording',
      paused: 'Paused',
      error: 'Error',
      stopped: 'Stopped',
      running: 'Running'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: CameraStatus | MicrophoneStatus | InferenceStatus): string => {
    const colorMap = {
      idle: '#666',
      requesting: '#ffa500',
      capturing: '#00ff00',
      recording: '#00ff00',
      paused: '#ffff00',
      error: '#ff0000',
      stopped: '#666',
      running: '#00ff00'
    }
    return colorMap[status] || '#666'
  }

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">Camera</span>
        <span 
          className={`status-value status-badge ${cameraStatus === 'capturing' ? 'pulse-badge' : ''}`}
          style={{ backgroundColor: getStatusColor(cameraStatus) }}
        >
          {getStatusText(cameraStatus)}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">Microphone</span>
        <span 
          className={`status-value status-badge ${microphoneStatus === 'recording' ? 'pulse-badge' : ''}`}
          style={{ backgroundColor: getStatusColor(microphoneStatus) }}
        >
          {getStatusText(microphoneStatus)}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">Inference</span>
        <span 
          className={`status-value status-badge ${inferenceStatus === 'running' ? 'pulse-badge' : ''}`}
          style={{ backgroundColor: getStatusColor(inferenceStatus) }}
        >
          {getStatusText(inferenceStatus)}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">Infer FPS</span>
        <span className="status-value fps-value">{fps.infer}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Render FPS</span>
        <span className="status-value fps-value">{fps.render}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Keypoints</span>
        <span className="status-value keypoint-count">{keypointCount}</span>
      </div>

      <div className="status-item">
        <span className="status-label">TF Backend</span>
        <span className="status-value backend-value">{tfBackend}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Inference Time</span>
        <span className="status-value inference-time-value">{inferenceTime.toFixed(1)}ms</span>
      </div>
    </div>
  )
}
