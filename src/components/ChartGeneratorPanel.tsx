/**
 * Chart Generator Panel
 * UI component for generating drum charts using OpenAI API
 */

import { useState } from 'react'
import { LLMChartGenerator } from '@/lib/drums/LLMChartGenerator'
import type { DrumChart } from '@/types/drum'
import { isOpenAIConfigured } from '@/lib/openai/config'
import { TEST_CHART, SIMPLE_TEST_CHART } from '@/lib/drums/testChart'

interface ChartGeneratorPanelProps {
  onChartGenerated: (chart: DrumChart) => void
  isGenerating?: boolean
  onGeneratingChange?: (generating: boolean) => void
  generationProgress?: {
    drumChart: 'idle' | 'generating' | 'completed' | 'error'
    bass: 'idle' | 'generating' | 'completed' | 'error'
    piano: 'idle' | 'generating' | 'completed' | 'error'
  }
  isReadyToStart?: boolean
}

export default function ChartGeneratorPanel({
  onChartGenerated,
  isGenerating: externalGenerating,
  onGeneratingChange,
  generationProgress,
  isReadyToStart = false
}: ChartGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')
  const [duration, setDuration] = useState(60)
  const [internalGenerating, setInternalGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [userApiKey, setUserApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  const isGenerating = externalGenerating !== undefined ? externalGenerating : internalGenerating
  const setGenerating = onGeneratingChange || setInternalGenerating

  // Handle loading test chart (no API key needed in debug mode)
  const handleLoadTestChart = (chartType: 'simple' | 'full') => {
    const chart = chartType === 'simple' ? SIMPLE_TEST_CHART : TEST_CHART
    console.log(`🧪 Loading ${chartType} test chart (no API key required):`, chart)
    onChartGenerated(chart)
    setError(null)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a theme description')
      return
    }

    // Check if user provided API key or system has one configured
    const hasApiKey = userApiKey.trim() || isOpenAIConfigured()
    if (!hasApiKey) {
      setError('Please provide your OpenAI API key below, or use Debug Mode to load test charts without an API key.')
      setShowApiKeyInput(true)
      return
    }

    setError(null)
    setGenerating(true)

    try {
      // Use user-provided API key if available, otherwise use system config
      const generator = userApiKey.trim() 
        ? new LLMChartGenerator(userApiKey.trim())
        : new LLMChartGenerator()
      
      const chart = await generator.generateChart(prompt, difficulty, duration)
      onChartGenerated(chart)
      setPrompt('')  // Clear prompt after successful generation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate chart'
      setError(errorMessage)
      console.error('Chart generation error:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="chart-generator-panel" style={{
      padding: '16px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Generate Drum Chart</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          <span style={{ color: '#666' }}>Debug Mode</span>
        </label>
      </div>
      
      {debugMode && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '4px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#1976d2' }}>
            🧪 Debug Mode - No API Key Required
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Load pre-made test charts instantly without needing an OpenAI API key.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleLoadTestChart('simple')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Simple (10s, 9 notes)
            </button>
            <button
              onClick={() => handleLoadTestChart('full')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Full (30s, 65 notes)
            </button>
          </div>
        </div>
      )}
      
      {!debugMode && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e8f5e9',
          border: '1px solid #4caf50',
          borderRadius: '4px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#2e7d32' }}>
            OpenAI API Key
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Enter your OpenAI API key to generate custom drum charts. Your key is only used locally and never stored.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type={showApiKeyInput ? 'text' : 'password'}
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="sk-..."
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {showApiKeyInput ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#2196f3' }}>OpenAI Platform</a>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Theme / Emotion Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Energetic rock with powerful beats' or 'Calm jazz with gentle rhythms'"
          disabled={isGenerating}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'normal' | 'hard')}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Duration (seconds)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.max(10, Math.min(300, parseInt(e.target.value) || 60)))}
            disabled={isGenerating}
            min={10}
            max={300}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '12px',
          color: '#721c24',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: isGenerating ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: isGenerating ? 'not-allowed' : 'pointer'
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate Chart'}
      </button>

      {/* Generation Progress Display */}
      {generationProgress && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Generation Progress</div>
          
          {/* Drum Chart Progress */}
          <div style={{ marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ display: 'inline-block', width: '80px' }}>Drum Chart:</span>
            <span style={{ 
              color: generationProgress.drumChart === 'completed' ? '#28a745' : 
                     generationProgress.drumChart === 'generating' ? '#ffc107' : 
                     generationProgress.drumChart === 'error' ? '#dc3545' : '#6c757d'
            }}>
              {generationProgress.drumChart === 'completed' ? '✓ Completed' :
               generationProgress.drumChart === 'generating' ? '⟳ Generating...' :
               generationProgress.drumChart === 'error' ? '✗ Error' : '⏸ Idle'}
            </span>
          </div>

          {/* Bass Progress */}
          {generationProgress.bass !== 'idle' && (
            <div style={{ marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ display: 'inline-block', width: '80px' }}>Bass:</span>
              <span style={{ 
                color: generationProgress.bass === 'completed' ? '#28a745' : 
                       generationProgress.bass === 'generating' ? '#ffc107' : '#dc3545'
              }}>
                {generationProgress.bass === 'completed' ? '✓ Completed' :
                 generationProgress.bass === 'generating' ? '⟳ Generating...' : '✗ Error'}
              </span>
            </div>
          )}

          {/* Piano Progress */}
          {generationProgress.piano !== 'idle' && (
            <div style={{ marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ display: 'inline-block', width: '80px' }}>Piano:</span>
              <span style={{ 
                color: generationProgress.piano === 'completed' ? '#28a745' : 
                       generationProgress.piano === 'generating' ? '#ffc107' : '#dc3545'
              }}>
                {generationProgress.piano === 'completed' ? '✓ Completed' :
                 generationProgress.piano === 'generating' ? '⟳ Generating...' : '✗ Error'}
              </span>
            </div>
          )}

          {/* Ready Status */}
          {isReadyToStart && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              backgroundColor: '#d4edda', 
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              color: '#155724',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              ✓ Ready to start! Click "Start Inference" to begin.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

