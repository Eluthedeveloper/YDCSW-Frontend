import { describe, it, expect } from 'vitest';
import { readAudioMetadata } from './metadata';

function ascii(text: string): number[] {
  return Array.from(text).map((c) => c.charCodeAt(0));
}

function utf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function u32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function syncsafe(value: number): number[] {
  return [(value >> 21) & 0x7f, (value >> 14) & 0x7f, (value >> 7) & 0x7f, value & 0x7f];
}

function id3Frame(id: string, text: string, version: 3 | 4): number[] {
  const data = version === 4 ? [0x03, ...utf8(text)] : [0x00, ...ascii(text)];
  const size = version === 4 ? syncsafe(data.length) : u32(data.length);
  return [...ascii(id), ...size, 0x00, 0x00, ...data];
}

function buildMp3(frames: number[][], version: 3 | 4): Uint8Array {
  const body = [...frames.flat(), ...new Array(64).fill(0)];
  const header = [0x49, 0x44, 0x33, version, 0x00, 0x00, ...syncsafe(body.length)];
  return Uint8Array.from([...header, ...body, ...new Array(64).fill(0xff)]);
}

function audioFile(bytes: Uint8Array, name: string): File {
  return new File([bytes as unknown as BlobPart], name, { type: 'audio/mpeg' });
}

describe('readAudioMetadata', () => {
  it('reads title, artist and album from the file tags', async () => {
    const file = audioFile(buildMp3([
      id3Frame('TIT2', 'Tagged Title', 3),
      id3Frame('TPE1', 'Tagged Artist', 3),
      id3Frame('TALB', 'Tagged Album', 3),
    ], 3), 'uploaded recording.mp3');

    await expect(readAudioMetadata(file)).resolves.toEqual({
      title: 'Tagged Title',
      artist: 'Tagged Artist',
      album: 'Tagged Album',
    });
  });

  it('reads UTF-8 tags, so Amharic text survives', async () => {
    const file = audioFile(buildMp3([
      id3Frame('TIT2', 'ትርል ዘማር', 4),
      id3Frame('TPE1', 'የብርሃን መዘምራን', 4),
      id3Frame('TALB', 'አልበም', 4),
    ], 4), 'zema.mp3');

    await expect(readAudioMetadata(file)).resolves.toEqual({
      title: 'ትርል ዘማር',
      artist: 'የብርሃን መዘምራን',
      album: 'አልበም',
    });
  });

  it('falls back to the file name for a file without tags', async () => {
    const file = audioFile(new Uint8Array(300), 'my song.mp3');

    await expect(readAudioMetadata(file)).resolves.toEqual({
      title: 'my song',
      artist: '',
      album: '',
    });
  });

  it('resolves with the fallback instead of rejecting for an unreadable file', async () => {
    const empty = new File([], 'nope.mp3', { type: 'audio/mpeg' });

    await expect(readAudioMetadata(empty)).resolves.toEqual({
      title: 'nope',
      artist: '',
      album: '',
    });
  });
});
