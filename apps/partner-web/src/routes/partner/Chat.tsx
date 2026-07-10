import { useEffect, useRef, useState } from 'react';
import { Send, Hash, Users } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { useChat, type Me } from '../../lib/chat.js';
import { useStore } from '../../lib/store.js';

const ROLE_LABEL: Record<string, string> = { manager: 'Manager', supervisor: 'Supervisor', accountant: 'Accounts' };

function initials(name: string) {
  return name.replace(/\(.*\)/, '').trim().split(' ').map((n) => n[0]).slice(0, 2).join('');
}
function timeOf(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function Chat() {
  const { messages, me, setMe, send } = useChat();
  const { staff } = useStore();
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const identities: Me[] = [{ id: 'owner', name: 'You (Owner)' }, ...staff.map((s) => ({ id: s.id, name: `${s.name} (${ROLE_LABEL[s.role] ?? s.role})` }))];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    send(draft);
    setDraft('');
  }

  return (
    <PartnerLayout title="Team Chat" subtitle="Internal staff messaging">
      <Card className="flex h-[calc(100vh-8.5rem)] flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><Hash size={15} /></span>
            general
            <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-400"><Users size={12} /> {staff.length + 1}</span>
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            Send as
            <select
              value={me.id}
              onChange={(e) => setMe(identities.find((i) => i.id === e.target.value)!)}
              className="rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-neutral-800 ring-1 ring-inset ring-neutral-200 outline-none focus:ring-2 focus:ring-primary-400"
            >
              {identities.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
        </div>

        {/* messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50/60 px-5 py-4">
          {messages.map((m) => {
            const mine = m.authorId === me.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">{initials(m.author)}</span>
                <div className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? 'rounded-br-sm bg-primary-500 text-white' : 'rounded-bl-sm bg-white text-neutral-800 ring-1 ring-inset ring-neutral-200'}`}>
                  {!mine && <div className="mb-0.5 text-[11px] font-bold text-primary-600">{m.author}</div>}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className={`mt-0.5 text-right text-[10px] ${mine ? 'text-primary-100' : 'text-neutral-400'}`}>{timeOf(m.ts)}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* composer */}
        <form onSubmit={submit} className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message as ${me.name}…`}
            className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900 outline-none ring-1 ring-inset ring-transparent focus:bg-white focus:ring-primary-300"
          />
          <button type="submit" disabled={!draft.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm transition hover:bg-primary-600 disabled:bg-neutral-300">
            <Send size={16} />
          </button>
        </form>
      </Card>
      <p className="mt-2 text-center text-[11px] text-neutral-400">Messages sync live across open tabs and alert with a sound. Cross-device chat arrives with the backend.</p>
    </PartnerLayout>
  );
}
