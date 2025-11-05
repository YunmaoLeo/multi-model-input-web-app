#!/usr/bin/env python3
"""
Generate drum samples using synthesis
Creates basic drum sounds: kick, snare, hihat, crash, ride, tom
"""

import numpy as np
import soundfile as sf
from pathlib import Path

# Audio settings
SAMPLE_RATE = 44100
DURATION = 2.0  # seconds

def generate_kick(frequency=60, sample_rate=SAMPLE_RATE, duration=0.3):
    """Generate kick drum sound"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Low frequency sine wave with envelope
    envelope = np.exp(-t * 8)  # Exponential decay
    wave = np.sin(2 * np.pi * frequency * t)
    
    # Add some harmonics
    wave += 0.3 * np.sin(2 * np.pi * frequency * 2 * t) * envelope
    
    # Apply envelope
    wave *= envelope
    
    # Normalize
    wave = wave / np.max(np.abs(wave)) * 0.8
    
    return wave

def generate_snare(sample_rate=SAMPLE_RATE, duration=0.2):
    """Generate snare drum sound"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # White noise component
    noise = np.random.randn(len(t)) * 0.5
    
    # Low frequency component (drum body)
    body_freq = 200
    body = np.sin(2 * np.pi * body_freq * t)
    
    # Envelope
    envelope = np.exp(-t * 15)
    
    # Mix
    wave = (noise * 0.7 + body * 0.3) * envelope
    
    # Normalize
    wave = wave / np.max(np.abs(wave)) * 0.8
    
    return wave

def generate_hihat(sample_rate=SAMPLE_RATE, duration=0.1):
    """Generate hihat sound"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # High frequency noise
    noise = np.random.randn(len(t))
    
    # High-pass filter effect (more high frequencies)
    # Apply exponential envelope
    envelope = np.exp(-t * 30)
    
    wave = noise * envelope
    
    # Normalize
    wave = wave / np.max(np.abs(wave)) * 0.7
    
    return wave

def generate_crash(sample_rate=SAMPLE_RATE, duration=1.0):
    """Generate crash cymbal sound"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Wide frequency noise
    noise = np.random.randn(len(t))
    
    # Slow decay envelope
    envelope = np.exp(-t * 2)
    
    wave = noise * envelope
    
    # Normalize
    wave = wave / np.max(np.abs(wave)) * 0.8
    
    return wave

def generate_ride(sample_rate=SAMPLE_RATE, duration=0.5):
    """Generate ride cymbal sound"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # High frequency noise with some tonal component
    noise = np.random.randn(len(t)) * 0.8
    
    # Add some tonal frequencies
    tonal = np.sin(2 * np.pi * 800 * t) * 0.2
    
    # Fast decay envelope
    envelope = np.exp(-t * 5)
    
    wave = (noise + tonal) * envelope
    
    # Normalize
    wave = wave / np.max(np.abs(wave)) * 0.7
    
    return wave

def generate_tom(pitch=150, sample_rate=SAMPLE_RATE, duration=0.4):
    """Generate tom drum sound"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Low frequency sine wave
    wave = np.sin(2 * np.pi * pitch * t)
    
    # Add harmonics
    wave += 0.2 * np.sin(2 * np.pi * pitch * 2 * t)
    
    # Envelope with some sustain
    envelope = np.exp(-t * 6)
    
    wave *= envelope
    
    # Normalize
    wave = wave / np.max(np.abs(wave)) * 0.8
    
    return wave

def main():
    """Generate all drum samples"""
    output_dir = Path(__file__).parent.parent / "assets" / "drums"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("🥁 Generating drum samples...")
    print(f"📁 Output directory: {output_dir}")
    
    # Generate all samples
    samples = {
        "kick": generate_kick(),
        "snare": generate_snare(),
        "hihat": generate_hihat(),
        "crash": generate_crash(),
        "ride": generate_ride(),
        "tom": generate_tom()
    }
    
    # Save samples
    for name, wave in samples.items():
        output_path = output_dir / f"{name}.wav"
        sf.write(output_path, wave, SAMPLE_RATE)
        print(f"✅ Generated: {name}.wav ({len(wave)/SAMPLE_RATE:.2f}s)")
    
    print("\n🎉 All samples generated successfully!")
    print(f"📂 Location: {output_dir}")
    print("\n💡 Tip: You can replace these with higher quality samples from:")
    print("   - https://freesound.org/")
    print("   - https://www.splice.com/")
    print("   - https://www.drummachinesamples.com/")

if __name__ == "__main__":
    main()

