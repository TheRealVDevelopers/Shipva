import { type ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Sparkline } from './Charts.js';

type Tone = 'primary' | 'accent' | 'success' | 'danger' | 'info' | 'violet';

const TONE: Record<Tone, { ring: string; icon: string; spark: string }> = {
  primary: { ring: 'ring-primary-100', icon: 'bg-primary-500', spark: 'var(--sx-primary-500)' },
  accent: { ring: 'ring-orange-100', icon: 'bg-orange-500', spark: 'var(--sx-accent-500)' },
  success: { ring: 'ring-emerald-100', icon: 'bg-emerald-500', spark: '#10b981' },
  danger: { ring: 'ring-rose-100', icon: 'bg-rose-500', spark: '#f43f5e' },
  info: { ring: 'ring-sky-100', icon: 'bg-sky-500', spark: '#0ea5e9' },
  violet: { ring: 'ring-violet-100', icon: 'bg-violet-500', spark: '#8b5cf6' },
};

export function StatCard({
  label, value, icon, tone = 'primary', deltaPct, hint, spark,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: Tone;
  deltaPct?: number;
  hint?: string;
  spark?: number[];
}) {
  const t = TONE[tone];
  const up = (deltaPct ?? 0) >= 0;
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ${t.ring}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-neutral-500">{label}</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-neutral-900">{value}</div>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${t.icon}`}>{icon}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          {deltaPct !== undefined && (
            <span className={`inline-flex items-center gap-0.5 font-bold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
              {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(deltaPct)}%
            </span>
          )}
          {hint && <span className="text-neutral-400">{hint}</span>}
        </div>
        {spark && <div className="h-8 w-20 shrink-0"><Sparkline data={spark} color={t.spark} /></div>}
      </div>
    </div>
  );
}
