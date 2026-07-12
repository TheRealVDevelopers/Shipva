import { useEffect, useState } from 'react';
import { Play, Pause, Check, Coffee, ListTodo, CheckCircle2, Clock } from 'lucide-react';
import { Card } from './ui/Card.js';
import { Badge } from './ui/Badge.js';
import { useAuth } from '../lib/auth.js';
import {
  watchTasksFor, startTask, pauseTask, completeTask, elapsedMs, fmtDuration, type Task,
} from '../lib/tasks.js';
import {
  watchActivity, setBreak, presence, fmtClock, fmtActive, type Activity,
} from '../lib/activity.js';

/** The signed-in member's tasks + break control, shown at the top of Overview. */
export function MyDayStrip() {
  const { member } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { if (member) return watchTasksFor(member.uid, setTasks); }, [member?.uid]);
  useEffect(() => { if (member) return watchActivity(member.uid, setActivity); }, [member?.uid]);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);

  if (!member) return null;
  const open = tasks.filter((t) => t.status !== 'done');
  const doneToday = tasks.filter((t) => t.status === 'done').length;
  const pres = presence(activity);
  const onBreak = activity?.onBreak ?? false;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-white px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white"><ListTodo size={18} /></div>
          <div>
            <div className="text-sm font-extrabold text-neutral-900">Your day, {member.name.split(' ')[0]}</div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <Badge tone={pres === 'active' ? 'success' : pres === 'break' ? 'warning' : 'neutral'}>
                {pres === 'active' ? 'Active now' : pres === 'break' ? 'On break' : 'Idle'}
              </Badge>
              <span className="inline-flex items-center gap-1"><Clock size={11} /> {activity ? `${fmtClock(activity.firstAtMs)} → ${onBreak ? 'break' : 'now'}` : 'starting…'}</span>
              <span>· {fmtActive(activity?.activeMs ?? 0)} active</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => void setBreak(member.uid, member.name, !onBreak)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold ring-1 ring-inset transition ${onBreak ? 'bg-emerald-500 text-white ring-emerald-500 hover:bg-emerald-600' : 'bg-white text-amber-700 ring-amber-200 hover:bg-amber-50'}`}>
          <Coffee size={14} /> {onBreak ? 'Resume work' : 'Take a break'}
        </button>
      </div>

      <div className="p-3">
        {open.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-4 text-sm text-neutral-400">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {doneToday > 0 ? `All caught up — ${doneToday} task${doneToday > 1 ? 's' : ''} done today.` : 'No tasks assigned to you right now.'}
          </div>
        ) : (
          <div className="space-y-2">
            {open.map((t) => {
              const running = !!t.startedAtMs;
              return (
                <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 px-3.5 py-2.5 ring-1 ring-inset ring-neutral-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                      {t.title}
                      {running && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    {t.note && <div className="truncate text-[11px] text-neutral-500">{t.note}</div>}
                    <div className="mt-0.5 text-[10px] text-neutral-400">assigned by {t.createdBy}</div>
                  </div>
                  <div className="font-mono text-sm font-extrabold tabular-nums text-neutral-800">{fmtDuration(elapsedMs(t, now))}</div>
                  <div className="flex items-center gap-1.5">
                    {running
                      ? <button onClick={() => void pauseTask(t)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-50"><Pause size={12} /> Pause</button>
                      : <button onClick={() => void startTask(t)} className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-primary-600"><Play size={12} /> {t.accumulatedMs > 0 ? 'Resume' : 'Start'}</button>}
                    <button onClick={() => void completeTask(t)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50"><Check size={12} /> Done</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
