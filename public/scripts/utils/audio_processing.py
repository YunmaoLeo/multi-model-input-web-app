"""
音频处理工具模块
提供音频加载、预处理、BPM检测等功能
"""

import librosa
import soundfile as sf
import numpy as np
from pathlib import Path


def load_audio(file_path: str, sr: int = 44100, mono: bool = True):
    """
    加载音频文件
    
    Args:
        file_path: 音频文件路径
        sr: 目标采样率
        mono: 是否转换为单声道
    
    Returns:
        y: 音频时间序列
        sr: 采样率
    """
    print(f"📂 加载音频: {file_path}")
    y, sr = librosa.load(file_path, sr=sr, mono=mono)
    duration = len(y) / sr
    print(f"✅ 加载成功: {duration:.2f}秒, 采样率={sr}Hz")
    return y, sr


def estimate_bpm(y, sr):
    """
    估算音频的BPM（每分钟节拍数）
    
    Args:
        y: 音频时间序列
        sr: 采样率
    
    Returns:
        tempo: BPM值
        beat_frames: 节拍帧位置
    """
    print("🎵 分析BPM...")
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    # tempo可能是数组，取第一个值
    if hasattr(tempo, '__iter__'):
        tempo = tempo[0] if len(tempo) > 0 else 120.0
    print(f"✅ BPM: {float(tempo):.1f}")
    return float(tempo), beat_frames


def get_beat_times(beat_frames, sr):
    """
    将节拍帧转换为时间（秒）
    
    Args:
        beat_frames: 节拍帧位置数组
        sr: 采样率
    
    Returns:
        beat_times: 节拍时间数组（秒）
    """
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    print(f"✅ 检测到 {len(beat_times)} 个节拍点")
    return beat_times


def save_audio(y, sr, output_path: str):
    """
    保存音频文件
    
    Args:
        y: 音频时间序列
        sr: 采样率
        output_path: 输出路径
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    sf.write(str(output_path), y, sr)
    print(f"💾 音频已保存: {output_path}")


def compute_stft(y, sr):
    """
    计算短时傅里叶变换（STFT）
    
    Args:
        y: 音频时间序列
        sr: 采样率
    
    Returns:
        S: 频谱幅度矩阵
        freqs: 频率数组
    """
    print("🔬 计算频谱...")
    S = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    print(f"✅ 频谱矩阵: {S.shape[0]} 频率 × {S.shape[1]} 帧")
    return S, freqs


def get_audio_metadata(y, sr, tempo):
    """
    获取音频元数据
    
    Args:
        y: 音频时间序列
        sr: 采样率
        tempo: BPM
    
    Returns:
        metadata: 元数据字典
    """
    metadata = {
        "duration": float(len(y) / sr),
        "sample_rate": int(sr),
        "bpm": float(tempo),
        "samples": len(y)
    }
    return metadata

