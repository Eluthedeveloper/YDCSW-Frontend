import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api, uploadUrl } from '../utils/api';
import { getFingerprint } from '../utils/fingerprint';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration: number;
  file_path: string;
  program_id: string;
  track_type?: string;
  program_cover?: string;
}

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
  play: (track: Track, list?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  startSeeking: () => void;
  endSeeking: () => void;
  setVolume: (vol: number) => void;
  next: () => void;
  prev: () => void;
  skipForward: (seconds?: number) => void;
  skipBack: (seconds?: number) => void;
  setPlaylist: (tracks: Track[]) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const isSeekingRef = useRef(false);
  const playlistRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const pendingListenRef = useRef<string | null>(null);
  const lastListenAtRef = useRef<{ [id: string]: number }>({});

  // Records a listen only when playback actually starts and at most once
  // per track per minute, so replays/repeated clicks don't inflate stats.
  const recordListenIfDue = (track: Track) => {
    const now = Date.now();
    const last = lastListenAtRef.current[track.id];
    if (last && now - last < 60_000) return;
    lastListenAtRef.current[track.id] = now;
    api.recordListen(track.id, getFingerprint()).catch(() => {});
  };

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
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
        const list = playlistRef.current;
        const current = currentTrackRef.current;
        const currentIndex = list.findIndex((t) => t.id === current?.id);
        if (currentIndex < list.length - 1) {
          play(list[currentIndex + 1], list);
        } else {
          setIsPlaying(false);
        }
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
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const play = useCallback((track: Track, list?: Track[]) => {
    if (list) { setPlaylist(list); playlistRef.current = list; }
    setCurrentTrack(track);
    currentTrackRef.current = track;

    // Record the listen once playback actually starts (see 'playing' handler).
    pendingListenRef.current = track.id;

    if (audioRef.current) {
      audioRef.current.src = uploadUrl(`tracks/${track.file_path}`);
      audioRef.current.load();
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [initAudioContext]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [initAudioContext]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    currentTrackRef.current = null;
    setPlaylist([]);
    playlistRef.current = [];
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setIsBuffering(false);
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

  const skipForward = useCallback((seconds = 10) => {
    if (audioRef.current) {
      const from = audioRef.current.currentTime;
      const to = Math.min(audioRef.current.duration || 0, from + seconds);
      audioRef.current.currentTime = to;
      const dur = to - from;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / 300);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setProgress(from + dur * ease);
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, []);

  const skipBack = useCallback((seconds = 10) => {
    if (audioRef.current) {
      const from = audioRef.current.currentTime;
      const to = Math.max(0, from - seconds);
      audioRef.current.currentTime = to;
      const dur = to - from;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / 300);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setProgress(from + dur * ease);
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const next = useCallback(() => {
    const list = playlistRef.current;
    const current = currentTrackRef.current;
    const currentIndex = list.findIndex((t) => t.id === current?.id);
    if (currentIndex < list.length - 1) {
      play(list[currentIndex + 1], list);
    }
  }, [play]);

  const prev = useCallback(() => {
    const list = playlistRef.current;
    const current = currentTrackRef.current;
    const currentIndex = list.findIndex((t) => t.id === current?.id);
    if (currentIndex > 0) {
      play(list[currentIndex - 1], list);
    }
  }, [play]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, playlist, isPlaying, isBuffering, volume, progress, duration, isSeeking,
      analyserNode: analyserRef.current,
      play, pause, resume, stop, close, seek, startSeeking, endSeeking, setVolume, next, prev, skipForward, skipBack, setPlaylist
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
