#!/usr/bin/env python3
"""
步骤3: 生成游戏谱面
功能：
  - 读取鼓点分析结果
  - 根据难度配置生成游戏谱面
  - 应用简化规则（间隔、密度、阈值）
  - 验证谱面合理性
  - 保存为JSON格式

使用方法:
  python 3_generate_chart.py <audio_dir> --difficulty <easy|normal|hard> --config config.yaml
  
示例:
  python 3_generate_chart.py "../audio/songs/test-demo" --difficulty easy
  python 3_generate_chart.py "../audio/songs/test-demo" --difficulty normal
  python 3_generate_chart.py "../audio/songs/test-demo" --difficulty hard --all
"""

import argparse
import json
import yaml
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from utils.chart_generator import generate_chart, validate_chart, apply_density_filter


def load_config(config_path):
    """加载配置文件"""
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def generate_for_difficulty(audio_dir: Path, difficulty: str, config: dict):
    """为指定难度生成谱面"""
    
    print("=" * 60)
    print(f"🎮 生成谱面 - 难度: {difficulty.upper()}")
    print("=" * 60)
    
    # 读取分析结果
    analysis_path = audio_dir / "drum_analysis.json"
    if not analysis_path.exists():
        print(f"❌ 错误: 找不到分析文件 {analysis_path}")
        print("   请先运行 2_analyze_beats.py")
        return False
    
    with open(analysis_path, 'r', encoding='utf-8') as f:
        analysis_data = json.load(f)
    
    # 读取元数据
    metadata_path = audio_dir / "metadata.json"
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    song_id = metadata.get('songId', audio_dir.name)
    audio_duration = metadata['duration']
    
    # 获取难度配置
    difficulty_config = config['difficulty'][difficulty]
    mapping = config['mapping']
    
    # 生成谱面
    chart = generate_chart(
        analysis_data['events'],
        difficulty_config,
        mapping,
        song_id,
        difficulty
    )
    
    # 应用密度过滤（如果需要）
    note_density = difficulty_config.get('note_density', 1.0)
    if note_density < 1.0:
        chart['notes'] = apply_density_filter(chart['notes'], note_density)
        chart['metadata']['noteCount'] = len(chart['notes'])
    
    # 验证谱面
    issues = validate_chart(chart, audio_duration)
    
    # 保存谱面
    output_dir = Path(config['output']['chart_dir'])
    output_dir.mkdir(parents=True, exist_ok=True)
    
    chart_filename = f"{song_id}-{difficulty}.json"
    chart_path = output_dir / chart_filename
    
    with open(chart_path, 'w', encoding='utf-8') as f:
        json.dump(chart, f, indent=2, ensure_ascii=False)
    
    print(f"💾 谱面已保存: {chart_path}")
    
    # 显示摘要
    print("\n" + "=" * 60)
    print(f"✅ 谱面生成完成 - {difficulty.upper()}")
    print("=" * 60)
    print(f"📊 谱面信息:")
    print(f"   歌曲ID: {song_id}")
    print(f"   难度: {difficulty}")
    print(f"   音符总数: {chart['metadata']['noteCount']}")
    print(f"   左手: {chart['metadata']['leftCount']}")
    print(f"   右手: {chart['metadata']['rightCount']}")
    print(f"   双手: {chart['metadata']['bothCount']}")
    print(f"   平均间隔: {chart['metadata']['averageInterval']:.3f}秒")
    
    if issues:
        print(f"\n⚠️ 验证发现 {len(issues)} 个问题（参见上方详情）")
    else:
        print(f"\n✅ 验证通过")
    
    return True


def main():
    parser = argparse.ArgumentParser(description='生成游戏谱面')
    parser.add_argument('audio_dir', type=str, help='音频目录')
    parser.add_argument('--difficulty', type=str, choices=['easy', 'normal', 'hard'], 
                       help='难度级别')
    parser.add_argument('--all', action='store_true', help='生成所有难度的谱面')
    parser.add_argument('--config', type=str, default='config.yaml', help='配置文件路径')
    
    args = parser.parse_args()
    
    if not args.difficulty and not args.all:
        parser.error("请指定 --difficulty 或 --all")
    
    # 加载配置
    config_path = Path(__file__).parent / args.config
    config = load_config(config_path)
    
    audio_dir = Path(args.audio_dir)
    
    # 生成谱面
    if args.all:
        difficulties = ['easy', 'normal', 'hard']
        for difficulty in difficulties:
            success = generate_for_difficulty(audio_dir, difficulty, config)
            if not success:
                break
            print("\n")
    else:
        generate_for_difficulty(audio_dir, args.difficulty, config)
    
    print("\n" + "=" * 60)
    print("🎉 完成！")
    print("=" * 60)
    print("📁 谱面文件保存在:", Path(config['output']['chart_dir']).absolute())
    print("\n下一步: 在前端应用中加载和测试谱面")


if __name__ == '__main__':
    main()

