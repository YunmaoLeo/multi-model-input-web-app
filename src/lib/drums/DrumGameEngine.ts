/**
 * Drum Game Engine
 * Manages the new drum-based game system
 */

import type {
  DrumChart,
  DrumChartNote,
  VisibleDrumNote,
  DrumHit,
  DrumGameStats,
  DrumGameState,
  DrumPad
} from '@/types/drum'
import type { GestureEvent } from '@/lib/gesture'
import { DrumPadManager } from './DrumPadManager'
import { DrumHitDetector } from './DrumHitDetector'
import { DrumAudioPlayer } from './DrumAudioPlayer'

// Timing windows for judgment
const TIMING_WINDOWS = {
  perfect: 150,  // ±150ms
  good: 300,      // ±300ms
  miss: 500       // ±500ms
}

export class DrumGameEngine {
  private chart: DrumChart | null = null
  private padManager: DrumPadManager
  private hitDetector: DrumHitDetector
  private audioPlayer: DrumAudioPlayer
  private audioContext: AudioContext

  // Game state
  private state: DrumGameState = 'idle'
  private startTime: number = 0
  private currentTime: number = 0

  // Note management
  private notes: DrumChartNote[] = []
  private currentNoteIndex: number = 0
  private visibleNotes: VisibleDrumNote[] = []
  private lookaheadTime: number = 2.0  // Show notes 2s ahead

  // Statistics
  private stats: DrumGameStats = {
    totalHits: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    accuracy: 1.0,
    score: 0,
    combo: 0,
    maxCombo: 0
  }

  // Callbacks
  private onHitCallback?: (hit: DrumHit) => void
  private onStatsUpdateCallback?: (stats: DrumGameStats) => void
  private onGameEndCallback?: (stats: DrumGameStats) => void

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    this.padManager = new DrumPadManager()
    this.hitDetector = new DrumHitDetector()
    this.audioPlayer = new DrumAudioPlayer(audioContext)

