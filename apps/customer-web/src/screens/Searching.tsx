import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, Star, Truck, CheckCircle2, X } from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { PrimaryButton } from '../components/Controls.js';
import { SearchingArt } from '../components/art.js';
import { useBooking, updateBooking, getBooking } from '../lib/sharedStore.js';
import { randomDriver } from '../lib/mocks.js';
import { rupees } from '../lib/format.js';

export function Searching() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(id);

  // Fallback: if no real driver (from the driver app) accepts within 7s, auto-assign
  // so the customer app still works standalone.
  useEffect(() => {
    const t = setTimeout(() => {
      const b = getBooking(id);
      if (b && b.status === 'searching') {
        const d = randomDriver();
        updateBooking(id, { status: 'assigned', driver: { name: d.name, phone: d.phone, vehicleReg: d.vehicleReg, ratingAvg: d.ratingAvg } });
      }
    }, 7000);
    return () => clearTimeout(t);
  }, [id]);

  if (!booking) return <Frame title="Booking" back><p className="p-6 text-sm text-neutral-500">Booking not found.</p></Frame>;

  const assigned = booking.status !== 'searching' && booking.driver;

  return (
    <Frame title={assigned ? 'Driver assigned' : 'Finding a driver'} back>
      <div className="p-4">
        {!assigned ? (
          <div className="flex flex-col items-center py-12 text-center">
            <SearchingArt className="h-28 w-28 animate-pulse" />
            <div className="mt-4 text-base font-semibold text-neutral-900">Finding a driver nearby…</div>
            <div className="mt-1 text-sm text-neutral-500">Alerting {booking.vehicleType.replaceAll('_', ' ')} drivers in your zone</div>
            <div className="mt-6 rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-600">{booking.pickup} → {booking.drop}</div>
            <button onClick={() => { updateBooking(id, { status: 'cancelled' }); navigate('/home'); }} className="mt-8 flex items-center gap-1.5 text-sm font-medium text-rose-600"><X size={14} /> Cancel request</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 size={16} /> {booking.driver!.name} accepted your booking</div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">{booking.driver!.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-neutral-900">{booking.driver!.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-0.5"><Star size={11} className="fill-amber-400 text-amber-400" /> {booking.driver!.ratingAvg}</span>
                    <span className="flex items-center gap-0.5"><Truck size={11} /> {booking.driver!.vehicleReg}</span>
                  </div>
                </div>
                <a href={`tel:${booking.driver!.phone}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white"><Phone size={16} /></a>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm"><span className="text-neutral-500">Fare</span><span className="font-semibold text-neutral-900">{rupees(booking.farePaise ?? 0)}</span></div>
            </div>
            <PrimaryButton onClick={() => navigate(`/track/${id}`)}>Track live</PrimaryButton>
          </div>
        )}
      </div>
    </Frame>
  );
}
