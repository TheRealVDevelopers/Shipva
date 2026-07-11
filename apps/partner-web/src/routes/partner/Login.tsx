import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ClipboardList, Users, Wallet } from 'lucide-react';
import { LogoMark } from '../../components/art.js';
import { BRAND } from '../../lib/brand.js';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@sarvaexpress.in');
  const [password, setPassword] = useState('••••••••••');

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lift md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-primary-800 to-primary-900 p-10 text-white md:flex">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <div>
              <div className="text-lg font-extrabold leading-none">{BRAND.name}</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-accent-400">{BRAND.tagline}</div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold leading-tight">Run your whole<br />transport business.</h2>
            <p className="mt-3 text-sm text-primary-100">Trips, fleet, billing, fuel and payroll — one place for your entire operation.</p>
            <ul className="mt-7 space-y-2.5 text-sm text-primary-50">
              <li className="flex items-center gap-2"><ClipboardList size={15} className="text-accent-300" /> Trips & lorry receipts</li>
              <li className="flex items-center gap-2"><Users size={15} className="text-accent-300" /> Trucks, drivers & staff</li>
              <li className="flex items-center gap-2"><Wallet size={15} className="text-accent-300" /> Invoicing, expenses & payroll</li>
            </ul>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); navigate('/p'); }} className="flex flex-col justify-center p-10">
          <h1 className="text-xl font-extrabold text-neutral-900">Sign in to {BRAND.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your fleet, trips and accounts.</p>
          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-neutral-700">Email</span>
              <div className="relative mt-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-700">Password</span>
              <div className="relative mt-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
              </div>
            </label>
          </div>
          <button type="submit" className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-white transition-colors hover:bg-primary-600 active:scale-[.98]">
            Sign in <ArrowRight size={15} />
          </button>
          <p className="mt-4 text-center text-[11px] text-neutral-400">Preview build — sign-in is not wired to Firebase Auth yet.</p>
        </form>
      </div>
    </div>
  );
}
