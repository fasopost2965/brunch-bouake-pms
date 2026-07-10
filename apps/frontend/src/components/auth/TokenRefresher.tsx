'use client';

import { useEffect, useRef } from 'react';
import { refreshAccessToken, logoutAction } from '@/lib/auth.actions';

export function TokenRefresher({ hasAccessToken }: { hasAccessToken: boolean }) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!hasAccessToken && !attempted.current) {
      attempted.current = true;
      refreshAccessToken().then((newToken) => {
        if (!newToken) {
          logoutAction();
        } else {
          // Force a reload to have the new cookie available in server components
          window.location.reload();
        }
      });
    }
  }, [hasAccessToken]);

  if (!hasAccessToken) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-bg-page)' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Authentification en cours...</p>
      </div>
    );
  }

  return null;
}
