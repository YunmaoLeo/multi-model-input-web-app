import { useState, useEffect } from 'react'
import type { ModelType, Calibration } from '@/types/pose'

interface ControlPanelProps {
  onStart: () => void
  onStop: () => void
  onModelChange: (model: ModelType) => void
  onCalibrationChange: (calibration: Calibration) => void
  onScoreThresholdChange: (threshold: number) => void
  isRunning: boolean
  currentModel: ModelType
  calibration: Calibration
  scoreThreshold: number
}

export default function ControlPanel({
  onStart,
  onStop,
  onModelChange,
  onCalibrationChange,
  onScoreThresholdChange,
  isRunning,
  currentModel,
  calibration,
  scoreThreshold
}: ControlPanelProps) {
  const [localCalibration, setLocalCalibration] = useState<Calibration>(calibration)

  useEffect(() => {
    onCalibrationChange(localCalibration)
  }, [localCalibration, onCalibrationChange])

  const handleCalibrationChange = (field: keyof Calibration, value: number) => {
    setLocalCalibration(prev => ({
      ...prev,
      [field]: value
    }))
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
          className={`control-btn ${isRunning ? 'stop' : 'start'} ${isRunning ? 'pulse-active' : ''}`}
        >
          {isRunning ? 'Stop Inference' : 'Start Inference'}
        </button>
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

      {/* 后端选择 */}
      <div className="control-group">
        <label>
          Backend
        </label>
        <select disabled className="styled-select">
          <option value="none">None (Local)</option>
        </select>
      </div>

      {/* 校准参数 */}
      <div className="control-group calibration-group">
        <h4>
          Calibration Parameters
        </h4>
        <div className="calibration-inputs">
          <div className="input-group">
            <label>Distance (m)</label>
            <input
              type="number"
              step="0.1"
              value={localCalibration.distance}
              onChange={(e) => handleCalibrationChange('distance', parseFloat(e.target.value) || 0)}
              className="styled-input"
            />
          </div>
          <div className="input-group">
            <label>Azimuth (°)</label>
            <input
              type="number"
              step="1"
              value={localCalibration.azimuth}
              onChange={(e) => handleCalibrationChange('azimuth', parseFloat(e.target.value) || 0)}
              className="styled-input"
            />
          </div>
          <div className="input-group">
            <label>Elevation (°)</label>
            <input
              type="number"
              step="1"
              value={localCalibration.elevation}
              onChange={(e) => handleCalibrationChange('elevation', parseFloat(e.target.value) || 0)}
              className="styled-input"
            />
          </div>
        </div>
      </div>

      {/* 置信度阈值 */}
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
    </div>
  )
}
