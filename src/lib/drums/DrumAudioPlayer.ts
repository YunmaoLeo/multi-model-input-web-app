/**
 * Drum Audio Player
 * Manages playback of multiple drum samples
 */

import type { DrumPad } from '@/types/drum'

export class DrumAudioPlayer {
  private audioContext: AudioContext
  private audioBuffers: Map<string, AudioBuffer> = new Map()
  private masterGain: GainNode
  private volume: number = 0.8

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    
    // Create master gain node
    this.masterGain = audioContext.createGain()
    this.masterGain.gain.value = this.volume
    this.masterGain.connect(audioContext.destination)
    
    console.log('🎵 DrumAudioPlayer initialized')
  }

  /**
   * Load audio buffer for a drum pad
   */
  public async loadDrumSample(drumPad: DrumPad): Promise<void> {
    if (this.audioBuffers.has(drumPad.id)) {
      console.log(`✅ ${drumPad.name} already loaded`)
      return
    }

    try {
      console.log(`📥 Loading ${drumPad.name} from ${drumPad.audioPath}`)
      
      const response = await fetch(drumPad.audioPath)
      if (!response.ok) {
        throw new Error(`Failed to load ${drumPad.audioPath}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      this.audioBuffers.set(drumPad.id, audioBuffer)
      console.log(`✅ ${drumPad.name} loaded (${audioBuffer.duration.toFixed(2)}s)`)
    } catch (error) {
      console.error(`❌ Failed to load ${drumPad.name}:`, error)
      throw error
    }
  }

  /**
   * Load all drum samples
   */
  public async loadAllSamples(drumPads: DrumPad[]): Promise<void> {
    console.log(`📥 Loading ${drumPads.length} drum samples...`)
    
    await Promise.all(
      drumPads.map(pad => this.loadDrumSample(pad))
    )
    
    console.log(`✅ All ${drumPads.length} samples loaded`)
  }

  /**
   * Play a drum sound
   */
  public playDrum(drumId: string, velocity: number = 1.0): void {
    const buffer = this.audioBuffers.get(drumId)
    if (!buffer) {
      console.warn(`⚠️ Drum sample not loaded: ${drumId}`)
      return
    }

    try {
      console.log('🔊 DrumAudioPlayer.playDrum', {
        drumId,
        velocity: velocity.toFixed(3)
      })
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer

      // Create gain node for this specific hit (for velocity control)
      const hitGain = this.audioContext.createGain()
      hitGain.gain.value = velocity * this.volume
      hitGain.connect(this.masterGain)

      source.connect(hitGain)
      source.start(0)

      // Clean up after playback
      source.onended = () => {
        source.disconnect()
        hitGain.disconnect()
      }
    } catch (error) {
      console.error(`❌ Failed to play ${drumId}:`, error)
    }
  }

  /**
   * Set master volume (0-1)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    const now = this.audioContext.currentTime
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1)
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this.volume
  }

  /**
   * Check if a drum sample is loaded
   */
  public isLoaded(drumId: string): boolean {
    return this.audioBuffers.has(drumId)
  }

  /**
   * Get loaded drum IDs
   */
  public getLoadedDrums(): string[] {
    return Array.from(this.audioBuffers.keys())
  }
}

