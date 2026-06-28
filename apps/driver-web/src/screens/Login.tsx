import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Gavel, Wallet, ArrowRight } from 'lucide-react';
import { PrimaryButton } from '../components/Controls.js';
import { HeroDelivery } from '../components/art.js';

export function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('99020 11234');

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-800 to-primary-600 flex justify-center">
      <div className="flex w-full max-w-md flex-col px-6 pt-16 pb-8 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-700 font-bold text-lg">G</div>
          <div>
            <div className="text-lg font-semibold leading-none">Ground Network</div>
            <div className="text-[11px] uppercase tracking-wide text-primary-200">Driver</div>
          </div>
        </div>

        <h1 className="mt-12 text-3xl font-bold leading-tight">Your platform.<br />Keep what you earn.</h1>
        <p className="mt-3 text-sm text-primary-100">Commission-free. See nearby work, accept, get paid — same day.</p>

        <div className="mt-6 rounded-2xl bg-white/95 p-3 shadow-lift animate-scale-in">
          <HeroDelivery className="w-full" />
        </div>

        <ul className="mt-6 space-y-3 text-sm">
          <Feat icon={<Radio size={16} />} text="Accept nearby jobs instantly" />
          <Feat icon={<Gavel size={16} />} text="Bid on scheduled & outstation loads" />
          <Feat icon={<Wallet size={16} />} text="Same-day payout — keep 100%" />
        </ul>

        <div className="mt-auto pt-10">
          <div className="rounded-xl bg-white/10 p-1.5 backdrop-blur">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-3">
              <span className="text-sm font-medium text-neutral-500">+91</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" className="flex-1 text-sm text-neutral-900 outline-none" placeholder="Phone number" />
            </div>
          </div>
          <div className="mt-3">
            <PrimaryButton onClick={() => navigate('/feed')} className="bg-white !text-primary-700 hover:bg-neutral-100">
              Go online <ArrowRight size={16} />
            </PrimaryButton>
          </div>
          <p className="mt-3 text-center text-[11px] text-primary-200">Preview build — OTP is skipped.</p>
        </div>
      </div>
    </div>
  );
}

function Feat({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-orange-200">{icon}</span>
      {text}
    </li>
  );
}
