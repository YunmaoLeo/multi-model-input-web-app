#!/usr/bin/env python3
"""
步骤2: 节拍和鼓点分析
功能：
  - 检测音频中的节拍点
  - 分析每个节拍的频段能量（Kick、Snare、HiHat）
  - 归一化能量值
  - 保存分析结果

使用方法:
  python 2_analyze_beats.py <audio_dir> --config config.yaml
  
示例:
  python 2_analyze_beats.py "../audio/songs/test-demo" --config config.yaml
"""

import argparse
import json
import yaml
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from utils.audio_processing import load_audio, get_beat_times, estimate_bpm
from utils.beat_detection import analyze_drum_hits, normalize_energies, detect_onsets, combine_beats_and_onsets


def load_config(config_path):
    """加载配置文件"""
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def main():
    parser = argparse.ArgumentParser(description='节拍和鼓点分析')
    parser.add_argument('audio_dir', type=str, help='音频目录（包含background.wav）')
    parser.add_argument('--config', type=str, default='config.yaml', help='配置文件路径')
    parser.add_argument('--use-onsets', action='store_true', help='使用Onset检测（更精确但可能更密集）')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🥁 步骤2: 节拍和鼓点分析")
    print("=" * 60)
    
    # 加载配置
    config = load_config(args.config)
    freq_bands = config['frequency_bands']
    
    # 加载音频
    audio_dir = Path(args.audio_dir)
    audio_path = audio_dir / "background.wav"
    
    if not audio_path.exists():
        print(f"❌ 错误: 找不到音频文件 {audio_path}")
        print("   请先运行 1_prepare_audio.py")
        sys.exit(1)
    
    y, sr = load_audio(str(audio_path))
    
    # 检测节拍
    tempo, beat_frames = estimate_bpm(y, sr)
    beat_times = get_beat_times(beat_frames, sr)
    
    # 如果启用Onset检测
    if args.use_onsets:
        onset_times = detect_onsets(y, sr)
        beat_times = combine_beats_and_onsets(beat_times, onset_times, tolerance=0.1)
    
    # 分析鼓点
    drum_events = analyze_drum_hits(y, sr, beat_times, freq_bands)
    
    # 归一化能量
    drum_events = normalize_energies(drum_events)
    
    # 保存分析结果
    output_path = audio_dir / "drum_analysis.json"
    analysis_data = {
        "bpm": float(tempo),
        "duration": float(len(y) / sr),
        "eventCount": len(drum_events),
        "events": drum_events
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 分析结果已保存: {output_path}")
    
    # 显示统计信息
    print("\n" + "=" * 60)
    print("✅ 分析完成")
    print("=" * 60)
    print(f"📊 统计:")
    print(f"   BPM: {tempo:.1f}")
    print(f"   鼓点事件: {len(drum_events)}")
    print(f"   平均间隔: {(len(y)/sr)/len(drum_events):.3f}秒")
    
    # 显示能量分布
    avg_kick = sum(e["kick_energy_norm"] for e in drum_events) / len(drum_events)
    avg_snare = sum(e["snare_energy_norm"] for e in drum_events) / len(drum_events)
    avg_hihat = sum(e["hihat_energy_norm"] for e in drum_events) / len(drum_events)
    
    print(f"   平均能量（归一化）:")
    print(f"     Kick:  {avg_kick:.3f}")
    print(f"     Snare: {avg_snare:.3f}")
    print(f"     HiHat: {avg_hihat:.3f}")
    
    print("\n下一步: 运行 3_generate_chart.py 生成谱面")


if __name__ == '__main__':
    main()

