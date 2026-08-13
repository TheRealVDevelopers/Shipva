import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Route, Truck, FileCheck2, UserCog, Users, FileText, Fuel, Wallet,
  HandCoins, BarChart3, TrendingUp, PackageSearch, Navigation, BadgeCheck, Building2,
  Settings as SettingsIcon, MessageCircle, MessagesSquare, FileSpreadsheet,
  Bell, Menu, X, Volume2, VolumeX, CheckCheck, LogOut, User as UserIcon, BookOpen, ExternalLink,
  Clock, MapPin, type LucideIcon,
} from 'lucide-react';
import { LogoMark } from '../art.js';
import { subscription } from '../../lib/mocks.js';
import { FEATURES, type FeatureId } from '../../lib/features.js';
import { useNotify } from '../../lib/notify.js';
import { roleLabel, canExportData } from '../../lib/roles.js';
import { useAuth } from '../../lib/auth.js';
import { memberCanAccess, watchMembers } from '../../lib/members.js';
import { touchActivity } from '../../lib/activity.js';
import { watchAllTasks, isOverdue, type Task } from '../../lib/tasks.js';
import { BRAND } from '../../lib/brand.js';
import { useStore } from '../../lib/store.js';
import { dueAlerts, takeUnsent, alertTitle, alertBody, showDesktopAlert, requestAlertPermission, alertsEnabled } from '../../lib/tripAlerts.js';
import { dueForReminder, toIso } from '../../lib/vendorMis.js';
import { rupees } from '../../lib/format.js';

/** Heartbeat that records screen-time while the tab is visible. The owner is a
 *  supervisor of the team, not a tracked worker, so we skip tracking for them. */
function useActivityHeartbeat() {
  const { member, status } = useAuth();
  const uid = member?.uid; const name = member?.name; const role = member?.role;
  useEffect(() => {
    if (status !== 'ready' || !uid || !name || role === 'owner') return;
    const beat = () => { if (document.visibilityState === 'visible') void touchActivity(uid, name); };
    beat();
    const id = window.setInterval(beat, 60_000);
    document.addEventListener('visibilitychange', beat);
    window.addEventListener('focus', beat);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', beat); window.removeEventListener('focus', beat); };
  }, [status, uid, name, role]);
}

/**
 * Point 3: a ticket one hour before every scheduled arrival and departure on
 * a run you're responsible for. Clicking it opens that run's update screen.
 *
 * Runs app-wide from the layout so it fires on any page. `tours` is already
 * scoped to the signed-in member (see watchToursFs), so a POC only ever gets
 * reminders for their own lines and leadership gets their team's.
 */
function useTripReminders() {
  const { status } = useAuth();
  const { tours } = useStore();
  const { push } = useNotify();
  const navigate = useNavigate();
  // Keep the newest tours in a ref so the interval doesn't need re-creating
  // every time a snapshot lands.
  const toursRef = useRef(tours);
  toursRef.current = tours;

  useEffect(() => {
    if (status !== 'ready') return;
    const tick = () => {
      const fresh = takeUnsent(dueAlerts(toursRef.current));
      fresh.forEach((a) => {
        // The Trips board is where a run is opened and updated; `?open=<id>`
        // opens its update pop-up straight away. The same link rides on the
        // in-app notification so clicking the bell-tray entry works too, not
        // only the desktop notification.
        const link = `/p/trips?q=${encodeURIComponent(a.tourCode)}&open=${encodeURIComponent(a.tourId)}`;
        push({ title: alertTitle(a), body: alertBody(a), tone: 'warning', link });
        showDesktopAlert(a, () => navigate(link));
      });
    };
    tick();
    // A minute is fine: the reminder window is ten minutes wide.
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [status, push, navigate]);
}

/**
 * Vendor payment due-date reminders — the client's "send automatic reminders to
 * the accounts team on due dates".
 *
 * Only the people who actually settle vendors are told: owner, manager and
 * accountant. `reminderOn` is stamped on the row once it fires, so the reminder
 * is once per MIS per day no matter how many of them have the app open, and it
 * survives a refresh.
 */
function useVendorDueReminders() {
  const { member, status } = useAuth();
  const { invoices, updateInvoice } = useStore();
  const { push } = useNotify();
  const navigate = useNavigate();
  const seesMoney = member?.role === 'owner' || member?.role === 'manager' || member?.role === 'accountant';

  const invRef = useRef(invoices);
  invRef.current = invoices;

  useEffect(() => {
    if (status !== 'ready' || !seesMoney) return;
    const tick = () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      dueForReminder(invRef.current, todayIso).forEach((i) => {
        const overdue = toIso(i.dueDate) < todayIso;
        push({
          title: overdue ? 'Vendor payment overdue' : 'Vendor payment due today',
          body: `${i.client} · ${rupees(i.totalPaise)} · ${i.no}`,
          tone: overdue ? 'warning' : 'info',
          link: '/p/invoices',
        });
        // Stamp it so it doesn't fire again today, here or on anyone else's screen.
        updateInvoice(i.no, { reminderOn: todayIso });
      });
    };
    tick();
    // Hourly is plenty for a date-based rule, and it catches a session left
    // open across midnight.
    const id = window.setInterval(tick, 3_600_000);
    return () => window.clearInterval(id);
  }, [status, seesMoney, push, navigate, updateInvoice]);
}

