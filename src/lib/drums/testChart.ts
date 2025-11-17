/**
 * Test Chart for Local Development
 * A pre-made drum chart for quick testing without API calls
 */

import type { DrumChart } from '@/types/drum'

export const TEST_CHART: DrumChart = {
  title: 'Test Pattern',
  theme: 'test',
  difficulty: 'normal',
  duration: 30,
  bpm: 120,
  notes: [
    // Intro - Kick pattern
    { time: 1.0, drum: 'kick', velocity: 0.8, hand: 'right' },
    { time: 1.5, drum: 'kick', velocity: 0.8, hand: 'right' },
    { time: 2.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    
    // Add snare
    { time: 2.5, drum: 'snare', velocity: 0.8, hand: 'left' },
    { time: 3.0, drum: 'kick', velocity: 0.8, hand: 'right' },
    { time: 3.5, drum: 'snare', velocity: 0.8, hand: 'left' },
    
    // Add hihat
    { time: 4.0, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 4.25, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 4.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 4.75, drum: 'hihat', velocity: 0.6, hand: 'right' },
    
    // Basic pattern: Kick-Hihat-Snare-Hihat
    { time: 5.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 5.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 6.0, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 6.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    
    { time: 7.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 7.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 8.0, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 8.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    
    // Add tom for variety
    { time: 9.0, drum: 'tom', velocity: 0.8, hand: 'left' },
    { time: 9.5, drum: 'tom', velocity: 0.8, hand: 'right' },
    { time: 10.0, drum: 'snare', velocity: 0.9, hand: 'left' },
    
    // Continue pattern
    { time: 10.5, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 11.0, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 11.5, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 12.0, drum: 'hihat', velocity: 0.6, hand: 'right' },
    
    { time: 12.5, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 13.0, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 13.5, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 14.0, drum: 'hihat', velocity: 0.6, hand: 'right' },
    
    // Add crash cymbal
    { time: 14.5, drum: 'crash', velocity: 1.0, hand: 'right' },
    { time: 15.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    
    // Ride pattern
    { time: 15.5, drum: 'ride', velocity: 0.7, hand: 'right' },
    { time: 16.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 16.5, drum: 'ride', velocity: 0.7, hand: 'right' },
    { time: 17.0, drum: 'snare', velocity: 0.9, hand: 'left' },
    
    // Build up
    { time: 17.5, drum: 'tom', velocity: 0.8, hand: 'left' },
    { time: 18.0, drum: 'tom', velocity: 0.8, hand: 'right' },
    { time: 18.5, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 19.0, drum: 'snare', velocity: 0.9, hand: 'left' },
    
    // Final pattern
    { time: 19.5, drum: 'kick', velocity: 1.0, hand: 'right' },
    { time: 20.0, drum: 'crash', velocity: 1.0, hand: 'right' },
    { time: 20.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 21.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 21.5, drum: 'snare', velocity: 0.9, hand: 'left' },
    
    { time: 22.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 22.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 23.0, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 23.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    
    { time: 24.0, drum: 'kick', velocity: 0.9, hand: 'right' },
    { time: 24.5, drum: 'tom', velocity: 0.8, hand: 'left' },
    { time: 25.0, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 25.5, drum: 'hihat', velocity: 0.6, hand: 'right' },
    
    // Ending
    { time: 26.0, drum: 'kick', velocity: 1.0, hand: 'right' },
    { time: 26.5, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 27.0, drum: 'kick', velocity: 1.0, hand: 'right' },
    { time: 27.5, drum: 'snare', velocity: 0.9, hand: 'left' },
    { time: 28.0, drum: 'kick', velocity: 1.0, hand: 'right' },
    { time: 28.5, drum: 'crash', velocity: 1.0, hand: 'right' },
    { time: 29.0, drum: 'kick', velocity: 1.0, hand: 'right' },
    { time: 29.5, drum: 'crash', velocity: 1.0, hand: 'right' }
  ]
}

/**
 * Simple test chart - just 10 seconds with basic pattern
 */
export const SIMPLE_TEST_CHART: DrumChart = {
  title: 'Simple Test',
  theme: 'test-simple',
  difficulty: 'easy',
  duration: 10,
  bpm: 100,
  notes: [
    { time: 1.0, drum: 'kick', velocity: 0.8, hand: 'right' },
    { time: 2.0, drum: 'snare', velocity: 0.8, hand: 'left' },
    { time: 3.0, drum: 'kick', velocity: 0.8, hand: 'right' },
    { time: 4.0, drum: 'snare', velocity: 0.8, hand: 'left' },
    { time: 5.0, drum: 'kick', velocity: 0.8, hand: 'right' },
    { time: 6.0, drum: 'snare', velocity: 0.8, hand: 'left' },
    { time: 7.0, drum: 'hihat', velocity: 0.6, hand: 'right' },
    { time: 8.0, drum: 'tom', velocity: 0.8, hand: 'left' },
    { time: 9.0, drum: 'crash', velocity: 1.0, hand: 'right' }
  ]
}

