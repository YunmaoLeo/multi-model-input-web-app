import type { GestureEvent } from './gesture'

/**
 * 音频样本配置
 */
export interface AudioSample {
  buffer: AudioBuffer | null
  path: string
  loaded: boolean
}

/**
 * 音频管理器配置
 */
export interface AudioManagerConfig {
  masterVolume: number        // 主音量 [0, 1]
  velocitySensitivity: number // 力度敏感度
  pitchVariation: number      // 音高变化范围 [0, 1]
  useCompressor: boolean      // 是否使用压缩器
}

/**
 * 音频管理器
 */
export class AudioManager {
  private context: AudioContext | null = null
  private samples: Map<string, AudioSample> = new Map()
  private config: AudioManagerConfig
  private compressor: DynamicsCompressorNode | null = null
  private _isInitialized: boolean = false

  // Public getter for initialization status
  public get isInitialized(): boolean {
    return this._isInitialized
  }

  // 音频文件映射 (使用绝对路径，Vite 会自动处理 base URL)
  private getAssetPath(filename: string): string {
    // @ts-ignore - Vite env is available
    const base = import.meta.env?.BASE_URL || '/'
    return `${base}assets/drums/${filename}`
  }
  
  private get SAMPLE_PATHS() {
    return {
      kick: this.getAssetPath('kick.wav'),
      snare: this.getAssetPath('snare.wav'),
      hihat: this.getAssetPath('hihat.wav')
    }
  }

  constructor(config: Partial<AudioManagerConfig> = {}) {
    this.config = {
      masterVolume: 0.7,
      velocitySensitivity: 1.0,
      pitchVariation: 0.02,
      useCompressor: true,
      ...config
    }
  }

  /**
   * 初始化音频上下文
   * 必须在用户交互后调用
   */
  public async initialize(): Promise<void> {
    console.log('🎵 AudioManager.initialize() called', {
      isInitialized: this.isInitialized
    })
    
    if (this.isInitialized) {
      console.warn('⚠️ Audio manager already initialized')
      return
    }

    try {
      // 创建音频上下文
      console.log('🔄 Creating AudioContext...')
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
      console.log('✅ AudioContext created:', {
        sampleRate: this.context.sampleRate,
        state: this.context.state
      })

      // 创建压缩器（可选）
      if (this.config.useCompressor && this.context) {
        console.log('🔄 Creating compressor...')
        this.compressor = this.context.createDynamicsCompressor()
        this.compressor.threshold.value = -24
        this.compressor.knee.value = 30
        this.compressor.ratio.value = 12
        this.compressor.attack.value = 0.003
        this.compressor.release.value = 0.25
        this.compressor.connect(this.context.destination)
        console.log('✅ Compressor created')
      }

      // 预加载所有音频样本
      console.log('🔄 Loading audio samples...')
      await this.loadAllSamples()
      console.log('✅ Audio samples loaded:', this.samples.size)

      this._isInitialized = true
      console.log('✅ Audio manager initialized successfully', {
        sampleRate: this.context?.sampleRate,
        state: this.context?.state,
        samplesLoaded: this.samples.size
      })
    } catch (error) {
      console.error('❌ Audio manager initialization failed:', error)
      throw error
    }
  }

