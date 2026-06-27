import { Route, Routes, Navigate } from 'react-router-dom';
import { Login } from './routes/Login.js';
import { Dashboard } from './routes/ops/Dashboard.js';
import { Bookings } from './routes/ops/Bookings.js';
import { Dispatch } from './routes/ops/Dispatch.js';
import { Auctions } from './routes/ops/Auctions.js';
import { Drivers } from './routes/ops/Drivers.js';
import { Transporters } from './routes/ops/Transporters.js';
import { Settings } from './routes/ops/Settings.js';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route path="/ops" element={<Dashboard />} />
      <Route path="/ops/bookings" element={<Bookings />} />
      <Route path="/ops/dispatch" element={<Dispatch />} />
      <Route path="/ops/auctions" element={<Auctions />} />
      <Route path="/ops/drivers" element={<Drivers />} />
      <Route path="/ops/transporters" element={<Transporters />} />
      <Route path="/ops/settings" element={<Settings />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
