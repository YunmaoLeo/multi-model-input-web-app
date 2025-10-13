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

    const smoothed = keypoints.map((kp, index) => {
      const prev = this.previousKeypoints![index]
      const smoothedX = this.alpha * kp.x + (1 - this.alpha) * prev.x
      const smoothedY = this.alpha * kp.y + (1 - this.alpha) * prev.y
      
      // Debug: Log wrist smoothing occasionally
      if (Math.random() < 0.01 && kp.name && kp.name.includes('wrist')) {
        console.log(`🔍 EMA Smoothing (${kp.name}):`, {
          alpha: this.alpha,
          raw: { x: kp.x.toFixed(6), y: kp.y.toFixed(6) },
          prev: { x: prev.x.toFixed(6), y: prev.y.toFixed(6) },
          smoothed: { x: smoothedX.toFixed(6), y: smoothedY.toFixed(6) },
          deltaRaw: { x: (kp.x - prev.x).toFixed(6), y: (kp.y - prev.y).toFixed(6) },
          deltaSmoothed: { x: (smoothedX - prev.x).toFixed(6), y: (smoothedY - prev.y).toFixed(6) }
        })
      }
      
      return {
        name: kp.name,
        x: smoothedX,
        y: smoothedY,
        score: kp.score // Confidence score is not smoothed
      }
    })
    
    this.previousKeypoints = smoothed
    return smoothed
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
 * @param threshold Confidence threshold (not used for filtering, kept for compatibility)
 * @returns Processed keypoints (ALL keypoints, not filtered)
 */
export function processKeypoints(
  keypoints: Keypoint[],
  smoother: EMASmoother,
  _threshold: number = 0.3
): Keypoint[] {
  // Just smooth, don't filter! 
  // We need all keypoints for gesture detection even if confidence is low
  const smoothed = smoother.smooth(keypoints)
  return smoothed
  
  // Note: Individual components (like PoseOverlay) will check confidence
  // when drawing, but we keep all points in the array for gesture detection
}
