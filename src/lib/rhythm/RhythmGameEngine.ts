/**
 * Rhythm Game Engine
 * Manages game timeline, note scheduling, and judgment system
 */

import type { Chart, Note, VisibleNote, JudgeResult, JudgeInfo, GameStats, GameState } from '@/types/rhythm'
import type { GestureEvent } from '@/lib/gesture'
import { RhythmAudioPlayer } from './RhythmAudioPlayer'

/**
 * Timing windows (milliseconds)
 */
const TIMING_WINDOWS = {
  perfect: 120,  // ±120ms = Perfect (increased tolerance)
  good: 250,     // ±250ms = Good (increased tolerance)
  miss: 400      // ±400ms = Miss (ignore beyond this)
}

/**
 * Score configuration
 */
const SCORE_VALUES = {
  perfect: 100,
  good: 50,
  miss: 0
}

export class RhythmGameEngine {
  private chart: Chart
  private audioPlayer: RhythmAudioPlayer
  private audioContext: AudioContext
  
  // Game state
  private state: GameState = 'idle'
  private startTime: number = 0
  private currentTime: number = 0
  
  // Note management
  private notes: Note[]
  private currentNoteIndex: number = 0
  private visibleNotes: VisibleNote[] = []
  private lookaheadTime: number = 2.0  // Show notes 2 seconds ahead
  
  // Statistics
  private stats: GameStats = {
    perfect: 0,
    good: 0,
    miss: 0,
    combo: 0,
    maxCombo: 0,
    score: 0,
    accuracy: 1.0
  }
  
  // Callbacks
  private onJudgeCallback?: (judgeInfo: JudgeInfo) => void
  private onStatsUpdateCallback?: (stats: GameStats) => void
  private onGameEndCallback?: (stats: GameStats) => void

  constructor(
    chart: Chart,
    audioBuffer: AudioBuffer,
    audioContext: AudioContext
  ) {
    this.chart = chart
    this.audioContext = audioContext
    this.audioPlayer = new RhythmAudioPlayer(audioContext, audioBuffer)
    this.notes = [...chart.notes].sort((a, b) => a.time - b.time)
    
    console.log('🎮 RhythmGameEngine initialized:', {
      songId: chart.songId,
      difficulty: chart.difficulty,
      noteCount: this.notes.length,
      duration: audioBuffer.duration.toFixed(2) + 's'
    })
  }

  /**
   * Start game
   */
  public start(): void {
    if (this.state !== 'idle' && this.state !== 'ready') {
      console.warn('⚠️ 游戏已经在运行')
      return
    }
    
    console.log('🚀 Game started')
    console.log('🎵 Background music plays continuously, volume increases on correct hits, decreases on miss')
    this.state = 'playing'
    this.startTime = this.audioContext.currentTime
    this.currentNoteIndex = 0
    this.visibleNotes = []
    
    // Start playing background music (at low volume)
    this.audioPlayer.start()
  }

  /**
   * Pause game
   */
  public pause(): void {
    if (this.state !== 'playing') return
    
    console.log('⏸️ Game paused')
    this.state = 'paused'
  }

  /**
   * Resume game
   */
  public resume(): void {
    if (this.state !== 'paused') return
    
    console.log('▶️ Game resumed')
    this.state = 'playing'
  }

