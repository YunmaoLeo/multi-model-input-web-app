/**
 * Drum Chart Guide
 * Displays falling notes to guide user (rhythm game style)
 */

import type { VisibleDrumNote, DrumPad } from '@/types/drum'

interface DrumChartGuideProps {
  notes: VisibleDrumNote[]
  pads: DrumPad[]
  videoWidth: number
  videoHeight: number
}

export default function DrumChartGuide({
  notes,
  pads,
  videoWidth,
  videoHeight
}: DrumChartGuideProps) {
  // Helper to get pad position
  const getPadPosition = (drumId: string): { x: number; y: number } | null => {
    const pad = pads.find(p => p.id === drumId)
    if (!pad) return null
    return {
      x: pad.position.x * videoWidth,
      y: pad.position.y * videoHeight
    }
  }

  // Debug: Log render
  console.log('🎨 DrumChartGuide rendering:', {
    notesCount: notes.length,
    padsCount: pads.length,
    videoSize: `${videoWidth}x${videoHeight}`
  })

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: 'none',
        zIndex: 15  // Higher z-index to ensure visibility
      }}
    >
      {/* Pad target indicators - show where to hit */}
      {pads.map((pad, index) => {
        const padPos = getPadPosition(pad.id)
        if (!padPos) {
          console.warn(`❌ Pad position not found for ${pad.id}`)
          return null
        }

        const targetSize = 80
        
        // Debug: Log first pad
        if (index === 0) {
          console.log('🎯 Rendering pad target:', {
            id: pad.id,
            position: padPos,
            color: pad.color,
            icon: pad.icon
          })
        }

        return (
          <div
            key={`target-${pad.id}`}
            style={{
              position: 'absolute',
              left: padPos.x - targetSize / 2,
              top: padPos.y - targetSize / 2,
              width: targetSize,
              height: targetSize,
              borderRadius: '50%',
              border: `4px solid ${pad.color}`,
              backgroundColor: `${pad.color}22`,
              boxShadow: `
                inset 0 0 20px ${pad.color}44,
                0 0 30px ${pad.color}66
              `,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 14
            }}
          >
            {/* Pad icon/label */}
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: pad.color,
              textShadow: `0 0 8px ${pad.color}, 0 2px 4px rgba(0,0,0,0.8)`,
              filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))'
            }}>
              {pad.icon}
            </div>
          </div>
        )
      })}

      {/* Falling notes */}
      {notes.map(note => {
        const pad = pads.find(p => p.id === note.drum)
        if (!pad) return null

        const padPos = getPadPosition(note.drum)
        if (!padPos) return null

        // Calculate note position (falling from top to pad position)
        const startY = -50  // Start above screen
        const endY = padPos.y
        const noteY = startY + (endY - startY) * note.progress

        // Note size increases as it approaches the target
        const baseSize = 35
        const sizeMultiplier = 1 + (note.progress * 0.5)
        const noteSize = baseSize * sizeMultiplier

        // Opacity and glow increase as note approaches
        const opacity = 0.6 + (note.progress * 0.4)
        const glowIntensity = 10 + (note.progress * 30)

        return (
          <div
            key={note.id}
            style={{
              position: 'absolute',
              left: padPos.x - noteSize / 2,
              top: noteY - noteSize / 2,
              width: noteSize,
              height: noteSize,
              borderRadius: '50%',
              background: `
                radial-gradient(
                  circle at 30% 30%,
                  ${pad.color}ff,
                  ${pad.color}dd 40%,
                  ${pad.color}99
                )
              `,
              border: `${2 + note.progress * 2}px solid rgba(255, 255, 255, ${0.6 + note.progress * 0.4})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${16 + note.progress * 6}px`,
              fontWeight: 'bold',
              color: 'white',
              textShadow: `
                0 2px 4px rgba(0,0,0,0.9),
                0 0 ${glowIntensity}px ${pad.color}
              `,
              boxShadow: `
                0 0 ${glowIntensity}px ${pad.color},
                0 0 ${glowIntensity * 1.5}px ${pad.color}88,
                0 4px 12px rgba(0,0,0,0.4)
              `,
              opacity,
              zIndex: 16,
              transform: `scale(${note.progress > 0.9 ? 1.1 : 1})`,
              transition: 'transform 0.05s ease-out'
            }}
          >
            {pad.icon}
          </div>
        )
      })}
      
      {/* Debug info */}
      {notes.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#4ade80',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          ♪ {notes.length} note{notes.length !== 1 ? 's' : ''} incoming
        </div>
      )}
    </div>
  )
}

