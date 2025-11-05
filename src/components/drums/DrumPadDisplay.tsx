/**
 * Drum Pad Display
 * Shows virtual drum pads on screen
 */

import type { DrumPad } from '@/types/drum'

interface DrumPadDisplayProps {
  pads: DrumPad[]
  videoWidth: number
  videoHeight: number
  hitDrumId?: string | null  // Currently hit drum (for visual feedback)
}

export default function DrumPadDisplay({
  pads,
  videoWidth,
  videoHeight,
  hitDrumId
}: DrumPadDisplayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      {pads.map(pad => {
        const x = pad.position.x * videoWidth
        const y = pad.position.y * videoHeight
        const radius = pad.radius * Math.min(videoWidth, videoHeight)
        const isHit = hitDrumId === pad.id

        return (
          <div
            key={pad.id}
            style={{
              position: 'absolute',
              left: x - radius,
              top: y - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: '50%',
              background: isHit
                ? `radial-gradient(circle, ${pad.color}ff, ${pad.color}88)`
                : `radial-gradient(circle, ${pad.color}66, ${pad.color}33)`,
              border: isHit ? '4px solid white' : '2px solid rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: radius * 0.4,
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              boxShadow: isHit
                ? `0 0 30px ${pad.color}, 0 4px 8px rgba(0,0,0,0.3)`
                : '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'all 0.1s ease',
              transform: isHit ? 'scale(1.2)' : 'scale(1)',
              zIndex: isHit ? 10 : 5
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: radius * 0.5 }}>{pad.icon}</div>
              <div style={{ fontSize: radius * 0.2, marginTop: '4px' }}>
                {pad.name}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

