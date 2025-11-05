# LLM Drum Chart Pipeline (Quickstart)

## 0) Install deps
```bash
cd public/scripts
pip install -r requirements.txt
```

## 1) Set API key (do NOT hardcode)
```bash
export OPENAI_API_KEY=sk-xxxxx   # macOS/Linux
# Windows (PowerShell):
# $Env:OPENAI_API_KEY="sk-xxxxx"
```

## 2) Generate a chart via LLM
```bash
python generate_drum_chart_llm.py \
  --theme "Upbeat pop groove with open hihat on chorus" \
  --difficulty normal \
  --duration 60 \
  --bpm 120 \
  --out ../charts/generated/pop_upbeat_normal_60s.json
```

## 3) Render audio preview from chart
```bash
python render_chart_audio.py \
  --chart ../charts/generated/pop_upbeat_normal_60s.json \
  --samples ../assets/drums \
  --out ../audio/previews/pop_upbeat_normal_60s.wav
```

## Notes
- Spec: see DRUM_LLM_SPEC.md
- Samples: ../assets/drums/*.wav (kick/snare/hihat/crash/ride/tom)
- The rendered audio is a quick preview for QA; frontend still guides users in real-time.
