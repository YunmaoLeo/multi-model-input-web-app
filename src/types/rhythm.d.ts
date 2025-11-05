/**
 * 节奏游戏类型定义
 */

/**
 * 音符数据
 */
export interface Note {
  time: number              // 时间点（秒）
  type: 'left' | 'right' | 'both'  // 手势类型
  velocity: number          // 力度 [0.0-1.0]
}

/**
 * 谱面数据
 */
export interface Chart {
  songId: string
  difficulty: 'easy' | 'normal' | 'hard'
  notes: Note[]
  metadata: {
    generatedBy: string
    noteCount: number
    leftCount: number
    rightCount: number
    bothCount: number
    averageInterval: number
  }
}

/**
 * 歌曲配置
 */
export interface SongConfig {
  id: string
  name: string
  artist?: string
  audioPath: string           // 完整鼓点音频路径（test demo_drums）
  bpm?: number
  duration?: number
  charts: {
    easy?: string
    normal?: string
    hard?: string
  }
}

/**
 * 判定结果
 */
export type JudgeResult = 'perfect' | 'good' | 'miss' | null

/**
 * 判定信息
 */
export interface JudgeInfo {
  result: JudgeResult
  timingError: number       // 时间误差（毫秒）
  note: Note
}

/**
 * 游戏统计
 */
export interface GameStats {
  perfect: number
  good: number
  miss: number
  combo: number
  maxCombo: number
  score: number
  accuracy: number          // 准确率 [0.0-1.0]
}

/**
 * 可见音符（用于渲染）
 */
export interface VisibleNote extends Note {
  id: string
  progress: number          // 下落进度 [0.0-1.0]，0=顶部，1=判定线
  isPassed: boolean         // 是否已经过判定线
}

/**
 * 游戏状态
 */
export type GameState = 'idle' | 'ready' | 'playing' | 'paused' | 'finished'

