import { describe, it, expect, beforeEach } from 'vitest'
import { EMASmoother, filterByConfidence, processKeypoints } from '../smooth'
import type { Keypoint } from '@/types/pose'

describe('EMASmoother', () => {
  let smoother: EMASmoother

  beforeEach(() => {
    smoother = new EMASmoother(0.3)
  })

  it('应该正确进行EMA平滑', () => {
    const keypoints1: Keypoint[] = [
      { name: 'nose', x: 0.5, y: 0.5, score: 0.9 },
      { name: 'left_eye', x: 0.4, y: 0.4, score: 0.8 }
    ]

    const keypoints2: Keypoint[] = [
      { name: 'nose', x: 0.6, y: 0.6, score: 0.9 },
      { name: 'left_eye', x: 0.5, y: 0.5, score: 0.8 }
    ]

    // 第一次调用应该返回原始数据
    const result1 = smoother.smooth(keypoints1)
    expect(result1).toEqual(keypoints1)

    // 第二次调用应该进行平滑
    const result2 = smoother.smooth(keypoints2)
    
    // 验证平滑计算: 0.3 * 0.6 + 0.7 * 0.5 = 0.18 + 0.35 = 0.53
    expect(result2[0].x).toBeCloseTo(0.53, 2)
    expect(result2[0].y).toBeCloseTo(0.53, 2)
    expect(result2[1].x).toBeCloseTo(0.43, 2) // 0.3 * 0.5 + 0.7 * 0.4
    expect(result2[1].y).toBeCloseTo(0.43, 2)
  })

  it('应该正确过滤置信度', () => {
    const keypoints: Keypoint[] = [
      { name: 'nose', x: 0.5, y: 0.5, score: 0.9 },
      { name: 'left_eye', x: 0.4, y: 0.4, score: 0.2 },
      { name: 'right_eye', x: 0.6, y: 0.6, score: 0.8 }
    ]

    const filtered = filterByConfidence(keypoints, 0.3)
    
    expect(filtered).toHaveLength(2)
    expect(filtered[0].name).toBe('nose')
    expect(filtered[1].name).toBe('right_eye')
  })

  it('应该正确组合平滑和过滤', () => {
    const keypoints: Keypoint[] = [
      { name: 'nose', x: 0.5, y: 0.5, score: 0.9 },
      { name: 'left_eye', x: 0.4, y: 0.4, score: 0.2 }
    ]

    const result = processKeypoints(keypoints, smoother, 0.3)
    
    // 应该只返回置信度 >= 0.3 的关键点
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('nose')
  })

  it('应该正确重置状态', () => {
    const keypoints: Keypoint[] = [
      { name: 'nose', x: 0.5, y: 0.5, score: 0.9 }
    ]

    // 第一次平滑
    smoother.smooth(keypoints)
    
    // 重置
    smoother.reset()
    
    // 重置后应该重新开始平滑
    const result = smoother.smooth(keypoints)
    expect(result).toEqual(keypoints)
  })
})
