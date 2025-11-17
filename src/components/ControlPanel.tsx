import type { ModelType, CameraStatus, InferenceStatus, FPSInfo } from '@/types/pose'

interface ControlPanelProps {
  onStart: () => void
  onStop: () => void
  onModelChange: (model: ModelType) => void
  onScoreThresholdChange: (threshold: number) => void
  isRunning: boolean
  currentModel: ModelType
  scoreThreshold: number
  // Status info
  cameraStatus: CameraStatus
  inferenceStatus: InferenceStatus
  fps: FPSInfo
  keypointCount: number
  tfBackend: string
  inferenceTime: number
  // Optional: disable start button (e.g., when generation not complete)
  disableStart?: boolean
  disableStartReason?: string
}

export default function ControlPanel({
  onStart,
  onStop,
  onModelChange,
  onScoreThresholdChange,
  isRunning,
  currentModel,
  scoreThreshold,
  cameraStatus,
  inferenceStatus,
  fps,
  keypointCount,
  tfBackend,
  inferenceTime,
  disableStart = false,
  disableStartReason
}: ControlPanelProps) {
  
  const getStatusColor = (status: CameraStatus | InferenceStatus): string => {
    const colorMap = {
      idle: '#999',
      requesting: '#ffa500',
      capturing: '#00A651',
      paused: '#ffff00',
      error: '#ff0000',
      stopped: '#999',
      running: '#00A651'
    }
    return colorMap[status] || '#999'
  }

  return (
    <div className="control-panel">
      <h3>
        Control Panel
      </h3>
      
      {/* 开始/停止按钮 */}
      <div className="control-group">
        <button
          onClick={isRunning ? onStop : onStart}
          disabled={!isRunning && disableStart}
          className={`control-btn ${isRunning ? 'stop' : 'start'} ${isRunning ? 'pulse-active' : ''} ${!isRunning && disableStart ? 'disabled' : ''}`}
          title={!isRunning && disableStart ? disableStartReason : undefined}
          style={{
            opacity: !isRunning && disableStart ? 0.5 : 1,
            cursor: !isRunning && disableStart ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Stop Inference' : 'Start Inference'}
        </button>
        {!isRunning && disableStart && disableStartReason && (
          <div style={{
            marginTop: '8px',
            padding: '6px 10px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#856404'
          }}>
            {disableStartReason}
          </div>
        )}
      </div>

      {/* 模型选择 */}
      <div className="control-group">
        <label>
          Model Selection
        </label>
        <select
          value={currentModel}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
          disabled={isRunning}
          className="styled-select"
        >
          <option value="movenet-lightning">MoveNet Lightning</option>
          <option value="movenet-thunder">MoveNet Thunder</option>
        </select>
      </div>

      {/* Confidence Threshold */}
      <div className="control-group">
        <label className="threshold-label">
          Confidence Threshold
          <span className="threshold-value">{scoreThreshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={scoreThreshold}
          onChange={(e) => onScoreThresholdChange(parseFloat(e.target.value))}
          className="styled-range"
        />
      </div>

      {/* Status Monitor */}
      <div className="status-monitor">
        <h4 style={{ 
          fontSize: '0.9rem', 
          color: '#555', 
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #e0e0e0'
        }}>
          System Status
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>Camera:</span>
            <span style={{ 
              color: getStatusColor(cameraStatus), 
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}>
              {cameraStatus}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>Inference:</span>
            <span style={{ 
              color: getStatusColor(inferenceStatus), 
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}>
              {inferenceStatus}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>FPS:</span>
            <span style={{ 
              color: fps.infer > 20 ? '#00A651' : '#ffa500', 
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {fps.infer} / {fps.render}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>Backend:</span>
            <span style={{ 
              color: '#4facfe', 
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}>
              {tfBackend}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>Keypoints:</span>
            <span style={{ 
              color: '#00693E', 
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {keypointCount}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>Latency:</span>
            <span style={{ 
              color: inferenceTime < 50 ? '#00A651' : '#ffa500', 
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {inferenceTime.toFixed(1)}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
