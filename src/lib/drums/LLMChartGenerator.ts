/**
 * LLM Chart Generator
 * Uses OpenAI API to generate drum charts based on themes
 */

import { getOpenAIApiKey } from '@/lib/openai/config'
import type { DrumChart, DrumChartNote } from '@/types/drum'

interface LLMConfig {
  apiKey?: string
  model?: string
  baseURL?: string
}

export class LLMChartGenerator {
  private config: LLMConfig

  constructor(config?: LLMConfig) {
    const apiKey = config?.apiKey || getOpenAIApiKey()
    this.config = {
      apiKey,
      model: 'gpt-4o-mini',  // Use cheaper model for chart generation
      ...config
    }
    
    if (!this.config.apiKey) {
      console.warn('OpenAI API key not provided. LLM chart generation will not work.')
    }
  }

  /**
   * Generate drum chart using LLM
   */
  public async generateChart(
    theme: string,
    difficulty: 'easy' | 'normal' | 'hard',
    duration: number = 60
  ): Promise<DrumChart> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log(`🤖 Generating drum chart: theme="${theme}", difficulty=${difficulty}, duration=${duration}s`)

    const prompt = this.buildPrompt(theme, difficulty, duration)
    
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
              content: 'You are a professional drum chart generator. Generate JSON drum charts for rhythm games.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
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
      const chartData = JSON.parse(content)
      
      // Validate and normalize chart
      const chart = this.normalizeChart(chartData, theme, difficulty, duration)
      
      console.log(`✅ Chart generated: ${chart.notes.length} notes`)
      return chart
      
    } catch (error) {
      console.error('❌ Failed to generate chart:', error)
      throw error
    }
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(
    theme: string,
    difficulty: 'easy' | 'normal' | 'hard',
    duration: number
  ): string {
    const difficultyParams = {
      easy: {
        noteDensity: 'low (0.5-1 notes per second)',
        complexity: 'simple patterns, mostly kick and snare',
        tempo: 'slow to medium (80-100 BPM)'
      },
      normal: {
        noteDensity: 'medium (1-2 notes per second)',
        complexity: 'moderate patterns, mix of all drums',
        tempo: 'medium (100-120 BPM)'
      },
      hard: {
        noteDensity: 'high (2-3 notes per second)',
        complexity: 'complex patterns, rapid changes',
        tempo: 'fast (120-140 BPM)'
      }
    }

    const params = difficultyParams[difficulty]

    return `Generate a drum chart for a "${theme}" style song.

Requirements:
- Duration: ${duration} seconds
- Difficulty: ${difficulty}
- Note density: ${params.noteDensity}
- Complexity: ${params.complexity}
- Tempo: ${params.tempo}

Available drums:
- kick: Low bass drum (use for strong beats)
- snare: Snare drum (use for backbeats)
- hihat: Hi-hat cymbal (use for rhythm)
- crash: Crash cymbal (use for accents)
- ride: Ride cymbal (use for steady rhythm)
- tom: Tom drum (use for fills)

Hand assignments:
- left: Left hand
- right: Right hand
- both: Both hands together

Output format (JSON):
{
  "theme": "${theme}",
  "difficulty": "${difficulty}",
  "duration": ${duration},
  "bpm": <estimated BPM>,
  "notes": [
    {
      "time": <time in seconds>,
      "drum": "<drum id>",
      "hand": "<left|right|both>",
      "hint": "<optional hint text>"
    }
  ]
}

Generate a ${theme} style drum chart with ${params.noteDensity}, suitable for ${difficulty} difficulty.`
  }

  /**
   * Normalize and validate chart from LLM response
   */
  private normalizeChart(
    data: any,
    theme: string,
    difficulty: 'easy' | 'normal' | 'hard',
    duration: number
  ): DrumChart {
    // Validate structure
    if (!data.notes || !Array.isArray(data.notes)) {
      throw new Error('Invalid chart format: missing notes array')
    }

    // Helper: normalize drum name to known IDs used by DrumPadManager / DrumAudioPlayer
    const normalizeDrumId = (raw: any): string => {
      const value = String(raw || '').trim().toLowerCase()
      
      // Common aliases mapping
      const mapping: Record<string, string> = {
        // Kick
        'kick': 'kick',
        'kick drum': 'kick',
        'bass': 'kick',
        'bass drum': 'kick',
        // Snare
        'snare': 'snare',
        'snare drum': 'snare',
        // Hi-hat
        'hihat': 'hihat',
        'hi-hat': 'hihat',
        'hi hat': 'hihat',
        // Crash
        'crash': 'crash',
        'crash cymbal': 'crash',
        // Ride
        'ride': 'ride',
        'ride cymbal': 'ride',
        // Tom
        'tom': 'tom',
        'tom1': 'tom',
        'tom2': 'tom',
        'floor tom': 'tom'
      }

      if (mapping[value]) {
        return mapping[value]
      }

      // If LLM outputs something like "kick (bass drum)" try partial matching
      if (value.includes('kick') || value.includes('bass')) return 'kick'
      if (value.includes('snare')) return 'snare'
      if (value.includes('hat')) return 'hihat'
      if (value.includes('crash')) return 'crash'
      if (value.includes('ride')) return 'ride'
      if (value.includes('tom')) return 'tom'

      // Fallback: use kick to avoid silent notes
      console.warn('Unknown drum id from LLM, falling back to kick:', raw)
      return 'kick'
    }

    // Normalize notes
    const notes: DrumChartNote[] = data.notes
      .filter((note: any) => note.time != null && note.drum && note.hand)
      .map((note: any) => ({
        time: Math.max(0, Math.min(duration, parseFloat(note.time) || 0)),
        drum: normalizeDrumId(note.drum),
        hand: note.hand as 'left' | 'right' | 'both',
        hint: note.hint || undefined,
        velocity: note.velocity ? Math.max(0, Math.min(1, parseFloat(note.velocity))) : undefined
      }))
      .sort((a: DrumChartNote, b: DrumChartNote) => a.time - b.time)

    const chart: DrumChart = {
      theme,
      difficulty,
      duration,
      bpm: data.bpm ? parseFloat(data.bpm) : undefined,
      notes,
      metadata: {
        generatedBy: 'OpenAI',
        prompt: `Theme: ${theme}, Difficulty: ${difficulty}`,
        timestamp: new Date().toISOString()
      }
    }

    return chart
  }
}

