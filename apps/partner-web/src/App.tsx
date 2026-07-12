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
import { FEATURES, type FeatureId } from './lib/features.js';
import { useRole, canAccess } from './lib/roles.js';

export function App() {
  const { role } = useRole();
  /** Register a /p/* route only when its feature is enabled AND the current role
   *  may access it. Disabled/blocked URLs fall through to the dashboard. */
  const Gated = ({ id, path, element }: { id: FeatureId; path: string; element: JSX.Element }) =>
    FEATURES[id] && canAccess(role, id) ? <Route path={path} element={element} /> : null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/p" element={<Overview />} />

      {Gated({ id: 'trips', path: '/p/trips', element: <Trips /> })}
      {Gated({ id: 'tours', path: '/p/tours', element: <Tours /> })}
      {Gated({ id: 'fleet', path: '/p/fleet', element: <Fleet /> })}
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
      {Gated({ id: 'export', path: '/p/export', element: <ExportData /> })}
      {Gated({ id: 'loads', path: '/p/loads', element: <LoadBoard /> })}
      {Gated({ id: 'jobs', path: '/p/jobs', element: <ActiveJobs /> })}
      {Gated({ id: 'subscription', path: '/p/subscription', element: <Subscription /> })}
      {Gated({ id: 'profile', path: '/p/profile', element: <Profile /> })}
      {Gated({ id: 'settings', path: '/p/settings', element: <Settings /> })}

      {/* Disabled sections and unknown URLs land on the dashboard. */}
      <Route path="*" element={<Navigate to="/p" replace />} />
    </Routes>
  );
}
