#!/usr/bin/env python3
"""
生成简单的打击乐测试音频文件

依赖:
    pip install numpy scipy
    
使用:
    python generate_drums.py
"""

import numpy as np
from scipy.io import wavfile

def generate_kick(filename='kick.wav', duration=0.3, sample_rate=44100):
    """生成底鼓音色 - 低频重音"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 频率从 120Hz 快速下降到 40Hz（模拟鼓皮振动）
    freq_sweep = 120 * np.exp(-10 * t) + 40
    
    # 正弦波 + 指数衰减包络
    kick = np.sin(2 * np.pi * freq_sweep * t) * np.exp(-8 * t)
    
    # 添加一些噪声增加真实感
    noise = np.random.uniform(-0.05, 0.05, len(t)) * np.exp(-15 * t)
    kick = kick + noise
    
    # 归一化并转换为 16 位整数
    kick = kick / np.max(np.abs(kick)) * 0.9
    kick = (kick * 32767).astype(np.int16)
    
    wavfile.write(filename, sample_rate, kick)
    print(f'✅ 已生成: {filename}')

def generate_snare(filename='snare.wav', duration=0.2, sample_rate=44100):
    """生成军鼓音色 - 清脆响亮"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 白噪声（模拟响弦）
    noise = np.random.uniform(-1, 1, len(t))
    
    # 音调成分（鼓面）
    tone1 = np.sin(2 * np.pi * 180 * t)
    tone2 = np.sin(2 * np.pi * 330 * t)
    
    # 混合 + 快速衰减
    snare = (0.6 * noise + 0.25 * tone1 + 0.15 * tone2) * np.exp(-15 * t)
    
    # 归一化
    snare = snare / np.max(np.abs(snare)) * 0.85
    snare = (snare * 32767).astype(np.int16)
    
    wavfile.write(filename, sample_rate, snare)
    print(f'✅ 已生成: {filename}')

def generate_hihat(filename='hihat.wav', duration=0.1, sample_rate=44100):
    """生成踩镲音色 - 尖锐清脆"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 高频噪声
    hihat = np.random.uniform(-1, 1, len(t))
    
    # 高通滤波（简单版 - 保留高频）
    # 添加一些高频谐波
    for freq in [8000, 10000, 12000]:
        hihat += 0.1 * np.sin(2 * np.pi * freq * t)
    
    # 快速衰减
    hihat = hihat * np.exp(-30 * t)
    
    # 归一化
    hihat = hihat / np.max(np.abs(hihat)) * 0.6
    hihat = (hihat * 32767).astype(np.int16)
    
    wavfile.write(filename, sample_rate, hihat)
    print(f'✅ 已生成: {filename}')

if __name__ == '__main__':
    print('🎵 开始生成打击乐音频文件...\n')
    
    try:
        generate_kick()
        generate_snare()
        generate_hihat()
        
        print('\n✅ 所有音频文件生成完成！')
        print('   - kick.wav  (底鼓)')
        print('   - snare.wav (军鼓)')
        print('   - hihat.wav (踩镲)')
        print('\n📝 提示: 你可以使用专业音频替换这些测试文件以获得更好的音质')
        
    except Exception as e:
        print(f'\n❌ 生成失败: {e}')
        print('请确保已安装依赖: pip install numpy scipy')


