# 🥁 新鼓点系统设计文档

## 📋 核心概念

### 当前系统 vs 新系统

**当前系统：**
- 给定音乐 → 分析生成谱面 → 用户按谱敲击 → 播放背景音乐

**新系统：**
- 多个虚拟鼓分布在屏幕 → 用户敲击不同位置的鼓 → 产生音乐 → LLM生成指导谱面

---

## 🎯 系统架构

### 1. 虚拟鼓布局（Drum Pad Layout）

```
┌─────────────────────────────────────┐
│                                     │
│   [Kick]     [Snare]     [HiHat]   │
│     🥁          🥁          🥁       │
│                                     │
│   [Crash]    [Ride]      [Tom1]     │
│     🥁          🥁          🥁       │
│                                     │
└─────────────────────────────────────┘
```

**布局特点：**
- 6-8个虚拟鼓分布在屏幕不同区域
- 每个鼓有固定的屏幕位置（归一化坐标）
- 每个鼓有独立的音色（WAV文件）
- 鼓的位置可以根据屏幕尺寸自适应

### 2. 空间手势检测（Spatial Gesture Detection）

**当前检测：** 只检测"向下敲击"动作（左/右/双手）
**新检测：** 检测"向下敲击 + 落在哪个鼓的位置"

**实现逻辑：**
```typescript
// 伪代码
1. 检测到向下敲击动作
2. 获取手部屏幕位置 (x, y)
3. 计算手部落在哪个鼓的区域内
4. 触发对应鼓的音色
```

**鼓区域定义：**
- 每个鼓有圆形/矩形检测区域
- 检测区域大小可配置（例如：屏幕宽度的15%）
- 支持同时检测左右手位置

### 3. LLM生成乐谱（LLM Chart Generation）

**输入：**
- 主题（如："Jazz", "Rock", "Pop", "Happy Birthday"）
- 难度（easy/normal/hard）
- 时长（秒数）

**输出：**
- JSON格式的指导谱面
- 每个音符包含：
  - 时间戳
  - 目标鼓（哪个鼓）
  - 手势类型（左手/右手/双手）
  - 节奏提示

**LLM Prompt示例：**
```
Generate a drum chart for a [THEME] style song:
- Duration: [DURATION] seconds
- Difficulty: [DIFFICULTY]
- Available drums: Kick, Snare, HiHat, Crash, Ride, Tom1
- Hand gestures: left_hand, right_hand, both_hands
- Output format: JSON with notes array
```

### 4. 实时音乐生成（Real-time Music Generation）

**特点：**
- 用户敲击 → 立即播放对应鼓的音色
- 不播放背景音乐
- 所有音乐由用户敲击产生
- 可以显示当前生成音乐的波形

---

## 📁 文件结构

```
src/
├── lib/
│   ├── drums/
│   │   ├── DrumPad.ts              # 虚拟鼓定义和布局
│   │   ├── DrumHitDetector.ts      # 空间敲击检测
│   │   ├── DrumAudioPlayer.ts      # 鼓音色播放
│   │   └── DrumChartLoader.ts      # 加载LLM生成的谱面
│   └── llm/
│       └── ChartGenerator.ts       # LLM API调用
├── components/
│   └── drums/
│       ├── DrumPadDisplay.tsx      # 显示虚拟鼓位置
│       ├── DrumChartGuide.tsx       # 显示LLM生成的指导
│       └── DrumWaveform.tsx         # 显示生成的音乐波形
└── types/
    └── drum.d.ts                    # 新系统类型定义
```

---

## 🔄 工作流程

### 用户流程：
1. **选择主题** → 输入主题（如"Jazz"）
2. **生成谱面** → LLM生成指导谱面
3. **开始游戏** → 显示虚拟鼓和指导音符
4. **敲击鼓** → 手向下敲击对应位置的鼓
5. **产生音乐** → 实时播放敲击的音色

