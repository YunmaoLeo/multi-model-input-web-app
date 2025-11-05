/**
 * Drum Hit Detector
 * Detects spatial drum hits based on hand position and gesture
 */

import type { DrumPad, DrumHit } from '@/types/drum'
import type { GestureEvent } from '@/lib/gesture'

export class DrumHitDetector {
  private lastHitTime: Map<string, number> = new Map()  // Track last hit time per drum
  private debounceTime: number = 100  // Minimum time between hits (ms)

  /**
   * Detect which drum was hit based on hand position and gesture
   */
  public detectHit(
    gestureEvent: GestureEvent,
    leftHandPos: { x: number; y: number } | null,
    rightHandPos: { x: number; y: number } | null,
    drumPad: DrumPad,
    currentTime: number
  ): DrumHit | null {
    if (!gestureEvent) return null

    // Determine which hand(s) are involved
    let hand: 'left' | 'right' | 'both' = 'both'
    let handPosition: { x: number; y: number } | null = null

    if (gestureEvent === 'hit_left') {
      hand = 'left'
      handPosition = leftHandPos
    } else if (gestureEvent === 'hit_right') {
      hand = 'right'
      handPosition = rightHandPos
    } else if (gestureEvent === 'hit_both') {
      hand = 'both'
      // Use the hand that's closer to the drum pad
      if (leftHandPos && rightHandPos) {
        const leftDist = this.getDistance(leftHandPos, drumPad.position)
        const rightDist = this.getDistance(rightHandPos, drumPad.position)
        handPosition = leftDist < rightDist ? leftHandPos : rightHandPos
      } else {
        handPosition = leftHandPos || rightHandPos
      }
    }

    if (!handPosition) return null

    // Check if hand is in drum pad zone
    const distance = this.getDistance(handPosition, drumPad.position)
    if (distance > drumPad.radius) {
      return null  // Not in this drum's zone
    }

    // Debounce: prevent multiple hits within short time
    const lastHit = this.lastHitTime.get(drumPad.id) || 0
    if (currentTime - lastHit < this.debounceTime) {
      return null
    }

    // Record hit time
    this.lastHitTime.set(drumPad.id, currentTime)

    // Create hit event
    const hit: DrumHit = {
      drumId: drumPad.id,
      hand,
      position: handPosition,
      timestamp: currentTime
    }

    return hit
  }

  /**
   * Calculate distance between two points
   */
  private getDistance(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ): number {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2)
    )
  }

  /**
   * Reset debounce timers
   */
  public reset(): void {
    this.lastHitTime.clear()
  }
}

