/**
 * Employee activity log — the client's page 1 ask: "login/logout, working hours,
 * break times, status, filters, and export."
 *
 * Presence is tracked per member per day (lib/activity): first-seen is the
 * login, last-seen the logout / last active, active time the working hours, and
 * break time is derived (span present minus active). Pick any date; filter by
 * name or status; export the day as a sheet. Leadership only — it's a
 * management view, gated the same way as the export.
 */
import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Search, Download, Clock, Coffee, LogIn, LogOut, Circle } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import {
  watchActivityByDate, todayKey, breakMs, presence, fmtClock, fmtActive, type Activity,
} from '../../lib/activity.js';
import { exportRows, type Cell } from '../../lib/exportExcel.js';
import { brandSlug } from '../../lib/brand.js';

const STATUS: Record<'active' | 'break' | 'offline', { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  break: { label: 'On break', tone: 'warning' },
  offline: { label: 'Offline', tone: 'neutral' },
};
type StatusKey = keyof typeof STATUS;

export function Activity() {
  const [date, setDate] = useState(todayKey());
  const [rows, setRows] = useState<Activity[]>([]);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState<'' | StatusKey>('');

  useEffect(() => watchActivityByDate(date, setRows), [date]);
  const isToday = date === todayKey();

  const shown = useMemo(() => rows
    // presence is a live "now" state, only meaningful for today; on a past day a
    // record just means they were seen, so status filtering applies to today.
    .map((a) => ({ a, status: (isToday ? presence(a) : 'offline') as StatusKey }))
    .filter(({ a, status }) => {
      if (statusF && isToday && status !== statusF) return false;
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((x, y) => y.a.activeMs - x.a.activeMs), [rows, q, statusF, isToday]);

  const totalActive = rows.reduce((s, a) => s + a.activeMs, 0);
  const onBreak = rows.filter((a) => a.onBreak).length;
  const activeNow = isToday ? rows.filter((a) => presence(a) === 'active').length : 0;

  function exportDay() {
    exportRows(`${brandSlug}-activity-${date}`,
      ['Employee', 'Date', 'Login', 'Last active', 'Working hours', 'Break', 'Status'],
      shown.map(({ a, status }): Cell[] => [
        a.name, a.date, fmtClock(a.firstAtMs), fmtClock(a.lastAtMs),
        fmtActive(a.activeMs), fmtActive(breakMs(a)), isToday ? STATUS[status].label : '—',
      ]));
  }

  return (
    <PartnerLayout title="Activity Log" subtitle="Employee login, working hours, breaks & status">
      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Team members seen" value={String(rows.length)} hint={isToday ? 'today' : date} tone="primary" icon={<LogIn size={14} />} />
          <KpiCard label="Active now" value={isToday ? String(activeNow) : '—'} hint={isToday ? 'online' : 'past date'} tone="success" icon={<Circle size={14} />} />
          <KpiCard label="On break" value={String(onBreak)} hint="right now" tone="accent" icon={<Coffee size={14} />} />
          <KpiCard label="Total working hours" value={fmtActive(totalActive)} hint="across the team" tone="neutral" icon={<Clock size={14} />} />
        </section>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 ring-1 ring-inset ring-neutral-200">
                <CalendarRange size={14} className="text-neutral-400" />
                <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())}
                  className="bg-transparent text-xs text-neutral-700 outline-none" aria-label="Activity date" />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5 ring-1 ring-inset ring-neutral-200">
                <Search size={13} className="text-neutral-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee" className="w-36 bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400" />
              </div>
              {isToday && (
                <div className="flex items-center gap-1">
                  {(['', 'active', 'break', 'offline'] as const).map((s) => (
                    <button key={s || 'all'} onClick={() => setStatusF(s)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${statusF === s ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                      {s === '' ? 'All' : STATUS[s].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button size="sm" variant="secondary" onClick={exportDay} disabled={shown.length === 0}><Download size={13} /> Export</Button>
          </div>

          <Table>
            <THead>
              <Tr>
                <Th>Employee</Th><Th>Login</Th><Th>Last active</Th>
                <Th className="text-right">Working hours</Th><Th className="text-right">Break</Th><Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {shown.map(({ a, status }) => (
                <Tr key={a.uid}>
                  <Td className="font-semibold text-neutral-900">{a.name || '—'}</Td>
                  <Td className="text-neutral-600"><span className="inline-flex items-center gap-1"><LogIn size={11} className="text-emerald-500" /> {fmtClock(a.firstAtMs)}</span></Td>
                  <Td className="text-neutral-600"><span className="inline-flex items-center gap-1"><LogOut size={11} className="text-neutral-400" /> {fmtClock(a.lastAtMs)}</span></Td>
                  <Td className="text-right font-bold text-neutral-900">{fmtActive(a.activeMs)}</Td>
                  <Td className="text-right text-neutral-500">{fmtActive(breakMs(a))}</Td>
                  <Td>{isToday ? <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge> : <span className="text-xs text-neutral-400">seen</span>}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          {shown.length === 0 && (
            <div className="py-10 text-center text-sm text-neutral-400">
              {rows.length === 0 ? `No activity recorded for ${isToday ? 'today' : date} yet.` : 'No employees match this filter.'}
            </div>
          )}
          <p className="px-5 py-3 text-[11px] text-neutral-400">
            Login is the first time seen; last active is the most recent. Break time is the day's span minus counted working time. The owner isn't tracked.
          </p>
        </Card>
      </div>
    </PartnerLayout>
  );
}
