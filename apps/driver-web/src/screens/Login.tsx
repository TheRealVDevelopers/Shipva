import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Gavel, Wallet, ArrowRight } from 'lucide-react';
import { DriverHero } from '../components/art.js';

export function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('99020 11234');

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-primary-900 to-primary-800 flex justify-center">
      <div className="flex w-full max-w-md flex-col px-6 pt-14 pb-8 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white font-extrabold text-lg">G</div>
          <div>
            <div className="text-lg font-extrabold leading-none">Sarva Express</div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-accent-400">Driver Partner</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 animate-scale-in">
          <DriverHero className="w-full" />
        </div>

        <h1 className="mt-7 text-3xl font-extrabold leading-tight">Your platform.<br />Keep what you <span className="text-accent-400">earn.</span></h1>
        <p className="mt-2 text-sm text-neutral-300">Commission-free. Accept nearby work and get paid the same day.</p>

        <ul className="mt-6 space-y-3 text-sm">
          <Feat icon={<Radio size={16} />} text="Accept nearby jobs instantly" />
          <Feat icon={<Gavel size={16} />} text="Bid on scheduled & outstation loads" />
          <Feat icon={<Wallet size={16} />} text="Same-day payout — keep 100%" />
        </ul>

        <div className="mt-auto pt-8">
          <div className="rounded-xl bg-white/[0.06] p-1.5 ring-1 ring-white/10">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-3">
              <span className="text-sm font-bold text-neutral-500">+91</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" className="flex-1 text-sm font-semibold text-neutral-900 outline-none" placeholder="Phone number" />
            </div>
          </div>
          <button
            onClick={() => navigate('/feed')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3.5 text-sm font-extrabold text-white shadow-lift transition-colors hover:bg-accent-600 active:scale-[.98]"
          >
            Go online <ArrowRight size={16} />
          </button>
          <p className="mt-3 text-center text-[11px] text-neutral-400">Preview build — OTP is skipped.</p>
        </div>
      </div>
    </div>
  );
}

function Feat({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 text-neutral-200">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/20 text-accent-400">{icon}</span>
      {text}
    </li>
  );
}
