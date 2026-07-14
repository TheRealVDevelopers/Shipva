import { useEffect, useState } from 'react';
import {
  Plus, Phone, UserCog, Mail, Check, Copy, KeyRound, Shield, Pencil, ShieldCheck,
  Clock, ListTodo, CalendarClock, Coffee,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { useAuth } from '../../lib/auth.js';
import { roleLabel, defaultPages, type Role } from '../../lib/roles.js';
import {
  watchMembers, inviteMember, updateMember, pagesForRole, canManageMember, ASSIGNABLE_PAGES, type Member,
} from '../../lib/members.js';
import type { FeatureId } from '../../lib/features.js';
import {
  watchAllToday, watchActivity, presence, fmtClock, fmtActive, type Activity,
} from '../../lib/activity.js';
import {
  watchTasksFor, elapsedMs, fmtDuration, isOverdue, type Task,
} from '../../lib/tasks.js';
import { watchWorklogFor, fmtTime, type WorklogEntry } from '../../lib/worklog.js';
import { AssignTaskModal } from '../../components/AssignTaskModal.js';
import { useNotify } from '../../lib/notify.js';

const ROLE_TONE: Record<Role, BadgeTone> = { owner: 'success', manager: 'primary', team_leader: 'warning', supervisor: 'info', accountant: 'accent' };
const EMPTY = { name: '', email: '', phone: '', role: 'supervisor' as Role, pages: defaultPages('supervisor'), leaderUid: '' };

export function Team() {
  const { member: me } = useAuth();
  const { push } = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Record<string, Activity>>({});
  const [invite, setInvite] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [edit, setEdit] = useState<Member | null>(null);
  const [assignTo, setAssignTo] = useState<Member | null>(null);
  const [todayFor, setTodayFor] = useState<Member | null>(null);

  const isAdmin = me?.role === 'owner' || me?.role === 'manager';
  const isTL = me?.role === 'team_leader';
  const canManage = isAdmin || isTL;

  useEffect(() => watchMembers((list) => setMembers(list.sort((a, b) => a.name.localeCompare(b.name)))), []);
  useEffect(() => watchAllToday((list) => setActivity(Object.fromEntries(list.map((a) => [a.uid, a])))), []);

  // A Team Leader only sees & manages their own POCs; owner/manager see everyone.
  const leaders = members.filter((m) => m.role === 'team_leader');
  const leaderName = (uid?: string) => members.find((m) => m.uid === uid)?.name ?? '';
  const visible = isAdmin ? members : isTL ? members.filter((m) => m.leaderUid === me?.uid || m.uid === me?.uid) : members.filter((m) => m.uid === me?.uid);
  const inviteRoles: Role[] = isAdmin ? ['manager', 'team_leader', 'supervisor', 'accountant'] : ['supervisor', 'accountant'];
  const showLeaderPicker = isAdmin && (f.role === 'supervisor' || f.role === 'accountant');

  const adminRole = f.role === 'owner' || f.role === 'manager';
  function setRole(role: Role) { setF((p) => ({ ...p, role, pages: defaultPages(role) })); }
  function togglePage(id: FeatureId) {
    setF((p) => ({ ...p, pages: p.pages.includes(id) ? p.pages.filter((x) => x !== id) : [...p.pages, id] }));
  }

  async function submitInvite() {
    if (!f.name.trim() || !f.email.trim() || busy) return;
    setBusy(true);
    try {
      // A TL's new members are POCs under them; an owner/manager may pick the leader.
      const leaderUid = isTL ? me?.uid : (showLeaderPicker ? (f.leaderUid || undefined) : undefined);
      const { tempPassword } = await inviteMember({ name: f.name, email: f.email, phone: f.phone, role: f.role, pages: f.pages, ...(leaderUid ? { leaderUid } : {}) });
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
              <div className="text-sm font-extrabold">{visible.length} {isTL ? 'POC' : 'team member'}{visible.length === 1 ? '' : 's'}</div>
              <div className="text-xs text-primary-200">{isTL ? 'Your sub-team — add POCs and assign them routes' : 'Each person signs in with their own email & password'}</div>
            </div>
          </div>
          {canManage && <Button size="sm" variant="secondary" onClick={() => { setF(EMPTY); setInvite(true); }}><Plus size={13} /> {isTL ? 'Add POC' : 'Add member'}</Button>}
        </div>

        {!canManage && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-100">
            Only an owner, manager or team leader can add members or change permissions.
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((m) => {
            const pages = m.pages === 'all' ? 'Full access' : `${m.pages.filter((p) => p !== 'overview').length} pages`;
            const canEdit = canManageMember(me, m);
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
                {m.leaderUid && <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500"><UserCog size={11} /> Reports to <span className="font-semibold text-neutral-700">{leaderName(m.leaderUid) || 'Team Leader'}</span></div>}
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                  <Shield size={12} /> Access: <span className="font-semibold text-neutral-700">{pages}</span>
                  {m.mustSetPassword && <Badge tone="warning"><KeyRound size={10} /> Pending first login</Badge>}
                </div>

                {/* Today's presence */}
                <ActivityRow activity={activity[m.uid] ?? null} />

                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {m.pages === 'all'
                      ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><ShieldCheck size={11} /> All pages</span>
                      : m.pages.filter((p) => p !== 'overview').map((p) => (
                        <span key={p} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{ASSIGNABLE_PAGES.find((x) => x.id === p)?.label ?? p}</span>
                      ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <button onClick={() => setTodayFor(m)} className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-primary-700"><CalendarClock size={12} /> Today</button>
                    {canEdit && m.uid !== me?.uid && <button onClick={() => setAssignTo(m)} className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><ListTodo size={12} /> Assign task</button>}
                    {canEdit && <button onClick={() => setEdit(m)} className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-primary-700"><Pencil size={12} /> Edit access</button>}
                  </div>
                </div>
              </Card>
            );
          })}
          {visible.length === 0 && <Card className="p-8 text-center text-sm text-neutral-400 sm:col-span-2 xl:col-span-3">{isTL ? 'No POCs yet — press "Add POC".' : 'Loading team…'}</Card>}
        </section>
      </div>

      {/* Invite */}
      <Modal open={invite} onClose={() => setInvite(false)} title="Add team member" subtitle="Creates a login and assigns page access" onSubmit={submitInvite} submitLabel={busy ? 'Creating…' : 'Create account'} submitDisabled={!f.name.trim() || !f.email.trim() || busy} wide>
        <Row>
          <Field label="Full name"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Prakash Nayak" /></Field>
          <Field label="Phone"><TextInput value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91 99011 22001" /></Field>
        </Row>
        <Field label="Email" hint="They'll sign in with this and set their own password"><TextInput type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="prakash@company.com" /></Field>
        <Row>
          <Field label="Role">
            <Select value={f.role} onChange={(e) => setRole(e.target.value as Role)}>
              {inviteRoles.map((r) => <option key={r} value={r}>{roleLabel(r)}{r === 'team_leader' ? ' — runs a sub-team' : r === 'manager' ? ' — full access' : r === 'supervisor' ? ' — operations' : ' — money'}</option>)}
            </Select>
          </Field>
          {showLeaderPicker
            ? <Field label="Reports to (Team Leader)" hint="Optional — assigns this POC under a leader">
                <Select value={f.leaderUid} onChange={(e) => setF({ ...f, leaderUid: e.target.value })}>
                  <option value="">— none (reports to you) —</option>
                  {leaders.map((l) => <option key={l.uid} value={l.uid}>{l.name}</option>)}
                </Select>
              </Field>
            : <div />}
        </Row>
        {isTL && <p className="text-[11px] text-neutral-500">This person becomes a POC under you — you'll assign them routes and see their work.</p>}
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
      {edit && <EditMember member={edit} onClose={() => setEdit(null)} isSelf={edit.uid === me?.uid} adminEditor={isAdmin} />}

      {/* Assign task */}
      {assignTo && me && <AssignTaskModal members={visible} preset={assignTo} createdBy={`${me.name} · ${roleLabel(me.role)}`} onClose={() => setAssignTo(null)} />}

      {/* Member's day */}
      {todayFor && <TodayModal member={todayFor} activity={activity[todayFor.uid] ?? null} onClose={() => setTodayFor(null)} />}
    </PartnerLayout>
  );
}

function ActivityRow({ activity }: { activity: Activity | null }) {
  const pres = presence(activity);
  const tone: BadgeTone = pres === 'active' ? 'success' : pres === 'break' ? 'warning' : 'neutral';
  const text = pres === 'active' ? 'Active now' : pres === 'break' ? 'On break' : activity ? 'Idle' : 'Offline today';
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
      <Badge tone={tone}>{pres === 'break' ? <><Coffee size={10} /> {text}</> : text}</Badge>
      {activity && (
        <span className="inline-flex items-center gap-1"><Clock size={11} /> {fmtClock(activity.firstAtMs)} → {activity.onBreak ? 'break' : fmtClock(activity.lastAtMs)} · {fmtActive(activity.activeMs)} active</span>
      )}
    </div>
  );
}

function TodayModal({ member, activity, onClose }: { member: Member; activity: Activity | null; onClose: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [act, setAct] = useState<Activity | null>(activity);
  const [entries, setEntries] = useState<WorklogEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => watchTasksFor(member.uid, setTasks), [member.uid]);
  useEffect(() => watchActivity(member.uid, setAct), [member.uid]);
  useEffect(() => watchWorklogFor(member.uid, setEntries), [member.uid]);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const todays = tasks.filter((t) => new Date(t.createdAtMs).toDateString() === new Date().toDateString() || t.status !== 'done');
  const pres = presence(act);

  return (
    <Modal open onClose={onClose} title={`${member.name} · today`} subtitle={today} submitLabel="Close" onSubmit={onClose}>
      <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-inset ring-neutral-100">
        <div className="flex items-center gap-2">
          <Badge tone={pres === 'active' ? 'success' : pres === 'break' ? 'warning' : 'neutral'}>{pres === 'active' ? 'Active now' : pres === 'break' ? 'On break' : 'Offline'}</Badge>
          <span className="text-xs text-neutral-600">{act ? `${fmtClock(act.firstAtMs)} → ${act.onBreak ? 'break' : fmtClock(act.lastAtMs)}` : 'No activity today'}</span>
        </div>
        {act && <div className="mt-1 text-xs text-neutral-500">{fmtActive(act.activeMs)} of active screen time</div>}
      </div>

      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Tasks</div>
      {todays.length === 0 && <p className="py-3 text-sm text-neutral-400">No tasks.</p>}
      <div className="space-y-2">
        {todays.map((t) => {
          const overdue = isOverdue(t, now);
          return (
            <div key={t.id} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ring-1 ring-inset ${overdue ? 'bg-rose-50 ring-rose-200' : 'bg-white ring-neutral-200'}`}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-neutral-900">{t.title}</div>
                <div className={`text-[11px] ${overdue ? 'font-bold text-rose-600' : 'text-neutral-400'}`}>{overdue ? 'Overdue' : t.status === 'done' ? 'Completed' : t.startedAtMs ? 'In progress' : 'Not started'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tabular-nums text-neutral-700">{fmtDuration(elapsedMs(t, now))}</span>
                <Badge tone={t.status === 'done' ? 'success' : overdue ? 'danger' : t.startedAtMs ? 'primary' : 'neutral'}>{t.status === 'done' ? 'Done' : t.startedAtMs ? 'Running' : 'Todo'}</Badge>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Work log</div>
      {entries.length === 0 && <p className="py-2 text-sm text-neutral-400">No entries logged today.</p>}
      <div className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.id} className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="mt-0.5 font-mono text-[11px] font-bold text-neutral-400">{fmtTime(e.atMs)}</span>
            <span className="flex-1">{e.text}</span>
          </div>
        ))}
      </div>
    </Modal>
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

function EditMember({ member, onClose, isSelf, adminEditor }: { member: Member; onClose: () => void; isSelf: boolean; adminEditor: boolean }) {
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
            {adminEditor && <option value="owner">Owner — everything</option>}
            {adminEditor && <option value="manager">Manager — full access</option>}
            {adminEditor && <option value="team_leader">Team Leader — sub-team</option>}
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
