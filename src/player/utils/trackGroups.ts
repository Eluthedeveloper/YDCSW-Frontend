import type { Track } from './types';

export interface TrackGroup {
  /** Empty string is the ungrouped bucket, matching the API's null label. */
  key: string;
  name: string | null;
  tracks: Track[];
}

/**
 * Groups a flat track list into program sections while preserving order.
 *
 * The API returns tracks ordered by (group_order, sort_order), so the first
 * appearance of a label defines where that section appears. Tracks without a
 * label land in a single ungrouped bucket at the front, exactly as the backend
 * orders them.
 */
export function groupTracks(tracks: Track[]): TrackGroup[] {
  const groups = new Map<string, TrackGroup>();
  for (const track of tracks) {
    const name = track.group_name?.trim() || null;
    const key = name ?? '';
    let group = groups.get(key);
    if (!group) {
      group = { key, name, tracks: [] };
      groups.set(key, group);
    }
    group.tracks.push(track);
  }
  return [...groups.values()];
}

/** The identity used to decide whether two tracks belong to the same section. */
export function groupKeyOf(track: Track): string {
  return track.group_name?.trim() || '';
}
