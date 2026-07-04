import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Truck, FileCheck2, UserCog, Users, FileText, Fuel, Wallet,
  HandCoins, BarChart3, TrendingUp, PackageSearch, Navigation, BadgeCheck, Building2, Settings as SettingsIcon,
  ShieldCheck, Bell, Menu, X,
} from 'lucide-react';
import { LogoMark } from '../art.js';
import { subscription } from '../../lib/mocks.js';

const NAV = [
  { to: '/p', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/p/trips', label: 'Trips', icon: ClipboardList },
  { to: '/p/fleet', label: 'My Fleet', icon: Truck },
  { to: '/p/documents', label: 'Documents', icon: FileCheck2 },
  { to: '/p/team', label: 'Team & Roles', icon: UserCog },
  { to: '/p/customers', label: 'Customers', icon: Users },
  { to: '/p/invoices', label: 'Invoices', icon: FileText },
  { to: '/p/expenses', label: 'Expenses & Fuel', icon: Fuel },
  { to: '/p/payables', label: 'Payables', icon: HandCoins },
  { to: '/p/payroll', label: 'Payroll', icon: Wallet },
  { to: '/p/earnings', label: 'Earnings', icon: TrendingUp },
  { to: '/p/reports', label: 'Reports', icon: BarChart3 },
  { to: '/p/loads', label: 'Load Board', icon: PackageSearch, soon: true },
  { to: '/p/jobs', label: 'Active Jobs', icon: Navigation, soon: true },
  { to: '/p/subscription', label: 'Subscription', icon: BadgeCheck },
  { to: '/p/profile', label: 'Profile', icon: Building2 },
  { to: '/p/settings', label: 'Settings', icon: SettingsIcon },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark className="h-8 w-8" />
        <div>
          <div className="text-sm font-extrabold leading-none">ShipVa</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-400">Partner</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end, soon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end ?? false}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-primary-200 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-accent-400" />}
                    <Icon size={17} /> <span className="flex-1">{label}</span>
                    {soon && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-primary-200">SOON</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="m-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white">{subscription.tier} plan</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Active</span>
        </div>
        <div className="mt-1.5 text-[11px] text-primary-200">{subscription.driversUsed}/{subscription.driverSlots} driver slots</div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent-400" style={{ width: `${(subscription.driversUsed / subscription.driverSlots) * 100}%` }} />
        </div>
        <NavLink to="/p/subscription" onClick={onNavigate} className="mt-2 block text-[11px] font-bold text-accent-300">Manage plan →</NavLink>
      </div>
    </>
  );
}

export function PartnerLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-primary-900 text-white">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="animate-fade absolute inset-y-0 left-0 flex w-64 flex-col bg-primary-900 text-white shadow-lift">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-primary-200 hover:bg-white/10" aria-label="Close menu"><X size={18} /></button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden" aria-label="Open menu"><Menu size={18} /></button>
            <div>
              <h1 className="text-base font-extrabold text-neutral-900 leading-tight">{title}</h1>
              {subtitle && <p className="hidden text-xs text-neutral-500 mt-0.5 sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <ShieldCheck size={12} /> Keep 100% · no commission
            </span>
            <button className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100" aria-label="Notifications">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-extrabold">KR</div>
              <div className="hidden sm:block">
                <div className="text-xs font-extrabold text-neutral-900 leading-none">Karnataka Roadlines</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Partner · Peenya corridor</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 animate-fade">{children}</main>
      </div>
    </div>
  );
}
