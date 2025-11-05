#!/usr/bin/env python3
"""
Generate a drum chart via OpenAI (LLM) based on a theme sentence.

Usage:
  python generate_drum_chart_llm.py \
    --theme "Funky syncopated snare, light ghost notes" \
    --difficulty normal \
    --duration 60 \
    --bpm 120 \
    --out ../charts/generated/funky_normal_60s.json

Env:
  OPENAI_API_KEY   Required. Do NOT hardcode keys in code.

Deps:
  pip install -r requirements.txt
"""

import os
import json
import argparse
from datetime import datetime

try:
    from openai import OpenAI
except Exception as e:
    OpenAI = None

SPEC_PATH = os.path.join(os.path.dirname(__file__), 'DRUM_LLM_SPEC.md')

SCHEMA_JSON = {
    "theme": "string",
    "difficulty": "easy",
    "duration": 60.0,
    "bpm": 120,
    "notes": [
        {"time": 0.0, "drum": "kick",  "hand": "right", "velocity": 0.9}
    ],
    "metadata": {"generatedBy": "OpenAI", "prompt": "...", "timestamp": "..."}
}

PROMPT_TEMPLATE = (
    "You are a professional drum chart generator for an interactive rhythm app.\n"
    "Generate a {duration:.1f}-second playable drum chart in JSON.\n\n"
    "Theme: \"{theme}\"\n"
    "Difficulty: {difficulty}\n"
    "BPM: {bpm}\n\n"
    "Requirements:\n"
    "- Use available drums: kick, snare, hihat, crash, ride, tom\n"
    "- Keep it playable for one human (two hands), use 'both' sparingly\n"
    "- Quantize mostly to 1/8 or 1/16; allow occasional off-grid for feel\n"
    "- Add short fills every 4 or 8 bars\n"
    "- Start simple, build mildly, end with an accent\n"
    "- Output strictly as JSON, no extra text\n"
    "- Follow this schema exactly (fields only, no comments):\n{schema}\n"
)


def read_spec_snippet() -> str:
    try:
        with open(SPEC_PATH, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return ""


def build_prompt(theme: str, difficulty: str, duration: float, bpm: int) -> str:
    schema = json.dumps(SCHEMA_JSON, ensure_ascii=False, indent=2)
    prompt = PROMPT_TEMPLATE.format(
        theme=theme,
        difficulty=difficulty,
        duration=duration,
        bpm=bpm,
        schema=schema
    )
    return prompt


def main():
    parser = argparse.ArgumentParser(description='Generate drum chart via OpenAI LLM')
    parser.add_argument('--theme', type=str, required=True, help='Theme sentence for the chart')
    parser.add_argument('--difficulty', type=str, default='normal', choices=['easy','normal','hard'])
    parser.add_argument('--duration', type=float, default=60.0)
    parser.add_argument('--bpm', type=int, default=120)
    parser.add_argument('--model', type=str, default='gpt-5-nano')
    parser.add_argument('--out', type=str, required=True, help='Output JSON path')
    args = parser.parse_args()

    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise SystemExit('OPENAI_API_KEY not set in environment')

    if OpenAI is None:
        raise SystemExit('openai package not available. pip install openai>=1.0.0')

    client = OpenAI(api_key=api_key)

    prompt = build_prompt(args.theme, args.difficulty, args.duration, args.bpm)

    print('🤖 Calling OpenAI...')
    resp = client.responses.create(
        model=args.model,
        input=prompt,
        store=False
    )

    content = resp.output_text

    # Parse JSON and normalize
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        # Try to extract JSON block if extra text appears
        start = content.find('{')
        end = content.rfind('}')
        if start >= 0 and end > start:
            data = json.loads(content[start:end+1])
        else:
            raise

    # Post-process
    duration = float(args.duration)
    notes = data.get('notes', [])
    cleaned = []
    for n in notes:
        try:
            t = max(0.0, min(duration, float(n.get('time', 0.0))))
            drum = str(n.get('drum','')).lower()
            if drum not in {'kick','snare','hihat','crash','ride','tom'}:
                continue
            hand = str(n.get('hand','right'))
            vel = n.get('velocity', None)
            if vel is not None:
                vel = max(0.0, min(1.0, float(vel)))
            cleaned.append({
                'time': t,
                'drum': drum,
                'hand': hand,
                **({'velocity': vel} if vel is not None else {})
            })
        except Exception:
            continue

    cleaned.sort(key=lambda x: x['time'])

    out = {
        'theme': args.theme,
        'difficulty': args.difficulty,
        'duration': duration,
        'bpm': int(args.bpm),
        'notes': cleaned,
        'metadata': {
            'generatedBy': 'OpenAI',
            'prompt': f"Theme: {args.theme}, Difficulty: {args.difficulty}",
            'timestamp': datetime.utcnow().isoformat()
        }
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f'✅ Chart saved to: {args.out} ({len(cleaned)} notes)')


if __name__ == '__main__':
    main()
