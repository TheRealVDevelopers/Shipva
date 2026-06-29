import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const STYLES: Record<Variant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-neutral-300',
  secondary:
    'bg-white text-neutral-800 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50',
  ghost:
    'text-neutral-700 hover:bg-neutral-100',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
  children: ReactNode;
}) {
  const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors ${padding} ${STYLES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
