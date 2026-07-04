/**
 * Lightweight, dependency-free chart primitives (inline SVG).
 * Colors are passed as CSS values (hex or var()). All charts are responsive:
 * they fill their container width and scale by viewBox.
 */

const PRIMARY = 'var(--sx-primary-500)';
const GRID = 'var(--sx-neutral-200)';

/* ------------------------------- Sparkline ------------------------------- */

export function Sparkline({
  data, color = PRIMARY, fill = true, className = '',
}: { data: number[]; color?: string; fill?: boolean; className?: string }) {
  const w = 100, h = 34;
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i): [number, number] => [
    (i / (data.length - 1)) * w,
    h - 3 - ((v - min) / rng) * (h - 6),
  ]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const id = `sl-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* --------------------------- Dual-series bars ---------------------------- */

export function BarPairChart({
  labels, a, b, aColor = PRIMARY, aLabel, bColor = 'var(--sx-accent-500)', bLabel,
  height = 190, format = (n: number) => String(n),
}: {
  labels: string[]; a: number[]; b: number[];
  aColor?: string; aLabel?: string; bColor?: string; bLabel?: string;
  height?: number; format?: (n: number) => string;
}) {
  const max = Math.max(...a, ...b, 1);
  const W = 320, H = 150, pad = 6;
  const groups = labels.length;
  const gw = (W - pad * 2) / groups;
  const bw = Math.min(14, gw / 3.2);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" height={height} preserveAspectRatio="none" role="img">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={H - f * H} y2={H - f * H} stroke={GRID} strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        ))}
        {labels.map((lb, i) => {
          const gx = pad + i * gw + gw / 2;
          const ah = (a[i]! / max) * (H - 6);
          const bh = (b[i]! / max) * (H - 6);
          return (
            <g key={lb}>
              <rect x={gx - bw - 1} y={H - ah} width={bw} height={ah} rx="2" fill={aColor}>
                <title>{`${lb} · ${aLabel ?? 'A'}: ${format(a[i]!)}`}</title>
              </rect>
              <rect x={gx + 1} y={H - bh} width={bw} height={bh} rx="2" fill={bColor}>
                <title>{`${lb} · ${bLabel ?? 'B'}: ${format(b[i]!)}`}</title>
              </rect>
              <text x={gx} y={H + 13} textAnchor="middle" fontSize="9" fill="var(--sx-neutral-400)">{lb}</text>
            </g>
          );
        })}
      </svg>
      {(aLabel || bLabel) && (
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-neutral-500">
          {aLabel && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: aColor }} /> {aLabel}</span>}
          {bLabel && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: bColor }} /> {bLabel}</span>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Donut chart ------------------------------ */

export function Donut({
  segments, size = 150, thickness = 20, centerMain, centerSub,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number; thickness?: number; centerMain?: string; centerSub?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sx-neutral-100)" strokeWidth={thickness} />
          {segments.map((s) => {
            const len = (s.value / total) * circ;
            const el = (
              <circle
                key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} strokeLinecap="butt"
              ><title>{`${s.label}: ${Math.round((s.value / total) * 100)}%`}</title></circle>
            );
            offset += len;
            return el;
          })}
        </g>
        {centerMain && <text x="50%" y="47%" textAnchor="middle" fontSize="17" fontWeight="800" fill="var(--sx-neutral-900)">{centerMain}</text>}
        {centerSub && <text x="50%" y="62%" textAnchor="middle" fontSize="9" fill="var(--sx-neutral-500)">{centerSub}</text>}
      </svg>
      <ul className="space-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-neutral-600">{s.label}</span>
            <span className="ml-auto font-bold text-neutral-800">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Radial gauge ----------------------------- */

export function RadialGauge({
  value, max = 100, color = PRIMARY, size = 132, thickness = 12, label, sub,
}: {
  value: number; max?: number; color?: string; size?: number; thickness?: number; label?: string; sub?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sx-neutral-100)" strokeWidth={thickness} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
            strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-neutral-900">{label ?? `${Math.round(pct * 100)}%`}</span>
        {sub && <span className="text-[10px] text-neutral-500">{sub}</span>}
      </div>
    </div>
  );
}

/* --------------------------- Horizontal bars ----------------------------- */

export function HBar({ value, max, color = PRIMARY }: { value: number; max: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
