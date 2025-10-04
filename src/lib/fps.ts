/**
 * FPS 计数器工具类
 */
export class FPSCounter {
  private frameCount = 0
  private lastTime = 0
  private fps = 0

  /**
   * 更新 FPS 计数
   * @param currentTime 当前时间戳
   * @returns 当前 FPS
   */
  update(currentTime: number): number {
    this.frameCount++
    
    if (this.lastTime === 0) {
      this.lastTime = currentTime
      return 0
    }

    const deltaTime = currentTime - this.lastTime
    
    // 每秒更新一次 FPS
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime)
      this.frameCount = 0
      this.lastTime = currentTime
    }

    return this.fps
  }

  /**
   * 获取当前 FPS
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * 重置计数器
   */
  reset(): void {
    this.frameCount = 0
    this.lastTime = 0
    this.fps = 0
  }
}
