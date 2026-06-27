import { Route, Routes, Navigate } from 'react-router-dom';
import { StoreProvider } from './lib/store.js';
import { seedBookings } from './lib/mocks.js';
import { Welcome } from './screens/Welcome.js';
import { Home } from './screens/Home.js';
import { QuickBooking } from './screens/QuickBooking.js';
import { Searching } from './screens/Searching.js';
import { AuctionPost } from './screens/AuctionPost.js';
import { AuctionDetail } from './screens/AuctionDetail.js';
import { Tracking } from './screens/Tracking.js';
import { History } from './screens/History.js';
import { Profile } from './screens/Profile.js';

export function App() {
  return (
    <StoreProvider seed={seedBookings}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/book" element={<QuickBooking />} />
        <Route path="/searching/:id" element={<Searching />} />
        <Route path="/auction" element={<AuctionPost />} />
        <Route path="/auction/:id" element={<AuctionDetail />} />
        <Route path="/track/:id" element={<Tracking />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
}
