import { useEffect, useRef, useState } from 'react';
import { Send, Hash, Users, Plus } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Modal, Field, TextInput } from '../../components/ui/Modal.js';
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
  const { messages, channels, me, setMe, send, createGroup } = useChat();
  const { staff } = useStore();
  const [active, setActive] = useState('general');
  const [draft, setDraft] = useState('');
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const identities: Me[] = [{ id: 'owner', name: 'You (Owner)' }, ...staff.map((s) => ({ id: s.id, name: `${s.name} (${ROLE_LABEL[s.role] ?? s.role})` }))];
  const shown = messages.filter((m) => m.channel === active);
  const countIn = (id: string) => messages.filter((m) => m.channel === id).length;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [shown.length, active]);

  function submit(e: React.FormEvent) { e.preventDefault(); send(draft, active); setDraft(''); }
  function makeGroup() {
    if (!groupName.trim()) return;
    const ch = createGroup(groupName);
    setActive(ch.id); setGroupName(''); setGroupOpen(false);
  }

  const activeName = channels.find((c) => c.id === active)?.name ?? 'General';

  return (
    <PartnerLayout title="Team Chat" subtitle="Internal staff messaging by group">
      <Card className="flex h-[calc(100vh-8.5rem)] overflow-hidden">
        {/* groups sidebar */}
        <div className="hidden w-52 shrink-0 flex-col border-r border-neutral-100 bg-neutral-50/60 sm:flex">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-neutral-400">Groups</span>
            <button onClick={() => setGroupOpen(true)} className="rounded-md p-1 text-primary-600 hover:bg-primary-50" title="New group"><Plus size={15} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {channels.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-bold transition ${active === c.id ? 'bg-primary-500 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <Hash size={14} className={active === c.id ? 'text-white/80' : 'text-neutral-400'} />
                <span className="flex-1 truncate text-left">{c.name}</span>
                <span className={`text-[10px] font-bold ${active === c.id ? 'text-white/70' : 'text-neutral-400'}`}>{countIn(c.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* messages */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><Hash size={15} /></span>
              {activeName}
              <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-400"><Users size={12} /> {staff.length + 1}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* mobile group selector */}
              <select value={active} onChange={(e) => setActive(e.target.value)} className="rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-neutral-800 ring-1 ring-inset ring-neutral-200 outline-none sm:hidden">
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name} ({countIn(c.id)})</option>)}
              </select>
              <button onClick={() => setGroupOpen(true)} className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-50 sm:hidden" title="New group"><Plus size={16} /></button>
              <label className="hidden items-center gap-2 text-xs text-neutral-500 md:flex">
                Send as
                <select value={me.id} onChange={(e) => setMe(identities.find((i) => i.id === e.target.value)!)}
                  className="rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-neutral-800 ring-1 ring-inset ring-neutral-200 outline-none focus:ring-2 focus:ring-primary-400">
                  {identities.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50/60 px-5 py-4">
            {shown.length === 0 && <p className="pt-8 text-center text-sm text-neutral-400">No messages in {activeName} yet — say hello.</p>}
            {shown.map((m) => {
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

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${activeName}…`}
              className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900 outline-none ring-1 ring-inset ring-transparent focus:bg-white focus:ring-primary-300" />
            <button type="submit" disabled={!draft.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm transition hover:bg-primary-600 disabled:bg-neutral-300"><Send size={16} /></button>
          </form>
        </div>
      </Card>
      <p className="mt-2 text-center text-[11px] text-neutral-400">Groups &amp; messages sync live across open tabs and alert with a sound. Cross-device chat arrives with the backend.</p>

      <Modal open={groupOpen} onClose={() => setGroupOpen(false)} title="New group" subtitle="Create a chat group" onSubmit={makeGroup} submitLabel="Create group" submitDisabled={!groupName.trim()}>
        <Field label="Group name"><TextInput autoFocus value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Peenya night shift" /></Field>
      </Modal>
    </PartnerLayout>
  );
}
