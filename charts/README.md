# 游戏谱面文件

这个目录包含为节奏游戏生成的谱面JSON文件。

## 📁 当前谱面

### test-demo（来自 "test demo_drums - Alge.mp3"）

- **BPM**: 161.5
- **时长**: 102秒
- **难度**:
  - `test-demo-easy.json` - 简单模式（20个音符，平均间隔2.8秒）
  - `test-demo-normal.json` - 普通模式（85个音符，平均间隔0.8秒）
  - `test-demo-hard.json` - 困难模式（134个音符，平均间隔0.5秒）

## 📊 谱面JSON格式

```json
{
  "songId": "test-demo",
  "difficulty": "easy",
  "notes": [
    {
      "time": 24.752,      // 时间点（秒）
      "type": "right",     // 手势类型: "left" | "right" | "both"
      "velocity": 0.9      // 力度 [0.0-1.0]
    }
  ],
  "metadata": {
    "generatedBy": "algorithm",
    "noteCount": 20,
    "leftCount": 0,
    "rightCount": 6,
    "bothCount": 14,
    "averageInterval": 0.902
  }
}
```

## 🎮 使用方法

### 在前端加载谱面

```typescript
// 加载谱面
const response = await fetch('/charts/test-demo-easy.json');
const chart = await response.json();

// 使用谱面
chart.notes.forEach(note => {
  console.log(`在 ${note.time} 秒时，执行 ${note.type} 手势`);
});
```

### 音频文件配置

谱面需要配合对应的音频文件使用：

```typescript
const songConfig = {
  songId: "test-demo",
  audioPath: "/audio/songs/test-demo/background.wav",
  charts: {
    easy: "/charts/test-demo-easy.json",
    normal: "/charts/test-demo-normal.json",
    hard: "/charts/test-demo-hard.json"
  }
};
```

## 🎯 手势映射

| 类型 | 手势 | 对应鼓点 | 颜色标识 |
|------|------|----------|----------|
| `left` | 左手下击 | Hi-Hat（踩镲） | 🔵 蓝色 |
| `right` | 右手下击 | Snare（军鼓） | 🔴 粉色 |
| `both` | 双手同时下击 | Kick（底鼓） | 🟢 绿色 |

## 📈 可视化文件

每个谱面都有对应的PNG可视化文件：
- `test-demo-easy.png` - 简单难度可视化
- `test-demo-normal.png` - 普通难度可视化  
- `test-demo-hard.png` - 困难难度可视化

打开这些图片可以预览谱面的时间线和音符分布。

## 🔧 如何生成新谱面

参见 `../scripts/README.md` 了解如何使用Python工具生成新的谱面。

