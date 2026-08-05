import { useEffect, useState } from 'react';
import {
  KeyRound, Lock, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import {
  confirmPasswordReset, verifyPasswordResetCode, applyActionCode,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase.js';
import { LogoMark } from '../../components/art.js';
import { BRAND } from '../../lib/brand.js';

/**
 * Branded handler for the links Firebase emails — password reset, email
 * verification. Firebase's console "custom action URL" is pointed at
 * `/app/auth/action`, so instead of Firebase's generic grey page the user lands
 * here, on a proper Sarva Express page.
 *
 * Rendered by App() straight from the URL, before the auth gate, so it works
 * while signed out (which the person always is when resetting a password).
 * Reads `window.location` directly rather than router hooks — it lives outside
 * the app's normal routes.
 */

const qp = (name: string): string => new URLSearchParams(window.location.search).get(name) ?? '';
/** Where "back to sign in" and the post-reset redirect go — the app root on
 *  whichever host served this page. */
const HOME = import.meta.env.BASE_URL || '/';

type Phase = 'checking' | 'form' | 'saving' | 'signing-in' | 'done' | 'verified' | 'error';

export function AuthAction() {
  const mode = qp('mode');
  const oobCode = qp('oobCode');

  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');

  // Verify the code up front. For a reset that gives us the account's email and
  // proves the link is still good before we show the form; for verify/recover
  // it applies the change outright.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!oobCode) { if (alive) setPhase('error'); return; }
      try {
        if (mode === 'resetPassword') {
          const mail = await verifyPasswordResetCode(auth, oobCode);
          if (!alive) return;
          setEmail(mail);
          setPhase('form');
        } else if (mode === 'verifyEmail' || mode === 'recoverEmail') {
          await applyActionCode(auth, oobCode);
          if (alive) setPhase('verified');
        } else {
          if (alive) setPhase('error');
        }
      } catch {
        if (alive) setPhase('error');
      }
    })();
    return () => { alive = false; };
  }, [mode, oobCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { setErr('Passwords do not match.'); return; }
    setErr(''); setPhase('saving');
    try {
      await confirmPasswordReset(auth, oobCode, pw);
    } catch {
      setErr('This reset link has expired. Please request a new one from the sign-in page.');
      setPhase('error');
      return;
    }
    // The password is changed — log them straight in with it, so "reset then use
    // the new password immediately" is literally one step. If that hiccups, fall
    // back to the success screen with a sign-in button.
    setPhase('signing-in');
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      window.location.assign(HOME);
    } catch {
      setPhase('done');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lift md:grid-cols-2">
        {/* Brand panel — same hero as the sign-in screen, so this reads as part
            of the app, not a stray utility page. */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-primary-800 to-primary-900 p-10 text-white md:flex">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <div>
              <div className="text-lg font-extrabold leading-none">{BRAND.name}</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-accent-400">{BRAND.tagline}</div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold leading-tight">Reset your<br />password securely.</h2>
            <p className="mt-3 text-sm text-primary-100">This link came from {BRAND.name}. Choose a new password and you're straight back in.</p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-10">
          {phase === 'checking' && <Centered icon={<LogoMark className="h-9 w-9 animate-pulse" />} title="Checking your link…" />}

          {phase === 'error' && (
            <Message
              tone="error"
              icon={<AlertTriangle size={22} />}
              title="This link isn't valid"
              body="Password-reset links expire after a while and can be used only once. Head back to sign in and choose “Forgot password?” to get a fresh one."
            />
          )}

          {phase === 'verified' && (
            <Message
              tone="ok"
              icon={<CheckCircle2 size={22} />}
              title="Email verified"
              body={`Thanks — your email is confirmed. You can sign in to ${BRAND.name} now.`}
            />
          )}

          {phase === 'done' && (
            <Message
              tone="ok"
              icon={<CheckCircle2 size={22} />}
              title="Password updated"
              body={`Your new password is set${email ? ` for ${email}` : ''}. Sign in with it now.`}
            />
          )}

          {phase === 'signing-in' && <Centered icon={<ShieldCheck className="h-9 w-9 animate-pulse text-primary-500" />} title="Signing you in…" />}

          {(phase === 'form' || phase === 'saving') && (
            <form onSubmit={submit}>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><KeyRound size={20} /></div>
              <h1 className="text-xl font-extrabold text-neutral-900">Choose a new password</h1>
              <p className="mt-1 text-sm text-neutral-500">For <span className="font-semibold text-neutral-700">{email}</span>. Pick something only you know.</p>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-neutral-700">New password</span>
                  <div className="relative mt-1">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters"
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-neutral-700">Confirm password</span>
                  <div className="relative mt-1">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Re-enter password"
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white" />
                  </div>
                </label>
              </div>
              {err && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{err}</p>}
              <button type="submit" disabled={phase === 'saving' || !pw || !pw2}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-white transition-colors hover:bg-primary-600 disabled:opacity-50">
                {phase === 'saving' ? 'Saving…' : <>Set password &amp; sign in <ArrowRight size={15} /></>}
              </button>
            </form>
          )}

          {(phase === 'error' || phase === 'verified' || phase === 'done') && (
            <a href={HOME}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-white transition-colors hover:bg-primary-600">
              Go to sign in <ArrowRight size={15} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Centered({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center text-neutral-500">
      {icon}
      <span className="text-sm font-bold">{title}</span>
    </div>
  );
}

function Message({ tone, icon, title, body }: { tone: 'ok' | 'error'; icon: React.ReactNode; title: string; body: string }) {
  const ring = tone === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  return (
    <div className="text-center">
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${ring}`}>{icon}</div>
      <h1 className="text-xl font-extrabold text-neutral-900">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">{body}</p>
    </div>
  );
}
