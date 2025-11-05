# 🎵 音乐谱面生成工具

这是一套基于音频分析的游戏谱面自动生成工具，用于将音乐转换为适合姿态控制的节奏游戏谱面。

## 📋 功能概述

1. **音频预处理** (`1_prepare_audio.py`) - 加载和标准化音频
2. **节拍分析** (`2_analyze_beats.py`) - 检测节拍和鼓点能量
3. **谱面生成** (`3_generate_chart.py`) - 生成多难度游戏谱面
4. **可视化工具** (`visualize_chart.py`) - 谱面可视化和统计

## 🚀 快速开始

### 1. 安装依赖

```bash
cd public/scripts
pip install -r requirements.txt
```

**注意**: 如果安装 `librosa` 遇到问题，请确保安装了以下系统依赖：
- macOS: `brew install libsndfile ffmpeg`
- Linux: `sudo apt-get install libsndfile1 ffmpeg`

### 2. 处理音频文件

假设你有一个音频文件 `test demo_drums - Alge.mp3` 在 `../assets/soundtracks/` 目录。

#### 步骤1: 预处理音频

```bash
python 1_prepare_audio.py \
  "../assets/soundtracks/test demo_drums - Alge.mp3" \
  --song-id "test-demo" \
  --output-dir "../audio/songs"
```

**输出**:
- `../audio/songs/test-demo/background.wav` - 标准化的音频
- `../audio/songs/test-demo/metadata.json` - 元数据（BPM、时长等）

#### 步骤2: 分析鼓点

```bash
python 2_analyze_beats.py "../audio/songs/test-demo" --config config.yaml
```

**可选参数**:
- `--use-onsets`: 使用更精确的Onset检测（会生成更密集的谱面）

**输出**:
- `../audio/songs/test-demo/drum_analysis.json` - 鼓点分析结果

#### 步骤3: 生成谱面

生成单个难度：
```bash
python 3_generate_chart.py "../audio/songs/test-demo" --difficulty easy
```

生成所有难度：
```bash
python 3_generate_chart.py "../audio/songs/test-demo" --all
```

**输出**:
- `../charts/test-demo-easy.json`
- `../charts/test-demo-normal.json`
- `../charts/test-demo-hard.json`

#### 步骤4: 可视化谱面（可选）

```bash
python visualize_chart.py ../charts/test-demo-easy.json
```

**输出**:
- `../charts/test-demo-easy.png` - 谱面可视化图
- 控制台显示统计信息

## ⚙️ 配置调整

编辑 `config.yaml` 来调整生成参数：

### 难度配置

```yaml
difficulty:
  easy:
    note_density: 0.25        # 保留25%的音符
    min_interval: 0.5         # 最小间隔500ms
    kick_threshold: 0.65      # 能量阈值（越高越严格）
    snare_threshold: 0.60
    hihat_threshold: 0.55
```

**参数说明**:
- `note_density`: 0.0-1.0，保留的音符比例（越小越简单）
- `min_interval`: 秒，相邻音符最小间隔（越大越容易）
- `*_threshold`: 0.0-1.0，归一化能量阈值（越高越少音符）

### 频段配置

```yaml
frequency_bands:
  kick:    # 底鼓（低频）
    min: 20
    max: 250
  snare:   # 军鼓（中频）
    min: 250
    max: 2500
  hihat:   # 踩镲（高频）
    min: 2500
    max: 20000
```

### 手势映射

```yaml
mapping:
  kick: "both"    # 底鼓 → 双手
  snare: "right"  # 军鼓 → 右手
  hihat: "left"   # 踩镲 → 左手
```

## 📁 输出文件结构

```
public/
├── audio/
│   └── songs/
│       └── test-demo/
│           ├── background.wav          # 处理后的音频
│           ├── metadata.json           # 音频元数据
│           └── drum_analysis.json      # 鼓点分析
└── charts/
    ├── test-demo-easy.json             # 简单难度谱面
    ├── test-demo-easy.png              # 可视化图
    ├── test-demo-normal.json           # 普通难度
    └── test-demo-hard.json             # 困难难度
```