  /**
   * 恢复音频上下文（处理浏览器自动暂停）
   */
  public async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume()
      console.log('✅ Audio context resumed')
    }
  }

  /**
   * 加载所有音频样本
   */
  private async loadAllSamples(): Promise<void> {
    const loadPromises = Object.entries(this.SAMPLE_PATHS).map(([name, path]) =>
      this.loadSample(name, path)
    )
    await Promise.all(loadPromises)
  }

  /**
   * 加载单个音频样本
   */
  private async loadSample(name: string, path: string): Promise<void> {
    try {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context!.decodeAudioData(arrayBuffer)

      this.samples.set(name, {
        buffer: audioBuffer,
        path,
        loaded: true
      })

      console.log(`✅ Audio sample loaded: ${name} (${path})`)
    } catch (error) {
      console.error(`❌ Audio sample failed to load: ${name} (${path})`, error)
      
      // 设置为未加载状态，但不阻断其他样本加载
      this.samples.set(name, {
        buffer: null,
        path,
        loaded: false
      })
    }
  }

  /**
   * 播放音频样本
   */
  private playSample(
    sampleName: string,
    velocity: number = 1.0
  ): void {
    console.log(`🎵 playSample called: ${sampleName}, velocity: ${velocity.toFixed(3)}`)
    
    if (!this.context || !this.isInitialized) {
      console.warn('⚠️ Audio manager not initialized', {
        hasContext: !!this.context,
        isInitialized: this.isInitialized
      })
      return
    }

    const sample = this.samples.get(sampleName)
    if (!sample || !sample.buffer) {
      console.warn(`⚠️ Audio sample not loaded: ${sampleName}`, {
        hasSample: !!sample,
        hasBuffer: sample ? !!sample.buffer : false
      })
      return
    }

    try {
      // 创建音频源
      const source = this.context.createBufferSource()
      source.buffer = sample.buffer

      // 创建增益节点（控制音量）
      const gainNode = this.context.createGain()
      
      // 根据速度计算音量（使用对数曲线）
      const normalizedVelocity = Math.max(0, Math.min(1, velocity * this.config.velocitySensitivity))
      const volume = this.config.masterVolume * Math.pow(normalizedVelocity, 0.5)
      gainNode.gain.value = volume

      // 随机音高变化
      const pitchVariation = (Math.random() - 0.5) * 2 * this.config.pitchVariation
      source.playbackRate.value = 1 + pitchVariation

      // 连接音频图
      source.connect(gainNode)
      if (this.compressor) {
        gainNode.connect(this.compressor)
      } else {
        gainNode.connect(this.context.destination)
      }

      // 播放
      source.start(0)

      console.log(`🔊 Playing audio: ${sampleName}`, {
        velocity: velocity.toFixed(3),
        volume: volume.toFixed(3),
        pitch: source.playbackRate.value.toFixed(3)
      })
    } catch (error) {
      console.error(`❌ Audio playback failed: ${sampleName}`, error)
    }
  }

  /**
   * 根据手势事件播放对应的声音
   */
  public playGestureSound(event: GestureEvent, velocity: number = 1.0): void {
    if (!event) return

    console.log('🔊 playGestureSound called:', { event, velocity: velocity.toFixed(3) })

    switch (event) {
      case 'hit_left':
        console.log('🎵 Playing hihat')
        this.playSample('hihat', velocity)
        break
      case 'hit_right':
        console.log('🎵 Playing snare')
        this.playSample('snare', velocity)
        break
      case 'hit_both':
        console.log('🎵 Playing kick')
        this.playSample('kick', velocity)
        break
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<AudioManagerConfig>): void {
    this.config = { ...this.config, ...config }
    
    // 如果压缩器状态改变，需要重新连接音频图
    if (config.useCompressor !== undefined) {
      if (config.useCompressor && !this.compressor && this.context) {
        this.compressor = this.context.createDynamicsCompressor()
        this.compressor.connect(this.context.destination)
      } else if (!config.useCompressor && this.compressor) {
        this.compressor.disconnect()
        this.compressor = null
      }
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): AudioManagerConfig {
    return { ...this.config }
  }

  /**
   * 获取初始化状态
   */
  public isReady(): boolean {
    return this.isInitialized && this.context !== null
  }

  /**
   * 获取音频上下文状态
   */
  public getContextState(): AudioContextState | null {
    return this.context?.state || null
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    if (this.context) {
      this.context.close()
      this.context = null
    }
    this.samples.clear()
    this.compressor = null
    this._isInitialized = false
    console.log('✅ Audio manager disposed')
  }
}