/**
 * Task alerts — chime + notification when a watched teammate finishes a task or
 * crosses a deadline. Owner and manager watch the whole org; a team leader
 * watches their own POCs, so when a POC is moved to a new TL their task updates
 * follow to that TL (the client's TL-change requirement). Pre-existing states
 * are primed so only live transitions notify.
 */
function useTeamTaskAlerts() {
  const { member, status } = useAuth();
  const { push } = useNotify();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  const isTL = member?.role === 'team_leader';
  const enabled = isAdmin || isTL;

  // A TL's POCs — recomputed live, so a reassignment (in either direction)
  // changes who they're alerted about without a reload.
  const [myPocUids, setMyPocUids] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (status !== 'ready' || !isTL || !member) { setMyPocUids(null); return; }
    return watchMembers((list) => {
      setMyPocUids(new Set(list.filter((x) => x.leaderUid === member.uid).map((x) => x.uid)));
    });
  }, [status, isTL, member?.uid]);

  const tasksRef = useRef<Task[]>([]);
  const prevStatus = useRef<Map<string, string>>(new Map());
  const notifiedDone = useRef<Set<string>>(new Set());
  const notifiedOverdue = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  // A TL only hears about their own POCs; an admin hears about everyone.
  const watched = (t: Task) => isAdmin || (myPocUids?.has(t.assigneeUid) ?? false);

  useEffect(() => {
    if (status !== 'ready' || !enabled) return;
    // A TL's watch can't run until their POC set has loaded, or it would prime
    // against an empty set and miss the first transitions.
    if (isTL && myPocUids === null) return;
    primed.current = false;
    prevStatus.current = new Map();
    notifiedDone.current = new Set();
    notifiedOverdue.current = new Set();

    const unsub = watchAllTasks((tasks) => {
      tasksRef.current = tasks;
      if (!primed.current) {
        tasks.forEach((t) => {
          prevStatus.current.set(t.id, t.status);
          if (t.status === 'done') notifiedDone.current.add(t.id);
          if (isOverdue(t)) notifiedOverdue.current.add(t.id);
        });
        primed.current = true;
        return;
      }
      tasks.forEach((t) => {
        const prev = prevStatus.current.get(t.id);
        if (t.status === 'done' && prev !== 'done' && !notifiedDone.current.has(t.id) && watched(t)) {
          notifiedDone.current.add(t.id);
          push({ title: 'Task completed ✅', body: `${t.assigneeName} completed: ${t.title}`, tone: 'success' });
        }
        prevStatus.current.set(t.id, t.status);
      });
    });

    const overdueTimer = window.setInterval(() => {
      if (!primed.current) return;
      const now = Date.now();
      tasksRef.current.forEach((t) => {
        if (isOverdue(t, now) && !notifiedOverdue.current.has(t.id) && watched(t)) {
          notifiedOverdue.current.add(t.id);
          push({ title: 'Task overdue ⏰', body: `${t.assigneeName}'s task is overdue: ${t.title}`, tone: 'warning' });
        }
      });
    }, 20_000);

    return () => { unsub(); window.clearInterval(overdueTimer); };
  }, [status, enabled, isTL, myPocUids, push]);
}

interface NavItem { key: FeatureId; to: string; label: string; icon: LucideIcon; end?: boolean; group?: string; soon?: boolean }