  /**
   * Stop game
   */
  public stop(): void {
    // Prevent multiple calls
    if (this.state === 'finished') {
      console.log('⚠️ Game already finished, skipping')
      return
    }
    
    console.log('⏹️ Game stopped')
    this.state = 'finished'
    
    // Stop background music
    this.audioPlayer.stop()
    
    // Trigger callback only once
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
    if (this.currentTime >= this.audioPlayer.getDuration()) {
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
   * Schedule new notes
   */
  private scheduleNotes(): void {
    while (
      this.currentNoteIndex < this.notes.length &&
      this.notes[this.currentNoteIndex].time <= this.currentTime + this.lookaheadTime
    ) {
      const note = this.notes[this.currentNoteIndex]
      const visibleNote: VisibleNote = {
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
      // Calculate falling progress
      const timeUntilHit = note.time - this.currentTime
      
      // Progress calculation:
      // - progress = 0: note appears at top (2 seconds before hit)
      // - progress = 1: note reaches judge line (at hit time)
      // Judge line is at 55% of track height, so we need to map progress accordingly
      // When progress = 1, note should be at 55% position (judge line)
      const progress = 1 - (timeUntilHit / this.lookaheadTime)
      
      return {
        ...note,
        progress: Math.max(0, Math.min(1, progress)),
        isPassed: timeUntilHit < -TIMING_WINDOWS.miss / 1000
      }
    }).filter(note => !note.isPassed)  // Remove expired notes
  }

  /**
   * Check missed notes
   */
  private checkMissedNotes(): void {
    this.visibleNotes.forEach(note => {
      const timeUntilHit = note.time - this.currentTime
      const missWindow = TIMING_WINDOWS.miss / 1000
      
      if (timeUntilHit < -missWindow && !note.isPassed) {
        // Reduce volume on miss
        this.audioPlayer.onMiss()
        
        // Mark as Miss
        this.handleJudge({
          result: 'miss',
          timingError: Math.abs(timeUntilHit * 1000),
          note
        })
        
        // Remove from visible list
        this.visibleNotes = this.visibleNotes.filter(n => n.id !== note.id)
      }
    })
  }

  /**
   * Process user input
   */
  public onUserInput(gestureType: GestureEvent, inputTime: number): JudgeInfo | null {
    if (this.state !== 'playing') return null
    if (!gestureType) return null
    
    // Map GestureEvent to Note type
    const noteType = this.mapGestureToNoteType(gestureType)
    if (!noteType) return null
    
    // Find closest matching note
    const matchingNote = this.findClosestNote(noteType, inputTime)
    
    if (!matchingNote) {
      console.log('⚠️ No matching note found')
      return null
    }
    
    // Calculate timing error
    const timingError = Math.abs((inputTime - matchingNote.time) * 1000)  // Convert to milliseconds
    
    // Judge
    let result: JudgeResult = 'miss'
    if (timingError <= TIMING_WINDOWS.perfect) {
      result = 'perfect'
    } else if (timingError <= TIMING_WINDOWS.good) {
      result = 'good'
    }
    
    const judgeInfo: JudgeInfo = {
      result,
      timingError,
      note: matchingNote
    }
    
    // Control volume based on judgment result
    if (result === 'perfect' || result === 'good') {
      // Correct hit: maintain/restore volume
      this.audioPlayer.onCorrectHit()
    } else {
      // Miss: reduce volume
      this.audioPlayer.onMiss()
    }
    
    // Process judgment result
    this.handleJudge(judgeInfo)
    
    // Remove judged note from visible list
    this.visibleNotes = this.visibleNotes.filter(n => n.time !== matchingNote.time)
    
    return judgeInfo
  }

  /**
   * Map gesture type to note type
   */
  private mapGestureToNoteType(gestureType: GestureEvent): Note['type'] | null {
    switch (gestureType) {
      case 'hit_left':
        return 'left'
      case 'hit_right':
        return 'right'
      case 'hit_both':
        return 'both'
      default:
        return null
    }
  }

  /**
   * Find closest matching note
   */
  private findClosestNote(noteType: Note['type'], currentTime: number): Note | null {
    let closestNote: Note | null = null
    let minDistance = TIMING_WINDOWS.miss / 1000
    
    for (const note of this.visibleNotes) {
      if (note.type === noteType) {
        const distance = Math.abs(note.time - currentTime)
        if (distance < minDistance) {
          minDistance = distance
          closestNote = note
        }
      }
    }
    
    return closestNote
  }

  /**
   * Handle judgment result
   */
  private handleJudge(judgeInfo: JudgeInfo): void {
    const { result } = judgeInfo
    
    // Update statistics
    if (result === 'perfect') {
      this.stats.perfect++
      this.stats.combo++
      this.stats.score += SCORE_VALUES.perfect
    } else if (result === 'good') {
      this.stats.good++
      this.stats.combo++
      this.stats.score += SCORE_VALUES.good
    } else if (result === 'miss') {
      this.stats.miss++
      this.stats.combo = 0
    }
    
    // Update max combo
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo
    }
    
    // Calculate accuracy
    const total = this.stats.perfect + this.stats.good + this.stats.miss
    if (total > 0) {
      this.stats.accuracy = (this.stats.perfect + this.stats.good * 0.5) / total
    }
    
    // Trigger callbacks
    if (this.onJudgeCallback) {
      this.onJudgeCallback(judgeInfo)
    }
    
    if (this.onStatsUpdateCallback) {
      this.onStatsUpdateCallback(this.stats)
    }
    
    console.log(`🎯 Judge: ${result?.toUpperCase()}`, {
      timingError: judgeInfo.timingError.toFixed(0) + 'ms',
      combo: this.stats.combo,
      score: this.stats.score
    })
  }

  // Getters
  public getState(): GameState {
    return this.state
  }

  public getCurrentTime(): number {
    return this.currentTime
  }

  public getDuration(): number {
    return this.audioPlayer.getDuration()
  }

  public getVisibleNotes(): VisibleNote[] {
    return this.visibleNotes
  }

  public getStats(): GameStats {
    return { ...this.stats }
  }

  public getChart(): Chart {
    return this.chart
  }

  // 事件监听器
  public onJudge(callback: (judgeInfo: JudgeInfo) => void): void {
    this.onJudgeCallback = callback
  }

  public onStatsUpdate(callback: (stats: GameStats) => void): void {
    this.onStatsUpdateCallback = callback
  }

  public onGameEnd(callback: (stats: GameStats) => void): void {
    this.onGameEndCallback = callback
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.stop()
    this.visibleNotes = []
    console.log('🗑️ RhythmGameEngine 已释放')
  }
}

