import { Bell, Search } from 'lucide-react';

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-neutral-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-md bg-neutral-50 ring-1 ring-inset ring-neutral-200 px-3 py-1.5 text-sm w-72">
          <Search size={14} className="text-neutral-400" />
          <input
            type="search"
            placeholder="Search orders, drivers, AWB…"
            className="bg-transparent w-full outline-none placeholder:text-neutral-400 text-neutral-800"
          />
        </div>

        <button
          type="button"
          className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-semibold">
            VK
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-neutral-900 leading-none">Vinay K.</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Ops Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}
