import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@shipva/ui/tokens.css';
import './index.css';
import { App } from './App.js';
import { StoreProvider } from './lib/store.js';
import { NotificationsProvider } from './lib/notify.js';
import { ChatProvider } from './lib/chat.js';
import { AuthProvider } from './lib/auth.js';
import { BRAND } from './lib/brand.js';

document.title = `${BRAND.name} — ${BRAND.tagline}`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <AuthProvider>
        <StoreProvider>
          <NotificationsProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </NotificationsProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
