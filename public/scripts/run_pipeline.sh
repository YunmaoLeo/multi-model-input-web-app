#!/bin/bash
# 完整处理流程脚本
# 使用方法: ./run_pipeline.sh <audio_file> <song_id>
# 示例: ./run_pipeline.sh "../assets/soundtracks/test demo_drums - Alge.mp3" "test-demo"

set -e  # 遇到错误立即退出

# 检查参数
if [ "$#" -ne 2 ]; then
    echo "用法: $0 <audio_file> <song_id>"
    echo "示例: $0 '../assets/soundtracks/test.mp3' 'test-demo'"
    exit 1
fi

AUDIO_FILE="$1"
SONG_ID="$2"

echo "🎵 开始处理音频: $AUDIO_FILE"
echo "📝 歌曲ID: $SONG_ID"
echo ""

# 步骤1: 预处理
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 1/4: 音频预处理"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python 1_prepare_audio.py "$AUDIO_FILE" --song-id "$SONG_ID" --output-dir "../audio/songs"

echo ""
echo ""

# 步骤2: 分析
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 2/4: 节拍和鼓点分析"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python 2_analyze_beats.py "../audio/songs/$SONG_ID" --config config.yaml

echo ""
echo ""

# 步骤3: 生成谱面
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 3/4: 生成游戏谱面（所有难度）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python 3_generate_chart.py "../audio/songs/$SONG_ID" --all --config config.yaml

echo ""
echo ""

# 步骤4: 可视化
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 4/4: 生成可视化"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python visualize_chart.py "../charts/${SONG_ID}-easy.json"
python visualize_chart.py "../charts/${SONG_ID}-normal.json"
python visualize_chart.py "../charts/${SONG_ID}-hard.json"

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 生成的文件:"
echo "   音频: ../audio/songs/$SONG_ID/"
echo "   谱面: ../charts/${SONG_ID}-*.json"
echo "   可视化: ../charts/${SONG_ID}-*.png"
echo ""
echo "🎮 现在可以在前端应用中加载谱面: ${SONG_ID}-easy.json"

