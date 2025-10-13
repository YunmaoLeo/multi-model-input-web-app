# 鼓声音频文件

本目录存放打击乐手势交互所需的音频样本。

## 所需文件

请在此目录下放置以下三个音频文件：

1. **kick.wav** - 底鼓音色（Kick Drum）
   - 触发条件：双手同时快速下挥
   - 建议：低频重音，短促有力

2. **snare.wav** - 军鼓音色（Snare Drum）
   - 触发条件：右手快速下挥
   - 建议：清脆响亮，中高频

3. **hihat.wav** - 踩镲音色（Hi-Hat）
   - 触发条件：左手快速下挥
   - 建议：尖锐清脆，高频

## 音频格式要求

- **格式**: WAV、MP3、OGG（推荐 WAV 无损格式）
- **采样率**: 44.1kHz 或 48kHz
- **时长**: 建议 0.5-2 秒
- **文件大小**: 建议单个文件 < 500KB

## 音频获取方式

### 方式 1：免费音频库
- [Freesound.org](https://freesound.org/) - 搜索 "kick drum", "snare drum", "hi-hat"
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) - 高质量音效库
- [Zapsplat](https://www.zapsplat.com/) - 免费音效（需注册）

### 方式 2：使用示例音频
我们提供了一组简单的测试音频文件（见下方链接），你可以：

```bash
# 方式 A: 下载示例音频
wget https://example.com/drums/kick.wav -O kick.wav
wget https://example.com/drums/snare.wav -O snare.wav
wget https://example.com/drums/hihat.wav -O hihat.wav

# 方式 B: 使用在线音频（临时测试）
# 系统会自动从 public/assets/drums/ 加载文件
```

### 方式 3：使用合成音频（开发测试）
如果暂时没有音频文件，可以使用以下 Python 脚本生成简单的测试音频：

```python
import numpy as np
from scipy.io import wavfile

def generate_kick(duration=0.3, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration))
    # 低频正弦波 + 衰减包络
    freq_sweep = 120 * np.exp(-10 * t)
    kick = np.sin(2 * np.pi * freq_sweep * t) * np.exp(-8 * t)
    kick = (kick * 32767).astype(np.int16)
    wavfile.write('kick.wav', sample_rate, kick)

def generate_snare(duration=0.2, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration))
    # 白噪声 + 短音调
    noise = np.random.uniform(-1, 1, len(t))
    tone = np.sin(2 * np.pi * 250 * t)
    snare = (0.7 * noise + 0.3 * tone) * np.exp(-15 * t)
    snare = (snare * 32767).astype(np.int16)
    wavfile.write('snare.wav', sample_rate, snare)

def generate_hihat(duration=0.1, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration))
    # 高频噪声
    hihat = np.random.uniform(-1, 1, len(t)) * np.exp(-30 * t)
    hihat = (hihat * 32767 * 0.5).astype(np.int16)
    wavfile.write('hihat.wav', sample_rate, hihat)

# 生成音频
generate_kick()
generate_snare()
generate_hihat()
print("✅ 音频文件已生成")
```

运行脚本：
```bash
pip install numpy scipy
python generate_drums.py
```

## 测试

音频文件放置完成后：
1. 启动开发服务器：`npm run dev`
2. 打开浏览器控制台
3. 点击"Start"按钮（首次启动会初始化音频）
4. 查看控制台日志确认音频加载成功：
   ```
   ✅ 音频样本加载成功: kick (/assets/drums/kick.wav)
   ✅ 音频样本加载成功: snare (/assets/drums/snare.wav)
   ✅ 音频样本加载成功: hihat (/assets/drums/hihat.wav)
   ```

## 故障排除

### 问题 1: 音频文件加载失败
```
❌ 音频样本加载失败: kick (/assets/drums/kick.wav)
```
**解决方法**：
- 确认文件名正确（小写，.wav 扩展名）
- 确认文件放在 `public/assets/drums/` 目录下
- 重新启动开发服务器

### 问题 2: 音频无法播放
```
⚠️ 音频管理器未初始化
```
**解决方法**：
- 浏览器需要用户交互后才能播放音频
- 点击"Start"按钮启动推理时会自动初始化

### 问题 3: 音频卡顿或延迟
**解决方法**：
- 减小音频文件大小（< 500KB）
- 使用 WAV 格式（解码更快）
- 检查系统性能（CPU/GPU 使用率）

## 文件结构

```
public/
└── assets/
    └── drums/
        ├── README.md     # 本说明文档
        ├── kick.wav      # 底鼓音色（需要添加）
        ├── snare.wav     # 军鼓音色（需要添加）
        └── hihat.wav     # 踩镲音色（需要添加）
```

---

**注意**: 如果使用从网络下载的音频，请确保遵守相关许可协议（如 Creative Commons）。