### 技术流程：
```
选择主题
  ↓
LLM生成谱面 (JSON)
  ↓
加载谱面到 DrumChartLoader
  ↓
显示指导音符 (DrumChartGuide)
  ↓
实时检测手部位置 (DrumHitDetector)
  ↓
判断落在哪个鼓 (DrumPad)
  ↓
播放对应音色 (DrumAudioPlayer)
  ↓
记录敲击历史 → 生成音乐
```

---

## 🎨 UI设计

### 屏幕布局：
```
┌─────────────────────────────────────┐
│  [主题选择] [难度] [生成] [开始]     │ ← 控制栏
├─────────────────────────────────────┤
│                                     │
│   [虚拟鼓显示区域]                   │
│   🥁    🥁    🥁                     │
│                                     │
│   [指导音符显示]                     │
│   ↓    ↓    ↓    (下落的音符)        │
│                                     │
│   [手部位置检测区域]                  │
│   (摄像头画面 + 手部追踪)            │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 技术实现细节

### 1. 虚拟鼓布局（DrumPad.ts）

```typescript
interface DrumPad {
  id: string              // "kick", "snare", "hihat"
  name: string            // 显示名称
  position: {             // 屏幕位置（归一化 0-1）
    x: number
    y: number
  }
  radius: number          // 检测区域半径（归一化）
  audioPath: string       // 音色文件路径
  color: string          // 显示颜色
}
```

### 2. 空间敲击检测（DrumHitDetector.ts）

```typescript
// 检测手部是否在鼓的区域内
function isHandInDrumZone(
  handPosition: { x: number, y: number },
  drumPad: DrumPad
): boolean {
  const distance = Math.sqrt(
    Math.pow(handPosition.x - drumPad.position.x, 2) +
    Math.pow(handPosition.y - drumPad.position.y, 2)
  )
  return distance <= drumPad.radius
}
```

### 3. LLM谱面格式

```json
{
  "theme": "Jazz",
  "difficulty": "normal",
  "duration": 60,
  "bpm": 120,
  "notes": [
    {
      "time": 0.0,
      "drum": "kick",
      "hand": "right",
      "hint": "Start with kick on beat 1"
    },
    {
      "time": 0.5,
      "drum": "snare",
      "hand": "left",
      "hint": "Snare on beat 2"
    }
  ]
}
```

---

## 📝 实现步骤

### Phase 1: 基础架构
1. ✅ 创建 DrumPad 类型定义
2. ✅ 实现 DrumPad 布局管理器
3. ✅ 实现 DrumHitDetector（空间检测）
4. ✅ 实现 DrumAudioPlayer（多音色播放）

### Phase 2: LLM集成
5. ✅ 创建 LLM API 调用模块
6. ✅ 实现谱面生成 Prompt
7. ✅ 实现谱面解析和加载

### Phase 3: UI实现
8. ✅ 创建 DrumPadDisplay 组件
9. ✅ 创建 DrumChartGuide 组件
10. ✅ 集成到 App.tsx

### Phase 4: 测试和优化
11. ✅ 测试空间检测准确性
12. ✅ 优化LLM生成的谱面质量
13. ✅ 优化音色播放延迟

---

## 🎯 关键决策

### 1. 鼓的数量和位置
- **建议：** 6个鼓（Kick, Snare, HiHat, Crash, Ride, Tom）
- **布局：** 2行3列，均匀分布
- **位置：** 屏幕上半部分（摄像头在下半部分）

### 2. LLM服务选择
- **选项A：** OpenAI API (GPT-4)
- **选项B：** 本地LLM (Ollama)
- **选项C：** 混合（本地生成 + API优化）

### 3. 音色来源
- **选项A：** 使用现有的 kick.wav, snare.wav, hihat.wav
- **选项B：** 添加更多音色（crash.wav, ride.wav, tom.wav）
- **选项C：** 使用Web Audio API合成

---

## ❓ 需要确认的问题

1. **鼓的数量：** 6个够吗？还是需要更多？
2. **LLM服务：** 使用OpenAI API还是本地LLM？
3. **主题输入：** 用户输入文本，还是从预设列表选择？
4. **谱面展示：** 如何显示指导音符？（类似当前的下落音符？）
5. **音色：** 是否需要添加新的音色文件？

