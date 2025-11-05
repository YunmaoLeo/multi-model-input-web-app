/**
 * Music Progress Bar Component
 * Floats at the bottom of the interface, displays current playback progress
 */

import type { GameStats } from '@/types/rhythm'

interface ProgressBarProps {
  currentTime: number
  duration: number
  stats: GameStats
  songName?: string
  difficulty?: string
}

export default function ProgressBar({
  currentTime,
  duration,
  stats,
  songName = 'Unknown',
  difficulty = 'normal'
}: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  
  // Format time (mm:ss)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Difficulty colors
  const difficultyColors = {
    easy: '#4facfe',
    normal: '#ffa500',
    hard: '#ff6b9d'
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '1200px',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '16px 24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Top section: Song info and stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        fontSize: '14px'
      }}>
        {/* Left: Song info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>🎵 {songName}</span>
          <span style={{
            background: difficultyColors[difficulty as keyof typeof difficultyColors] || '#999',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            {difficulty}
          </span>
        </div>
        
        {/* Right: Statistics */}
        <div style={{
          display: 'flex',
          gap: '20px',
          fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#4facfe' }}>⭐</span>
            <span>Perfect: {stats.perfect}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ffa500' }}>✓</span>
            <span>Good: {stats.good}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ff6b6b' }}>✗</span>
            <span>Miss: {stats.miss}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
            paddingLeft: '20px'
          }}>
            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>🔥 {stats.combo}x</span>
          </div>
        </div>
      </div>
      
      {/* Bottom section: Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Current time */}
        <span style={{
          color: 'white',
          fontSize: '13px',
          fontFamily: 'monospace',
          minWidth: '45px'
        }}>
          {formatTime(currentTime)}
        </span>
        
        {/* Progress bar */}
        <div style={{
          flex: 1,
          height: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Progress fill */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
            transition: 'width 0.1s linear',
            boxShadow: '0 0 10px rgba(79, 172, 254, 0.6)'
          }} />
          
          {/* Progress indicator */}
          <div style={{
            position: 'absolute',
            left: `${progress}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
            transition: 'left 0.1s linear'
          }} />
        </div>
        
        {/* Total duration */}
        <span style={{
          color: 'white',
          fontSize: '13px',
          fontFamily: 'monospace',
          minWidth: '45px'
        }}>
          {formatTime(duration)}
        </span>
      </div>
      
      {/* Score and accuracy */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ color: 'white', fontSize: '14px' }}>
          <span style={{ color: '#aaa' }}>Score: </span>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#ffd700' }}>
            {stats.score.toLocaleString()}
          </span>
        </div>
        
        <div style={{ color: 'white', fontSize: '14px' }}>
          <span style={{ color: '#aaa' }}>Accuracy: </span>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {(stats.accuracy * 100).toFixed(1)}%
          </span>
        </div>
        
        <div style={{ color: 'white', fontSize: '14px' }}>
          <span style={{ color: '#aaa' }}>Max Combo: </span>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#00ff88' }}>
            {stats.maxCombo}x
          </span>
        </div>
      </div>
    </div>
  )
}

