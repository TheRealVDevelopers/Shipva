import { Clock, AlertTriangle } from 'lucide-react';
import {
  shiftElapsedMs, shiftProgress, isOvertime, fmtShiftClock, fmtShiftRemaining,
  SHIFT_TARGET_MS, type Activity,
} from '../lib/activity.js';

/**
 * The 9-hour shift clock, live on the dashboard.
 *
 * `size="lg"` is the personal one on MyDayStrip -- big digits, a progress
 * bar, "left" / "over" underneath. `size="sm"` is the compact one dropped
 * into a team roster row (TeamMix), where a dozen of these render at once.
 *
 * Renders nothing before a shift has actually started (no heartbeat yet
 * today) rather than showing a misleading 0:00:00 running clock.
 */
export function ShiftTimer({ activity, nowMs, size = 'lg' }: {
  activity: Activity | null;
  nowMs: number;
  size?: 'lg' | 'sm';
}) {
  if (!activity?.firstAtMs) return null;
  const elapsed = shiftElapsedMs(activity, nowMs);
  const over = isOvertime(elapsed);
  const pct = Math.round(shiftProgress(elapsed) * 100);

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1.5" title={`Shift started ${new Date(activity.firstAtMs).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`}>
        <span className={`font-mono text-xs font-extrabold tabular-nums ${over ? 'text-rose-600' : 'text-neutral-700'}`}>
          {fmtShiftClock(elapsed)}
        </span>
        <span className="text-[10px] text-neutral-400">/ 9h</span>
        {over && <AlertTriangle size={11} className="text-rose-500" />}
        <span className="h-1 w-12 overflow-hidden rounded-full bg-neutral-100">
          <span className={`block h-full rounded-full ${over ? 'bg-rose-500' : pct > 88 ? 'bg-amber-500' : 'bg-primary-500'}`} style={{ width: `${Math.max(4, pct)}%` }} />
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/70 px-4 py-3 ring-1 ring-inset ring-primary-100">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
        <Clock size={11} /> Shift clock
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`font-mono text-2xl font-extrabold tabular-nums ${over ? 'text-rose-600' : 'text-neutral-900'}`}>
          {fmtShiftClock(elapsed)}
        </span>
        <span className="text-xs font-semibold text-neutral-400">/ 9:00:00</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <span
          className={`block h-full rounded-full transition-all ${over ? 'bg-rose-500' : pct > 88 ? 'bg-amber-500' : 'bg-primary-500'}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <div className={`mt-1 text-[11px] font-bold ${over ? 'text-rose-600' : pct > 88 ? 'text-amber-600' : 'text-neutral-500'}`}>
        {over && <AlertTriangle size={11} className="mr-1 inline -mt-0.5" />}
        {fmtShiftRemaining(elapsed)}
      </div>
    </div>
  );
}

export { SHIFT_TARGET_MS };
