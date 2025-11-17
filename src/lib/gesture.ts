import type { Keypoint } from '@/types/pose'

/**
 * 手势事件类型
 */
export type GestureEvent = 'hit_left' | 'hit_right' | 'hit_both' | null

/**
 * 手势检测配置
 */
export interface GestureConfig {
  speedThreshold: number         // 速度阈值 (废弃，stroke-based 检测不使用)
  displacementThreshold: number  // 累积位移阈值 (归一化坐标，0-1，用于敲击行程检测)
  strokeTimeoutMs: number        // 击打行程超时时间 (毫秒，超时后重置)
  dualHitWindowMs: number        // 双手击打时间窗口 (毫秒)
  deadTimeMs: number             // 去抖时间 (毫秒)
  medianFilterSize: number       // 中值滤波窗口大小
}

/**
 * 手部状态
 */
interface HandState {
  position: { x: number; y: number } | null
  velocity: { x: number; y: number }  // 单位：归一化坐标/毫秒
  lastHitTime: number
  lastUpdateTime: number         // 上次更新时间 (用于计算基于时间的速度)
  velocityHistory: number[]      // 用于中值滤波
  
  // 击打行程追踪
  strokeStartY: number | null    // 向下挥动的起始Y坐标
  strokeStartTime: number | null // 向下挥动的开始时间
  accumulatedDownward: number    // 累积向下位移
  isMovingDown: boolean          // 当前是否在向下移动
}

/**
 * 手势检测器
 */
export class GestureDetector {
  private config: GestureConfig
  private leftHand: HandState
  private rightHand: HandState
  private lastLeftHitTime: number = 0
  private lastRightHitTime: number = 0

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = {
      speedThreshold: 0.00015,          // Not used for stroke-based detection
      displacementThreshold: 0.03,      // Stroke distance threshold (normalized coords, ~3% of screen height)
      strokeTimeoutMs: 800,             // Stroke must complete within 800ms (more forgiving)
      dualHitWindowMs: 120,             // Slightly wider window for dual hits
      deadTimeMs: 150,                  // Debounce time between hits
      medianFilterSize: 5,              // Increased for better noise filtering
      ...config
    }

    this.leftHand = this.createHandState()
    this.rightHand = this.createHandState()
    
