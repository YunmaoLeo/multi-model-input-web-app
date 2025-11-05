#!/usr/bin/env python3
"""
Render a drum chart (JSON) into an audio preview by overlaying drum samples.

Usage:
  python render_chart_audio.py \
    --chart ../charts/generated/funky_normal_60s.json \
    --samples ../assets/drums \
    --out ../audio/previews/funky_normal_60s.wav

Deps:
  pip install -r requirements.txt
"""

import os
import json
import argparse
from pathlib import Path
from pydub import AudioSegment

DRUM_TO_FILE = {
    'kick':  'kick.wav',
    'snare': 'snare.wav',
    'hihat': 'hihat.wav',
    'crash': 'crash.wav',
    'ride':  'ride.wav',
    'tom':   'tom.wav',
}


def load_samples(samples_dir: str):
    loaded = {}
    for k, fname in DRUM_TO_FILE.items():
        path = Path(samples_dir) / fname
        if not path.exists():
            raise FileNotFoundError(f'Missing sample: {path}')
        loaded[k] = AudioSegment.from_file(path)
    return loaded


def velocity_gain_db(velocity: float | None) -> float:
    if velocity is None:
        return 0.0
    v = max(0.0, min(1.0, velocity))
    # Map 0..1 to -12..+0 dB
    return -12.0 * (1.0 - v)


def main():
    parser = argparse.ArgumentParser(description='Render drum chart JSON to audio by overlaying samples')
    parser.add_argument('--chart', type=str, required=True)
    parser.add_argument('--samples', type=str, default='../assets/drums')
    parser.add_argument('--out', type=str, required=True)
    parser.add_argument('--sr', type=int, default=44100)
    args = parser.parse_args()

    with open(args.chart, 'r', encoding='utf-8') as f:
        chart = json.load(f)

    duration_s = float(chart.get('duration', 60.0))
    notes = chart.get('notes', [])

    samples = load_samples(args.samples)

    # Base silent track
    base = AudioSegment.silent(duration=int(duration_s * 1000))

    # Overlay hits
    mix = base
    for n in notes:
        drum = n.get('drum')
        t_s = float(n.get('time', 0.0))
        vel = n.get('velocity', None)
        if drum not in samples:
            continue
        start_ms = max(0, int(t_s * 1000))
        seg = samples[drum].apply_gain(velocity_gain_db(vel))
        mix = mix.overlay(seg, position=start_ms)

    # Normalize (soft)
    peak = mix.max_dBFS
    target = -1.0
    gain = target - peak
    mix = mix.apply_gain(gain)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    mix.export(out_path, format='wav', parameters=["-ar", str(args.sr)])
    print(f'✅ Rendered audio: {out_path} (duration ~{duration_s:.1f}s)')


if __name__ == '__main__':
    main()
