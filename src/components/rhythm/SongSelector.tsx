/**
 * Song Selector Component
 */

import type { SongConfig } from '@/types/rhythm'

interface SongSelectorProps {
  songs: SongConfig[]
  selectedSong: SongConfig | null
  selectedDifficulty: 'easy' | 'normal' | 'hard'
  onSelectSong: (song: SongConfig) => void
  onSelectDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void
  onStart: () => void
  onClose: () => void
  isLoading?: boolean
}

export default function SongSelector({
  songs,
  selectedSong,
  selectedDifficulty,
  onSelectSong,
  onSelectDifficulty,
  onStart,
  onClose,
  isLoading = false
}: SongSelectorProps) {
  const difficultyColors = {
    easy: '#4facfe',
    normal: '#ffa500',
    hard: '#ff6b9d'
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 50px rgba(0, 0, 0, 0.5)',
        minWidth: '500px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{
            color: 'white',
            fontSize: '28px',
            margin: 0,
            textShadow: '0 0 20px rgba(79, 172, 254, 0.6)'
          }}>
            🎵 Select Song
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Song List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginBottom: '30px'
        }}>
          {songs.map(song => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song)}
              style={{
                background: selectedSong?.id === song.id 
                  ? 'linear-gradient(90deg, rgba(79, 172, 254, 0.3) 0%, rgba(0, 242, 254, 0.3) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedSong?.id === song.id 
                  ? '2px solid #4facfe'
                  : '2px solid transparent',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: selectedSong?.id === song.id ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (selectedSong?.id !== song.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSong?.id !== song.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>
                {song.name}
              </div>
              {song.artist && (
                <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>
                  {song.artist}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#888' }}>
                {song.bpm && <span>♫ {song.bpm} BPM</span>}
                {song.duration && <span>⏱️ {Math.floor(song.duration / 60)}:{(Math.floor(song.duration % 60)).toString().padStart(2, '0')}</span>}
              </div>
            </div>
          ))}
        </div>
        
        {/* Difficulty Selection */}
        {selectedSong && (
          <>
            <div style={{ color: 'white', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
              Select Difficulty:
            </div>
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {(['easy', 'normal', 'hard'] as const).map(difficulty => {
                const available = selectedSong.charts[difficulty]
                return (
                  <button
                    key={difficulty}
                    onClick={() => available && onSelectDifficulty(difficulty)}
                    disabled={!available}
                    style={{
                      flex: 1,
                      padding: '15px 20px',
                      background: selectedDifficulty === difficulty
                        ? difficultyColors[difficulty]
                        : 'rgba(255, 255, 255, 0.1)',
                      border: selectedDifficulty === difficulty
                        ? `2px solid ${difficultyColors[difficulty]}`
                        : '2px solid transparent',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      cursor: available ? 'pointer' : 'not-allowed',
                      opacity: available ? 1 : 0.3,
                      transition: 'all 0.3s ease',
                      boxShadow: selectedDifficulty === difficulty
                        ? `0 0 20px ${difficultyColors[difficulty]}80`
                        : 'none'
                    }}
                  >
                    {difficulty}
                  </button>
                )
              })}
            </div>
          </>
        )}
        
        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={!selectedSong || isLoading}
          style={{
            width: '100%',
            padding: '18px',
            background: selectedSong && !isLoading
              ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
              : 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: selectedSong && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selectedSong && !isLoading
              ? '0 5px 20px rgba(79, 172, 254, 0.5)'
              : 'none',
            opacity: selectedSong && !isLoading ? 1 : 0.5
          }}
        >
          {isLoading ? 'Loading...' : selectedSong ? '🎮 Start Game' : 'Please Select a Song'}
        </button>
      </div>
    </div>
  )
}

