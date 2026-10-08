import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';import type { ReactNode } from 'react';
import { api, trackStreamUrl } from '../utils/api';
import type { Track } from '../utils/types';

export type { Track } from '../utils/types';

export type RepeatMode = 'off' | 'all' | 'one';

/**
 * Why playback failed, as a code rather than a sentence.
 *
 * The context is a state container, not a view: leaving the wording to the
 * component keeps i18n out of the provider and lets the player surface these in
 * whichever language is active.
 */
export type PlaybackErrorCode = 'network' | 'unsupported' | 'unknown';

interface PlayerContextType {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  progress: number;
  duration: number;
  analyserNode: AnalyserNode | null;
  isSeeking: boolean;
  /** Playback-order and loop settings. These drive `ended`, not just the icons. */
  shuffle: boolean;
  repeatMode: RepeatMode;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  /** Populated when the audio element fails, so the UI can offer a retry. */
  playbackError: PlaybackErrorCode | null;
  dismissPlaybackError: () => void;
  play: (track: Track, list?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  startSeeking: () => void;
  endSeeking: () => void;
  setVolume: (vol: number) => void;
  next: () => void;
  prev: () => void;
  skipForward: (seconds?: number) => void;
  skipBack: (seconds?: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playbackError, setPlaybackError] = useState<PlaybackErrorCode | null>(null);
  // Must be state, not a ref: WaveSpectrum lists this in its effect deps, and a
  // ref never triggers a render, so consumers would only ever see the null it
  // held on first render and the visualiser would never start.
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const isSeekingRef = useRef(false);
  const playlistRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const pendingListenRef = useRef<string | null>(null);
  const lastListenAtRef = useRef<Record<string, number>>({});
  const shuffleRef = useRef(shuffle);
  const repeatModeRef = useRef(repeatMode);

  // The media element listeners below are registered once on mount and need to
  // reach the current `play`, but registering them before `play` is declared
  // would capture a stale closure. A ref keeps them pointed at the live one.
  const playRef = useRef<(track: Track, list?: Track[]) => void>(() => {});
  const endedRef = useRef<() => void>(() => {});

  /**
   * Classifies a MediaError. Codes per the HTML spec: 1 aborted, 2 network,
   * 3 decode, 4 source unsupported. An aborted load is what `close()` and track
   * changes trigger, so it is not treated as a failure worth reporting.
   */
  const classifyMediaError = useCallback((): PlaybackErrorCode | null => {
    const err = audioRef.current?.error;
    if (!err) return 'unknown';
    if (err.code === 1) return null;
    if (err.code === 2) return 'network';
    if (err.code === 3 || err.code === 4) return 'unsupported';
    return 'unknown';
  }, []);

  // Records a listen only when playback actually starts and at most once
  // per track per minute, so replays/repeated clicks don't inflate stats.
  const recordListenIfDue = useCallback((track: Track) => {
    const now = Date.now();
    const last = lastListenAtRef.current[track.id];
    if (last && now - last < 60_000) return;
    lastListenAtRef.current[track.id] = now;
    api.recordListen(track.id).catch(() => {});
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      // A MediaElementAudioSourceNode can only be created once per element.
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      sourceRef.current = source;
      setAnalyserNode(analyser);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (!isSeekingRef.current) {
        setProgress(audio.currentTime);
      }
      setDuration(audio.duration || 0);
    });

    audio.addEventListener('ended', () => {
      endedRef.current();
    });

    // A decode failure or an unreachable file fires `error` on the element.
    // Previously nothing listened, so the play button sat there doing nothing
    // with no indication anything had gone wrong.
    audio.addEventListener('error', () => {
      const code = classifyMediaError();
      setIsBuffering(false);
      if (!code) return;
      setPlaybackError(code);
      setIsPlaying(false);
    });

    audio.addEventListener('playing', () => {
      setIsBuffering(false);
      const pending = pendingListenRef.current;
      if (pending) {
        pendingListenRef.current = null;
        const track = currentTrackRef.current;
        if (track && track.id === pending) recordListenIfDue(track);
      }
    });
    audio.addEventListener('waiting', () => setIsBuffering(true));
    audio.addEventListener('canplay', () => setIsBuffering(false));
    audio.addEventListener('stalled', () => setIsBuffering(true));

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      void audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
      sourceRef.current = null;
    };
    // Mount-only: this element and its listeners live for the provider's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordListenIfDue]);

