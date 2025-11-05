/**
 * Drum Pad Manager
 * Manages the layout and configuration of virtual drum pads
 */

import type { DrumPad } from '@/types/drum'

export class DrumPadManager {
  private pads: DrumPad[] = []

  constructor() {
    this.initializeDefaultLayout()
  }

  /**
   * Initialize default 6-drum layout (2 rows x 3 columns)
   * Positioned in the center-upper area of screen
   */
  private initializeDefaultLayout(): void {
    // Row 1: Kick, Snare, HiHat (upper row)
    // Row 2: Crash, Ride, Tom (lower row)
    // Positioned more centrally, not too close to edges
    
    const pads: DrumPad[] = [
      {
        id: 'kick',
        name: 'Kick',
        position: { x: 0.25, y: 0.3 },   // Top row - left
        radius: 0.15,
        audioPath: '/assets/drums/kick.wav',
        color: '#ff6b6b',
        icon: '🥁'
      },
      {
        id: 'snare',
        name: 'Snare',
        position: { x: 0.5, y: 0.3 },   // Top row - center
        radius: 0.15,
        audioPath: '/assets/drums/snare.wav',
        color: '#4ecdc4',
        icon: '🥁'
      },
      {
        id: 'hihat',
        name: 'HiHat',
        position: { x: 0.75, y: 0.3 },   // Top row - right
        radius: 0.15,
        audioPath: '/assets/drums/hihat.wav',
        color: '#45b7d1',
        icon: '🥁'
      },
      {
        id: 'crash',
        name: 'Crash',
        position: { x: 0.25, y: 0.75 },   // Bottom row - left (increased distance)
        radius: 0.15,
        audioPath: '/assets/drums/crash.wav',
        color: '#96ceb4',
        icon: '🥁'
      },
      {
        id: 'ride',
        name: 'Ride',
        position: { x: 0.5, y: 0.75 },   // Bottom row - center (increased distance)
        radius: 0.15,
        audioPath: '/assets/drums/ride.wav',
        color: '#ffeaa7',
        icon: '🥁'
      },
      {
        id: 'tom',
        name: 'Tom',
        position: { x: 0.75, y: 0.75 },   // Bottom row - right (increased distance)
        radius: 0.15,
        audioPath: '/assets/drums/tom.wav',
        color: '#a29bfe',
        icon: '🥁'
      }
    ]

    this.pads = pads
    console.log('🥁 DrumPadManager initialized:', this.pads.length, 'drums')
  }

  /**
   * Get all drum pads
   */
  public getAllPads(): DrumPad[] {
    return this.pads
  }

  /**
   * Get drum pad by ID
   */
  public getPadById(id: string): DrumPad | null {
    return this.pads.find(pad => pad.id === id) || null
  }

  /**
   * Find which drum pad contains the given position
   * @param normalizedX Normalized X coordinate (0-1) from gesture detector
   * @param normalizedY Normalized Y coordinate (0-1) from gesture detector
   * @returns The drum pad that contains the position, or null
   */
  public findPadAtPosition(normalizedX: number, normalizedY: number): DrumPad | null {
    // Note: Keypoint coordinates might be mirrored
    // For left_wrist, if it's on screen left, x should be small (0-0.5)
    // For right_wrist, if it's on screen right, x should be large (0.5-1)
    // But MoveNet might return mirrored coordinates, so we need to handle that
    
    for (const pad of this.pads) {
      const distance = Math.sqrt(
        Math.pow(normalizedX - pad.position.x, 2) +
        Math.pow(normalizedY - pad.position.y, 2)
      )
      
      if (distance <= pad.radius) {
        return pad
      }
    }
    
    return null
  }

  /**
   * Find pad using screen pixel coordinates
   * @param screenX Screen X coordinate in pixels
   * @param screenY Screen Y coordinate in pixels
   * @param screenWidth Screen width in pixels
   * @param screenHeight Screen height in pixels
   */
  public findPadAtScreenPosition(
    screenX: number,
    screenY: number,
    screenWidth: number,
    screenHeight: number
  ): DrumPad | null {
    // Convert screen coordinates to normalized (0-1)
    const normalizedX = screenX / screenWidth
    const normalizedY = screenY / screenHeight
    
    return this.findPadAtPosition(normalizedX, normalizedY)
  }

  /**
   * Get pad count
   */
  public getPadCount(): number {
    return this.pads.length
  }
}

