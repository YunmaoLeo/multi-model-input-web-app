/**
 * 音符轨道组件
 * 显示下落的音符和判定线
 */

import { useRef, useEffect } from 'react'
import type { VisibleNote } from '@/types/rhythm'

interface NoteTrackProps {
  visibleNotes: VisibleNote[]
  videoWidth: number
  videoHeight: number
}

export default function NoteTrack({
  visibleNotes,
  videoWidth,
  videoHeight
}: NoteTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Configuration
    const trackWidth = canvas.width
    const trackHeight = canvas.height
    const judgeLineY = trackHeight * 0.55  // Judge line position (55% height, moved up for better visibility)
    const noteSize = 60  // Note size
    
    // Color configuration
    const colors = {
      left: { main: '#4facfe', glow: 'rgba(79, 172, 254, 0.6)' },
      right: { main: '#ff6b9d', glow: 'rgba(255, 107, 157, 0.6)' },
      both: { main: '#00ff88', glow: 'rgba(0, 255, 136, 0.6)' }
    }
    
    // Draw judge line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(0, judgeLineY)
    ctx.lineTo(trackWidth, judgeLineY)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Draw judge line label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('HIT ZONE ↓', 10, judgeLineY - 10)
    
    // Draw track dividers
    const leftX = trackWidth * 0.3
    const rightX = trackWidth * 0.7
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    
    ctx.beginPath()
    ctx.moveTo(leftX, 0)
    ctx.lineTo(leftX, trackHeight)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(rightX, 0)
    ctx.lineTo(rightX, trackHeight)
    ctx.stroke()
    
    ctx.setLineDash([])
    
    // Draw notes (track labels removed)
    visibleNotes.forEach(note => {
      // Calculate note position
      let noteX: number
      if (note.type === 'left') {
        noteX = leftX / 2
      } else if (note.type === 'right') {
        noteX = (rightX + trackWidth) / 2
      } else {
        noteX = trackWidth / 2
      }
      
      // Calculate note Y position
      // When progress = 0: note at top (y = 0)
      // When progress = 1: note at judge line (y = judgeLineY)
      // Judge line is at 55% of track height
      const noteY = judgeLineY * note.progress
      
      const color = colors[note.type]
      
      // Draw glow effect
      ctx.shadowBlur = 20
      ctx.shadowColor = color.glow
      
      // Draw note circle
      ctx.fillStyle = color.main
      ctx.beginPath()
      ctx.arc(noteX, noteY, noteSize / 2, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw inner circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.arc(noteX, noteY, noteSize / 3, 0, Math.PI * 2)
      ctx.fill()
      
      // Reset shadow
      ctx.shadowBlur = 0
      
      // Draw gesture icon
      ctx.fillStyle = 'white'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      let icon = ''
      if (note.type === 'left') icon = '👈'
      else if (note.type === 'right') icon = '👉'
      else icon = '👐'
      
      ctx.fillText(icon, noteX, noteY)
      
      // Draw hint circle when approaching judge line
      if (note.progress > 0.8) {
        ctx.strokeStyle = color.main
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(noteX, judgeLineY, noteSize / 2 + 10, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
  }, [visibleNotes, videoWidth, videoHeight])
  
  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  )
}

