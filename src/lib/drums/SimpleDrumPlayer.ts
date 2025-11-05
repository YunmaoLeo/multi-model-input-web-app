/**
 * Simple Drum Player
 * Simplified version for testing - just play drums based on hand position
 */

import type { DrumPad } from '@/types/drum'
import { DrumPadManager } from './DrumPadManager'
import { DrumAudioPlayer } from './DrumAudioPlayer'
import type { GestureEvent } from '@/lib/gesture'

export class SimpleDrumPlayer {
  private padManager: DrumPadManager
  private audioPlayer: DrumAudioPlayer
  private audioContext: AudioContext
  private lastHitTime: Map<string, number> = new Map()
  private debounceTime: number = 150  // Minimum time between hits (ms)
  private mirrorX: boolean = true  // Flip X coordinate (camera is usually mirrored)

  constructor(audioContext: AudioContext, mirrorX: boolean = true) {
    this.audioContext = audioContext
    this.padManager = new DrumPadManager()
    this.audioPlayer = new DrumAudioPlayer(audioContext)
    this.mirrorX = mirrorX
    
    console.log('🥁 SimpleDrumPlayer initialized', { mirrorX })
  }

  /**
   * Load all drum samples
   */
  public async loadSamples(): Promise<void> {
    const pads = this.padManager.getAllPads()
    await this.audioPlayer.loadAllSamples(pads)
    console.log('✅ All drum samples loaded')
  }

  /**
   * Process hand gesture and position
   * Returns the drum that was hit, or null
   * @param screenWidth Screen width in pixels (for coordinate conversion)
   * @param screenHeight Screen height in pixels (for coordinate conversion)
   */
  public processHit(
    gestureEvent: GestureEvent,
    leftHandPos: { x: number; y: number } | null,
    rightHandPos: { x: number; y: number } | null,
    currentTime: number,
    screenWidth: number = 640,
    screenHeight: number = 480
  ): DrumPad | null {
    if (!gestureEvent) return null

    // Find which drum pad the hand is over
    // Apply X mirroring if needed (camera is usually mirrored, so user's left = screen right)
    let hitDrum: DrumPad | null = null

    if (leftHandPos && (gestureEvent === 'hit_left' || gestureEvent === 'hit_both')) {
      // Apply mirroring if enabled
      const x = this.mirrorX ? (1.0 - leftHandPos.x) : leftHandPos.x
      hitDrum = this.padManager.findPadAtPosition(x, leftHandPos.y)
    }
    
    if (!hitDrum && rightHandPos && (gestureEvent === 'hit_right' || gestureEvent === 'hit_both')) {
      // Apply mirroring if enabled
      const x = this.mirrorX ? (1.0 - rightHandPos.x) : rightHandPos.x
      hitDrum = this.padManager.findPadAtPosition(x, rightHandPos.y)
    }

    if (!hitDrum) return null

    // Debounce: prevent multiple hits within short time
    const lastHit = this.lastHitTime.get(hitDrum.id) || 0
    if (currentTime - lastHit < this.debounceTime) {
      return null
    }

    // Record hit time
    this.lastHitTime.set(hitDrum.id, currentTime)

    // Play drum sound
    this.audioPlayer.playDrum(hitDrum.id, 1.0)

    console.log(`🥁 Hit: ${hitDrum.name} (${hitDrum.id})`)
    
    return hitDrum
  }

  /**
   * Get all drum pads (for display)
   */
  public getAllPads(): DrumPad[] {
    return this.padManager.getAllPads()
  }

  /**
   * Set X mirroring (for camera mirroring)
   */
  public setMirrorX(enabled: boolean): void {
    this.mirrorX = enabled
    console.log(`🪞 X mirroring ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Reset debounce timers
   */
  public reset(): void {
    this.lastHitTime.clear()
  }
}

