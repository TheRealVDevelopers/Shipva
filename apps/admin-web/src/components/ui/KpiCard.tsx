import { type ReactNode } from 'react';

export function KpiCard({
  label, value, hint, icon, tone = 'primary',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral';
}) {
  const toneRing = {
    primary: 'from-primary-50 to-white ring-primary-100',
    accent: 'from-orange-50 to-white ring-orange-100',
    success: 'from-emerald-50 to-white ring-emerald-100',
    danger: 'from-rose-50 to-white ring-rose-100',
    neutral: 'from-neutral-50 to-white ring-neutral-200',
  }[tone];
  const iconBg = {
    primary: 'bg-primary-500',
    accent: 'bg-orange-500',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    neutral: 'bg-neutral-500',
  }[tone];

  return (
    <div className={`rounded-lg bg-gradient-to-br ring-1 ring-inset shadow-sm p-4 ${toneRing}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-600">{label}</span>
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-md text-white ${iconBg}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold text-neutral-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}
