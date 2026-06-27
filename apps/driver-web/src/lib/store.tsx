import { createContext, useContext, useState, type ReactNode } from 'react';
import type { VehicleType } from '@ground/shared-types';

export type JobKind = 'instant' | 'auction' | 'backhaul';
export type JobStatus = 'open' | 'assigned' | 'arrived' | 'picked_up' | 'in_transit' | 'delivered';

export interface Job {
  id: string;
  kind: JobKind;
  vehicleType: VehicleType;
  pickup: string;
  drop: string;
  distanceKm: number;
  customer?: string;
  company?: string;
  farePaise?: number;       // instant
  basePricePaise?: number;  // auction / backhaul floor
  myBidPaise?: number;      // driver's bid on an auction
  status: JobStatus;
  payoutPaise?: number;     // realised on delivery
  minsAgo: number;
}

interface Store {
  online: boolean;
  setOnline: (v: boolean) => void;
  feed: Job[];
  active: Job | null;
  completed: Job[];
  accept: (id: string) => void;
  placeBid: (id: string, amountPaise: number) => void;
  win: (id: string) => void;
  advance: () => void;
  complete: () => void;
}

const Ctx = createContext<Store | null>(null);

const NEXT: Record<JobStatus, JobStatus | null> = {
  open: 'assigned', assigned: 'arrived', arrived: 'picked_up',
  picked_up: 'in_transit', in_transit: 'delivered', delivered: null,
};

export function StoreProvider({ children, seedFeed, seedCompleted }: {
  children: ReactNode; seedFeed: Job[]; seedCompleted: Job[];
}) {
  const [online, setOnline] = useState(true);
  const [feed, setFeed] = useState<Job[]>(seedFeed);
  const [active, setActive] = useState<Job | null>(null);
  const [completed, setCompleted] = useState<Job[]>(seedCompleted);

  const takeFromFeed = (id: string): Job | undefined => {
    const job = feed.find((j) => j.id === id);
    if (job) setFeed((prev) => prev.filter((j) => j.id !== id));
    return job;
  };

  const accept: Store['accept'] = (id) => {
    if (active) return;
    const job = takeFromFeed(id);
    if (job) setActive({ ...job, status: 'assigned' });
  };

  const placeBid: Store['placeBid'] = (id, amountPaise) =>
    setFeed((prev) => prev.map((j) => (j.id === id ? { ...j, myBidPaise: amountPaise } : j)));

  const win: Store['win'] = (id) => {
    if (active) return;
    const job = takeFromFeed(id);
    if (!job) return;
    const fare = job.myBidPaise ?? job.basePricePaise;
    setActive({ ...job, status: 'assigned', ...(fare !== undefined ? { farePaise: fare } : {}) });
  };

  const advance: Store['advance'] = () =>
    setActive((cur) => (cur && NEXT[cur.status] ? { ...cur, status: NEXT[cur.status]! } : cur));

  const complete: Store['complete'] = () =>
    setActive((cur) => {
      if (!cur) return null;
      const done: Job = { ...cur, status: 'delivered', payoutPaise: cur.farePaise ?? cur.basePricePaise ?? 0 };
      setCompleted((prev) => [done, ...prev]);
      return null;
    });

  return (
    <Ctx.Provider value={{ online, setOnline, feed, active, completed, accept, placeBid, win, advance, complete }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used within StoreProvider');
  return s;
}