  const play = useCallback((track: Track, list?: Track[]) => {
    if (list) { setPlaylist(list); playlistRef.current = list; }
    setCurrentTrack(track);
    currentTrackRef.current = track;

    // Record the listen once playback actually starts (see 'playing' handler).
    pendingListenRef.current = track.id;

    if (audioRef.current) {
      audioRef.current.src = trackStreamUrl(track.file_path);
      audioRef.current.load();
      // A new source supersedes whatever went wrong with the last one.
      setPlaybackError(null);
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err: unknown) => {
          // A rejected play() is either a missing file or an autoplay block.
          // Both used to be swallowed into the console, leaving the play
          // button inert with nothing on screen to explain why.
          console.error('Playback failed:', err);
          setIsPlaying(false);
          setIsBuffering(false);
          setPlaybackError(classifyMediaError());
        });
    }
  }, [initAudioContext, classifyMediaError]);

  // Synced in an effect rather than assigned during render, which would be a
  // ref write in the render phase. The `ended` listener reads it only after
  // mount, by which time this has run.
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err: unknown) => console.error('Playback failed:', err));
    }
  }, [initAudioContext]);

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setCurrentTrack(null);
    currentTrackRef.current = null;
    setPlaylist([]);
    playlistRef.current = [];
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setIsBuffering(false);
    pendingListenRef.current = null;
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setProgress(time);
  }, []);

  const startSeeking = useCallback(() => {
    isSeekingRef.current = true;
    setIsSeeking(true);
  }, []);

  const endSeeking = useCallback(() => {
    isSeekingRef.current = false;
    setIsSeeking(false);
  }, []);

  // Animates the scrub bar toward its new position; the audio element itself
  // jumps instantly, which would otherwise look like the seek was ignored.
  //
  // The frame handle is kept so a second skip cancels the first one's loop.
  // Overlapping loops both write `progress`, so the bar would jump backwards
  // mid-animation, and a loop still running after unmount would call
  // setProgress on a provider that is gone.
  const rafRef = useRef(0);

  const animateProgressTo = useCallback((from: number, to: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const delta = to - from;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / 300);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(from + delta * ease);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  /**
   * The furthest position a skip may land on.
   *
   * `HTMLMediaElement.duration` is `NaN` until metadata loads and `Infinity`
   * for a live stream, so only a finite positive value may be used as a clamp.
   * Falling back to `0` would make a skip pressed during that window rewind to
   * the start of the track, which reads as the button being broken.
   */
  const upperBound = useCallback((audio: HTMLAudioElement) => {
    const { duration } = audio;
    return Number.isFinite(duration) && duration > 0 ? duration : null;
  }, []);

  const skipForward = useCallback((seconds = 10) => {
    const audio = audioRef.current;
    if (!audio) return;
    const from = audio.currentTime;
    const limit = upperBound(audio);
    const to = limit === null ? from + seconds : Math.min(limit, from + seconds);
    audio.currentTime = to;
    animateProgressTo(from, to);
  }, [animateProgressTo, upperBound]);

  const skipBack = useCallback((seconds = 10) => {
    const audio = audioRef.current;
    if (!audio) return;
    const from = audio.currentTime;
    const to = Math.max(0, from - seconds);
    audio.currentTime = to;
    animateProgressTo(from, to);
  }, [animateProgressTo]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  /**
   * Moves `delta` places through the playlist and reports whether it played.
   *
   * The next/prev buttons always step sequentially, even with shuffle on:
   * pressing "next" means the track after this one, not a random one. Shuffle
   * changes what happens when a track finishes on its own, which is where the
   * listener has no intent to override. Returns false at the edge of the list
   * so the caller can decide between stopping and wrapping.
   */
  const step = useCallback((delta: number, wrap: boolean): boolean => {
    const list = playlistRef.current;
    if (list.length === 0) return false;
    const current = currentTrackRef.current;
    const from = list.findIndex((t) => t.id === current?.id);
    let to = from + delta;
    if (to < 0) {
      if (!wrap) return false;
      to = list.length - 1;
    } else if (to >= list.length) {
      if (!wrap) return false;
      to = 0;
    }
    playRef.current(list[to]!, list);
    return true;
  }, []);

  const next = useCallback(() => {
    step(1, repeatModeRef.current === 'all');
  }, [step]);

  const prev = useCallback(() => {
    step(-1, repeatModeRef.current === 'all');
  }, [step]);

  /**
   * What happens when a track reaches its end on its own.
   *
   * Repeat-one replays the track before anything else is considered, so it
   * wins over shuffle — otherwise shuffle would immediately pull in a different
   * track and repeat-one would appear to do nothing.
   */
  const handleEnded = useCallback(() => {
    const list = playlistRef.current;
    const current = currentTrackRef.current;
    if (list.length === 0) {
      setIsPlaying(false);
      return;
    }

    if (repeatModeRef.current === 'one') {
      if (current) playRef.current(current, list);
      return;
    }

    if (shuffleRef.current && list.length > 1) {
      const currentIndex = list.findIndex((t) => t.id === current?.id);
      let pick = Math.floor(Math.random() * list.length);
      // Nudge off the current track so a shuffled single-item queue still makes
      // progress instead of silently replaying.
      if (pick === currentIndex) pick = (pick + 1) % list.length;
      playRef.current(list[pick]!, list);
      return;
    }

    if (!step(1, repeatModeRef.current === 'all')) setIsPlaying(false);
  }, [step]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    endedRef.current = handleEnded;
  }, [handleEnded]);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'));
  }, []);

  const dismissPlaybackError = useCallback(() => setPlaybackError(null), []);

  return (
    <PlayerContext.Provider value={{
      currentTrack, playlist, isPlaying, isBuffering, volume, progress, duration, isSeeking,
      analyserNode,
      shuffle, repeatMode, toggleShuffle, cycleRepeat, playbackError, dismissPlaybackError,
      play, pause, resume, close, seek, startSeeking, endSeeking, setVolume, next, prev,
      skipForward, skipBack,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
