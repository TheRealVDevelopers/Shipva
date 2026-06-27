import { Route, Routes, Navigate } from 'react-router-dom';
import { StoreProvider } from './lib/store.js';
import { seedFeed, seedCompleted } from './lib/mocks.js';
import { Login } from './screens/Login.js';
import { Feed } from './screens/Feed.js';
import { Active } from './screens/Active.js';
import { Earnings } from './screens/Earnings.js';
import { Profile } from './screens/Profile.js';

export function App() {
  return (
    <StoreProvider seedFeed={seedFeed} seedCompleted={seedCompleted}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/active" element={<Active />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
}
