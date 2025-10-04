// COCO-17 Keypoint 类型定义
export interface Keypoint {
  name: string
  x: number
  y: number
  score: number
}

// 校准参数
export interface Calibration {
  distance: number // 米
  azimuth: number // 度
  elevation: number // 度
}

// FPS 信息
export interface FPSInfo {
  infer: number
  render: number
}

// 元数据
export interface MetaInfo {
  ua: string
  platform: string
  version: string
}

// 标准化的帧数据载荷
export interface FramePayload {
  sourceId: string
  ts: number
  fps: FPSInfo
  keypoints: Keypoint[]
  calibration: Calibration
  meta: MetaInfo
}

// 模型类型
export type ModelType = 'movenet-lightning' | 'movenet-thunder'

// 后端类型
export type BackendType = 'none' | 'websocket' | 'http'

// 摄像头状态
export type CameraStatus = 'idle' | 'requesting' | 'capturing' | 'paused' | 'error'

// 麦克风状态
export type MicrophoneStatus = 'idle' | 'requesting' | 'recording' | 'paused' | 'error'

// 推理状态
export type InferenceStatus = 'stopped' | 'running' | 'paused'
