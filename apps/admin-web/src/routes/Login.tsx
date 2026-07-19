import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Gavel, Radio, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button.js';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('dispatch@sarvaexpress.in');
  const [password, setPassword] = useState('••••••••••');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-500 to-primary-400 flex items-center justify-center p-6">
      <div className="grid md:grid-cols-2 gap-0 max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary-600 to-primary-800 text-white p-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-primary-700 font-bold">G</div>
              <div className="text-lg font-semibold">Sarva Express</div>
            </div>
            <h2 className="mt-12 text-2xl font-semibold leading-tight">
              Bangalore's driver-first logistics marketplace.
            </h2>
            <p className="mt-3 text-sm text-primary-100/90">
              Instant booking, price-competitive auctions, and a transporter exchange
              that fills idle trucks and empty return legs — commission-free.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-primary-50">
            <li className="flex items-center gap-2"><Radio size={14} className="text-orange-300" /> Instant booking — first driver to accept wins</li>
            <li className="flex items-center gap-2"><Gavel size={14} className="text-orange-300" /> Auctions — drivers compete on price</li>
            <li className="flex items-center gap-2"><Truck size={14} className="text-orange-300" /> Transporter exchange + backhaul matching</li>
          </ul>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); navigate('/ops'); }}
          className="p-10 flex flex-col justify-center"
        >
          <h1 className="text-xl font-semibold text-neutral-900">Sign in to Admin Console</h1>
          <p className="text-sm text-neutral-500 mt-1">Dispatch, verify, and configure the platform.</p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-neutral-700">Email</span>
              <div className="relative mt-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-400 focus:bg-white"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-neutral-700">Password</span>
              <div className="relative mt-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-400 focus:bg-white"
                />
              </div>
            </label>
          </div>

          <Button type="submit" className="mt-7 w-full justify-center">
            Sign in <ArrowRight size={14} />
          </Button>
          <p className="mt-4 text-center text-xs text-neutral-400">
            Preview build — sign-in is not wired to Firebase Auth yet.
          </p>
        </form>
      </div>
    </div>
  );
}
