'use client';

import ThemeProvider from './ThemeProvider';
import AuthProvider from './AuthProvider';
import SocketProvider from './SocketProvider';
import VoiceCallModal from '@/components/chat/VoiceCallModal';
import ConnectionBanner from '@/components/ui/ConnectionBanner';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ConnectionBanner />
          {children}
          <VoiceCallModal />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
