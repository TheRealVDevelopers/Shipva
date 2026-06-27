import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Gavel, RotateCcw, Minus, Plus } from 'lucide-react';
import type { TripType, VehicleType } from '@ground/shared-types';
import { suggestedBasePricePaise } from '@ground/shared-logic';
import { Frame } from '../components/Frame.js';
import { PrimaryButton, VehiclePicker, Stepper } from '../components/Controls.js';
import { useStore } from '../lib/store.js';
import { rupees } from '../lib/format.js';

const WINDOWS = [3, 6, 24];

export function AuctionPost() {
  const navigate = useNavigate();
  const { add } = useStore();
  const trip = (useLocation().state as { trip?: TripType } | null)?.trip ?? 'outstation';

  const [pickup, setPickup] = useState('Peenya Industrial Area');
  const [drop, setDrop] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>('truck');
  const [km, setKm] = useState(120);
  const [windowH, setWindowH] = useState(6);

  const suggested = suggestedBasePricePaise(vehicle, km);
  const [basePaise, setBasePaise] = useState(suggested);

  const canPost = drop.trim().length > 0;

  function post() {
    const id = add({ type: 'auction', tripType: trip, vehicleType: vehicle, pickup, drop, distanceKm: km, status: 'bidding', basePricePaise: basePaise });
    navigate(`/auction/${id}`);
  }

  return (
    <Frame title="Auction bidding" back>
      <div className="space-y-5 p-4">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <Field icon={<MapPin size={16} className="text-emerald-600" />} label="Pickup" value={pickup} onChange={setPickup} />
          <div className="h-px bg-neutral-100" />
          <Field icon={<MapPin size={16} className="text-rose-600" />} label="Drop" value={drop} onChange={setDrop} placeholder="Destination city" />
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Vehicle</div>
          <VehiclePicker value={vehicle} onChange={setVehicle} />
        </div>

        <Stepper label="Distance" value={km} onChange={setKm} min={5} step={5} unit="km" />

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">Your base price</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setBasePaise(Math.max(50000, basePaise - 50000))} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"><Minus size={14} /></button>
              <span className="w-24 text-center text-base font-bold text-primary-700">{rupees(basePaise)}</span>
              <button onClick={() => setBasePaise(basePaise + 50000)} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"><Plus size={14} /></button>
            </div>
          </div>
          <button onClick={() => setBasePaise(suggested)} className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary-600">
            <RotateCcw size={11} /> Smart suggestion: {rupees(suggested)}
          </button>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Bidding window</div>
          <div className="grid grid-cols-3 gap-2">
            {WINDOWS.map((w) => (
              <button key={w} onClick={() => setWindowH(w)}
                className={`rounded-lg border py-2.5 text-sm font-medium ${windowH === w ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-neutral-600'}`}>
                {w}h
              </button>
            ))}
          </div>
        </div>

        <PrimaryButton onClick={post} disabled={!canPost}>
          <Gavel size={16} /> Post auction
        </PrimaryButton>
        {!canPost && <p className="-mt-2 text-center text-xs text-neutral-400">Enter a destination to continue.</p>}
      </div>
    </Frame>
  );
}

function Field({ icon, label, value, onChange, placeholder }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="flex items-center gap-3 px-4 py-3">
      {icon}
      <div className="flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full text-sm text-neutral-900 outline-none placeholder:text-neutral-400" />
      </div>
    </label>
  );
}
