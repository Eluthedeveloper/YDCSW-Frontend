import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api, trackStreamUrl, trackHlsUrl } from '../utils/api';
import { attachHls, hlsEnabled, supportsMse, supportsNativeHls } from '../utils/hls';
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
export type PlaybackErrorCode = 'notfound' | 'network' | 'unsupported' | 'unknown';

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
  /** Re-requests the stream and picks up where it stopped. */
  reconnect: () => void;
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

const VOLUME_STORAGE_KEY = 'ydcs:volume';
const DEFAULT_VOLUME = 0.8;

/** Reads the listener's last chosen volume, falling back on any bad value. */
function readStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  // Set once Web Audio setup fails so it is not retried on every play(), which
  // would leak contexts and re-trigger the same failure.
  const audioContextFailedRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(readStoredVolume);
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
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A reconnect waits for `loadedmetadata` to restore the position. Keeping the
  // listener here lets play()/close() remove it, so it can never fire against a
  // different track and seek that one to the old position.
  const reconnectRestoreRef = useRef<(() => void) | null>(null);

  // HLS state. `hlsModeRef` is 'native' for Safari's built-in support and
  // 'mse' while hls.js is attached; null means the progressive element is in
  // use. `loadTokenRef` identifies the current source so a slow dynamic import
  // or a late HLS error cannot touch a track the listener has already left.
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const hlsModeRef = useRef<'native' | 'mse' | null>(null);
  const nativeFallbackRef = useRef<(() => void) | null>(null);
  const hlsStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTokenRef = useRef(0);

  // The media element listeners below are registered once on mount and need to
  // reach the current `play`, but registering them before `play` is declared
  // would capture a stale closure. A ref keeps them pointed at the live one.
  const playRef = useRef<(track: Track, list?: Track[]) => void>(() => {});
  const endedRef = useRef<() => void>(() => {});

  /**
   * A stalled download never fires the element's `error` event, so a dead
   * mobile connection used to leave the buffering spinner turning and the
   * progress bar frozen, with nothing the listener could act on. The watchdog
   * turns that silence into the same error-and-retry the other failures use.
   */
  const STALL_TIMEOUT_MS = 12000;
  const HLS_START_TIMEOUT_MS = 2000;

  const clearStallWatchdog = useCallback(() => {
    if (stallTimerRef.current !== null) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const armStallWatchdog = useCallback(() => {
    clearStallWatchdog();
    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null;
      const audio = audioRef.current;
      // readyState 3 is HAVE_FUTURE_DATA: the browser recovered on its own and
      // the element can play, so there is nothing to report.
      if (!audio || audio.readyState >= 3) return;
      setIsBuffering(false);
      setPlaybackError('network');
    }, STALL_TIMEOUT_MS);
  }, [clearStallWatchdog]);

  const clearReconnectRestore = useCallback(() => {
    const audio = audioRef.current;
    if (audio && reconnectRestoreRef.current) {
      audio.removeEventListener('loadedmetadata', reconnectRestoreRef.current);
    }
    reconnectRestoreRef.current = null;
  }, []);

  const clearHlsStartTimer = useCallback(() => {
    if (hlsStartTimerRef.current !== null) {
      clearTimeout(hlsStartTimerRef.current);
      hlsStartTimerRef.current = null;
    }
  }, []);

  /**
   * Detaches hls.js and forgets how the current source was loaded.
   *
   * Every source change goes through here, because an hls.js instance left
   * attached keeps its own MediaSource on the element and would fight the
   * next `src` assignment.
   */
  const destroyHls = useCallback(() => {
    clearHlsStartTimer();
    hlsRef.current?.destroy();
    hlsRef.current = null;
    hlsModeRef.current = null;
    nativeFallbackRef.current = null;
  }, [clearHlsStartTimer]);
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

  /**
   * A missing upload and an unsupported codec both surface as MediaError code 4,
   * so the player cannot tell them apart from the error alone. Ask the server
   * once, only after a failure, whether the stream URL actually exists. A 404
   * means the track's row points at an audio file that is no longer on disk,
   * which deserves a different message than an unsupported format.
   */
  const detectMissingSource = useCallback(async (src: string): Promise<PlaybackErrorCode> => {
    try {
      const res = await fetch(src, { method: 'HEAD' });
      return res.status === 404 ? 'notfound' : 'unsupported';
    } catch {
      // Network failure or a CORS rejection; keep the original diagnosis.
      return 'unsupported';
    }
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
    if (audioContextRef.current || !audioRef.current || audioContextFailedRef.current) return;
    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
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
    } catch (err) {
      // Without Web Audio there is no visualiser, but the element is still
      // connected to its own output, so playback must not be lost over it.
      audioContextFailedRef.current = true;
      if (ctx) void ctx.close().catch(() => {});
      console.warn('Audio analyser unavailable; continuing without visualiser:', err);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    // `metadata` rather than `auto`: a track is tens of megabytes, and `auto`
    // makes the browser download all of it before it will start playing. On a
    // mobile connection that is a spinner with a frozen progress bar for
    // minutes, which reads as a broken player. `metadata` fetches only enough
    // to begin, and the rest streams in as playback proceeds.
    audio.preload = 'metadata';
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
      // Safari's native HLS reports a missing packager as a media error with
      // no useful code. The progressive stream is the answer, not an error
      // message, so take that path before classifying anything.
      const nativeFallback = hlsModeRef.current === 'native' ? nativeFallbackRef.current : null;
      if (nativeFallback) {
        nativeFallbackRef.current = null;
        nativeFallback();
        return;
      }

      const code = classifyMediaError();
      setIsBuffering(false);
      setIsPlaying(false);
      if (!code) return;
      // Capture the URL so a slow HEAD cannot overwrite the state of a track the
      // listener has since switched to.
      const src = audio.src;
      if (code === 'unsupported') {
        void detectMissingSource(src).then((next) => {
          if (audioRef.current?.src === src) setPlaybackError(next);
        });
      } else {
        setPlaybackError(code);
      }
    });

    audio.addEventListener('playing', () => {
      setIsBuffering(false);
      clearStallWatchdog();
      const pending = pendingListenRef.current;
      if (pending) {
        pendingListenRef.current = null;
        const track = currentTrackRef.current;
        if (track && track.id === pending) recordListenIfDue(track);
      }
    });
    audio.addEventListener('waiting', () => {
      setIsBuffering(true);
      armStallWatchdog();
    });
    audio.addEventListener('canplay', () => {
      setIsBuffering(false);
      clearStallWatchdog();
    });
    audio.addEventListener('stalled', () => {
      setIsBuffering(true);
      armStallWatchdog();
    });

    // The element is the single source of truth for playing state. Relying
    // only on optimistic React writes desynced after a production 429 or a
    // rejected play() while buffered audio kept running — the toggle then
    // called resume() instead of pause(), so clicking pause did nothing.
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      clearStallWatchdog();
      clearHlsStartTimer();
      loadTokenRef.current += 1;
      hlsRef.current?.destroy();
      hlsRef.current = null;
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

  /**
   * Plays the element, mapping a rejected play() onto the same error codes the
   * `error` listener uses. A missing/unsupported source also fires `error`, so
   * that event owns the specific message; this only catches the rest.
   */
  const playWith = useCallback((audio: HTMLAudioElement, token: number) => {
    void audio.play()
      .then(() => setIsPlaying(true))
      .catch((err: unknown) => {
        setIsPlaying(false);
        setIsBuffering(false);
        // AbortError/NotAllowedError happen when another track replaces this
        // one or the browser blocks autoplay, and are not real failures.
        if (err instanceof Error && ['NotSupportedError', 'AbortError', 'NotAllowedError'].includes(err.name)) return;
        // A slow rejection from a track the listener already left must not
        // overwrite the current track's state.
        if (loadTokenRef.current !== token) return;
        console.warn('Playback could not start:', err);
        setPlaybackError(classifyMediaError() ?? 'unknown');
      });
  }, [classifyMediaError]);

  /**
   * Loads one track, preferring HLS and falling back to the progressive
   * `.stream` URL whenever packaging is unavailable.
   *
   * Keeping the decision in one place is what lets play(), reconnect() and the
   * HLS failure path share position restoration and error handling. `token`
   * identifies this load, so an async hls.js import that resolves after the
   * listener moved on cannot hijack the element.
   */
  const startPlayback = useCallback(
    (audio: HTMLAudioElement, track: Track, at: number, token: number) => {
      const streamUrl = trackStreamUrl(track.file_path);
      const hlsUrl = trackHlsUrl(track.file_path);
      let target = at;
      let fallbackStarted = false;

      const restore = () => {
        if (reconnectRestoreRef.current === restore) reconnectRestoreRef.current = null;
        if (target <= 0) return;
        if (loadTokenRef.current !== token || audioRef.current !== audio) return;
        try {
          audio.currentTime = target;
        } catch {
          // No metadata yet; the loadedmetadata listener retries.
        }
      };

      const armRestore = () => {
        clearReconnectRestore();
        if (target > 0) {
          reconnectRestoreRef.current = restore;
          audio.addEventListener('loadedmetadata', restore, { once: true });
        }
      };

      const loadProgressive = (from: number) => {
        if (fallbackStarted) return;
        fallbackStarted = true;
        if (loadTokenRef.current !== token) return;
        target = from;
        destroyHls();
        setPlaybackError(null);
        armRestore();
        audio.src = streamUrl;
        audio.load();
        restore();
        playWith(audio, token);
      };

      const armHlsStartTimer = (from: number) => {
        clearHlsStartTimer();
        hlsStartTimerRef.current = setTimeout(() => {
          hlsStartTimerRef.current = null;
          if (fallbackStarted || loadTokenRef.current !== token) return;
          if (hlsModeRef.current === null) return;
          if (!audio.paused && !audio.ended) return;
          const resumeAt = Number.isFinite(audio.currentTime) ? audio.currentTime : from;
          loadProgressive(resumeAt);
        }, HLS_START_TIMEOUT_MS);
      };

      if (hlsEnabled() && supportsNativeHls(audio)) {
        hlsModeRef.current = 'native';
        nativeFallbackRef.current = () => {
          const from = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
          loadProgressive(from);
        };
        armRestore();
        audio.src = hlsUrl;
        audio.load();
        restore();
        playWith(audio, token);
        armHlsStartTimer(at);
        return;
      }

      if (!hlsEnabled() || !supportsMse()) {
        loadProgressive(at);
        return;
      }

      void attachHls(audio, hlsUrl, {
        isCurrent: () => loadTokenRef.current === token,
        onFatal: () => {
          if (loadTokenRef.current !== token || fallbackStarted) return;
          const from = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
          loadProgressive(from);
        },
      })
        .then((handle) => {
          if (fallbackStarted || loadTokenRef.current !== token) {
            handle?.destroy();
            return;
          }
          if (!handle) {
            loadProgressive(at);
            return;
          }
          hlsRef.current = handle;
          hlsModeRef.current = 'mse';
          armRestore();
          restore();
          playWith(audio, token);
          armHlsStartTimer(at);
        })
        .catch((error: unknown) => {
          if (fallbackStarted || loadTokenRef.current !== token) return;
          console.warn('HLS unavailable; using the progressive stream:', error);
          loadProgressive(at);
        });
    },
    [clearHlsStartTimer, clearReconnectRestore, destroyHls, playWith]
  );

  const play = useCallback((track: Track, list?: Track[]) => {
    if (list) { setPlaylist(list); playlistRef.current = list; }
    setCurrentTrack(track);
    currentTrackRef.current = track;

    // Record the listen once playback actually starts (see 'playing' handler).
    pendingListenRef.current = track.id;

    if (audioRef.current) {
      const audio = audioRef.current;
      clearReconnectRestore();
      destroyHls();
      const token = ++loadTokenRef.current;
      // A new source supersedes whatever went wrong with the last one.
      setPlaybackError(null);
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      startPlayback(audio, track, 0, token);
    }
  }, [initAudioContext, clearReconnectRestore, destroyHls, startPlayback]);

  // Synced in an effect rather than assigned during render, which would be a
  // ref write in the render phase. The `ended` listener reads it only after
  // mount, by which time this has run.
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const pause = useCallback(() => {
    // Pausing while buffering must cancel the watchdog, or it fires 12s later
    // and reports a network error for a pause the listener chose.
    clearStallWatchdog();
    audioRef.current?.pause();
    setIsPlaying(false);
  }, [clearStallWatchdog]);

  const resume = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      const startedSrc = audio.src;
      audio.play()
        .catch((err: unknown) => {
          setIsBuffering(false);
          // Same treatment as play(): the element's `error` event covers a
          // missing/unsupported source, so only autoplay blocks need reporting.
          if (err instanceof Error && ['NotSupportedError', 'AbortError', 'NotAllowedError'].includes(err.name)) return;
          if (audioRef.current?.src !== startedSrc) return;
          console.warn('Playback could not start:', err);
          setPlaybackError(classifyMediaError() ?? 'unknown');
        });
    }
  }, [initAudioContext, classifyMediaError]);

  /**
   * Re-requests the stream and picks up where it stopped.
   *
   * `resume()` cannot recover a stalled download: the element is still
   * holding the dead response, so `play()` resolves and no sound comes out —
   * the retry button appeared to do nothing. The source has to be requested
   * again, and the position restored by hand, because a fresh element starts
   * at zero.
   */
  const reconnect = useCallback(() => {
    const audio = audioRef.current;
    const track = currentTrackRef.current;
    if (!audio || !track) return;

    const at = audio.currentTime || 0;
    clearReconnectRestore();
    destroyHls();
    const token = ++loadTokenRef.current;

    clearStallWatchdog();
    setPlaybackError(null);
    setIsBuffering(false);
    startPlayback(audio, track, at, token);
  }, [clearStallWatchdog, clearReconnectRestore, destroyHls, startPlayback]);

  const close = useCallback(() => {
    clearStallWatchdog();
    clearReconnectRestore();
    // Invalidate any pending HLS import/load before tearing the source down.
    loadTokenRef.current += 1;
    destroyHls();
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // No metadata yet; removing the source below is enough.
      }
      audio.removeAttribute('src');
      audio.load();
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
  }, [clearStallWatchdog, clearReconnectRestore, destroyHls]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = time;
    } catch {
      return;
    }
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
    try {
      audio.currentTime = to;
    } catch {
      return;
    }
    animateProgressTo(from, to);
  }, [animateProgressTo, upperBound]);

  const skipBack = useCallback((seconds = 10) => {
    const audio = audioRef.current;
    if (!audio) return;
    const from = audio.currentTime;
    const to = Math.max(0, from - seconds);
    try {
      audio.currentTime = to;
    } catch {
      return;
    }
    animateProgressTo(from, to);
  }, [animateProgressTo]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.min(1, Math.max(0, vol));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {
      // Private mode / storage disabled: the in-memory volume still works.
    }
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
      play, pause, resume, reconnect, close, seek, startSeeking, endSeeking, setVolume, next, prev,
      skipForward, skipBack,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
