import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Zap } from 'lucide-react';
import type { TripType, VehicleType } from '@ground/shared-types';
import { estimateFarePaise } from '@ground/shared-logic';
import { Frame } from '../components/Frame.js';
import { PrimaryButton, VehiclePicker, Stepper } from '../components/Controls.js';
import { useStore } from '../lib/store.js';
import { rupees } from '../lib/format.js';

export function QuickBooking() {
  const navigate = useNavigate();
  const { add } = useStore();
  const trip = (useLocation().state as { trip?: TripType } | null)?.trip ?? 'intercity';

  const [pickup, setPickup] = useState('Koramangala 5th Block');
  const [drop, setDrop] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>('mini_truck');
  const [km, setKm] = useState(7);

  const fare = estimateFarePaise(vehicle, km);
  const canBook = drop.trim().length > 0;

  function book() {
    const id = add({ type: 'instant', tripType: trip, vehicleType: vehicle, pickup, drop, distanceKm: km, status: 'searching', farePaise: fare });
    navigate(`/searching/${id}`);
  }

  return (
    <Frame title="Quick booking" back>
      <div className="space-y-5 p-4">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <Field icon={<MapPin size={16} className="text-emerald-600" />} label="Pickup" value={pickup} onChange={setPickup} />
          <div className="h-px bg-neutral-100" />
          <Field icon={<MapPin size={16} className="text-rose-600" />} label="Drop" value={drop} onChange={setDrop} placeholder="Where to?" />
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Vehicle</div>
          <VehiclePicker value={vehicle} onChange={setVehicle} />
        </div>

        <Stepper label="Distance" value={km} onChange={setKm} min={1} step={1} unit="km" />

        <div className="rounded-xl bg-primary-50 p-4 ring-1 ring-primary-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Estimated fare</span>
            <span className="text-2xl font-bold text-primary-700">{rupees(fare)}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
            <Zap size={11} className="text-orange-500" /> Pay the driver directly · commission-free
          </div>
        </div>

        <PrimaryButton onClick={book} disabled={!canBook}>
          Book now · {rupees(fare)}
        </PrimaryButton>
        {!canBook && <p className="-mt-2 text-center text-xs text-neutral-400">Enter a drop location to continue.</p>}
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
