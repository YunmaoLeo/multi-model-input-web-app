"""
节拍和鼓点检测模块
基于频段能量分析识别Kick、Snare、HiHat
"""

import numpy as np
import librosa


def analyze_drum_hits(y, sr, beat_times, freq_bands):
    """
    分析每个节拍点的鼓点类型和能量
    
    Args:
        y: 音频时间序列
        sr: 采样率
        beat_times: 节拍时间数组
        freq_bands: 频段配置字典
    
    Returns:
        drum_events: 鼓点事件列表
    """
    print("🥁 分析鼓点...")
    
    # 计算STFT
    S = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    
    # 创建频段掩码
    kick_mask = (freqs >= freq_bands['kick']['min']) & (freqs <= freq_bands['kick']['max'])
    snare_mask = (freqs >= freq_bands['snare']['min']) & (freqs <= freq_bands['snare']['max'])
    hihat_mask = (freqs >= freq_bands['hihat']['min']) & (freqs <= freq_bands['hihat']['max'])
    
    drum_events = []
    
    for beat_time in beat_times:
        # 将时间转换为帧索引
        frame = librosa.time_to_frames(beat_time, sr=sr)
        
        # 确保frame在有效范围内
        if frame >= S.shape[1]:
            frame = S.shape[1] - 1
        
        # 计算各频段能量
        kick_energy = np.sum(S[kick_mask, frame])
        snare_energy = np.sum(S[snare_mask, frame])
        hihat_energy = np.sum(S[hihat_mask, frame])
        
        drum_events.append({
            "time": float(beat_time),
            "kick_energy": float(kick_energy),
            "snare_energy": float(snare_energy),
            "hihat_energy": float(hihat_energy)
        })
    
    print(f"✅ 分析完成: {len(drum_events)} 个鼓点事件")
    return drum_events


def normalize_energies(drum_events):
    """
    归一化能量值到 [0, 1] 范围
    
    Args:
        drum_events: 鼓点事件列表
    
    Returns:
        drum_events: 归一化后的鼓点事件列表
    """
    print("📊 归一化能量值...")
    
    # 找到最大值
    max_kick = max(e["kick_energy"] for e in drum_events) or 1.0
    max_snare = max(e["snare_energy"] for e in drum_events) or 1.0
    max_hihat = max(e["hihat_energy"] for e in drum_events) or 1.0
    
    # 归一化
    for event in drum_events:
        event["kick_energy_norm"] = event["kick_energy"] / max_kick
        event["snare_energy_norm"] = event["snare_energy"] / max_snare
        event["hihat_energy_norm"] = event["hihat_energy"] / max_hihat
    
    print(f"✅ 归一化完成")
    return drum_events


def detect_onsets(y, sr, aggregate=np.median):
    """
    使用Onset检测算法找到所有潜在的鼓点击打时刻
    这比只依赖节拍检测更精确
    
    Args:
        y: 音频时间序列
        sr: 采样率
        aggregate: 聚合函数
    
    Returns:
        onset_times: Onset时间数组
    """
    print("🎯 检测Onset（音符起始点）...")
    
    onset_frames = librosa.onset.onset_detect(
        y=y, 
        sr=sr, 
        units='frames',
        backtrack=True
    )
    
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    
    print(f"✅ 检测到 {len(onset_times)} 个Onset点")
    return onset_times


def combine_beats_and_onsets(beat_times, onset_times, tolerance=0.1):
    """
    结合节拍和Onset检测结果，提高准确性
    
    Args:
        beat_times: 节拍时间数组
        onset_times: Onset时间数组
        tolerance: 容差（秒）
    
    Returns:
        combined_times: 合并后的时间点
    """
    print(f"🔗 合并节拍和Onset数据（容差={tolerance}s）...")
    
    # 使用Onset作为基础，因为更精确
    combined_times = list(onset_times)
    
    # 添加没有被Onset覆盖的节拍点
    for beat_time in beat_times:
        # 检查是否有接近的onset
        has_nearby_onset = any(abs(beat_time - onset) < tolerance for onset in onset_times)
        if not has_nearby_onset:
            combined_times.append(beat_time)
    
    # 排序并去重
    combined_times = sorted(set(np.round(combined_times, 3)))
    
    print(f"✅ 合并完成: {len(combined_times)} 个时间点")
    return np.array(combined_times)

