import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthForm } from './AuthForm';

export function AuthGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1025 50%, #0d1b2a 100%)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 14px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              letterSpacing: '0.04em',
            }}
          >
            Loading…
          </span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthForm />;
  return <>{children}</>;
}
