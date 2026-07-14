import { useEffect, useState } from 'react';
import { Users, Plus, AlertTriangle, CheckCircle2, Coffee, Clock, Play } from 'lucide-react';
import { Card } from './ui/Card.js';
import { Badge } from './ui/Badge.js';
import { AssignTaskModal } from './AssignTaskModal.js';
import { useAuth } from '../lib/auth.js';
import { roleLabel } from '../lib/roles.js';
import { watchMembers, type Member } from '../lib/members.js';
import { watchAllToday, presence, fmtActive, type Activity } from '../lib/activity.js';
import { watchAllTasks, isOverdue, elapsedMs, fmtDuration, type Task } from '../lib/tasks.js';

function fmtDue(ms: number): string {
  const d = new Date(ms);
  const sameDay = d.toDateString() === new Date().toDateString();
  const t = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return sameDay ? t : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${t}`;
}

/** Owner/manager dashboard section: everyone on the team, what they're doing,
 *  overdue alerts in red, and one-click task assignment. */
export function TeamMix() {
  const { member: me } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Record<string, Activity>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState(Date.now());
  const [assign, setAssign] = useState(false);

  useEffect(() => watchMembers((l) => setMembers(l.sort((a, b) => a.name.localeCompare(b.name)))), []);
  useEffect(() => watchAllToday((l) => setActivity(Object.fromEntries(l.map((a) => [a.uid, a])))), []);
  useEffect(() => watchAllTasks(setTasks), []);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);

  // Owner/manager see the whole team; a Team Leader sees only their POCs.
  const isAdmin = me?.role === 'owner' || me?.role === 'manager';
  const team = members.filter((m) => m.uid !== me?.uid && (isAdmin ? m.role !== 'owner' : m.leaderUid === me?.uid));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-white px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white"><Users size={18} /></div>
          <div>
            <div className="text-sm font-extrabold text-neutral-900">Team mix</div>
            <div className="text-[11px] text-neutral-500">Who's online, what they're on, and what's overdue</div>
          </div>
        </div>
        <button onClick={() => setAssign(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-primary-600">
          <Plus size={14} /> Assign task
        </button>
      </div>

      <div className="divide-y divide-neutral-100">
        {team.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-neutral-400">No team members yet — add them in Team &amp; Roles.</div>
        )}
        {team.map((m) => {
          const act = activity[m.uid] ?? null;
          const pres = presence(act);
          const mine = tasks.filter((t) => t.assigneeUid === m.uid);
          const open = mine.filter((t) => t.status !== 'done');
          const overdue = open.filter((t) => isOverdue(t, now));
          const doneToday = mine.filter((t) => t.status === 'done' && t.completedAtMs && new Date(t.completedAtMs).toDateString() === new Date().toDateString()).length;
          return (
            <div key={m.uid} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt={m.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-neutral-200" />
                    : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-extrabold text-primary-700">{m.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</div>}
                  <div>
                    <div className="text-sm font-bold text-neutral-900">{m.name} <span className="text-[11px] font-semibold text-neutral-400">· {roleLabel(m.role)}</span></div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <Badge tone={pres === 'active' ? 'success' : pres === 'break' ? 'warning' : 'neutral'}>{pres === 'break' ? <><Coffee size={10} /> On break</> : pres === 'active' ? 'Active now' : 'Offline'}</Badge>
                      {act && <span className="inline-flex items-center gap-1"><Clock size={10} /> {fmtActive(act.activeMs)} today</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {doneToday > 0 && <span className="inline-flex items-center gap-1 font-bold text-emerald-600"><CheckCircle2 size={12} /> {doneToday} done</span>}
                  <span className="text-neutral-400">{open.length} open</span>
                </div>
              </div>

              {/* Overdue — red */}
              {overdue.map((t) => (
                <div key={t.id} className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                  <AlertTriangle size={13} /> Overdue: {t.title} <span className="font-semibold text-rose-500">· was due {t.dueAtMs ? fmtDue(t.dueAtMs) : ''}</span>
                </div>
              ))}
              {/* Other open tasks */}
              {open.filter((t) => !isOverdue(t, now)).map((t) => (
                <div key={t.id} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs ring-1 ring-inset ring-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-700">
                    {t.startedAtMs && <Play size={11} className="text-emerald-500" />}
                    <span className="font-semibold text-neutral-900">{t.title}</span>
                    {t.dueAtMs && <span className="text-neutral-400">· due {fmtDue(t.dueAtMs)}</span>}
                  </div>
                  <span className="font-mono font-bold tabular-nums text-neutral-500">{fmtDuration(elapsedMs(t, now))}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {assign && me && <AssignTaskModal members={team} createdBy={`${me.name} · ${roleLabel(me.role)}`} onClose={() => setAssign(false)} />}
    </Card>
  );
}