## 📊 谱面JSON格式

```json
{
  "songId": "test-demo",
  "difficulty": "easy",
  "notes": [
    {
      "time": 1.234,        // 时间（秒）
      "type": "left",       // 手势类型: "left" | "right" | "both"
      "velocity": 0.85      // 力度 [0.0-1.0]
    }
  ],
  "metadata": {
    "generatedBy": "algorithm",
    "noteCount": 42,
    "leftCount": 15,
    "rightCount": 18,
    "bothCount": 9,
    "averageInterval": 0.523
  }
}
```

## 🎯 调优建议

### 谱面太难？

1. **降低密度**: 减小 `note_density` (如 0.25 → 0.15)
2. **增加间隔**: 增大 `min_interval` (如 0.5 → 0.7)
3. **提高阈值**: 增大 `*_threshold` (如 0.6 → 0.7)

### 谱面太简单？

1. **增加密度**: 增大 `note_density` (如 0.45 → 0.65)
2. **减少间隔**: 减小 `min_interval` (如 0.35 → 0.25)
3. **降低阈值**: 减小 `*_threshold` (如 0.4 → 0.3)
4. **使用Onset检测**: 添加 `--use-onsets` 参数

### 音符类型不平衡？

调整 `*_threshold` 来控制特定类型的音符数量：
- 想要更多双手（kick）: 降低 `kick_threshold`
- 想要更多右手（snare）: 降低 `snare_threshold`
- 想要更多左手（hihat）: 降低 `hihat_threshold`

## 🔧 故障排除

### 问题: `No module named 'librosa'`
```bash
pip install librosa soundfile
# macOS需要: brew install libsndfile
```

### 问题: 谱面为空或音符太少
- 检查音频是否有明显的鼓点
- 降低所有 `*_threshold` 值
- 尝试使用 `--use-onsets` 参数

### 问题: 间隔过短的警告
- 这是正常的，算法会尽量保留更多音符
- 如果想消除警告，增大 `min_interval`

### 问题: MP3加载失败
```bash
# 安装ffmpeg支持
# macOS: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg
```

## 📚 进阶使用

### 批量处理多首歌曲

```bash
#!/bin/bash
# batch_process.sh

SONGS=("song1.mp3" "song2.mp3" "song3.mp3")

for song in "${SONGS[@]}"; do
  song_id=$(basename "$song" .mp3)
  
  python 1_prepare_audio.py "../assets/soundtracks/$song" --song-id "$song_id"
  python 2_analyze_beats.py "../audio/songs/$song_id"
  python 3_generate_chart.py "../audio/songs/$song_id" --all
  python visualize_chart.py "../charts/${song_id}-easy.json"
done
```

### 自定义难度

修改 `config.yaml` 添加新难度：

```yaml
difficulty:
  expert:
    note_density: 0.9
    min_interval: 0.15
    kick_threshold: 0.15
    snare_threshold: 0.15
    hihat_threshold: 0.15
```

然后在 `3_generate_chart.py` 中添加：
```python
parser.add_argument('--difficulty', type=str, 
                   choices=['easy', 'normal', 'hard', 'expert'])
```

## 💡 工作原理

1. **音频加载**: 使用librosa加载音频并标准化
2. **节拍检测**: 使用动态规划算法检测节拍点
3. **频谱分析**: STFT将音频转换为频域
4. **频段分离**: 低频→Kick，中频→Snare，高频→HiHat
5. **能量计算**: 计算每个节拍在各频段的能量
6. **阈值过滤**: 根据能量阈值筛选音符
7. **间隔控制**: 应用最小间隔规则避免过密
8. **密度调整**: 保留能量最高的音符达到目标密度

## 🤝 贡献

欢迎提出改进建议！可以调整的方向：
- 更智能的音符类型选择算法
- 难度曲线自动平滑
- 支持更多乐器类型
- LLM优化集成

## 📄 许可

MIT License

