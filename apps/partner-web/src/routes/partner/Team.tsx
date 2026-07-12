import { useEffect, useMemo, useState } from 'react';
import { Plus, Phone, UserCog, Mail, Check, Copy, KeyRound, Shield, Pencil, ShieldCheck } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { useAuth } from '../../lib/auth.js';
import { roleLabel, defaultPages, type Role } from '../../lib/roles.js';
import {
  watchMembers, inviteMember, updateMember, pagesForRole, ASSIGNABLE_PAGES, type Member,
} from '../../lib/members.js';
import type { FeatureId } from '../../lib/features.js';
import { useNotify } from '../../lib/notify.js';

const ROLE_TONE: Record<Role, BadgeTone> = { owner: 'success', manager: 'primary', supervisor: 'info', accountant: 'accent' };
const EMPTY = { name: '', email: '', phone: '', role: 'supervisor' as Role, pages: defaultPages('supervisor') };

export function Team() {
  const { member: me } = useAuth();
  const { push } = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [invite, setInvite] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [edit, setEdit] = useState<Member | null>(null);

  const isAdmin = me?.role === 'owner' || me?.role === 'manager';

  useEffect(() => watchMembers((list) => setMembers(list.sort((a, b) => a.name.localeCompare(b.name)))), []);

  const adminRole = f.role === 'owner' || f.role === 'manager';
  function setRole(role: Role) { setF((p) => ({ ...p, role, pages: defaultPages(role) })); }
  function togglePage(id: FeatureId) {
    setF((p) => ({ ...p, pages: p.pages.includes(id) ? p.pages.filter((x) => x !== id) : [...p.pages, id] }));
  }

  async function submitInvite() {
    if (!f.name.trim() || !f.email.trim() || busy) return;
    setBusy(true);
    try {
      const { tempPassword } = await inviteMember({ name: f.name, email: f.email, phone: f.phone, role: f.role, pages: f.pages });
      setCreated({ email: f.email.trim(), tempPassword });
      setF(EMPTY); setInvite(false);
      push({ title: 'Member added', body: `${f.name} can now sign in.`, tone: 'success' });
    } catch (ex) {
      const code = (ex as { code?: string })?.code ?? '';
      push({ title: "Couldn't add member", body: code.includes('email-already-in-use') ? 'That email already has an account.' : 'Please try again.', tone: 'warning' });
    } finally { setBusy(false); }
  }

  return (
    <PartnerLayout title="Team & Roles" subtitle="Accounts, page permissions & profiles">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10"><UserCog size={18} /></span>
            <div>
              <div className="text-sm font-extrabold">{members.length} team member{members.length === 1 ? '' : 's'}</div>
              <div className="text-xs text-primary-200">Each person signs in with their own email &amp; password</div>
            </div>
          </div>
          {isAdmin && <Button size="sm" variant="secondary" onClick={() => { setF(EMPTY); setInvite(true); }}><Plus size={13} /> Add member</Button>}
        </div>

        {!isAdmin && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-100">
            Only an owner or manager can add members or change permissions.
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((m) => {
            const pages = m.pages === 'all' ? 'Full access' : `${m.pages.filter((p) => p !== 'overview').length} pages`;
            return (
              <Card key={m.uid} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt={m.name} className="h-11 w-11 rounded-full object-cover ring-1 ring-neutral-200" />
                      : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-700">{m.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</div>}
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-extrabold text-neutral-900">{m.name}{m.uid === me?.uid && <span className="text-[10px] font-bold text-neutral-400">(you)</span>}</div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500"><Mail size={10} /> {m.email}</div>
                    </div>
                  </div>
                  <Badge tone={ROLE_TONE[m.role]}>{roleLabel(m.role)}</Badge>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500"><Phone size={12} /> {m.phone || '—'}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  <Shield size={12} /> Access: <span className="font-semibold text-neutral-700">{pages}</span>
                  {m.mustSetPassword && <Badge tone="warning"><KeyRound size={10} /> Pending first login</Badge>}
                </div>

                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {m.pages === 'all'
                      ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><ShieldCheck size={11} /> All pages</span>
                      : m.pages.filter((p) => p !== 'overview').map((p) => (
                        <span key={p} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{ASSIGNABLE_PAGES.find((x) => x.id === p)?.label ?? p}</span>
                      ))}
                  </div>
                  {isAdmin && (
                    <button onClick={() => setEdit(m)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><Pencil size={12} /> Edit access</button>
                  )}
                </div>
              </Card>
            );
          })}
          {members.length === 0 && <Card className="p-8 text-center text-sm text-neutral-400 sm:col-span-2 xl:col-span-3">Loading team…</Card>}
        </section>
      </div>

      {/* Invite */}
      <Modal open={invite} onClose={() => setInvite(false)} title="Add team member" subtitle="Creates a login and assigns page access" onSubmit={submitInvite} submitLabel={busy ? 'Creating…' : 'Create account'} submitDisabled={!f.name.trim() || !f.email.trim() || busy} wide>
        <Row>
          <Field label="Full name"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Prakash Nayak" /></Field>
          <Field label="Phone"><TextInput value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91 99011 22001" /></Field>
        </Row>
        <Field label="Email" hint="They'll sign in with this and set their own password"><TextInput type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="prakash@company.com" /></Field>
        <Field label="Role">
          <Select value={f.role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="manager">Manager — full access</option>
            <option value="supervisor">Supervisor — operations</option>
            <option value="accountant">Accountant — money</option>
          </Select>
        </Field>
        <PageToggles adminRole={adminRole} pages={f.pages} onToggle={togglePage} />
      </Modal>

      {/* Show temp password after creating */}
      <Modal open={!!created} onClose={() => setCreated(null)} title="Account created" subtitle="Share these one-time details with the member" submitLabel="Done" onSubmit={() => setCreated(null)}>
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">They sign in with the temporary password below, then set their own password on first login.</p>
          <CopyRow label="Email" value={created?.email ?? ''} />
          <CopyRow label="Temporary password" value={created?.tempPassword ?? ''} mono />
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">This password is shown only once. Send it to them over WhatsApp or in person.</p>
        </div>
      </Modal>

      {/* Edit member access */}
      {edit && <EditMember member={edit} onClose={() => setEdit(null)} isSelf={edit.uid === me?.uid} />}
    </PartnerLayout>
  );
}

function PageToggles({ adminRole, pages, onToggle }: { adminRole: boolean; pages: FeatureId[]; onToggle: (id: FeatureId) => void }) {
  if (adminRole) {
    return <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-100"><ShieldCheck size={13} className="mr-1 inline" /> Managers get access to every page automatically.</div>;
  }
  return (
    <Field label="Pages this person can open" hint="Overview is always visible">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ASSIGNABLE_PAGES.map((p) => {
          const on = pages.includes(p.id);
          return (
            <button type="button" key={p.id} onClick={() => onToggle(p.id)}
              className={`flex items-center justify-between gap-1 rounded-lg px-2.5 py-2 text-xs font-bold ring-1 ring-inset transition ${on ? 'bg-primary-500 text-white ring-primary-500' : 'bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50'}`}>
              {p.label} {on && <Check size={13} />}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function EditMember({ member, onClose, isSelf }: { member: Member; onClose: () => void; isSelf: boolean }) {
  const { push } = useNotify();
  const [role, setRoleState] = useState<Role>(member.role);
  const [pages, setPages] = useState<FeatureId[]>(member.pages === 'all' ? defaultPages('supervisor') : member.pages.filter((p) => p !== 'overview'));
  const [phone, setPhone] = useState(member.phone ?? '');
  const [busy, setBusy] = useState(false);
  const adminRole = role === 'owner' || role === 'manager';

  function setRole(r: Role) { setRoleState(r); setPages(defaultPages(r)); }
  function toggle(id: FeatureId) { setPages((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); }

  async function save() {
    setBusy(true);
    try {
      await updateMember(member.uid, { role, pages: pagesForRole(role, pages), phone });
      push({ title: 'Access updated', body: `${member.name}'s permissions saved.`, tone: 'success' });
      onClose();
    } catch { push({ title: "Couldn't save", body: 'Please try again.', tone: 'warning' }); }
    finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={`Edit · ${member.name}`} subtitle={member.email} onSubmit={save} submitLabel={busy ? 'Saving…' : 'Save access'} wide>
      {isSelf && member.role === 'owner' && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">You're editing your own owner account — be careful not to lock yourself out.</div>
      )}
      <Row>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="owner">Owner — everything</option>
            <option value="manager">Manager — full access</option>
            <option value="supervisor">Supervisor — operations</option>
            <option value="accountant">Accountant — money</option>
          </Select>
        </Field>
        <Field label="Phone"><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" /></Field>
      </Row>
      <PageToggles adminRole={adminRole} pages={pages} onToggle={toggle} />
    </Modal>
  );
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 ring-1 ring-inset ring-neutral-200">
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
        <div className={`truncate text-sm text-neutral-900 ${mono ? 'font-mono font-bold' : 'font-semibold'}`}>{value}</div>
      </div>
      <button onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ } }}
        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50">
        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </button>
    </div>
  );
}
