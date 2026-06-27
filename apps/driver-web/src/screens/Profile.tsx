import { useNavigate } from 'react-router-dom';
import { Star, Truck, ShieldCheck, FileText, Power, LogOut, ChevronRight } from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { useStore } from '../lib/store.js';
import { DRIVER } from '../lib/mocks.js';

export function Profile() {
  const navigate = useNavigate();
  const { online, setOnline } = useStore();

  return (
    <Frame title="Profile" nav>
      <div className="space-y-5 p-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
              {DRIVER.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-neutral-900">{DRIVER.name}</div>
              <div className="text-sm text-neutral-500">{DRIVER.phone}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-semibold text-neutral-900"><Star size={13} className="fill-amber-400 text-amber-400" /> {DRIVER.ratingAvg}</div>
              <div className="text-[11px] text-neutral-400">{DRIVER.ratingCount} trips</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-800"><Power size={16} className={online ? 'text-emerald-500' : 'text-neutral-400'} /> Duty status</span>
          <button onClick={() => setOnline(!online)} className={`relative h-6 w-11 rounded-full transition-colors ${online ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${online ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <Item icon={<Truck size={16} className="text-neutral-500" />} label="Vehicle" value={`${DRIVER.vehicleReg} · mini truck`} />
          <Item icon={<ShieldCheck size={16} className="text-emerald-500" />} label="KYC" value="Verified" valueCls="text-emerald-600" />
          <Item icon={<FileText size={16} className="text-neutral-500" />} label="Documents" value="RC · DL · Insurance" />
        </div>

        <button onClick={() => navigate('/')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-rose-600">
          <LogOut size={15} /> Sign out
        </button>
        <p className="text-center text-[11px] text-neutral-400">Ground Network · driver preview</p>
      </div>
    </Frame>
  );
}

function Item({ icon, label, value, valueCls = 'text-neutral-700' }: { icon: React.ReactNode; label: string; value: string; valueCls?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-0">
      {icon}
      <span className="text-sm text-neutral-600">{label}</span>
      <span className={`ml-auto text-sm font-medium ${valueCls}`}>{value}</span>
      <ChevronRight size={15} className="text-neutral-300" />
    </div>
  );
}