    console.log('🥁 DrumGameEngine initialized')
  }

  /**
   * Load drum samples
   */
  public async loadSamples(): Promise<void> {
    const pads = this.padManager.getAllPads()
    await this.audioPlayer.loadAllSamples(pads)
    console.log('✅ All drum samples loaded')
  }

  /**
   * Set chart
   */
  public setChart(chart: DrumChart): void {
    this.chart = chart
    this.notes = [...chart.notes].sort((a, b) => a.time - b.time)
    this.currentNoteIndex = 0
    this.visibleNotes = []
    
    console.log(`📊 Chart loaded: ${this.notes.length} notes, ${chart.duration}s duration`)
  }

  /**
   * Start game
   */
  public start(): void {
    if (this.state !== 'idle' && this.state !== 'ready') {
      console.warn('⚠️ Game already running')
      return
    }

    if (!this.chart) {
      throw new Error('No chart loaded')
    }

    console.log('🚀 Drum game started')
    this.state = 'playing'
    this.startTime = this.audioContext.currentTime
    this.currentNoteIndex = 0
    this.visibleNotes = []
    
    // Reset stats
    this.stats = {
      totalHits: 0,
      perfect: 0,
      good: 0,
      miss: 0,
      accuracy: 1.0,
      score: 0,
      combo: 0,
      maxCombo: 0
    }
  }

  /**
   * Stop game
   */
  public stop(): void {
    if (this.state === 'finished') return
    
    console.log('⏹️ Game stopped')
    this.state = 'finished'
    
    if (this.onGameEndCallback) {
      this.onGameEndCallback(this.stats)
    }
  }

  /**
   * Update game state (called every frame)
   */
  public update(): void {
    if (this.state !== 'playing') return

    // Update current time
    this.currentTime = this.audioContext.currentTime - this.startTime

    // Check if game should end
    if (this.chart && this.currentTime >= this.chart.duration) {
      console.log('⏱️ Time\'s up, ending game')
      this.stop()
      return
    }

    // Schedule new notes
    this.scheduleNotes()

    // Update visible notes
    this.updateVisibleNotes()

    // Check for missed notes
    this.checkMissedNotes()
  }

  /**
   * Process user input
   */
  public onUserInput(
    gestureEvent: GestureEvent,
    leftHandPos: { x: number; y: number } | null,
    rightHandPos: { x: number; y: number } | null,
    currentTime: number
  ): DrumHit | null {
    if (this.state !== 'playing') return null
    if (!gestureEvent) return null

    // Find which drum pad the hand is over
    let hitDrum: DrumPad | null = null

    if (leftHandPos && (gestureEvent === 'hit_left' || gestureEvent === 'hit_both')) {
      hitDrum = this.padManager.findPadAtPosition(leftHandPos.x, leftHandPos.y)
    }
    
    if (!hitDrum && rightHandPos && (gestureEvent === 'hit_right' || gestureEvent === 'hit_both')) {
      hitDrum = this.padManager.findPadAtPosition(rightHandPos.x, rightHandPos.y)
    }

    if (!hitDrum) return null

    // Detect hit
    const hit = this.hitDetector.detectHit(
      gestureEvent,
      leftHandPos,
      rightHandPos,
      hitDrum,
      currentTime
    )

    if (!hit) return null

    // Play drum sound
    this.audioPlayer.playDrum(hit.drumId, hit.velocity || 1.0)

    // Judge against chart notes
    const judgeInfo = this.judgeHit(hit, currentTime)

    // Update stats
    this.stats.totalHits++
    if (judgeInfo) {
      if (judgeInfo.result === 'perfect') {
        this.stats.perfect++
        this.stats.combo++
        this.stats.score += 100 * this.stats.combo
      } else if (judgeInfo.result === 'good') {
        this.stats.good++
        this.stats.combo++
        this.stats.score += 50 * this.stats.combo
      } else {
        this.stats.miss++
        this.stats.combo = 0
      }
    } else {
      this.stats.miss++
      this.stats.combo = 0
    }

    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo)

    // Calculate accuracy
    const totalJudged = this.stats.perfect + this.stats.good + this.stats.miss
    if (totalJudged > 0) {
      this.stats.accuracy = (this.stats.perfect + this.stats.good * 0.5) / totalJudged
    }

    // Trigger callbacks
    if (this.onHitCallback) {
      this.onHitCallback(hit)
    }

    if (this.onStatsUpdateCallback) {
      this.onStatsUpdateCallback(this.stats)
    }

    return hit
  }

  /**
   * Judge hit against chart notes
   */
  private judgeHit(hit: DrumHit, hitTime: number): { result: 'perfect' | 'good' | 'miss'; note: DrumChartNote } | null {
    if (!this.chart) return null

    // Find closest matching note
    let closestNote: DrumChartNote | null = null
    let minTimeDiff = Infinity

    for (const note of this.notes) {
      // Check if drum matches
      if (note.drum !== hit.drumId) continue

      const timeDiff = Math.abs(note.time - hitTime)
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff
        closestNote = note
      }
    }

    if (!closestNote) return null

    // Check if within timing window
    const timingError = minTimeDiff * 1000  // Convert to ms

    if (timingError <= TIMING_WINDOWS.perfect) {
      return { result: 'perfect', note: closestNote }
    } else if (timingError <= TIMING_WINDOWS.good) {
      return { result: 'good', note: closestNote }
    } else {
      return { result: 'miss', note: closestNote }
    }
  }

  /**
   * Schedule new notes
   */
  private scheduleNotes(): void {
    if (!this.chart) return

    while (
      this.currentNoteIndex < this.notes.length &&
      this.notes[this.currentNoteIndex].time <= this.currentTime + this.lookaheadTime
    ) {
      const note = this.notes[this.currentNoteIndex]
      const visibleNote: VisibleDrumNote = {
        ...note,
        id: `note-${this.currentNoteIndex}`,
        progress: 0,
        isPassed: false
      }

      this.visibleNotes.push(visibleNote)
      this.currentNoteIndex++
    }
  }

  /**
   * Update visible notes
   */
  private updateVisibleNotes(): void {
    this.visibleNotes = this.visibleNotes.map(note => {
      const timeUntilHit = note.time - this.currentTime
      const progress = 1 - (timeUntilHit / this.lookaheadTime)

      return {
        ...note,
        progress: Math.max(0, Math.min(1, progress)),
        isPassed: timeUntilHit < -TIMING_WINDOWS.miss / 1000
      }
    }).filter(note => !note.isPassed)
  }

  /**
   * Check for missed notes
   */
  private checkMissedNotes(): void {
    this.visibleNotes.forEach(note => {
      const timeUntilHit = note.time - this.currentTime
      const missWindow = TIMING_WINDOWS.miss / 1000

      if (timeUntilHit < -missWindow && !note.isPassed) {
        this.stats.miss++
        this.stats.combo = 0

        // Remove from visible list
        this.visibleNotes = this.visibleNotes.filter(n => n.id !== note.id)
      }
    })
  }

  /**
   * Register callbacks
   */
  public onHit(callback: (hit: DrumHit) => void): void {
    this.onHitCallback = callback
  }

  public onStatsUpdate(callback: (stats: DrumGameStats) => void): void {
    this.onStatsUpdateCallback = callback
  }

  public onGameEnd(callback: (stats: DrumGameStats) => void): void {
    this.onGameEndCallback = callback
  }

  /**
   * Getters
   */
  public getVisibleNotes(): VisibleDrumNote[] {
    return this.visibleNotes
  }

  public getCurrentTime(): number {
    return this.currentTime
  }

  public getState(): DrumGameState {
    return this.state
  }

  public getStats(): DrumGameStats {
    return this.stats
  }

  public getPadManager(): DrumPadManager {
    return this.padManager
  }

  public getChart(): DrumChart | null {
    return this.chart
  }
}

