import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Minus, Plus, Check, ChevronUp, Clock } from 'lucide-react';
import { VEHICLE_TYPES, type TripType, type VehicleType } from '@shipva/shared-types';
import { estimateFarePaise } from '@shipva/shared-logic';
import { Frame } from '../components/Frame.js';
import { PrimaryButton } from '../components/Controls.js';
import { VehicleArt, MapArt } from '../components/art.js';
import { addBooking, nextBookingId } from '../lib/sharedStore.js';
import { rupees } from '../lib/format.js';

const ETA: Record<string, string> = {
  bike: '5 min', auto: '6 min', mini_truck: '8 min', tempo: '10 min',
  pickup: '12 min', truck: '15 min', reefer: '15 min',
};

export function QuickBooking() {
  const navigate = useNavigate();
  const st = useLocation().state as { trip?: TripType; vehicle?: VehicleType } | null;

  const [pickup, setPickup] = useState('Koramangala 5th Block');
  const [drop, setDrop] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>(st?.vehicle ?? 'mini_truck');
  const [km, setKm] = useState(7);
  const [showBreakup, setShowBreakup] = useState(false);

  const fare = estimateFarePaise(vehicle, km);
  const label = VEHICLE_TYPES.find((v) => v.type === vehicle)?.label ?? 'vehicle';
  const canBook = drop.trim().length > 0;

  function book() {
    const id = nextBookingId();
    addBooking({
      id, type: 'instant', vehicleType: vehicle, pickup, drop, distanceKm: km,
      farePaise: fare, status: 'searching', customerName: 'Anita Rao', createdAt: Date.now(),
    });
    navigate(`/searching/${id}`);
  }

  return (
    <Frame title="Choose a vehicle" back>
      <div className="pb-40">
        <div className="relative">
          <MapArt className="h-44 w-full" />
          <div className="absolute inset-x-3 -bottom-6">
            <div className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-neutral-100">
              <Field icon={<span className="h-2.5 w-2.5 rounded-full bg-success ring-2 ring-success/20" />} value={pickup} onChange={setPickup} />
              <div className="my-1 ml-[5px] border-l-2 border-dotted border-neutral-200 pl-[15px] text-[10px] text-neutral-400">{km} km</div>
              <Field icon={<span className="h-2.5 w-2.5 rounded-sm bg-accent-500" />} value={drop} onChange={setDrop} placeholder="Drop location" />
            </div>
          </div>
        </div>

        <div className="mt-10 px-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-neutral-900">Choose a vehicle</span>
            <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600">
              <button onClick={() => setKm(Math.max(1, km - 1))} aria-label="less"><Minus size={12} /></button>
              <span className="font-semibold">{km} km</span>
              <button onClick={() => setKm(km + 1)} aria-label="more"><Plus size={12} /></button>
            </span>
          </div>

          <div className="space-y-2 stagger">
            {VEHICLE_TYPES.map((v) => {
              const f = estimateFarePaise(v.type, km);
              const active = v.type === vehicle;
              return (
                <button key={v.type} onClick={() => setVehicle(v.type)}
                  className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-all ${active ? 'border-primary-500 ring-1 ring-primary-500 shadow-card' : 'border-neutral-200 hover:border-primary-300'}`}>
                  <VehicleArt type={v.type} className="h-10 w-14 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-neutral-900">{v.label}</div>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-500"><Clock size={10} /> {ETA[v.type]} away · up to {v.capacityKg} kg</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-neutral-900">{rupees(f)}</div>
                    {active && <Check size={14} className="ml-auto text-primary-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={() => setShowBreakup(!showBreakup)} className="mt-3 flex w-full items-center justify-between rounded-xl bg-neutral-100 px-3 py-2.5 text-xs font-medium text-neutral-600">
            <span>Fare details</span>
            <ChevronUp size={14} className={`transition-transform ${showBreakup ? '' : 'rotate-180'}`} />
          </button>
          {showBreakup && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-neutral-200 bg-white p-3 text-xs animate-fade">
              <Row label="Base fare" value={rupees(Math.round(fare * 0.35))} />
              <Row label={`Distance (${km} km)`} value={rupees(Math.round(fare * 0.65))} />
              <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-1.5 font-bold text-neutral-900"><span>Total</span><span>{rupees(fare)}</span></div>
              <p className="pt-1 text-[10px] text-neutral-400">Commission-free · pay the driver directly. No surge.</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-neutral-200 bg-white/95 p-3 backdrop-blur">
        <div className="mb-1.5 flex items-center justify-between px-1 text-xs text-neutral-500">
          <span>{label} · {km} km</span><span className="font-bold text-neutral-900">{rupees(fare)}</span>
        </div>
        <PrimaryButton onClick={book} disabled={!canBook}>Book {label}</PrimaryButton>
        {!canBook && <p className="mt-1.5 text-center text-[11px] text-neutral-400">Enter a drop location to book.</p>}
      </div>
    </Frame>
  );
}

function Field({ icon, value, onChange, placeholder }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex items-center gap-2.5">
      {icon}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent py-1 text-sm font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400" />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-neutral-500"><span>{label}</span><span className="text-neutral-800">{value}</span></div>;
}
