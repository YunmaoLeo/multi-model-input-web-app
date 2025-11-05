/**
 * Rhythm Game Audio Player
 * Background music plays continuously, volume dynamically controlled based on user hits
 */

export class RhythmAudioPlayer {
  private audioContext: AudioContext
  private audioBuffer: AudioBuffer
  private audioSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode
  private isPlaying: boolean = false
  private startTime: number = 0
  private baseVolume: number = 0.25  // Start at low volume (25%)
  private currentVolume: number = 0.25
  private targetVolume: number = 1.0  // Target volume when playing well
  private missCount: number = 0
  private consecutiveHits: number = 0

  constructor(audioContext: AudioContext, audioBuffer: AudioBuffer) {
    this.audioContext = audioContext
    this.audioBuffer = audioBuffer
    
    // Create main gain node
    this.gainNode = audioContext.createGain()
    this.gainNode.gain.value = this.baseVolume  // Start at low volume
    this.gainNode.connect(audioContext.destination)
    
    console.log('🎵 RhythmAudioPlayer initialized:', {
      duration: audioBuffer.duration.toFixed(2) + 's',
      sampleRate: audioBuffer.sampleRate + 'Hz',
      startVolume: (this.baseVolume * 100).toFixed(0) + '%'
    })
  }

  /**
   * Start playing background music
   */
  public start(): void {
    if (this.isPlaying) {
      console.warn('⚠️ Audio already playing')
      return
    }

    try {
      // Create audio source
      this.audioSource = this.audioContext.createBufferSource()
      this.audioSource.buffer = this.audioBuffer
      this.audioSource.connect(this.gainNode)
      
      // Record start time
      this.startTime = this.audioContext.currentTime
      
      // Start playback at low volume
      this.gainNode.gain.setValueAtTime(this.baseVolume, this.audioContext.currentTime)
      this.currentVolume = this.baseVolume
      this.audioSource.start(0)
      this.isPlaying = true
      
      // Listen for playback end
      this.audioSource.onended = () => {
        this.isPlaying = false
        console.log('⏹️ Audio playback ended')
      }
      
      console.log(`🎵 Background music started playing (starting volume: ${(this.baseVolume * 100).toFixed(0)}%)`)
    } catch (error) {
      console.error('❌ Audio playback failed:', error)
    }
  }

  /**
   * Stop playback
   */
  public stop(): void {
    if (this.audioSource && this.isPlaying) {
      try {
        this.audioSource.stop()
        this.audioSource.disconnect()
        this.audioSource = null
        this.isPlaying = false
        this.gainNode.gain.value = 0
        console.log('⏹️ Audio stopped')
      } catch (error) {
        console.error('❌ Failed to stop audio:', error)
      }
    }
  }

  /**
   * Handle correct hit - gradually increase volume
   */
  public onCorrectHit(): void {
    if (!this.isPlaying) return

    try {
      const now = this.audioContext.currentTime
      
      // Reset miss count and increase consecutive hits
      this.missCount = 0
      this.consecutiveHits++
      
      // Gradually increase volume based on consecutive hits
      // More consecutive hits = higher volume (up to target)
      const volumeBoost = Math.min(this.consecutiveHits * 0.1, this.targetVolume - this.baseVolume)
      const newVolume = Math.min(this.baseVolume + volumeBoost, this.targetVolume)
      
      this.gainNode.gain.cancelScheduledValues(now)
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
      this.gainNode.gain.linearRampToValueAtTime(newVolume, now + 0.15)
      this.currentVolume = newVolume
      
      console.log(`🔊 Volume increased (hits: ${this.consecutiveHits}, volume: ${(newVolume * 100).toFixed(0)}%)`)
    } catch (error) {
      console.error('❌ Failed to boost volume:', error)
    }
  }

  /**
   * Handle miss - reduce volume significantly
   */
  public onMiss(): void {
    if (!this.isPlaying) return

    try {
      this.missCount++
      this.consecutiveHits = 0  // Reset consecutive hits
      const now = this.audioContext.currentTime
      
      // Significantly reduce volume on miss
      // Each miss reduces volume more drastically
      const volumeReduction = Math.min(0.80, this.missCount * 0.25)  // Up to 80% reduction
      const targetVolume = Math.max(this.baseVolume * (1 - volumeReduction), 0.05)  // Minimum 5% volume
      
      this.gainNode.gain.cancelScheduledValues(now)
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
      this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.2)
      this.currentVolume = targetVolume
      
      console.log(`🔉 Volume reduced (miss count: ${this.missCount}, volume: ${(targetVolume * 100).toFixed(0)}%)`)
    } catch (error) {
      console.error('❌ Failed to reduce volume:', error)
    }
  }

  /**
   * Get current playback time (relative to music start)
   */
  public getCurrentTime(): number {
    if (!this.isPlaying) return 0
    return this.audioContext.currentTime - this.startTime
  }

  /**
   * Get total audio duration
   */
  public getDuration(): number {
    return this.audioBuffer.duration
  }

  /**
   * Check if playing
   */
  public getIsPlaying(): boolean {
    return this.isPlaying
  }
}

