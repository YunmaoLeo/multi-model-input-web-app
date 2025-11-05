#!/usr/bin/env python3
"""
可视化工具: 谱面可视化
功能：
  - 读取谱面JSON
  - 生成时间线可视化图
  - 显示音符分布统计

使用方法:
  python visualize_chart.py <chart_file>
  
示例:
  python visualize_chart.py ../charts/test-demo-easy.json
"""

import argparse
import json
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches


def visualize_chart(chart_path):
    """可视化谱面"""
    
    print(f"📊 可视化谱面: {chart_path}")
    
    # 读取谱面
    with open(chart_path, 'r', encoding='utf-8') as f:
        chart = json.load(f)
    
    notes = chart['notes']
    
    if not notes:
        print("❌ 谱面为空")
        return
    
    # 提取数据
    times = [n['time'] for n in notes]
    types = [n['type'] for n in notes]
    velocities = [n['velocity'] for n in notes]
    
    # 颜色映射
    color_map = {
        'left': '#4facfe',    # 蓝色
        'right': '#ff6b9d',   # 粉色
        'both': '#00ff88'     # 绿色
    }
    
    colors = [color_map[t] for t in types]
    
    # 创建图表
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(20, 8))
    
    # 子图1: 时间线
    ax1.scatter(times, [1] * len(times), c=colors, s=100, alpha=0.7, edgecolors='black', linewidths=0.5)
    ax1.set_xlabel('时间 (秒)', fontsize=12)
    ax1.set_title(f'谱面可视化 - {chart["songId"]} ({chart["difficulty"]})', fontsize=14, fontweight='bold')
    ax1.set_yticks([])
    ax1.grid(axis='x', alpha=0.3, linestyle='--')
    ax1.set_xlim(0, max(times) + 1)
    
    # 添加图例
    legend_elements = [
        mpatches.Patch(color=color_map['left'], label='左手 (HiHat)'),
        mpatches.Patch(color=color_map['right'], label='右手 (Snare)'),
        mpatches.Patch(color=color_map['both'], label='双手 (Kick)')
    ]
    ax1.legend(handles=legend_elements, loc='upper right', fontsize=10)
    
    # 子图2: 速度分布
    left_velocities = [n['velocity'] for n in notes if n['type'] == 'left']
    right_velocities = [n['velocity'] for n in notes if n['type'] == 'right']
    both_velocities = [n['velocity'] for n in notes if n['type'] == 'both']
    
    positions = []
    velocity_data = []
    labels = []
    colors_bar = []
    
    if left_velocities:
        positions.append(1)
        velocity_data.append(left_velocities)
        labels.append(f'左手\n(n={len(left_velocities)})')
        colors_bar.append(color_map['left'])
    
    if right_velocities:
        positions.append(2)
        velocity_data.append(right_velocities)
        labels.append(f'右手\n(n={len(right_velocities)})')
        colors_bar.append(color_map['right'])
    
    if both_velocities:
        positions.append(3)
        velocity_data.append(both_velocities)
        labels.append(f'双手\n(n={len(both_velocities)})')
        colors_bar.append(color_map['both'])
    
    bp = ax2.boxplot(velocity_data, positions=positions, widths=0.6, patch_artist=True,
                     showmeans=True, meanline=True)
    
    # 设置颜色
    for patch, color in zip(bp['boxes'], colors_bar):
        patch.set_facecolor(color)
        patch.set_alpha(0.6)
    
    ax2.set_xticks(positions)
    ax2.set_xticklabels(labels)
    ax2.set_ylabel('速度 (Velocity)', fontsize=12)
    ax2.set_title('音符速度分布', fontsize=12, fontweight='bold')
    ax2.grid(axis='y', alpha=0.3, linestyle='--')
    ax2.set_ylim(0, 1.1)
    
    plt.tight_layout()
    
    # 保存图片
    output_path = Path(chart_path).with_suffix('.png')
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    print(f"✅ 可视化已保存: {output_path}")
    
    # 显示统计信息
    print("\n" + "=" * 60)
    print("📊 统计信息")
    print("=" * 60)
    print(f"总音符数: {len(notes)}")
    print(f"时长: {max(times):.2f}秒")
    print(f"音符密度: {len(notes)/max(times):.2f} 个/秒")
    print(f"\n类型分布:")
    print(f"  左手: {len(left_velocities)} ({len(left_velocities)/len(notes)*100:.1f}%)")
    print(f"  右手: {len(right_velocities)} ({len(right_velocities)/len(notes)*100:.1f}%)")
    print(f"  双手: {len(both_velocities)} ({len(both_velocities)/len(notes)*100:.1f}%)")
    
    # 计算间隔统计
    intervals = [notes[i]['time'] - notes[i-1]['time'] for i in range(1, len(notes))]
    if intervals:
        print(f"\n间隔统计:")
        print(f"  最小: {min(intervals):.3f}秒")
        print(f"  最大: {max(intervals):.3f}秒")
        print(f"  平均: {sum(intervals)/len(intervals):.3f}秒")


def main():
    parser = argparse.ArgumentParser(description='可视化谱面')
    parser.add_argument('chart_file', type=str, help='谱面JSON文件路径')
    
    args = parser.parse_args()
    
    chart_path = Path(args.chart_file)
    
    if not chart_path.exists():
        print(f"❌ 错误: 找不到文件 {chart_path}")
        return
    
    visualize_chart(chart_path)


if __name__ == '__main__':
    main()

