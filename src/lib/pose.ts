import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import type { Keypoint, ModelType } from '@/types/pose'

/**
 * Pose detector wrapper class
 */
export class PoseDetector {
  private detector: poseDetection.PoseDetector | null = null
  private modelType: ModelType = 'movenet-lightning'
  private currentBackend: string = 'webgl'

  /**
   * Initialize detector
   * @param modelType Model type
   */
  async initialize(modelType: ModelType = 'movenet-lightning'): Promise<void> {
    this.modelType = modelType
    
    // Auto-detect and set the best backend
    await this.initializeBackend()

    // Create detector
    const model = poseDetection.SupportedModels.MoveNet
    const detectorConfig: poseDetection.MoveNetModelConfig = {
      modelType: modelType === 'movenet-lightning' 
        ? poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        : poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
      enableSmoothing: false, // We use custom smoothing
    }

    this.detector = await poseDetection.createDetector(model, detectorConfig)
  }

  /**
   * Initialize TensorFlow.js backend
   * Prefer WebGPU, fallback to WebGL
   */
  private async initializeBackend(): Promise<void> {
    try {
      // Try using WebGPU
      const hasWebGPU = 'gpu' in navigator
      
      if (hasWebGPU) {
        try {
          await tf.setBackend('webgpu')
          await tf.ready()
          this.currentBackend = 'webgpu'
          console.log('✅ TensorFlow.js backend: WebGPU (GPU-accelerated)')
          return
        } catch (error) {
          console.warn('⚠️ WebGPU not available, falling back to WebGL')
        }
      }
      
      // Fallback to WebGL
      await tf.setBackend('webgl')
      await tf.ready()
      this.currentBackend = 'webgl'
      console.log('✅ TensorFlow.js backend: WebGL (GPU-accelerated)')
    } catch (error) {
      // Final fallback to CPU
      console.error('❌ GPU backends unavailable, using CPU (slow)')
      await tf.setBackend('cpu')
      await tf.ready()
      this.currentBackend = 'cpu'
    }
  }

  /**
   * Detect poses
   * @param videoElement Video element
   * @returns Keypoint array (normalized coordinates 0-1)
   */
  async estimatePoses(videoElement: HTMLVideoElement): Promise<Keypoint[]> {
    if (!this.detector) {
      throw new Error('Detector not initialized')
    }

    const poses = await this.detector.estimatePoses(videoElement)
    
    if (poses.length === 0) {
      return []
    }

    const pose = poses[0]
    const videoWidth = videoElement.videoWidth || videoElement.width
    const videoHeight = videoElement.videoHeight || videoElement.height
    
    return this.convertKeypoints(pose.keypoints, videoWidth, videoHeight)
  }

  /**
   * Convert keypoint format and normalize coordinates
   * @param keypoints Raw keypoints (pixel coordinates)
   * @param videoWidth Video width
   * @param videoHeight Video height
   * @returns Normalized keypoints (coordinates 0-1)
   */
  private convertKeypoints(keypoints: any[], videoWidth: number, videoHeight: number): Keypoint[] {
    const keypointNames = [
      'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
      'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
      'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
    ]

    return keypoints.map((kp, index) => ({
      name: keypointNames[index] || `keypoint_${index}`,
      x: kp.x / videoWidth,   // Normalize to 0-1
      y: kp.y / videoHeight,  // Normalize to 0-1
      score: kp.score || 0
    }))
  }

  /**
   * Release resources
   */
  dispose(): void {
    if (this.detector) {
      this.detector.dispose()
      this.detector = null
    }
  }

  /**
   * Get current model type
   */
  getModelType(): ModelType {
    return this.modelType
  }

  /**
   * Get current backend type
   */
  getBackend(): string {
    return this.currentBackend
  }
}