const NAV: NavItem[] = [
  { key: 'overview', to: '/p', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { key: 'trips', to: '/p/trips', label: 'Trips', icon: ClipboardList, group: 'Operations' },
  { key: 'tours', to: '/p/tours', label: 'Amazon Tours', icon: Route, group: 'Operations' },
  { key: 'locations', to: '/p/locations', label: 'Locations', icon: MapPin, group: 'Operations' },
  { key: 'documents', to: '/p/documents', label: 'Documents', icon: FileCheck2, group: 'Operations' },
  // Vendors Register — the client's structure: transporters and truck owners,
  // plus the Trucks & Drivers page split into its two registers. All four are
  // the same vendor book, so Trucks & Drivers no longer sits under Operations.
  { key: 'customers', to: '/p/customers', label: 'Transporters', icon: Users, group: 'Vendors Register' },
  { key: 'payables', to: '/p/payables', label: 'Truck Owners', icon: HandCoins, group: 'Vendors Register' },
  { key: 'fleet', to: '/p/trucks', label: 'Truck Register', icon: Truck, group: 'Vendors Register' },
  { key: 'fleet', to: '/p/drivers', label: 'Driver Register', icon: Users, group: 'Vendors Register' },
  { key: 'invoices', to: '/p/invoices', label: 'Vendor Payments', icon: FileText, group: 'Accounts' },
  { key: 'expenses', to: '/p/expenses', label: 'Expenses & Fuel', icon: Fuel, group: 'Accounts' },
  { key: 'diesel', to: '/p/diesel', label: 'Diesel Requests', icon: Fuel, group: 'Accounts' },
  { key: 'payroll', to: '/p/payroll', label: 'Payroll & HR', icon: Wallet, group: 'Accounts' },
  { key: 'reports', to: '/p/reports', label: 'Reports', icon: BarChart3, group: 'Accounts' },
  { key: 'earnings', to: '/p/earnings', label: 'Earnings', icon: TrendingUp, group: 'Accounts' },
  { key: 'team', to: '/p/team', label: 'Team & Roles', icon: UserCog, group: 'Admin' },
  { key: 'activity', to: '/p/activity', label: 'Activity Log', icon: Clock, group: 'Admin' },
  { key: 'messages', to: '/p/messages', label: 'WhatsApp', icon: MessageCircle, group: 'Tools' },
  { key: 'chat', to: '/p/chat', label: 'Team Chat', icon: MessagesSquare, group: 'Tools' },
  { key: 'export', to: '/p/export', label: 'Data Export', icon: FileSpreadsheet, group: 'Tools' },
  { key: 'loads', to: '/p/loads', label: 'Load Board', icon: PackageSearch, group: 'Marketplace', soon: true },
  { key: 'jobs', to: '/p/jobs', label: 'Active Jobs', icon: Navigation, group: 'Marketplace', soon: true },
  { key: 'subscription', to: '/p/subscription', label: 'Subscription', icon: BadgeCheck, group: 'Account' },
  { key: 'profile', to: '/p/profile', label: 'Profile', icon: Building2, group: 'Account' },
  { key: 'settings', to: '/p/settings', label: 'Settings', icon: SettingsIcon, group: 'Account' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { member } = useAuth();
  // Export and the activity log carry an extra rule the page permission can't
  // express: Admin + Team Leader only, per the client. Mirrors App.tsx.
  const leadershipOnly = (k: FeatureId) => k === 'export' || k === 'activity';
  const visible = NAV.filter((n) => FEATURES[n.key] && memberCanAccess(member, n.key)
    && (!leadershipOnly(n.key) || canExportData(member?.role)));
  let lastGroup: string | undefined;
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark className="h-8 w-8" />
        <div>
          <div className="text-sm font-extrabold leading-none">{BRAND.name}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-400">{BRAND.tagline}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {visible.map(({ to, label, icon: Icon, end, soon, group }, i) => {
            const showGroup = group && group !== lastGroup;
            lastGroup = group;
            return (
              <Fragment key={to}>
                {showGroup && (
                  <li className={`px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-primary-300/70 ${i === 0 ? '' : 'pt-4'}`}>{group}</li>
                )}
                <li>
                  <NavLink
                    to={to}
                    end={end ?? false}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                        isActive ? 'bg-white/10 text-white' : 'text-primary-200 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-accent-400" />}
                        <Icon size={17} /> <span className="flex-1">{label}</span>
                        {soon && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-primary-200">SOON</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </nav>

      {/* User guide — always visible to everyone */}
      <a
        href={`${import.meta.env.BASE_URL}guide.html`}
        target="_blank" rel="noreferrer" onClick={onNavigate}
        className="group mx-3 mb-2 flex items-center gap-3 rounded-lg bg-white/[0.06] px-3 py-2.5 text-sm font-bold text-primary-100 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
      >
        <BookOpen size={17} /> <span className="flex-1">User Guide</span>
        <ExternalLink size={13} className="opacity-60" />
      </a>

      {FEATURES.subscription && (
        <div className="m-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">{subscription.tier} plan</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Active</span>
          </div>
          <div className="mt-1.5 text-[11px] text-primary-200">{subscription.driversUsed}/{subscription.driverSlots} driver slots</div>
        </div>
      )}
    </>
  );
}

function timeAgo(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function NotificationBell() {
  const { notes, unread, soundOn, toggleSound, markAllRead, clear } = useNotify();
  const navigate = useNavigate();
  const [desktopOn, setDesktopOn] = useState(alertsEnabled());
  const [open, setOpen] = useState(false);
  const toneDot = { info: 'bg-sky-500', success: 'bg-emerald-500', warning: 'bg-amber-500' };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}
        className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100" aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">{unread}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
              <span className="text-sm font-extrabold text-neutral-900">Notifications</span>
              <div className="flex items-center gap-1">
                <button onClick={toggleSound} title={soundOn ? 'Sound on' : 'Sound off'} className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100">
                  {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button onClick={markAllRead} title="Mark all read" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"><CheckCheck size={15} /></button>
              </div>
            </div>
            {/* Desktop alerts must be asked for from a real click — browsers
                reject the prompt on page load. Trip reminders (1 hour before an
                arrival or departure) always reach this tray; turning this on
                also pops them over other windows. */}
            {!desktopOn && (
              <button
                onClick={async () => { const ok = await requestAlertPermission(); setDesktopOn(ok); }}
                className="flex w-full items-center gap-2 border-b border-neutral-100 bg-amber-50/60 px-4 py-2 text-left text-[11px] font-bold text-amber-800 hover:bg-amber-50">
                <Bell size={12} /> Turn on desktop alerts for trip reminders
              </button>
            )}
            <div className="max-h-80 overflow-y-auto">
              {notes.length === 0 && <p className="px-4 py-8 text-center text-sm text-neutral-400">No notifications.</p>}
              {notes.map((n) => {
                // A notification with a link (a trip reminder) navigates to the
                // run's update screen when clicked — the client's "clicking a
                // notification opens the trip directly". Others stay static.
                const row = (
                  <>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneDot[n.tone]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-neutral-900">{n.title}</div>
                      <div className="text-xs text-neutral-600">{n.body}</div>
                      <div className="mt-0.5 text-[10px] text-neutral-400">{timeAgo(n.ts)}{n.link && ' · tap to open'}</div>
                    </div>
                  </>
                );
                const base = `flex w-full gap-3 border-b border-neutral-50 px-4 py-3 text-left ${n.read ? '' : 'bg-primary-50/40'}`;
                return n.link ? (
                  <button key={n.id} onClick={() => { markAllRead(); setOpen(false); navigate(n.link!); }}
                    className={`${base} hover:bg-primary-50`}>{row}</button>
                ) : (
                  <div key={n.id} className={base}>{row}</div>
                );
              })}
            </div>
            {notes.length > 0 && (
              <button onClick={clear} className="w-full border-t border-neutral-100 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-50">Clear all</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const { member, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = (member?.name || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="relative pl-2 border-l border-neutral-200">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-neutral-100">
        {member?.photoUrl
          ? <img src={member.photoUrl} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
          : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-extrabold text-white">{initials}</div>}
        <div className="hidden text-left sm:block">
          <div className="text-xs font-extrabold text-neutral-900 leading-none">{member?.name || 'You'}</div>
          <div className="mt-0.5 text-[10px] text-neutral-500">{member ? roleLabel(member.role) : ''}</div>
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-neutral-200">
            <div className="border-b border-neutral-100 px-4 py-3">
              <div className="text-sm font-extrabold text-neutral-900">{member?.name}</div>
              <div className="truncate text-[11px] text-neutral-500">{member?.email}</div>
            </div>
            <NavLink to="/p/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              <UserIcon size={15} className="text-neutral-400" /> My profile
            </NavLink>
            <button onClick={() => { setOpen(false); void signOutUser(); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function PartnerLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  useActivityHeartbeat();
  useTeamTaskAlerts();
  useTripReminders();
  useVendorDueReminders();
  return (
    <div className="flex h-screen bg-neutral-50">
      <aside className="hidden md:flex md:w-64 md:flex-col bg-primary-900 text-white">
        <SidebarContent />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="animate-fade absolute inset-y-0 left-0 flex w-64 flex-col bg-primary-900 text-white shadow-lift">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-primary-200 hover:bg-white/10" aria-label="Close menu"><X size={18} /></button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden" aria-label="Open menu"><Menu size={18} /></button>
            <div>
              <h1 className="text-base font-extrabold text-neutral-900 leading-tight">{title}</h1>
              {subtitle && <p className="hidden text-xs text-neutral-500 mt-0.5 sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 animate-fade">{children}</main>
      </div>
    </div>
  );
}
