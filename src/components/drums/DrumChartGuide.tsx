/**
 * Drum Chart Guide
 * Displays falling notes to guide user
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
  const judgeLineY = videoHeight * 0.55  // Same as rhythm game
  // const trackHeight = videoHeight

  // Helper to get pad position
  const getPadPosition = (drumId: string): { x: number; y: number } | null => {
    const pad = pads.find(p => p.id === drumId)
    if (!pad) return null
    return {
      x: pad.position.x * videoWidth,
      y: pad.position.y * videoHeight
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: 'none',
        zIndex: 8
      }}
    >
      {/* Judge line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: judgeLineY,
          width: videoWidth,
          height: '3px',
          background: 'linear-gradient(to right, #4facfe, #00f2fe)',
          boxShadow: '0 0 10px rgba(79, 172, 254, 0.8)',
          zIndex: 10
        }}
      />

      {/* Notes */}
      {notes.map(note => {
        const pad = pads.find(p => p.id === note.drum)
        if (!pad) return null

        const padPos = getPadPosition(note.drum)
        if (!padPos) return null

        // Calculate note position (falling from top to pad position)
        const startY = 0
        const endY = padPos.y
        const noteY = startY + (endY - startY) * note.progress

        // Note size
        const noteSize = 40

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
              background: `radial-gradient(circle, ${pad.color}dd, ${pad.color}99)`,
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              boxShadow: `0 0 20px ${pad.color}, 0 4px 8px rgba(0,0,0,0.3)`,
              opacity: note.progress > 0.8 ? 1.0 : 0.7,
              transition: 'opacity 0.1s ease',
              zIndex: 9
            }}
          >
            {pad.icon}
          </div>
        )
      })}
    </div>
  )
}

