import { useEffect, useState } from 'react';
import { Mail, Save, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Field, TextInput } from '../../components/ui/Modal.js';
import { ImageUpload } from '../../components/ui/ImageUpload.js';
import { useAuth } from '../../lib/auth.js';
import { roleLabel } from '../../lib/roles.js';
import { updateMember, ASSIGNABLE_PAGES } from '../../lib/members.js';
import { useNotify } from '../../lib/notify.js';

export function Profile() {
  const { member, refreshMember, changePassword, signOutUser } = useAuth();
  const { push } = useNotify();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => { if (member) { setName(member.name); setPhone(member.phone ?? ''); } }, [member]);

  if (!member) return <PartnerLayout title="Profile"><div /></PartnerLayout>;

  async function saveProfile() {
    if (!member) return;
    setSavingProfile(true);
    try {
      await updateMember(member.uid, { name: name.trim() || member.name, phone: phone.trim() });
      await refreshMember();
      push({ title: 'Profile saved', body: 'Your details were updated.', tone: 'success' });
    } catch { push({ title: "Couldn't save", body: 'Please try again.', tone: 'warning' }); }
    finally { setSavingProfile(false); }
  }

  async function onPhoto(url: string | undefined) {
    if (!member) return;
    await updateMember(member.uid, { photoUrl: url ?? '' });
    await refreshMember();
  }

  const allowed = member.pages === 'all' ? ['Every page'] : member.pages.filter((p) => p !== 'overview').map((p) => ASSIGNABLE_PAGES.find((x) => x.id === p)?.label ?? p);

  return (
    <PartnerLayout title="My profile" subtitle="Your account, photo and password">
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardBody className="flex flex-wrap items-center gap-4">
            {member.photoUrl
              ? <img src={member.photoUrl} alt={member.name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-neutral-200" />
              : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-lg font-extrabold text-primary-700">{member.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</div>}
            <div className="flex-1">
              <h2 className="text-lg font-extrabold text-neutral-900">{member.name}</h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                <span className="flex items-center gap-1"><Mail size={12} /> {member.email}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">{roleLabel(member.role)}</span>
              </div>
            </div>
            <ImageUpload value={member.photoUrl} onChange={onPhoto} path={`members/${member.uid}/photo`} label="Add photo" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your details" subtitle="Visible to your team" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Phone"><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" /></Field>
            <div className="sm:col-span-2">
              <Button size="sm" onClick={saveProfile} disabled={savingProfile}><Save size={13} /> {savingProfile ? 'Saving…' : 'Save details'}</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pages you can access" subtitle="Set by your owner or manager" action={<ShieldCheck size={15} className="text-emerald-500" />} />
          <CardBody>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">Overview</span>
              {allowed.map((p) => <span key={p} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{p}</span>)}
            </div>
          </CardBody>
        </Card>

        <ChangePassword onChange={changePassword} />

        <Card>
          <CardBody className="flex items-center justify-between">
            <div className="text-sm text-neutral-600">Signed in as <b className="text-neutral-900">{member.email}</b></div>
            <Button size="sm" variant="secondary" onClick={() => void signOutUser()}><LogOut size={13} /> Sign out</Button>
          </CardBody>
        </Card>
      </div>
    </PartnerLayout>
  );
}

function ChangePassword({ onChange }: { onChange: (cur: string, next: string) => Promise<void> }) {
  const { push } = useNotify();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = cur && next.length >= 6 && next === confirm;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    try {
      await onChange(cur, next);
      setCur(''); setNext(''); setConfirm('');
      push({ title: 'Password changed', body: 'Use your new password next time you sign in.', tone: 'success' });
    } catch (ex) {
      const code = (ex as { code?: string })?.code ?? '';
      push({ title: "Couldn't change password", body: code.includes('wrong-password') || code.includes('invalid-credential') ? 'Current password is incorrect.' : code.includes('requires-recent-login') ? 'Please sign out and in again, then retry.' : 'Please try again.', tone: 'warning' });
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardHeader title="Change password" subtitle="Keep your account secure" action={<KeyRound size={15} className="text-primary-500" />} />
      <CardBody className="grid gap-4 sm:grid-cols-3">
        <Field label="Current password"><TextInput type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <Field label="New password"><TextInput type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="6+ characters" /></Field>
        <Field label="Confirm new"><TextInput type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <div className="sm:col-span-3">
          <Button size="sm" onClick={submit} disabled={!valid || busy}><KeyRound size={13} /> {busy ? 'Updating…' : 'Update password'}</Button>
        </div>
      </CardBody>
    </Card>
  );
}
