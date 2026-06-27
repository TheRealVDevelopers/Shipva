import { useNavigate } from 'react-router-dom';
import { MapPin, Gift, LogOut, ChevronRight, Phone, Home as HomeIcon } from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { SAVED_ADDRESSES } from '../lib/mocks.js';

export function Profile() {
  const navigate = useNavigate();
  return (
    <Frame title="Profile" nav>
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">AR</div>
          <div>
            <div className="text-base font-semibold text-neutral-900">Anita Rao</div>
            <div className="flex items-center gap-1 text-sm text-neutral-500"><Phone size={12} /> +91 98860 41200</div>
          </div>
        </div>

        <div>
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Saved addresses</div>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {SAVED_ADDRESSES.map((a, i) => (
              <div key={a.label} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-neutral-100' : ''}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                  {a.label === 'Home' ? <HomeIcon size={15} /> : <MapPin size={15} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900">{a.label}</div>
                  <div className="truncate text-xs text-neutral-500">{a.line}</div>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600"><Gift size={18} /></span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-neutral-900">Refer & earn</div>
            <div className="text-xs text-neutral-500">Share code <span className="font-mono font-semibold text-orange-700">ANITA50</span> — reward on their first trip</div>
          </div>
        </div>

        <button onClick={() => navigate('/')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-rose-600">
          <LogOut size={15} /> Sign out
        </button>

        <p className="text-center text-[11px] text-neutral-400">Ground Network · preview build</p>
      </div>
    </Frame>
  );
}
