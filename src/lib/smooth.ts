import type { Keypoint } from '@/types/pose'

/**
 * EMA (Exponential Moving Average) smoother
 */
export class EMASmoother {
  private alpha: number
  private previousKeypoints: Keypoint[] | null = null

  constructor(alpha: number = 0.3) {
    this.alpha = alpha
  }

  /**
   * Apply EMA smoothing to keypoints
   * @param keypoints Current keypoints
   * @returns Smoothed keypoints
   */
  smooth(keypoints: Keypoint[]): Keypoint[] {
    if (!this.previousKeypoints) {
      this.previousKeypoints = keypoints.map(kp => ({ ...kp }))
      return keypoints
    }

    return keypoints.map((kp, index) => {
      const prev = this.previousKeypoints![index]
      return {
        name: kp.name,
        x: this.alpha * kp.x + (1 - this.alpha) * prev.x,
        y: this.alpha * kp.y + (1 - this.alpha) * prev.y,
        score: kp.score // Confidence score is not smoothed
      }
    })
  }

  /**
   * Update smoothing parameter
   * @param alpha New alpha value
   */
  setAlpha(alpha: number): void {
    this.alpha = alpha
  }

  /**
   * Reset smoother state
   */
  reset(): void {
    this.previousKeypoints = null
  }
}

/**
 * Confidence threshold filter
 * @param keypoints Keypoint array
 * @param threshold Confidence threshold
 * @returns Filtered keypoint array
 */
export function filterByConfidence(
  keypoints: Keypoint[],
  threshold: number = 0.3
): Keypoint[] {
  return keypoints.filter(kp => kp.score >= threshold)
}

/**
 * Combined smoothing and filtering
 * @param keypoints Raw keypoints
 * @param smoother EMA smoother
 * @param threshold Confidence threshold
 * @returns Processed keypoints
 */
export function processKeypoints(
  keypoints: Keypoint[],
  smoother: EMASmoother,
  threshold: number = 0.3
): Keypoint[] {
  const smoothed = smoother.smooth(keypoints)
  return filterByConfidence(smoothed, threshold)
}
