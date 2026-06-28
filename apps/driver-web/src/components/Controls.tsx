import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { VEHICLE_TYPES, type VehicleType } from '@ground/shared-types';
import { VehicleArt } from './art.js';

export function PrimaryButton({ children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-600 active:scale-[.98] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function VehiclePicker({ value, onChange }: { value: VehicleType; onChange: (v: VehicleType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {VEHICLE_TYPES.map((v) => {
        const active = v.type === value;
        return (
          <button
            key={v.type}
            onClick={() => onChange(v.type)}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
              active ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 shadow-soft' : 'border-neutral-200 bg-white hover:border-primary-300'
            }`}
          >
            <VehicleArt type={v.type} className="h-8 w-12 shrink-0" />
            <div>
              <div className={`text-sm font-bold ${active ? 'text-primary-700' : 'text-neutral-800'}`}>{v.label}</div>
              <div className="text-[11px] text-neutral-500">up to {v.capacityKg} kg</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ label, value, onChange, min = 1, step = 1, unit }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <span className="text-sm text-neutral-700">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - step))} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200" aria-label="Decrease">
          <Minus size={14} />
        </button>
        <span className="w-16 text-center text-sm font-semibold text-neutral-900">{value}{unit ? ` ${unit}` : ''}</span>
        <button onClick={() => onChange(value + step)} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200" aria-label="Increase">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
