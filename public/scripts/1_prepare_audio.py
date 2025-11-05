#!/usr/bin/env python3
"""
步骤1: 音频预处理
功能：
  - 加载原始音频（支持MP3等格式）
  - 转换为标准格式（44.1kHz WAV）
  - 提取BPM和元数据
  - 保存到指定目录

使用方法:
  python 1_prepare_audio.py <input_audio> --song-id <id> --output-dir <dir>
  
示例:
  python 1_prepare_audio.py "../assets/soundtracks/test demo_drums - Alge.mp3" \
    --song-id "test-demo" \
    --output-dir "../audio/songs/test-demo"
"""

import argparse
import json
from pathlib import Path
import sys

# 添加utils到路径
sys.path.insert(0, str(Path(__file__).parent))

from utils.audio_processing import (
    load_audio,
    estimate_bpm,
    get_beat_times,
    save_audio,
    get_audio_metadata
)


def main():
    parser = argparse.ArgumentParser(description='音频预处理')
    parser.add_argument('input', type=str, help='输入音频文件路径')
    parser.add_argument('--song-id', type=str, required=True, help='歌曲ID')
    parser.add_argument('--output-dir', type=str, default='../audio/songs', help='输出目录')
    parser.add_argument('--sr', type=int, default=44100, help='采样率')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🎵 步骤1: 音频预处理")
    print("=" * 60)
    
    # 加载音频
    y, sr = load_audio(args.input, sr=args.sr)
    
    # 估算BPM
    tempo, beat_frames = estimate_bpm(y, sr)
    
    # 获取元数据
    metadata = get_audio_metadata(y, sr, tempo)
    metadata["songId"] = args.song_id
    metadata["originalFile"] = str(Path(args.input).name)
    
    # 创建输出目录
    output_dir = Path(args.output_dir) / args.song_id
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 保存处理后的音频
    audio_path = output_dir / "background.wav"
    save_audio(y, sr, audio_path)
    
    # 保存元数据
    metadata_path = output_dir / "metadata.json"
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"💾 元数据已保存: {metadata_path}")
    
    # 显示摘要
    print("\n" + "=" * 60)
    print("✅ 预处理完成")
    print("=" * 60)
    print(f"📊 摘要:")
    print(f"   歌曲ID: {args.song_id}")
    print(f"   时长: {metadata['duration']:.2f}秒")
    print(f"   BPM: {metadata['bpm']:.1f}")
    print(f"   采样率: {metadata['sample_rate']}Hz")
    print(f"   输出目录: {output_dir}")
    print("\n下一步: 运行 2_analyze_beats.py 分析鼓点")


if __name__ == '__main__':
    main()

