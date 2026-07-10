/**
 * Internal staff chat. Persists to localStorage and syncs live across open tabs
 * via BroadcastChannel. Incoming messages from another tab raise a notification.
 * (Cross-device chat needs the backend — Phase B.)
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNotify } from './notify.js';

export interface ChatMsg { id: string; tabId: string; authorId: string; author: string; text: string; ts: number }
export interface Me { id: string; name: string }

interface ChatApi { messages: ChatMsg[]; me: Me; setMe: (m: Me) => void; send: (text: string) => void }

const KEY = 'shipva-chat-v1';
const TAB = Math.random().toString(36).slice(2);

const seed: ChatMsg[] = [
  { id: 'm1', tabId: 'seed', authorId: 's1', author: 'Prakash (Manager)', text: 'Morning team — 3 loads to dispatch from Peenya today.', ts: Date.now() - 5400_000 },
  { id: 'm2', tabId: 'seed', authorId: 's2', author: 'Sunil (Supervisor)', text: 'Ramesh is on KA01C5521 for the Hosur steel load. LR raised.', ts: Date.now() - 5200_000 },
  { id: 'm3', tabId: 'seed', authorId: 's4', author: 'Lakshmi (Accounts)', text: 'Reminder sent to Leela Stores on the overdue invoice.', ts: Date.now() - 3600_000 },
];

function read(): ChatMsg[] {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return seed;
}

const Ctx = createContext<ChatApi | null>(null);
let seq = 0;

export function ChatProvider({ children }: { children: ReactNode }) {
  const { push } = useNotify();
  const [messages, setMessages] = useState<ChatMsg[]>(read);
  const [me, setMe] = useState<Me>({ id: 'owner', name: 'You (Owner)' });
  const chan = useRef<BroadcastChannel | null>(null);
  const lastTs = useRef<number>(messages.reduce((m, x) => Math.max(m, x.ts), 0));

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const c = new BroadcastChannel('shipva-chat');
    chan.current = c;
    c.onmessage = () => {
      const latest = read();
      const fresh = latest.filter((m) => m.ts > lastTs.current && m.tabId !== TAB);
      lastTs.current = latest.reduce((mx, x) => Math.max(mx, x.ts), lastTs.current);
      setMessages(latest);
      const last = fresh[fresh.length - 1];
      if (last) push({ title: `New message · ${last.author}`, body: last.text, tone: 'info' });
    };
    return () => c.close();
  }, [push]);

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    const msg: ChatMsg = { id: `c${Date.now().toString(36)}${seq++}`, tabId: TAB, authorId: me.id, author: me.name, text: t, ts: Date.now() };
    const next = [...read(), msg];
    try { localStorage.setItem(KEY, JSON.stringify(next.slice(-200))); } catch { /* quota */ }
    lastTs.current = msg.ts;
    setMessages(next);
    chan.current?.postMessage('sync');
  }, [me]);

  const value = useMemo<ChatApi>(() => ({ messages, me, setMe, send }), [messages, me, send]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat(): ChatApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useChat must be used within ChatProvider');
  return v;
}
