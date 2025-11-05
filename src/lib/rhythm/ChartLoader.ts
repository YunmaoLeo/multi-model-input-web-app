/**
 * 谱面加载器
 * 负责加载谱面JSON文件和音频文件
 */

import type { Chart, SongConfig } from '@/types/rhythm'

export class ChartLoader {
  /**
   * 加载谱面JSON
   */
  public async loadChart(chartPath: string): Promise<Chart> {
    try {
      console.log(`📂 加载谱面: ${chartPath}`)
      const response = await fetch(chartPath)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const chart: Chart = await response.json()
      
      console.log(`✅ 谱面加载成功:`, {
        songId: chart.songId,
        difficulty: chart.difficulty,
        noteCount: chart.notes.length
      })
      
      return chart
    } catch (error) {
      console.error(`❌ 谱面加载失败: ${chartPath}`, error)
      throw error
    }
  }

  /**
   * 加载音频文件（完整的鼓点音频）
   */
  public async loadAudio(
    audioContext: AudioContext,
    audioPath: string
  ): Promise<AudioBuffer> {
    try {
      console.log(`🎵 加载鼓点音频: ${audioPath}`)
      const response = await fetch(audioPath)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      console.log(`✅ 音频加载成功:`, {
        duration: audioBuffer.duration.toFixed(2) + 's',
        sampleRate: audioBuffer.sampleRate + 'Hz',
        channels: audioBuffer.numberOfChannels
      })
      
      return audioBuffer
    } catch (error) {
      console.error(`❌ 音频加载失败: ${audioPath}`, error)
      throw error
    }
  }

  /**
   * 加载完整歌曲数据
   */
  public async loadSong(
    audioContext: AudioContext,
    songConfig: SongConfig,
    difficulty: 'easy' | 'normal' | 'hard'
  ): Promise<{ chart: Chart; audioBuffer: AudioBuffer }> {
    const chartPath = songConfig.charts[difficulty]
    
    if (!chartPath) {
      throw new Error(`难度 ${difficulty} 的谱面不存在`)
    }
    
    console.log('🎮 加载歌曲:', {
      id: songConfig.id,
      name: songConfig.name,
      difficulty,
      audioPath: songConfig.audioPath
    })
    
    // 并行加载谱面和音频
    const [chart, audioBuffer] = await Promise.all([
      this.loadChart(chartPath),
      this.loadAudio(audioContext, songConfig.audioPath)
    ])
    
    console.log('✅ 歌曲加载完成')
    
    return { chart, audioBuffer }
  }
}

