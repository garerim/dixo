/**
 * Generate placeholder WAV sound files for the sound system.
 * These are short sine-wave tones — replace with real assets later.
 *
 * Usage: node scripts/generate-sounds.mjs
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = join(__dirname, "..", "public", "sounds");

function generateWav(frequency, durationMs, volume = 0.5, fadeOut = true) {
  const sampleRate = 22050;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2; // 16-bit mono
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // WAV header
  buffer.write("RIFF", offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write("WAVE", offset); offset += 4;
  buffer.write("fmt ", offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM
  buffer.writeUInt16LE(1, offset); offset += 2; // mono
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * 2, offset); offset += 4; // byte rate
  buffer.writeUInt16LE(2, offset); offset += 2; // block align
  buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample
  buffer.write("data", offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Generate samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = Math.sin(2 * Math.PI * frequency * t) * volume;

    // Fade out last 30%
    if (fadeOut) {
      const fadeStart = numSamples * 0.7;
      if (i > fadeStart) {
        sample *= 1 - (i - fadeStart) / (numSamples - fadeStart);
      }
    }

    const val = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.floor(val * 32767), offset);
    offset += 2;
  }

  return buffer;
}

// Multi-tone sound (chord / sequence)
function generateMultiTone(tones, volume = 0.4) {
  const sampleRate = 22050;
  let totalSamples = 0;
  for (const t of tones) totalSamples += Math.floor((sampleRate * t.durationMs) / 1000);

  const dataSize = totalSamples * 2;
  const fileSize = 44 + dataSize;
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // WAV header
  buffer.write("RIFF", offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write("WAVE", offset); offset += 4;
  buffer.write("fmt ", offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * 2, offset); offset += 4;
  buffer.writeUInt16LE(2, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2;
  buffer.write("data", offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (const tone of tones) {
    const numSamples = Math.floor((sampleRate * tone.durationMs) / 1000);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = Math.sin(2 * Math.PI * tone.freq * t) * volume;

      // Fade out last 20%
      const fadeStart = numSamples * 0.8;
      if (i > fadeStart) {
        sample *= 1 - (i - fadeStart) / (numSamples - fadeStart);
      }

      const val = Math.max(-1, Math.min(1, sample));
      buffer.writeInt16LE(Math.floor(val * 32767), offset);
      offset += 2;
    }
  }

  return buffer;
}

const sounds = {
  "dice-roll.mp3": generateWav(200, 600, 0.3),
  "bid-place.mp3": generateWav(800, 150, 0.3),
  "challenge.mp3": generateMultiTone([
    { freq: 400, durationMs: 200 },
    { freq: 600, durationMs: 200 },
    { freq: 800, durationMs: 300 },
  ], 0.4),
  "round-win.mp3": generateMultiTone([
    { freq: 523, durationMs: 150 },
    { freq: 659, durationMs: 150 },
    { freq: 784, durationMs: 300 },
  ], 0.35),
  "round-loss.mp3": generateMultiTone([
    { freq: 400, durationMs: 200 },
    { freq: 300, durationMs: 300 },
  ], 0.35),
  "game-victory.mp3": generateMultiTone([
    { freq: 523, durationMs: 150 },
    { freq: 659, durationMs: 150 },
    { freq: 784, durationMs: 150 },
    { freq: 1047, durationMs: 400 },
  ], 0.4),
  "game-defeat.mp3": generateMultiTone([
    { freq: 400, durationMs: 200 },
    { freq: 350, durationMs: 200 },
    { freq: 300, durationMs: 200 },
    { freq: 200, durationMs: 400 },
  ], 0.35),
  "your-turn.mp3": generateMultiTone([
    { freq: 880, durationMs: 100 },
    { freq: 1100, durationMs: 150 },
  ], 0.3),
};

for (const [name, buffer] of Object.entries(sounds)) {
  const path = join(SOUNDS_DIR, name);
  writeFileSync(path, buffer);
  console.log(`Generated ${name} (${buffer.length} bytes)`);
}

console.log("\nDone! Replace these placeholder WAV files with real sound assets.");
console.log("Note: Files are named .mp3 but are actually WAV — browsers handle both fine.");
