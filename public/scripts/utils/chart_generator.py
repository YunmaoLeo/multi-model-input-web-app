"""
谱面生成模块
将鼓点分析结果转换为游戏谱面
"""

import numpy as np
from typing import List, Dict


def generate_chart(drum_events: List[Dict], difficulty_config: Dict, mapping: Dict, song_id: str, difficulty: str):
    """
    生成游戏谱面
    
    Args:
        drum_events: 归一化后的鼓点事件列表
        difficulty_config: 难度配置
        mapping: 手势映射配置
        song_id: 歌曲ID
        difficulty: 难度名称
    
    Returns:
        chart: 谱面数据字典
    """
    print(f"🎮 生成谱面（难度={difficulty}）...")
    
    thresholds = {
        "kick": difficulty_config["kick_threshold"],
        "snare": difficulty_config["snare_threshold"],
        "hihat": difficulty_config["hihat_threshold"]
    }
    
    min_interval = difficulty_config["min_interval"]
    
    notes = []
    last_time = -999.0
    
    for event in drum_events:
        time = event["time"]
        
        # 检查最小间隔
        if time - last_time < min_interval:
            continue
        
        # 获取归一化能量
        kick_norm = event.get("kick_energy_norm", 0)
        snare_norm = event.get("snare_energy_norm", 0)
        hihat_norm = event.get("hihat_energy_norm", 0)
        
        # 决定音符类型（按优先级：kick > snare > hihat）
        note_type = None
        velocity = 0
        
        if kick_norm > thresholds["kick"]:
            note_type = mapping["kick"]  # "both"
            velocity = kick_norm
        elif snare_norm > thresholds["snare"]:
            note_type = mapping["snare"]  # "right"
            velocity = snare_norm
        elif hihat_norm > thresholds["hihat"]:
            note_type = mapping["hihat"]  # "left"
            velocity = hihat_norm
        
        # 添加音符
        if note_type:
            notes.append({
                "time": round(time, 3),
                "type": note_type,
                "velocity": round(velocity, 2)
            })
            last_time = time
    
    print(f"✅ 生成完成: {len(notes)} 个音符")
    
    # 打印统计信息
    left_count = sum(1 for n in notes if n["type"] == "left")
    right_count = sum(1 for n in notes if n["type"] == "right")
    both_count = sum(1 for n in notes if n["type"] == "both")
    
    print(f"   📊 音符分布: 左手={left_count}, 右手={right_count}, 双手={both_count}")
    
    # 构建谱面数据
    chart = {
        "songId": song_id,
        "difficulty": difficulty,
        "notes": notes,
        "metadata": {
            "generatedBy": "algorithm",
            "noteCount": len(notes),
            "leftCount": left_count,
            "rightCount": right_count,
            "bothCount": both_count,
            "averageInterval": round(np.mean([notes[i]["time"] - notes[i-1]["time"] for i in range(1, len(notes))]), 3) if len(notes) > 1 else 0
        }
    }
    
    return chart


def validate_chart(chart: Dict, audio_duration: float) -> List[str]:
    """
    验证谱面合理性
    
    Args:
        chart: 谱面数据
        audio_duration: 音频总时长（秒）
    
    Returns:
        issues: 问题列表
    """
    print("🔍 验证谱面...")
    
    issues = []
    notes = chart["notes"]
    
    if not notes:
        issues.append("⚠️ 谱面为空，没有生成任何音符")
        return issues
    
    for i, note in enumerate(notes):
        # 检查时间范围
        if note["time"] < 0:
            issues.append(f"❌ 音符 {i} 时间为负: {note['time']}s")
        
        if note["time"] > audio_duration:
            issues.append(f"❌ 音符 {i} 超出音频时长: {note['time']}s > {audio_duration}s")
        
        # 检查速度
        if not 0 <= note["velocity"] <= 1:
            issues.append(f"❌ 音符 {i} 速度超出范围: {note['velocity']}")
        
        # 检查类型
        if note["type"] not in ["left", "right", "both"]:
            issues.append(f"❌ 音符 {i} 类型无效: {note['type']}")
        
        # 检查间隔（警告，不是错误）
        if i > 0:
            interval = note["time"] - notes[i-1]["time"]
            if interval < 0.15:
                issues.append(f"⚠️ 音符 {i-1} 和 {i} 间隔过短: {interval:.3f}s")
    
    if issues:
        print(f"⚠️ 发现 {len(issues)} 个问题")
        for issue in issues[:5]:  # 只显示前5个
            print(f"   {issue}")
        if len(issues) > 5:
            print(f"   ... 还有 {len(issues) - 5} 个问题")
    else:
        print("✅ 验证通过，谱面合理")
    
    return issues


def apply_density_filter(notes: List[Dict], target_density: float) -> List[Dict]:
    """
    应用密度过滤，保留指定比例的音符（保留能量最高的）
    
    Args:
        notes: 音符列表
        target_density: 目标密度（0-1）
    
    Returns:
        filtered_notes: 过滤后的音符列表
    """
    if target_density >= 1.0:
        return notes
    
    target_count = max(1, int(len(notes) * target_density))
    
    # 按velocity排序，保留能量最高的
    sorted_notes = sorted(notes, key=lambda n: n["velocity"], reverse=True)
    selected_notes = sorted_notes[:target_count]
    
    # 重新按时间排序
    filtered_notes = sorted(selected_notes, key=lambda n: n["time"])
    
    print(f"🎯 密度过滤: {len(notes)} → {len(filtered_notes)} 音符")
    
    return filtered_notes

