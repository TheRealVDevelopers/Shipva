import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutList, Wallet, User } from 'lucide-react';

export function Frame({
  children, title, back, nav, headerRight,
}: {
  children: ReactNode; title?: string; back?: boolean; nav?: boolean; headerRight?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-200/60 flex justify-center">
      <div className="relative flex w-full max-w-md flex-col bg-neutral-50 min-h-screen shadow-xl">
        {title && (
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4">
            {back && (
              <button onClick={() => navigate(-1)} className="rounded-md p-1.5 -ml-1.5 text-neutral-600 hover:bg-neutral-100" aria-label="Back">
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 className="flex-1 text-base font-semibold text-neutral-900">{title}</h1>
            {headerRight}
          </header>
        )}
        <main className={`flex-1 ${nav ? 'pb-20' : ''}`}>{children}</main>
        {nav && (
          <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-neutral-200 bg-white py-2">
            <Tab to="/feed" icon={<LayoutList size={20} />} label="Jobs" />
            <Tab to="/earnings" icon={<Wallet size={20} />} label="Earnings" />
            <Tab to="/profile" icon={<User size={20} />} label="Profile" />
          </nav>
        )}
      </div>
    </div>
  );
}

function Tab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) =>
      `flex flex-col items-center gap-0.5 px-6 py-1 text-[11px] font-medium ${isActive ? 'text-primary-600' : 'text-neutral-400'}`}>
      {icon}
      {label}
    </NavLink>
  );
}
