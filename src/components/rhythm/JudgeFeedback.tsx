/**
 * 判定反馈组件
 * 显示Perfect/Good/Miss等判定结果
 */

import { useState, useEffect } from 'react'
import type { JudgeResult } from '@/types/rhythm'

interface JudgeFeedbackProps {
  result: JudgeResult
  timingError?: number
  onComplete?: () => void
}

export default function JudgeFeedback({
  result,
  timingError = 0,
  onComplete
}: JudgeFeedbackProps) {
  const [visible, setVisible] = useState(true)
  const [scale, setScale] = useState(0)
  
  useEffect(() => {
    // 入场动画
    setTimeout(() => setScale(1), 10)
    
    // 自动消失
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 800)
    
    return () => clearTimeout(timer)
  }, [onComplete])
  
  if (!visible || !result) return null
  
  // 配置
  const config = {
    perfect: {
      text: 'PERFECT',
      color: '#4facfe',
      emoji: '⭐',
      size: '48px'
    },
    good: {
      text: 'GOOD',
      color: '#ffa500',
      emoji: '✓',
      size: '42px'
    },
    miss: {
      text: 'MISS',
      color: '#ff6b6b',
      emoji: '✗',
      size: '42px'
    }
  }
  
  const cfg = config[result]
  
  return (
    <div style={{
      position: 'fixed',
      top: '30%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 1000,
      pointerEvents: 'none',
      textAlign: 'center'
    }}>
      {/* 主文字 */}
      <div style={{
        fontSize: cfg.size,
        fontWeight: 'bold',
        color: cfg.color,
        textShadow: `0 0 20px ${cfg.color}, 0 0 40px ${cfg.color}`,
        marginBottom: '8px',
        animation: 'pulse 0.5s ease-out'
      }}>
        {cfg.emoji} {cfg.text}
      </div>
      
      {/* Timing误差 */}
      {result !== 'miss' && (
        <div style={{
          fontSize: '14px',
          color: 'white',
          opacity: 0.8,
          fontFamily: 'monospace'
        }}>
          {timingError > 0 ? '+' : ''}{timingError.toFixed(0)}ms
        </div>
      )}
      
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}

