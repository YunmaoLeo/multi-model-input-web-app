/**
 * Hand Position Debug Display
 * Shows hand positions on screen for debugging coordinate system
 */

interface HandPositionDebugProps {
  leftHandPos: { x: number; y: number } | null
  rightHandPos: { x: number; y: number } | null
  videoWidth: number
  videoHeight: number
  enabled?: boolean
  mirrorX?: boolean  // Whether to mirror X coordinate
}

export default function HandPositionDebug({
  leftHandPos,
  rightHandPos,
  videoWidth,
  videoHeight,
  enabled = true,
  mirrorX = true
}: HandPositionDebugProps) {
  if (!enabled) return null

  // Calculate mirrored positions for display
  const leftX = leftHandPos ? (mirrorX ? (1.0 - leftHandPos.x) : leftHandPos.x) : 0
  const rightX = rightHandPos ? (mirrorX ? (1.0 - rightHandPos.x) : rightHandPos.x) : 0

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: 'none',
        zIndex: 20
      }}
    >
      {/* Left hand marker */}
      {leftHandPos && (
        <div
          style={{
            position: 'absolute',
            left: leftX * videoWidth - 15,
            top: leftHandPos.y * videoHeight - 15,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(255, 0, 0, 0.6)',
            border: '3px solid red',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 0 10px red'
          }}
        >
          L
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.7)',
              padding: '2px 4px',
              borderRadius: '4px'
            }}
          >
            ({leftHandPos.x.toFixed(2)}, {leftHandPos.y.toFixed(2)})
            {mirrorX && ` → (${leftX.toFixed(2)}, ${leftHandPos.y.toFixed(2)})`}
          </div>
        </div>
      )}

      {/* Right hand marker */}
      {rightHandPos && (
        <div
          style={{
            position: 'absolute',
            left: rightX * videoWidth - 15,
            top: rightHandPos.y * videoHeight - 15,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(0, 0, 255, 0.6)',
            border: '3px solid blue',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 0 10px blue'
          }}
        >
          R
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.7)',
              padding: '2px 4px',
              borderRadius: '4px'
            }}
          >
            ({rightHandPos.x.toFixed(2)}, {rightHandPos.y.toFixed(2)})
            {mirrorX && ` → (${rightX.toFixed(2)}, ${rightHandPos.y.toFixed(2)})`}
          </div>
        </div>
      )}
    </div>
  )
}

