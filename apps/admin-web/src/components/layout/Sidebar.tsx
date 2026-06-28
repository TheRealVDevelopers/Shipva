import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Radio, Gavel, Users, Truck, Settings,
} from 'lucide-react';
import { LogoMark } from '../art.js';

const NAV = [
  { to: '/ops', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ops/bookings', label: 'Bookings', icon: Package },
  { to: '/ops/dispatch', label: 'Dispatch', icon: Radio },
  { to: '/ops/auctions', label: 'Auctions', icon: Gavel },
  { to: '/ops/drivers', label: 'Drivers', icon: Users },
  { to: '/ops/transporters', label: 'Exchange', icon: Truck },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-neutral-200 md:bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-100 px-5">
        <LogoMark className="h-8 w-8" />
        <div>
          <div className="text-sm font-semibold text-neutral-900 leading-none">Ground Network</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Admin & Dispatch</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end ?? false}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-neutral-100 px-3 py-3">
        <NavLink
          to="/ops/settings"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
