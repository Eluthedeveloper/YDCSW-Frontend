import { describe, it, expect } from 'vitest';
import { groupTracks } from './trackGroups';
import type { Track } from './types';

const track = (id: string, group_name: string | null = null): Track => ({
  id,
  title: id,
  duration: 0,
  file_path: `${id}.mp3`,
  program_id: 'p1',
  group_name,
});

describe('groupTracks', () => {
  it('keeps a program with no labels as one ungrouped section in order', () => {
    const groups = groupTracks([track('a'), track('b')]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.name).toBeNull();
    expect(groups[0]!.tracks.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('splits named sections and keeps first-appearance order', () => {
    const groups = groupTracks([
      track('a', 'Matthew'),
      track('b', 'Genesis'),
      track('c', 'Matthew'),
    ]);

    expect(groups.map((g) => g.name)).toEqual(['Matthew', 'Genesis']);
    expect(groups[0]!.tracks.map((t) => t.id)).toEqual(['a', 'c']);
    expect(groups[1]!.tracks.map((t) => t.id)).toEqual(['b']);
  });

  it('treats a whitespace-only label as ungrouped', () => {
    const groups = groupTracks([track('a', '   '), track('b', 'Genesis')]);

    expect(groups.map((g) => g.name)).toEqual([null, 'Genesis']);
  });
});
