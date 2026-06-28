import { Bell, Search, Radio } from 'lucide-react';

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6">
      <div>
        <h1 className="text-base font-bold text-neutral-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-neutral-50 ring-1 ring-inset ring-neutral-200 px-3 py-1.5 text-sm w-72 focus-within:ring-primary-400">
          <Search size={14} className="text-neutral-400" />
          <input
            type="search"
            placeholder="Search bookings, drivers, transporters…"
            className="bg-transparent w-full outline-none placeholder:text-neutral-400 text-neutral-800"
          />
        </div>

        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <Radio size={12} /> 4 online
        </span>

        <button
          type="button"
          className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold">
            VK
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-neutral-900 leading-none">Vinay K.</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Dispatch admin · Bengaluru</div>
          </div>
        </div>
      </div>
    </header>
  );
}
