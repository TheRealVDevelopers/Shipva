import { Route, Routes, Navigate } from 'react-router-dom';
import { Login } from './routes/partner/Login.js';
import { Overview } from './routes/partner/Overview.js';
import { Trips } from './routes/partner/Trips.js';
import { Tours } from './routes/partner/Tours.js';
import { Team } from './routes/partner/Team.js';
import { Customers } from './routes/partner/Customers.js';
import { Documents } from './routes/partner/Documents.js';
import { Invoices } from './routes/partner/Invoices.js';
import { Expenses } from './routes/partner/Expenses.js';
import { Payables } from './routes/partner/Payables.js';
import { Payroll } from './routes/partner/Payroll.js';
import { Reports } from './routes/partner/Reports.js';
import { Settings } from './routes/partner/Settings.js';
import { Messages } from './routes/partner/Messages.js';
import { Chat } from './routes/partner/Chat.js';
import { ExportData } from './routes/partner/ExportData.js';
import { LoadBoard } from './routes/partner/LoadBoard.js';
import { ActiveJobs } from './routes/partner/ActiveJobs.js';
import { Fleet } from './routes/partner/Fleet.js';
import { Earnings } from './routes/partner/Earnings.js';
import { Subscription } from './routes/partner/Subscription.js';
import { Profile } from './routes/partner/Profile.js';
import { LogoMark } from './components/art.js';
import { FEATURES, type FeatureId } from './lib/features.js';
import { useAuth } from './lib/auth.js';
import { memberCanAccess } from './lib/members.js';
import { canExportData } from './lib/roles.js';

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="flex flex-col items-center gap-3 text-neutral-400">
        <LogoMark className="h-10 w-10 animate-pulse" />
        <span className="text-sm font-bold">Loading…</span>
      </div>
    </div>
  );
}

export function App() {
  const { status, member } = useAuth();

  if (status === 'loading') return <Splash />;
  if (status !== 'ready' || !member) return <Login />;

  /** Register a /p/* route only when its feature is enabled AND this member may access it. */
  // `when` carries an extra rule the page permission can't express — see the
  // export route, which is role-gated on top of the member's granted pages.
  const Gated = ({ id, path, element, when = true }: { id: FeatureId; path: string; element: JSX.Element; when?: boolean }) =>
    FEATURES[id] && when && memberCanAccess(member, id) ? <Route path={path} element={element} /> : null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/p" replace />} />
      <Route path="/login" element={<Navigate to="/p" replace />} />
      <Route path="/p" element={<Overview />} />

      {Gated({ id: 'trips', path: '/p/trips', element: <Trips /> })}
      {Gated({ id: 'tours', path: '/p/tours', element: <Tours /> })}
      {/* The Trucks & Drivers page is now the two registers under Vendors
          Register. Same 'fleet' permission for both — splitting the feature id
          would silently drop access for every member already granted 'fleet'.
          /p/fleet stays as a redirect so old links keep working. */}
      {Gated({ id: 'fleet', path: '/p/drivers', element: <Fleet register="drivers" /> })}
      {Gated({ id: 'fleet', path: '/p/trucks', element: <Fleet register="trucks" /> })}
      <Route path="/p/fleet" element={<Navigate to="/p/drivers" replace />} />
      {Gated({ id: 'documents', path: '/p/documents', element: <Documents /> })}
      {Gated({ id: 'customers', path: '/p/customers', element: <Customers /> })}
      {Gated({ id: 'payables', path: '/p/payables', element: <Payables /> })}
      {Gated({ id: 'invoices', path: '/p/invoices', element: <Invoices /> })}
      {Gated({ id: 'expenses', path: '/p/expenses', element: <Expenses /> })}
      {Gated({ id: 'payroll', path: '/p/payroll', element: <Payroll /> })}
      {Gated({ id: 'reports', path: '/p/reports', element: <Reports /> })}
      {Gated({ id: 'earnings', path: '/p/earnings', element: <Earnings /> })}
      {Gated({ id: 'team', path: '/p/team', element: <Team /> })}
      {Gated({ id: 'messages', path: '/p/messages', element: <Messages /> })}
      {Gated({ id: 'chat', path: '/p/chat', element: <Chat /> })}
      {/* Export is Admin + Team Leader only, per the client — role-gated on top
          of the page permission, since a member's granted pages predate the rule. */}
      {Gated({ id: 'export', path: '/p/export', element: <ExportData />, when: canExportData(member?.role) })}
      {Gated({ id: 'loads', path: '/p/loads', element: <LoadBoard /> })}
      {Gated({ id: 'jobs', path: '/p/jobs', element: <ActiveJobs /> })}
      {Gated({ id: 'subscription', path: '/p/subscription', element: <Subscription /> })}
      <Route path="/p/profile" element={<Profile />} />
      {Gated({ id: 'settings', path: '/p/settings', element: <Settings /> })}

      {/* Disabled sections and unknown URLs land on the dashboard. */}
      <Route path="*" element={<Navigate to="/p" replace />} />
    </Routes>
  );
}
