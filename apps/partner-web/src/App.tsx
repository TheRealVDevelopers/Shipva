import { Route, Routes, Navigate } from 'react-router-dom';
import { Login } from './routes/partner/Login.js';
import { Overview } from './routes/partner/Overview.js';
import { Trips } from './routes/partner/Trips.js';
import { Team } from './routes/partner/Team.js';
import { Customers } from './routes/partner/Customers.js';
import { Invoices } from './routes/partner/Invoices.js';
import { Expenses } from './routes/partner/Expenses.js';
import { Payables } from './routes/partner/Payables.js';
import { Payroll } from './routes/partner/Payroll.js';
import { LoadBoard } from './routes/partner/LoadBoard.js';
import { ActiveJobs } from './routes/partner/ActiveJobs.js';
import { Fleet } from './routes/partner/Fleet.js';
import { Earnings } from './routes/partner/Earnings.js';
import { Subscription } from './routes/partner/Subscription.js';
import { Profile } from './routes/partner/Profile.js';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/p" element={<Overview />} />
      <Route path="/p/trips" element={<Trips />} />
      <Route path="/p/team" element={<Team />} />
      <Route path="/p/customers" element={<Customers />} />
      <Route path="/p/invoices" element={<Invoices />} />
      <Route path="/p/expenses" element={<Expenses />} />
      <Route path="/p/payables" element={<Payables />} />
      <Route path="/p/payroll" element={<Payroll />} />
      <Route path="/p/loads" element={<LoadBoard />} />
      <Route path="/p/jobs" element={<ActiveJobs />} />
      <Route path="/p/fleet" element={<Fleet />} />
      <Route path="/p/earnings" element={<Earnings />} />
      <Route path="/p/subscription" element={<Subscription />} />
      <Route path="/p/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
