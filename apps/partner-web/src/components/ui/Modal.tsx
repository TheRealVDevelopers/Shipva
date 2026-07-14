import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.js';
import { isoToLabel, labelToIso } from '../../lib/format.js';

export function Modal({
  open, onClose, title, subtitle, children, onSubmit, submitLabel = 'Save', submitDisabled, wide,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode;
  onSubmit?: () => void; submitLabel?: string; submitDisabled?: boolean; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`animate-scale-in flex max-h-[92vh] w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} flex-col overflow-hidden rounded-t-2xl bg-white shadow-lift ring-1 ring-neutral-200 sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"><X size={18} /></button>
        </div>

        <form
          className="flex-1 overflow-y-auto px-5 py-4"
          onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
        >
          <div className="space-y-3.5">{children}</div>
          <div className="mt-6 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={submitDisabled}>{submitLabel}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** A labelled form field. `required` marks it with a red asterisk; `error`
 *  shows the validation message in place of the hint. */
export function Field({ label, children, hint, required, error }: {
  label: string; children: ReactNode;
  hint?: string | undefined; required?: boolean | undefined; error?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-neutral-700">
        {label}{required && <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error
        ? <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>
        : hint && <p className="mt-1 text-[11px] text-neutral-400">{hint}</p>}
    </label>
  );
}

const inputCls = 'w-full rounded-lg bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-inset ring-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-400';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

/** Native calendar picker that reads & writes a readable label ("01 Jul 2026"),
 *  so stored dates stay human-readable in documents and exports. */
export function DateInput({ value, onChange, ...rest }: {
  value: string; onChange: (label: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <input
      {...rest}
      type="date"
      value={labelToIso(value)}
      onChange={(e) => onChange(isoToLabel(e.target.value))}
      className={`${inputCls} ${rest.className ?? ''}`}
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`}>{children}</select>;
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
