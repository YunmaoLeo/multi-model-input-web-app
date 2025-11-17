/**
 * Accompaniment Player
 * Plays generated accompaniment patterns using WebAudio API
 */

import type { AccompanimentPattern, AccompanimentNote } from '@/types/accompaniment'

export class AccompanimentPlayer {
  private audioContext: AudioContext
  private patterns: Map<string, AccompanimentPattern> = new Map()
  private scheduledNotes: Map<string, AudioScheduledSourceNode[]> = new Map()
  private masterGain: GainNode
  private oscillators: Map<string, OscillatorNode> = new Map()
  private volume: number = 0.5

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    
    // Create master gain node
    this.masterGain = audioContext.createGain()
    this.masterGain.gain.value = this.volume
    this.masterGain.connect(audioContext.destination)
    
    console.log('AccompanimentPlayer initialized')
  }

  /**
   * Load accompaniment pattern
   */
  public loadPattern(pattern: AccompanimentPattern): void {
    this.patterns.set(pattern.instrument, pattern)
    console.log(`Loaded ${pattern.instrument} pattern: ${pattern.notes.length} notes`)
  }

  /**
   * Start playing a pattern
   */
  public startPattern(instrument: string, startTime: number = 0): void {
    const pattern = this.patterns.get(instrument)
    if (!pattern) {
      console.warn(`Pattern not loaded for instrument: ${instrument}`)
      return
    }

    // Clear existing scheduled notes for this instrument
    this.stopPattern(instrument)

    const scheduled: AudioScheduledSourceNode[] = []
    const currentTime = this.audioContext.currentTime

    // Schedule all notes
    for (const note of pattern.notes) {
      const noteTime = currentTime + startTime + note.time
      const source = this.playNote(note, noteTime)
      if (source) {
        scheduled.push(source)
      }
    }

    this.scheduledNotes.set(instrument, scheduled)
    console.log(`Started playing ${instrument} pattern: ${pattern.notes.length} notes scheduled`)
  }

  /**
   * Stop playing a pattern
   */
  public stopPattern(instrument: string): void {
    const scheduled = this.scheduledNotes.get(instrument)
    if (scheduled) {
      for (const source of scheduled) {
        try {
          source.stop()
          source.disconnect()
        } catch (e) {
          // Source may have already stopped
        }
      }
      this.scheduledNotes.delete(instrument)
    }

    // Stop any oscillators
    const osc = this.oscillators.get(instrument)
    if (osc) {
      try {
        osc.stop()
        osc.disconnect()
      } catch (e) {
        // Oscillator may have already stopped
      }
      this.oscillators.delete(instrument)
    }
  }

  /**
   * Stop all patterns
   */
  public stopAll(): void {
    for (const instrument of this.patterns.keys()) {
      this.stopPattern(instrument)
    }
  }

  /**
   * Play a single note
   */
  private playNote(note: AccompanimentNote, startTime: number): AudioScheduledSourceNode | null {
    try {
      // Convert MIDI note to frequency
      const frequency = this.midiToFrequency(note.pitch)

      // Create oscillator
      const oscillator = this.audioContext.createOscillator()
      oscillator.type = 'sine'  // Simple sine wave (can be enhanced with samples)
      oscillator.frequency.value = frequency

      // Create gain node for velocity and duration
      const gainNode = this.audioContext.createGain()
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(note.velocity * this.volume, startTime + 0.01)
      
      const duration = note.duration || 0.2
      const endTime = startTime + duration
      gainNode.gain.linearRampToValueAtTime(0, endTime - 0.01)
      gainNode.gain.setValueAtTime(0, endTime)

      // Connect audio graph
      oscillator.connect(gainNode)
      gainNode.connect(this.masterGain)

      // Schedule playback
      oscillator.start(startTime)
      oscillator.stop(endTime)

      // Clean up on end
      oscillator.onended = () => {
        oscillator.disconnect()
        gainNode.disconnect()
      }

      return oscillator
    } catch (error) {
      console.error(`Failed to play note: ${error}`)
      return null
    }
  }

  /**
   * Convert MIDI note number to frequency (Hz)
   */
  private midiToFrequency(midiNote: number): number {
    // A4 (MIDI 69) = 440 Hz
    return 440 * Math.pow(2, (midiNote - 69) / 12)
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
   * Dispose resources
   */
  public dispose(): void {
    this.stopAll()
    this.patterns.clear()
    this.scheduledNotes.clear()
    this.oscillators.clear()
  }
}