    console.log('🎯 Gesture Detector initialized (stroke-based with timeout):', {
      displacementThreshold: this.config.displacementThreshold,
      strokeTimeoutMs: this.config.strokeTimeoutMs,
      unit: 'normalized coordinates (0-1)',
      note: 'Stroke must complete within timeout, like a real drumming motion'
    })
  }

  private createHandState(): HandState {
    return {
      position: null,
      velocity: { x: 0, y: 0 },
      lastHitTime: 0,
      lastUpdateTime: 0,  // Track time for velocity calculation
      velocityHistory: [],
      
      // Stroke tracking
      strokeStartY: null,
      strokeStartTime: null,
      accumulatedDownward: 0,
      isMovingDown: false
    }
  }

  /**
   * 中值滤波
   */
  private medianFilter(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }

  /**
   * 更新手部状态
   */
  private updateHandState(
    hand: HandState,
    wrist: Keypoint | null,
    currentTime: number
  ): void {
    // Check wrist confidence (lower threshold for upper body only scenarios)
    if (!wrist || wrist.score < 0.2) {
      hand.position = null
      hand.velocity = { x: 0, y: 0 }
      hand.lastUpdateTime = 0
      return
    }

    const newPosition = { x: wrist.x, y: wrist.y }

    if (hand.position && hand.lastUpdateTime > 0) {
      // Calculate time-based velocity (frame-rate independent)
      const deltaTime = currentTime - hand.lastUpdateTime  // milliseconds
      
      // Debug: Log occasionally
      if (Math.random() < 0.02) {
        console.log('🔍 Velocity calculation:', {
          deltaTime: deltaTime.toFixed(2) + 'ms',
          oldPos: hand.position.y.toFixed(6),
          newPos: newPosition.y.toFixed(6),
          displacement: (newPosition.y - hand.position.y).toFixed(6)
        })
      }
      
      // Avoid division by zero or extremely small deltaTime
      if (deltaTime > 0 && deltaTime < 1000) {
        const displacement = newPosition.y - hand.position.y
        // Velocity in normalized coordinates per millisecond
        const rawVelocityY = displacement / deltaTime
        
        // Add to history for median filtering
        hand.velocityHistory.push(rawVelocityY)
        if (hand.velocityHistory.length > this.config.medianFilterSize) {
          hand.velocityHistory.shift()
        }

        // Apply median filter to smooth velocity
        const smoothedVelocityY = this.medianFilter(hand.velocityHistory)
        
        hand.velocity = {
          x: (newPosition.x - hand.position.x) / deltaTime,
          y: smoothedVelocityY
        }
        
        // Track stroke for drumming gesture (with timeout)
        this.updateStrokeTracking(hand, newPosition, displacement, currentTime)
        
        // Debug: Log velocity after calculation
        if (Math.random() < 0.02) {
          console.log('🔍 Velocity result:', {
            rawVelocityY: rawVelocityY.toFixed(6),
            smoothedVelocityY: smoothedVelocityY.toFixed(6),
            historySize: hand.velocityHistory.length
          })
        }
      } else {
        console.warn('⚠️ Invalid deltaTime:', deltaTime)
      }
    } else {
      // First detection or reset
      if (Math.random() < 0.05) {
        console.log('🆕 First detection or reset:', {
          hasPosition: !!hand.position,
          lastUpdateTime: hand.lastUpdateTime,
          currentTime: currentTime
        })
      }
    }

    hand.position = newPosition
    hand.lastUpdateTime = currentTime
  }
  
  /**
   * 更新击打行程追踪（带超时检查）
   */
  private updateStrokeTracking(
    hand: HandState,
    newPosition: { x: number; y: number },
    displacement: number,
    currentTime: number
  ): void {
    const velocityThreshold = 0.0005  // 最小速度阈值，判断是否在移动
    
    // 检查行程是否超时
    if (hand.isMovingDown && hand.strokeStartTime !== null) {
      const strokeDuration = currentTime - hand.strokeStartTime
      if (strokeDuration > this.config.strokeTimeoutMs) {
        // 超时，重置行程
        if (Math.random() < 0.1) {
          console.log('⏱️ Stroke timeout (too slow):', {
            duration: strokeDuration.toFixed(0) + 'ms',
            timeout: this.config.strokeTimeoutMs + 'ms',
            accumulated: hand.accumulatedDownward.toFixed(4)
          })
        }
        hand.strokeStartY = null
        hand.strokeStartTime = null
        hand.accumulatedDownward = 0
        hand.isMovingDown = false
        return
      }
    }
    
    // 判断是否向下移动（Y增加 = 向下）
    const isCurrentlyMovingDown = hand.velocity.y > velocityThreshold
    const isCurrentlyMovingUp = hand.velocity.y < -velocityThreshold
    
    if (isCurrentlyMovingDown) {
      // 向下移动
      if (!hand.isMovingDown) {
        // 刚开始向下移动，记录起点和时间
        hand.strokeStartY = hand.position?.y || newPosition.y
        hand.strokeStartTime = currentTime
        hand.accumulatedDownward = 0
        hand.isMovingDown = true
        
        if (Math.random() < 0.1) {
          console.log('📉 Started downward stroke:', {
            startY: hand.strokeStartY.toFixed(4),
            startTime: currentTime.toFixed(0)
          })
        }
      }
      
      // 累积向下位移
      if (displacement > 0) {
        hand.accumulatedDownward += displacement
        
        if (Math.random() < 0.05) {
          const elapsed = hand.strokeStartTime ? currentTime - hand.strokeStartTime : 0
          console.log('📊 Stroke progress:', {
            accumulated: hand.accumulatedDownward.toFixed(4),
            threshold: this.config.displacementThreshold.toFixed(4),
            elapsed: elapsed.toFixed(0) + 'ms',
            ready: hand.accumulatedDownward >= this.config.displacementThreshold
          })
        }
      }
    } else if (isCurrentlyMovingUp) {
      // 向上移动，重置行程
      if (hand.isMovingDown) {
        if (Math.random() < 0.1) {
          console.log('📈 Stroke reset (moving up):', {
            accumulated: hand.accumulatedDownward.toFixed(4)
          })
        }
      }
      hand.strokeStartY = null
      hand.strokeStartTime = null
      hand.accumulatedDownward = 0
      hand.isMovingDown = false
    }
    // 如果速度很小（接近静止），不重置，保持当前状态
  }
  
  /**
   * 记录速度信息（用于调试）
   */
  private logVelocity(handName: string, hand: HandState): void {
    if (Math.random() < 0.05) { // 5% 采样率，避免刷屏
      console.log(`📊 ${handName} hand velocity:`, {
        vy: hand.velocity.y.toFixed(6),
        threshold: this.config.speedThreshold.toFixed(6),
        exceeds: hand.velocity.y > this.config.speedThreshold,
        unit: 'normalized coords/ms'
      })
    }
  }

  /**
   * 检测单手击打（基于累积位移）
   */
  private detectHit(
    hand: HandState,
    currentTime: number
  ): boolean {
    if (!hand.position) return false

    // 检查去抖时间
    const timeSinceLastHit = currentTime - hand.lastHitTime
    if (timeSinceLastHit < this.config.deadTimeMs) {
      return false
    }

    // Check if accumulated downward stroke exceeds threshold
    const hasCompletedStroke = 
      hand.isMovingDown && 
      hand.accumulatedDownward >= this.config.displacementThreshold

    if (hasCompletedStroke) {
      hand.lastHitTime = currentTime
      
      // Calculate stroke duration
      const strokeDuration = hand.strokeStartTime ? currentTime - hand.strokeStartTime : 0
      
      // Reset stroke after hit
      const strokeDistance = hand.accumulatedDownward
      hand.strokeStartY = null
      hand.strokeStartTime = null
      hand.accumulatedDownward = 0
      hand.isMovingDown = false
      
      // Log successful hit detection
      console.log('✅ Hit detected (stroke-based)!', {
        strokeDistance: strokeDistance.toFixed(4),
        strokeDuration: strokeDuration.toFixed(0) + 'ms',
        threshold: this.config.displacementThreshold.toFixed(4),
        ratio: (strokeDistance / this.config.displacementThreshold).toFixed(2) + 'x'
      })
      return true
    }

    return false
  }

  /**
   * 处理关键点并检测手势
   */
  public detect(keypoints: Keypoint[], currentTime: number = performance.now()): {
    event: GestureEvent
    leftVelocity: { x: number; y: number }
    rightVelocity: { x: number; y: number }
    leftPosition: { x: number; y: number } | null
    rightPosition: { x: number; y: number } | null
  } {
    // Debug: Log keypoints structure occasionally
    if (Math.random() < 0.01) {
      console.log('🔍 Keypoints structure:', {
        total: keypoints.length,
        sample: keypoints.slice(0, 3).map(kp => ({ name: kp.name, x: kp.x.toFixed(3), y: kp.y.toFixed(3), score: kp.score.toFixed(3) })),
        wrists: keypoints.filter(kp => kp.name?.includes('wrist')).map(kp => ({ name: kp.name, x: kp.x.toFixed(3), y: kp.y.toFixed(3), score: kp.score.toFixed(3) }))
      })
    }
    
    // Find wrist keypoints
    const leftWrist = keypoints.find(kp => kp.name === 'left_wrist') || null
    const rightWrist = keypoints.find(kp => kp.name === 'right_wrist') || null
    
    // Debug: Log wrist detection
    if (Math.random() < 0.05) {
      console.log('👋 Wrist detection:', {
        leftWrist: leftWrist ? { x: leftWrist.x.toFixed(4), y: leftWrist.y.toFixed(4), score: leftWrist.score.toFixed(3) } : 'NOT FOUND',
        rightWrist: rightWrist ? { x: rightWrist.x.toFixed(4), y: rightWrist.y.toFixed(4), score: rightWrist.score.toFixed(3) } : 'NOT FOUND'
      })
    }

    // 更新手部状态
    this.updateHandState(this.leftHand, leftWrist, currentTime)
    this.updateHandState(this.rightHand, rightWrist, currentTime)

    // 记录速度（用于调试）
    if (this.leftHand.position) {
      this.logVelocity('Left', this.leftHand)
    }
    if (this.rightHand.position) {
      this.logVelocity('Right', this.rightHand)
    }

    // 检测击打
    const leftHit = this.detectHit(this.leftHand, currentTime)
    const rightHit = this.detectHit(this.rightHand, currentTime)

    let event: GestureEvent = null

    // Determine event type
    if (leftHit && rightHit) {
      event = 'hit_both'
      this.lastLeftHitTime = currentTime
      this.lastRightHitTime = currentTime
      console.log('🥁 Both Hands Hit')
    } else if (leftHit || rightHit) {
      // Check for dual hit within time window
      const timeSinceLeft = currentTime - this.lastLeftHitTime
      const timeSinceRight = currentTime - this.lastRightHitTime

      if (leftHit && timeSinceRight < this.config.dualHitWindowMs) {
        event = 'hit_both'
        this.lastLeftHitTime = currentTime
        console.log('🥁 Both Hands Hit (sequential)')
      } else if (rightHit && timeSinceLeft < this.config.dualHitWindowMs) {
        event = 'hit_both'
        this.lastRightHitTime = currentTime
        console.log('🥁 Both Hands Hit (sequential)')
      } else if (leftHit) {
        event = 'hit_left'
        this.lastLeftHitTime = currentTime
        console.log('🥁 Left Hand Hit')
      } else if (rightHit) {
        event = 'hit_right'
        this.lastRightHitTime = currentTime
        console.log('🥁 Right Hand Hit')
      }
    }

    return {
      event,
      leftVelocity: this.leftHand.velocity,
      rightVelocity: this.rightHand.velocity,
      leftPosition: this.leftHand.position,
      rightPosition: this.rightHand.position
    }
  }

  /**
   * 重置检测器状态
   */
  public reset(): void {
    this.leftHand = this.createHandState()
    this.rightHand = this.createHandState()
    this.lastLeftHitTime = 0
    this.lastRightHitTime = 0
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): GestureConfig {
    return { ...this.config }
  }

  /**
   * Get right hand position (normalized screen coordinates)
   */
  public getRightHandPosition(): { x: number; y: number; hasPosition: boolean } {
    if (!this.rightHand.position) {
      return { x: 0, y: 0, hasPosition: false }
    }
    return {
      x: this.rightHand.position.x,
      y: this.rightHand.position.y,
      hasPosition: true
    }
  }

  /**
   * Get left hand position (normalized screen coordinates)
   */
  public getLeftHandPosition(): { x: number; y: number; hasPosition: boolean } {
    if (!this.leftHand.position) {
      return { x: 0, y: 0, hasPosition: false }
    }
    return {
      x: this.leftHand.position.x,
      y: this.leftHand.position.y,
      hasPosition: true
    }
  }
}


