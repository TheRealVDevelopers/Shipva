import { useState } from 'react';
import { Mail, Lock, ArrowRight, ClipboardList, Users, Wallet, KeyRound, ShieldAlert, LogOut, BookOpen } from 'lucide-react';
import { LogoMark } from '../../components/art.js';
import { BRAND } from '../../lib/brand.js';
import { useAuth } from '../../lib/auth.js';

/** Auth screen — renders sign-in, the first-login "set your password" step, or a
 *  no-access message, driven entirely by the auth status. */
export function Login() {
  const { status } = useAuth();
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

        <div className="flex flex-col justify-center p-10">
          {status === 'must-set-password' ? <SetPassword />
            : status === 'no-access' ? <NoAccess />
              : <SignIn />}
        </div>
      </div>
    </div>
  );
}

function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { await signIn(email, password); }
    catch (ex) { setErr(authError(ex)); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="text-xl font-extrabold text-neutral-900">Sign in to {BRAND.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage your fleet, trips and accounts.</p>
      <div className="mt-7 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-neutral-700">Email</span>
          <div className="relative mt-1">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" placeholder="you@company.com"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-neutral-700">Password</span>
          <div className="relative mt-1">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
          </div>
        </label>
      </div>
      {err && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{err}</p>}
      <button type="submit" disabled={busy || !email || !password}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-white transition-colors hover:bg-primary-600 active:scale-[.98] disabled:opacity-50">
        {busy ? 'Signing in…' : <>Sign in <ArrowRight size={15} /></>}
      </button>
      <p className="mt-4 text-center text-[11px] text-neutral-400">First time? Use the temporary password your admin shared — you'll set your own next.</p>
      <a href={`${import.meta.env.BASE_URL}guide.html`} target="_blank" rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-primary-600 hover:text-primary-700">
        <BookOpen size={13} /> Read the user guide — no login needed
      </a>
    </form>
  );
}

function SetPassword() {
  const { setInitialPassword, signOutUser, user } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = pw.length >= 6 && pw === pw2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) { setErr(pw.length < 6 ? 'Password must be at least 6 characters.' : 'Passwords do not match.'); return; }
    setErr(''); setBusy(true);
    try { await setInitialPassword(pw); }
    catch (ex) { setErr(authError(ex)); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><KeyRound size={20} /></div>
      <h1 className="text-xl font-extrabold text-neutral-900">Set your password</h1>
      <p className="mt-1 text-sm text-neutral-500">Welcome{user?.email ? `, ${user.email}` : ''}. Choose a password only you know.</p>
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-neutral-700">New password</span>
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters"
            className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-neutral-700">Confirm password</span>
          <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Re-enter password"
            className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
        </label>
      </div>
      {err && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{err}</p>}
      <button type="submit" disabled={busy || !valid}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-white transition-colors hover:bg-primary-600 disabled:opacity-50">
        {busy ? 'Saving…' : <>Set password & continue <ArrowRight size={15} /></>}
      </button>
      <button type="button" onClick={signOutUser} className="mt-3 w-full text-center text-[11px] font-bold text-neutral-400 hover:text-neutral-600">Sign out</button>
    </form>
  );
}

function NoAccess() {
  const { signOutUser, user } = useAuth();
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><ShieldAlert size={24} /></div>
      <h1 className="text-xl font-extrabold text-neutral-900">No access yet</h1>
      <p className="mt-2 text-sm text-neutral-500">{user?.email} isn't part of any team on {BRAND.name}. Ask your owner or manager to invite you, then sign in again.</p>
      <button onClick={signOutUser} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-200">
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}

function authError(ex: unknown): string {
  const code = (ex as { code?: string })?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Wrong email or password.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a minute and try again.';
  if (code.includes('requires-recent-login')) return 'Please sign in again to change your password.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('network')) return 'Network error — check your connection.';
  return 'Something went wrong. Please try again.';
}
