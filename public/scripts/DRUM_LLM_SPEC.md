# Drum LLM Prompting Spec (v0.1)

This spec defines how we ask an LLM to generate a 1-minute drum chart from a short theme sentence, and the JSON format our frontend expects.

## Goals
- Input: a short natural-language theme (e.g., "Upbeat pop groove with light hi-hat and syncopated snare")
- Output: a playable drum chart (JSON) for ~60 seconds
- The chart guides users to hit different pads (kick/snare/hihat/crash/ride/tom), no background music needed

## Constraints
- Duration: default 60.0s unless specified
- BPM: default 120 unless specified
- Grid: quantize to 1/8 or 1/16 notes; off-grid hits allowed sparingly for feel
- Density: stable and progressive; avoid impossible flams/rolls for beginners
- Playability: avoid unplayable simultaneous hits (use 'both' sparingly)
- Style adherence: reflect theme in instrument choice and rhythm

## Available Drums
- kick: low pulse, beats 1/3 accents
- snare: backbeat (2/4) or syncopation
- hihat: constant 1/8 or 1/16, open accents ok
- crash: section starts / accents
- ride: steady pattern alternative to hihat
- tom: fills, transitions

## Difficulty Guidelines
- easy: 0.5–1 note/s; simple backbeat; short fills
- normal: 1–2 notes/s; moderate syncopation; occasional fills
- hard: 2–3 notes/s; busier hihat/ride; more ghost-like snare (but keep playable)

## JSON Schema
```json
{
  "theme": "string",
  "difficulty": "easy|normal|hard",
  "duration": 60.0,
  "bpm": 120,
  "notes": [
    { "time": 0.0, "drum": "kick",  "hand": "right", "velocity": 0.9 },
    { "time": 0.5, "drum": "snare", "hand": "left",  "velocity": 0.8 },
    { "time": 0.25, "drum": "hihat", "hand": "right", "velocity": 0.6 }
  ],
  "metadata": {
    "generatedBy": "OpenAI",
    "prompt": "...",
    "timestamp": "ISO8601"
  }
}
```
- time: seconds from start (float)
- drum: one of [kick, snare, hihat, crash, ride, tom]
- hand: 'left' | 'right' | 'both' (used by UI hints; does not hard-limit)
- velocity: 0–1 (optional; used to scale hit loudness)

## Prompt Template
```
You are a professional drum chart generator for an interactive rhythm app.
Generate a 60-second playable drum chart in JSON.

Theme: "{THEME}"
Difficulty: {DIFFICULTY}
BPM: {BPM}

Requirements:
- Use available drums: kick, snare, hihat, crash, ride, tom
- Keep it playable for one human (two hands), use 'both' sparingly
- Quantize mostly to 1/8 or 1/16; allow occasional off-grid for feel
- Add short fills every 4 or 8 bars
- Start simple, build mildly, end with an accent
- Output strictly as JSON, no extra text
- Follow this schema: (include fields exactly as below)
{SCHEMA_JSON}
```

Where `{SCHEMA_JSON}` is the minimal schema shown above (without comments).

## Validation Rules (post-processing)
- Clamp time to [0, duration]
- Drop unknown drums
- Sort notes by time ascending
- Optional: uniquify near-duplicates within 10ms

## Test Themes
- "Upbeat pop groove with open hihat on chorus"
- "Funky syncopated snare, light ghost notes"
- "Energetic rock with ride in chorus, tom fills"

## Versioning
- v0.1: initial spec
