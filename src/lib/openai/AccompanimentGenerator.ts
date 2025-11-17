/**
 * Accompaniment Generator
 * Uses OpenAI API to generate accompaniment patterns for different instruments
 */

import { getOpenAIApiKey } from './config'
import type { AccompanimentPattern, AccompanimentInstrument, AccompanimentNote } from '@/types/accompaniment'

interface LLMConfig {
  apiKey: string
  model?: string
  baseURL?: string
}

export class AccompanimentGenerator {
  private config: LLMConfig

  constructor() {
    const apiKey = getOpenAIApiKey()
    this.config = {
      apiKey,
      model: 'gpt-4o-mini'  // Use cheaper model
    }
    
    if (!this.config.apiKey) {
      console.warn('OpenAI API key not provided. Accompaniment generation will not work.')
    }
  }

  /**
   * Generate accompaniment pattern for an instrument
   */
  public async generatePattern(
    instrument: AccompanimentInstrument,
    theme: string,
    duration: number = 60,
    bpm: number = 120
  ): Promise<AccompanimentPattern> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log(`Generating ${instrument} accompaniment: theme="${theme}", duration=${duration}s, bpm=${bpm}`)

    const prompt = this.buildPrompt(instrument, theme, duration, bpm)
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(instrument)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      // Parse JSON response
      const patternData = JSON.parse(content)
      
      // Validate and normalize pattern
      const pattern = this.normalizePattern(patternData, instrument, theme, duration, bpm)
      
      console.log(`Accompaniment pattern generated: ${pattern.notes.length} notes`)
      return pattern
      
    } catch (error) {
      console.error('Failed to generate accompaniment pattern:', error)
      throw error
    }
  }

  /**
   * Get system prompt based on instrument
   */
  private getSystemPrompt(instrument: AccompanimentInstrument): string {
    switch (instrument) {
      case 'bass':
        return 'You are a professional bass guitar pattern generator. Generate simple, rhythmic bass patterns that support the main rhythm.'
      case 'piano':
        return 'You are a professional piano accompanist. Generate harmonic patterns that complement the main rhythm without overpowering it.'
      case 'synth':
        return 'You are a professional synthesizer pattern generator. Generate melodic and harmonic patterns that enhance the musical atmosphere.'
      default:
        return 'You are a professional music pattern generator.'
    }
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(
    instrument: AccompanimentInstrument,
    theme: string,
    duration: number,
    bpm: number
  ): string {
    const instrumentGuidelines = {
      bass: 'Generate bass guitar notes in the range of MIDI 36-60 (low E to middle C). Use root notes and simple rhythmic patterns.',
      piano: 'Generate piano chords and arpeggios in the range of MIDI 48-84 (C3 to C6). Focus on harmonic support.',
      synth: 'Generate synthesizer melodies and pads in the range of MIDI 48-96 (C3 to C7). Use sustained notes and simple melodies.'
    }

    return `Generate a ${instrument} accompaniment pattern for a "${theme}" style piece.

Requirements:
- Duration: ${duration} seconds
- BPM: ${bpm}
- Instrument: ${instrument}
- ${instrumentGuidelines[instrument]}

Theme description: "${theme}"

Output format (JSON):
{
  "instrument": "${instrument}",
  "theme": "${theme}",
  "duration": ${duration},
  "bpm": ${bpm},
  "notes": [
    {
      "time": <time in seconds>,
      "pitch": <MIDI note number 0-127>,
      "velocity": <0.0-1.0>,
      "duration": <optional duration in seconds>
    }
  ]
}

Generate a ${theme} style ${instrument} accompaniment pattern.`
  }

  /**
   * Normalize and validate pattern from LLM response
   */
  private normalizePattern(
    data: any,
    instrument: AccompanimentInstrument,
    theme: string,
    duration: number,
    bpm: number
  ): AccompanimentPattern {
    // Validate structure
    if (!data.notes || !Array.isArray(data.notes)) {
      throw new Error('Invalid pattern format: missing notes array')
    }

    // Normalize notes
    const notes: AccompanimentNote[] = data.notes
      .filter((note: any) => note.time != null && note.pitch != null)
      .map((note: any) => ({
        time: Math.max(0, Math.min(duration, parseFloat(note.time) || 0)),
        pitch: Math.max(0, Math.min(127, parseInt(note.pitch) || 60)),
        velocity: Math.max(0, Math.min(1, parseFloat(note.velocity) || 0.7)),
        duration: note.duration ? Math.max(0.1, parseFloat(note.duration)) : undefined
      }))
      .sort((a: AccompanimentNote, b: AccompanimentNote) => a.time - b.time)

    const pattern: AccompanimentPattern = {
      instrument,
      theme,
      duration,
      bpm: data.bpm ? parseFloat(data.bpm) : bpm,
      notes,
      metadata: {
        generatedBy: 'OpenAI',
        prompt: `Instrument: ${instrument}, Theme: ${theme}`,
        timestamp: new Date().toISOString()
      }
    }

    return pattern
  }
}

