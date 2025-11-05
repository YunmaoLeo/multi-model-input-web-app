/**
 * Theme Selector
 * Allows user to input theme and generate chart using LLM
 */

import { useState } from 'react'

interface ThemeSelectorProps {
  onGenerate: (theme: string, difficulty: 'easy' | 'normal' | 'hard') => void
  onClose: () => void
  isLoading?: boolean
}

export default function ThemeSelector({
  onGenerate,
  onClose,
  isLoading = false
}: ThemeSelectorProps) {
  const [theme, setTheme] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')

  const handleGenerate = () => {
    if (theme.trim()) {
      onGenerate(theme.trim(), difficulty)
    }
  }

  const presetThemes = [
    'Jazz',
    'Rock',
    'Pop',
    'Hip Hop',
    'Electronic',
    'Latin',
    'Funk',
    'Blues'
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        maxWidth: '600px',
        width: '90%'
      }}>
        <h2 style={{
          margin: '0 0 30px 0',
          fontSize: '32px',
          color: 'white',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          🥁 Generate Drum Chart
        </h2>

        {/* Theme Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Theme / Style
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., Jazz, Rock, Happy Birthday..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            disabled={isLoading}
          />
          
          {/* Preset themes */}
          <div style={{
            marginTop: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {presetThemes.map(preset => (
              <button
                key={preset}
                onClick={() => setTheme(preset)}
                disabled={isLoading}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: theme === preset ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Difficulty
          </label>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            {(['easy', 'normal', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: difficulty === diff ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                  background: difficulty === diff ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleGenerate}
            disabled={!theme.trim() || isLoading}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: theme.trim() && !isLoading
                ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                : 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: theme.trim() && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: theme.trim() && !isLoading
                ? '0 4px 15px rgba(79, 172, 254, 0.4)'
                : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? '🤖 Generating...' : '🎵 Generate Chart'}
          </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '16px 24px',
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Cancel
          </button>
        </div>

        {isLoading && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            color: 'white',
            fontSize: '14px',
            opacity: 0.8
          }}>
            ⏳ Generating chart with AI... This may take a few seconds.
          </div>
        )}
      </div>
    </div>
  )
}

