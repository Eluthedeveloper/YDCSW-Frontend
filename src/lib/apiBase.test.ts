import { describe, it, expect } from 'vitest';
import { API_BASE, trackStreamUrl, uploadUrl } from './apiBase';

describe('trackStreamUrl', () => {
  // The whole point of this helper: IDM decides a response is a file to save
  // from the extension in the URL, so the audio URL must not carry one.
  it('strips the on-disk extension and appends .stream', () => {
    expect(trackStreamUrl('a1b2c3.mp3')).toBe(`${API_BASE}/uploads/tracks/a1b2c3.stream`);
  });

  // tracks.ts stores `path.extname(file.originalname)` verbatim, so an uploaded
  // SONG.MP3 reaches the client with an uppercase extension.
  it('strips a mixed-case extension', () => {
    expect(trackStreamUrl('song.MP3')).toBe(`${API_BASE}/uploads/tracks/song.stream`);
  });

  it('keeps dotted stems intact', () => {
    expect(trackStreamUrl('my.song.v2.flac')).toBe(`${API_BASE}/uploads/tracks/my.song.v2.stream`);
  });

  it('appends .stream when there is no extension to strip', () => {
    expect(trackStreamUrl('noextension')).toBe(`${API_BASE}/uploads/tracks/noextension.stream`);
  });

  it('never leaks a playable media extension into the URL', () => {
    for (const name of ['a.mp3', 'b.wav', 'c.ogg', 'd.flac', 'e.m4a', 'f.aac']) {
      expect(trackStreamUrl(name)).not.toMatch(/\.(mp3|wav|ogg|flac|m4a|aac)$/);
    }
  });

  // Covers keep their real extension; IDM does not capture images, so rewriting
  // those URLs would buy nothing.
  it('leaves cover URLs untouched', () => {
    expect(uploadUrl('covers/abc.jpg')).toBe(`${API_BASE}/uploads/covers/abc.jpg`);
  });
});