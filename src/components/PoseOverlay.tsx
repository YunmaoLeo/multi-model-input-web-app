/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useEffect } from 'react'
import type { Keypoint } from '@/types/pose'

interface PoseOverlayProps {
  videoElement: HTMLVideoElement | null
  keypoints: Keypoint[]
  isVisible: boolean
  drumHits?: {
    left: number   // 0-1, flash intensity for left drum
    right: number  // 0-1, flash intensity for right drum
  }
}

// COCO-17 上半身骨架连接定义
const UPPER_BODY_CONNECTIONS = [
  // 头部 - 面部特征
  [0, 1], [0, 2], // 鼻子-眼睛
  [1, 3], [2, 4], // 眼睛-耳朵
  [1, 2], // 左右眼
  
  // 躯干上部
  [5, 6], // 肩膀
  [5, 11], [6, 12], // 肩膀到臀部（定义躯干）
  [11, 12], // 臀部（上半身底部）
  
  // 左臂
  [5, 7], // 左肩-左肘
  [7, 9], // 左肘-左腕
  
  // 右臂
  [6, 8], // 右肩-右肘
  [8, 10], // 右肘-右腕
  
  // 颈部连接
  [0, 5], [0, 6], // 鼻子到肩膀（定义颈部）
]

// 定义关键点类别（用于不同的绘制样式）
const KEYPOINT_GROUPS = {
  face: [0, 1, 2, 3, 4], // 面部
  torso: [5, 6, 11, 12], // 躯干
  arms: [7, 8, 9, 10], // 手臂
}

export default function PoseOverlay({ videoElement, keypoints, isVisible, drumHits }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!videoElement || !isVisible) {
      // 清空画布
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let isDrawing = true

    /**
     * 绘制姿态
     */
    const drawPose = () => {
      if (!isDrawing) return
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 不再绘制旧的L/R鼓垫（绿色按钮）
      // （鼓UI由 DrumPadDisplay 渲染）

      if (keypoints.length === 0) {
        animationFrameRef.current = requestAnimationFrame(drawPose)
        return
      }

      const confidenceThreshold = 0.3

      // 绘制骨架连接（分层绘制，先画底层再画上层）
      UPPER_BODY_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const startPoint = keypoints[startIdx]
        const endPoint = keypoints[endIdx]

        if (startPoint && endPoint && 
            startPoint.score > confidenceThreshold && 
            endPoint.score > confidenceThreshold) {
          
          const x1 = startPoint.x * canvas.width
          const y1 = startPoint.y * canvas.height
          const x2 = endPoint.x * canvas.width
          const y2 = endPoint.y * canvas.height
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(canvas.width - x1, y1)
          ctx.lineTo(canvas.width - x2, y2)
          ctx.stroke()
        }
      })

      // 定义上半身关键点索引（0-12，排除13-16的腿部关键点）
      const upperBodyIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

      // 绘制关键点（只绘制上半身，根据类别使用不同样式）
      keypoints.forEach((keypoint, index) => {
        // 跳过下半身关键点（膝盖和脚踝）
        if (!upperBodyIndices.includes(index)) return
        
        if (keypoint.score > confidenceThreshold) {
          // 镜像 x 坐标以匹配骨骼连接和视频
          const x = canvas.width - (keypoint.x * canvas.width)
          const y = keypoint.y * canvas.height

          // 根据关键点类型确定大小和颜色
          let radius = 5
          let fillColor = '#00693E'
          let strokeColor = '#00A651'

          if (KEYPOINT_GROUPS.face.includes(index)) {
            // 面部关键点 - 小一点
            radius = 4
            fillColor = '#4facfe'
            strokeColor = '#2196f3'
          } else if (KEYPOINT_GROUPS.torso.includes(index)) {
            // 躯干关键点 - 大一点
            radius = 6
            fillColor = '#00693E'
            strokeColor = '#00A651'
          } else if (KEYPOINT_GROUPS.arms.includes(index)) {
            // 手臂关键点 - 中等
            radius = 5
            fillColor = '#00853f'
            strokeColor = '#00A651'
          }

          // 绘制外层光晕
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius + 4)
          glowGradient.addColorStop(0, `${strokeColor}80`)
          glowGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(x, y, radius + 4, 0, 2 * Math.PI)
          ctx.fill()

          // 绘制关键点边框
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.stroke()

          // 绘制关键点填充
          ctx.fillStyle = fillColor
          ctx.beginPath()
          ctx.arc(x, y, radius - 1, 0, 2 * Math.PI)
          ctx.fill()

          // 添加高光
          const highlightGradient = ctx.createRadialGradient(
            x - radius * 0.3, 
            y - radius * 0.3, 
            0, 
            x, 
            y, 
            radius
          )
          highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
          highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = highlightGradient
          ctx.beginPath()
          ctx.arc(x, y, radius - 1, 0, 2 * Math.PI)
          ctx.fill()
        }
      })

      animationFrameRef.current = requestAnimationFrame(drawPose)
    }

    drawPose()

    return () => {
      isDrawing = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [videoElement, keypoints, isVisible, drumHits])

  useEffect(() => {
    if (!videoElement || !canvasRef.current) return

    const updateCanvasSize = () => {
      const canvas = canvasRef.current!
      const video = videoElement
      
      canvas.width = video.videoWidth || video.clientWidth
      canvas.height = video.videoHeight || video.clientHeight
      canvas.style.width = video.clientWidth + 'px'
      canvas.style.height = video.clientHeight + 'px'
    }

    updateCanvasSize()
    
    videoElement.addEventListener('resize', updateCanvasSize)
    return () => videoElement.removeEventListener('resize', updateCanvasSize)
  }, [videoElement])

  if (!videoElement) return null

  return (
    <canvas
      ref={canvasRef}
      className="pose-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
        transform: 'scaleX(-1)', // 镜像显示，与视频保持一致
      }}
    />
  )
}
