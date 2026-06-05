import { useState, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthForm } from './AuthForm';

/**
 * Shown when the user clicks a password-reset link in their email.
 * Supabase redirects them back here with a recovery session active.
 */
function ResetPasswordForm() {
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const clearRecoveryMode = useAuthStore((s) => s.clearRecoveryMode);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) setError(result.error);
    else setSuccess(true);
  };

  return (
    <>
      <style>{`
        .reset-bg {
          position: fixed; inset: 0;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1025 25%, #0d1b2a 50%, #1a1025 75%, #0a0a0a 100%);
          background-size: 400% 400%;
          animation: reset-gradient 16s ease infinite;
          z-index: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        @keyframes reset-gradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .reset-card {
          width: min(440px, 92vw);
          padding: 40px 36px 36px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(24px) saturate(1.5);
          -webkit-backdrop-filter: blur(24px) saturate(1.5);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          animation: reset-fadein 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes reset-fadein {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .reset-input-wrap {
          position: relative; margin-bottom: 16px;
        }
        .reset-input {
          width: 100%; padding: 14px 16px;
          font-family: inherit; font-size: 15px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.92);
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .reset-input::placeholder { color: rgba(255, 255, 255, 0.35); }
        .reset-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(236, 255, 15, 0.12);
          background: rgba(255, 255, 255, 0.09);
        }

        .reset-pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px; cursor: pointer; padding: 4px 6px;
          transition: color 0.2s;
        }
        .reset-pw-toggle:hover { color: rgba(255, 255, 255, 0.7); }

        .reset-submit {
          width: 100%; padding: 14px 20px;
          font-family: inherit; font-size: 15px;
          font-weight: 600; letter-spacing: 0.03em;
          color: #0a0a0a; background: var(--color-accent);
          border: none; border-radius: 12px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .reset-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(236, 255, 15, 0.3);
        }
        .reset-submit:disabled {
          opacity: 0.6; cursor: not-allowed;
        }

        .reset-spinner {
          display: inline-block; width: 18px; height: 18px;
          border: 2px solid rgba(10, 10, 10, 0.2);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: reset-spin 0.65s linear infinite;
          vertical-align: middle;
        }
        @keyframes reset-spin { to { transform: rotate(360deg); } }

        .reset-error {
          background: rgba(235, 87, 87, 0.12);
          border: 1px solid rgba(235, 87, 87, 0.25);
          border-radius: 10px; padding: 10px 14px;
          color: #f87171; font-size: 13px;
          margin-top: 14px;
          animation: reset-shake 0.4s ease;
        }
        @keyframes reset-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .reset-success {
          background: rgba(39, 174, 96, 0.12);
          border: 1px solid rgba(39, 174, 96, 0.25);
          border-radius: 10px; padding: 10px 14px;
          color: #4ade80; font-size: 13px;
          margin-top: 14px;
        }

        .reset-skip {
          background: none; border: none;
          color: rgba(255, 255, 255, 0.4); font-size: 13px;
          cursor: pointer; padding: 4px 2px;
          font-family: inherit; transition: color 0.2s;
          margin-top: 16px;
        }
        .reset-skip:hover { color: var(--color-accent); }

        @media (max-width: 480px) {
          .reset-card {
            padding: 28px 22px 24px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="reset-bg">
        <div className="reset-card">
          {!success ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                  Set new password
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '6px 0 0' }}>
                  Choose a strong password for your Spatia account.
                </p>
              </div>

              <form onSubmit={onSubmit}>
                <div className="reset-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="reset-input"
                    style={{ paddingRight: 56 }}
                  />
                  <button
                    type="button"
                    className="reset-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="reset-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="reset-input"
                  />
                </div>

                <button type="submit" disabled={busy} className="reset-submit">
                  {busy ? <span className="reset-spinner" /> : 'Update password'}
                </button>

                {error && <div className="reset-error">{error}</div>}
              </form>

              <div style={{ textAlign: 'center' }}>
                <button className="reset-skip" onClick={clearRecoveryMode}>
                  Skip — I'll do this later
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: '0 0 8px' }}>
                Password updated!
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.5 }}>
                Your new password has been saved. You are now signed in.
              </p>
              <button
                onClick={clearRecoveryMode}
                className="reset-submit"
                style={{ width: 'auto', padding: '12px 32px' }}
              >
                Continue to Spatia
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const recoveryMode = useAuthStore((s) => s.recoveryMode);

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

  // User clicked a password-reset link and has an active recovery session.
  if (recoveryMode) return <ResetPasswordForm />;

  return <>{children}</>;
}
