import { Wallet, Zap, TrendingUp, Radio, Gavel } from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { useStore } from '../lib/store.js';
import { rupees } from '../lib/format.js';

export function Earnings() {
  const { completed } = useStore();
  const total = completed.reduce((s, j) => s + (j.payoutPaise ?? 0), 0);

  return (
    <Frame title="Earnings" nav>
      <div className="space-y-5 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white">
          <div className="flex items-center gap-1.5 text-xs text-primary-100"><Wallet size={13} /> Earned today</div>
          <div className="mt-1 text-3xl font-bold">{rupees(total)}</div>
          <div className="mt-1 text-xs text-primary-100">{completed.length} trips completed</div>
          <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs">
            <Zap size={13} className="text-orange-300" /> Same-day payout — settles to your account tonight
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<TrendingUp size={15} />} label="Acceptance" value="96%" />
          <Stat icon={<Wallet size={15} />} label="This week" value={rupees(total + 412000)} />
        </div>

        <div>
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent trips</div>
          <div className="space-y-2">
            {completed.map((j) => (
              <div key={j.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${j.kind === 'auction' ? 'bg-orange-50 text-orange-600' : 'bg-primary-50 text-primary-600'}`}>
                  {j.kind === 'auction' ? <Gavel size={16} /> : <Radio size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-neutral-500">{j.id}</div>
                  <div className="truncate text-sm font-medium text-neutral-900">{j.pickup} → {j.drop}</div>
                </div>
                <div className="text-sm font-semibold text-emerald-700">+{rupees(j.payoutPaise ?? 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">{icon} {label}</div>
      <div className="mt-1 text-lg font-bold text-neutral-900">{value}</div>
    </div>
  );
}
