/**
 * New Drum System Type Definitions
 */

/**
 * Drum pad definition
 */
export interface DrumPad {
  id: string              // "kick", "snare", "hihat", "crash", "ride", "tom"
  name: string            // Display name
  position: {             // Screen position (normalized 0-1)
    x: number              // 0 = left, 1 = right
    y: number              // 0 = top, 1 = bottom
  }
  radius: number          // Detection radius (normalized 0-1)
  audioPath: string       // Path to audio file
  color: string          // Display color
  icon: string            // Emoji icon
}

/**
 * Drum hit event
 */
export interface DrumHit {
  drumId: string          // Which drum was hit
  hand: 'left' | 'right' | 'both'  // Which hand(s)
  position: { x: number; y: number }  // Hand position
  timestamp: number       // Game time when hit
  velocity?: number       // Hit velocity (optional)
}

/**
 * LLM-generated drum chart
 */
export interface DrumChart {
  theme: string           // Theme (e.g., "Jazz", "Rock")
  difficulty: 'easy' | 'normal' | 'hard'
  duration: number        // Duration in seconds
  bpm?: number            // Beats per minute
  notes: DrumChartNote[]
  metadata?: {
    generatedBy: string
    prompt: string
    timestamp: string
  }
}

/**
 * Note in drum chart
 */
export interface DrumChartNote {
  time: number           // Time in seconds
  drum: string           // Drum ID ("kick", "snare", etc.)
  hand: 'left' | 'right' | 'both'  // Which hand to use
  hint?: string          // Optional hint text
  velocity?: number      // Optional velocity (0-1)
}

/**
 * Visible note for rendering
 */
export interface VisibleDrumNote extends DrumChartNote {
  id: string
  progress: number       // 0-1, how far down the screen
  isPassed: boolean      // Whether note has passed
}

/**
 * Drum game statistics
 */
export interface DrumGameStats {
  totalHits: number
  perfect: number
  good: number
  miss: number
  accuracy: number       // 0-1
  score: number
  combo: number
  maxCombo: number
}

/**
 * Drum game state
 */
export type DrumGameState = 'idle' | 'ready' | 'playing' | 'paused' | 'finished'

