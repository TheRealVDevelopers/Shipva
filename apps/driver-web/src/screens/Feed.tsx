import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Navigation, Gavel, Radio, ArrowLeftRight, Power, Loader2, Check, X,
} from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { EmptyArt } from '../components/art.js';
import { useStore, type Job } from '../lib/store.js';
import { rupees } from '../lib/format.js';

const TABS = [
  { key: 'instant', label: 'Instant', icon: Radio },
  { key: 'auction', label: 'Auctions', icon: Gavel },
  { key: 'backhaul', label: 'Backhaul', icon: ArrowLeftRight },
] as const;

export function Feed() {
  const navigate = useNavigate();
  const { online, setOnline, feed, active, accept } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('instant');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const jobs = feed.filter((j) => j.kind === tab && !dismissed.has(j.id));

  function onAccept(id: string) {
    accept(id);
    navigate('/active');
  }

  return (
    <Frame
      title="Nearby jobs"
      nav
      headerRight={
        <button
          onClick={() => setOnline(!online)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}
        >
          <Power size={12} /> {online ? 'Online' : 'Offline'}
        </button>
      }
    >
      <div className="p-4">
        {active && (
          <button onClick={() => navigate('/active')} className="mb-4 flex w-full items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white"><Navigation size={16} /></span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-neutral-900">Active job · {active.id}</div>
              <div className="text-xs text-neutral-500">{active.pickup} → {active.drop}</div>
            </div>
            <span className="text-xs font-medium text-primary-600">Open →</span>
          </button>
        )}

        <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-white p-1 ring-1 ring-neutral-200">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium ${tab === t.key ? 'bg-primary-500 text-white' : 'text-neutral-600'}`}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {!online ? (
          <Empty icon={<Power size={28} />} text="You're offline. Go online to see nearby jobs." />
        ) : jobs.length === 0 ? (
          <Empty icon={<EmptyArt className="h-20 w-20" />} text="No open jobs in this tab right now." />
        ) : (
          <div className="space-y-3">
            {jobs.map((j) =>
              j.kind === 'instant' ? (
                <InstantCard key={j.id} job={j} disabled={!!active} onAccept={() => onAccept(j.id)} onIgnore={() => setDismissed((s) => new Set(s).add(j.id))} />
              ) : j.kind === 'backhaul' ? (
                <BackhaulCard key={j.id} job={j} disabled={!!active} onClaim={() => onAccept(j.id)} />
              ) : (
                <AuctionCard key={j.id} job={j} disabled={!!active} />
              ),
            )}
          </div>
        )}
      </div>
    </Frame>
  );
}

function InstantCard({ job, disabled, onAccept, onIgnore }: { job: Job; disabled: boolean; onAccept: () => void; onIgnore: () => void }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-xs text-primary-700">{job.id}</div>
          <div className="text-xs text-neutral-500">{job.customer}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-neutral-900">{rupees(job.farePaise ?? 0)}</div>
          <div className="text-[11px] text-neutral-400 flex items-center justify-end gap-1"><Clock size={10} /> {job.minsAgo}m ago</div>
        </div>
      </div>
      <Route pickup={job.pickup} drop={job.drop} km={job.distanceKm} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={onIgnore} className="flex items-center justify-center gap-1 rounded-lg bg-neutral-100 py-2.5 text-sm font-medium text-neutral-600"><X size={14} /> Ignore</button>
        <button onClick={onAccept} disabled={disabled} className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
          <Check size={15} /> Accept
        </button>
      </div>
      {disabled && <p className="mt-2 text-center text-[11px] text-neutral-400">Finish your active job first.</p>}
    </div>
  );
}

function BackhaulCard({ job, disabled, onClaim }: { job: Job; disabled: boolean; onClaim: () => void }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700"><ArrowLeftRight size={10} /> return leg</span>
          <div className="mt-1 text-xs text-neutral-500">{job.company}</div>
        </div>
        <div className="text-lg font-bold text-neutral-900">{rupees(job.basePricePaise ?? 0)}</div>
      </div>
      <Route pickup={job.pickup} drop={job.drop} km={job.distanceKm} />
      <button onClick={onClaim} disabled={disabled} className="mt-3 w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Claim load</button>
    </div>
  );
}

function AuctionCard({ job, disabled }: { job: Job; disabled: boolean }) {
  const navigate = useNavigate();
  const { placeBid, win } = useStore();
  const floor = job.basePricePaise ?? 0;
  const [bid, setBid] = useState(Math.round((floor * 0.95) / 1000) * 1000);
  const [placed, setPlaced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function submit() {
    placeBid(job.id, bid);
    setPlaced(true);
    timer.current = setTimeout(() => { win(job.id); navigate('/active'); }, 4500);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-xs text-primary-700">{job.id}</div>
          <div className="text-xs text-neutral-500">{job.company}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-neutral-400">floor</div>
          <div className="text-base font-bold text-neutral-900">{rupees(floor)}</div>
        </div>
      </div>
      <Route pickup={job.pickup} drop={job.drop} km={job.distanceKm} />
      {placed ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-50 py-2.5 text-sm font-medium text-amber-700">
          <Loader2 size={15} className="animate-spin" /> Bid {rupees(bid)} placed · awaiting result
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-neutral-200 px-3 py-2">
            <span className="text-sm text-neutral-400">₹</span>
            <input type="number" value={Math.round(bid / 100)} onChange={(e) => setBid(Math.max(0, Number(e.target.value) * 100))} className="w-full text-sm font-semibold text-neutral-900 outline-none" />
          </div>
          <button onClick={submit} disabled={disabled} className="flex items-center gap-1 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            <Gavel size={14} /> Bid
          </button>
        </div>
      )}
    </div>
  );
}

function Route({ pickup, drop, km }: { pickup: string; drop: string; km: number }) {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-2 text-sm text-neutral-700"><MapPin size={13} className="text-emerald-600 shrink-0" /> {pickup}</div>
      <div className="flex items-center gap-2 text-sm text-neutral-700"><MapPin size={13} className="text-rose-600 shrink-0" /> {drop}</div>
      <div className="pl-5 text-[11px] text-neutral-400">{km} km</div>
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center text-sm text-neutral-500">
      <span className="mb-2 text-neutral-300">{icon}</span> {text}
    </div>
  );
}
