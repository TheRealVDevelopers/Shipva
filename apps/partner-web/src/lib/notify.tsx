/**
 * In-app notifications with sound. Persists to localStorage; plays a short
 * Web-Audio chime on each new alert (no audio asset needed).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface Note { id: string; title: string; body: string; ts: number; read: boolean; tone: 'info' | 'success' | 'warning' }

interface NotifyApi {
  notes: Note[];
  unread: number;
  soundOn: boolean;
  toggleSound: () => void;
  push: (n: { title: string; body: string; tone?: Note['tone']; silent?: boolean }) => void;
  markAllRead: () => void;
  clear: () => void;
}

const KEY = 'shipva-notes-v1';
const SOUND_KEY = 'shipva-sound-v1';

const seed: Note[] = [
  { id: 'n1', title: 'Document expiring', body: 'KA05K2245 insurance expires in 4 days.', ts: Date.now() - 3600_000, read: false, tone: 'warning' },
  { id: 'n2', title: 'Payment received', body: 'FreshCo Dairy paid ₹31,152 against INV-1038.', ts: Date.now() - 7200_000, read: false, tone: 'success' },
  { id: 'n3', title: 'Trip closed', body: 'LR-24805 delivered — POD captured.', ts: Date.now() - 10800_000, read: true, tone: 'info' },
];

const Ctx = createContext<NotifyApi | null>(null);
let seq = 0;

function chime(ctx: AudioContext) {
  const now = ctx.currentTime;
  [880, 1320].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(g); g.connect(ctx.destination);
    const t = now + i * 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.start(t); o.stop(t + 0.24);
  });
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch { /* ignore */ }
    return seed;
  });
  const [soundOn, setSoundOn] = useState<boolean>(() => localStorage.getItem(SOUND_KEY) !== '0');
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(notes.slice(0, 40))); } catch { /* quota */ } }, [notes]);
  useEffect(() => { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); }, [soundOn]);

  const play = useCallback(() => {
    if (!soundOn) return;
    try {
      audio.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (audio.current.state === 'suspended') void audio.current.resume();
      chime(audio.current);
    } catch { /* autoplay blocked until first interaction */ }
  }, [soundOn]);

  const push = useCallback<NotifyApi['push']>(({ title, body, tone = 'info', silent }) => {
    setNotes((p) => [{ id: `n${Date.now().toString(36)}${seq++}`, title, body, tone, ts: Date.now(), read: false }, ...p]);
    if (!silent) play();
  }, [play]);

  const markAllRead = useCallback(() => setNotes((p) => p.map((n) => ({ ...n, read: true }))), []);
  const clear = useCallback(() => setNotes([]), []);
  const toggleSound = useCallback(() => setSoundOn((s) => !s), []);

  const unread = notes.filter((n) => !n.read).length;
  const value = useMemo<NotifyApi>(() => ({ notes, unread, soundOn, toggleSound, push, markAllRead, clear }),
    [notes, unread, soundOn, toggleSound, push, markAllRead, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotify(): NotifyApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNotify must be used within NotificationsProvider');
  return v;
}
