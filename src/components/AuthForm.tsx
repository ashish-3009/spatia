import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

type Mode = 'sign-in' | 'sign-up' | 'magic-link' | 'forgot-password';

/* ─── floating particle config ─── */
const PARTICLE_COUNT = 24;
function spawnParticle() {
  return {
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    dur: 12 + Math.random() * 20,
    delay: Math.random() * -20,
    opacity: 0.15 + Math.random() * 0.25,
  };
}

export function AuthForm() {
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUpWithPassword = useAuthStore((s) => s.signUpWithPassword);
  const signInWithMagicLink = useAuthStore((s) => s.signInWithMagicLink);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const particles = useRef(Array.from({ length: PARTICLE_COUNT }, spawnParticle)).current;

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));

    // Parse error description from URL hash or query if present (e.g. from expired Supabase link)
    const hash = window.location.hash;
    const search = window.location.search;
    let errorMsg: string | null = null;

    if (hash && hash.includes('error_description')) {
      const params = new URLSearchParams(hash.substring(1));
      errorMsg = params.get('error_description');
    } else if (search && search.includes('error_description')) {
      const params = new URLSearchParams(search);
      errorMsg = params.get('error_description');
    }

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg.replace(/\+/g, ' ')));
      // Clean the URL (remove hash/search parameters) so it doesn't reappear on reload
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    let result: { error: string | null };
    if (mode === 'sign-in') result = await signInWithPassword(email, password);
    else if (mode === 'sign-up') result = await signUpWithPassword(email, password);
    else if (mode === 'forgot-password') result = await resetPassword(email);
    else result = await signInWithMagicLink(email);
    setBusy(false);
    if (result.error) setError(result.error);
    else if (mode === 'magic-link') setInfo('Check your email for the magic link.');
    else if (mode === 'sign-up') setInfo('Account created. Check your email if confirmation is required.');
    else if (mode === 'forgot-password') setInfo('Password reset link sent! Check your email inbox.');
  };

  const switchMode = (next: Mode) => {
    setError(null);
    setInfo(null);
    setMode(next);
  };

  const titles: Record<Mode, string> = {
    'sign-in': 'Welcome back',
    'sign-up': 'Create your space',
    'magic-link': 'Passwordless entry',
    'forgot-password': 'Reset password',
  };
  const subtitles: Record<Mode, string> = {
    'sign-in': 'Sign in to explore your 3D photo spaces.',
    'sign-up': 'Join Spatia — immersive photo visualization.',
    'magic-link': 'We\'ll send a secure link to your inbox.',
    'forgot-password': 'Enter your email to receive a reset link.',
  };
  const submitLabels: Record<Mode, string> = {
    'sign-in': 'Sign in',
    'sign-up': 'Create account',
    'magic-link': 'Send magic link',
    'forgot-password': 'Send reset link',
  };

  return (
    <>
      {/* ── inject scoped styles ── */}
      <style>{`
        /* ── animated gradient background ── */
        .auth-bg {
          position: fixed; inset: 0;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1025 25%, #0d1b2a 50%, #1a1025 75%, #0a0a0a 100%);
          background-size: 400% 400%;
          animation: auth-gradient 16s ease infinite;
          z-index: 0;
          overflow: hidden;
        }
        @keyframes auth-gradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ── floating particles ── */
        .auth-particle {
          position: absolute; border-radius: 50%;
          background: var(--color-accent);
          pointer-events: none;
          animation: auth-float linear infinite;
        }
        @keyframes auth-float {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: var(--p-opacity); }
          90%  { opacity: var(--p-opacity); }
          100% { transform: translateY(-110vh) translateX(30px); opacity: 0; }
        }

        /* ── glass card ── */
        .auth-card {
          position: relative; z-index: 2;
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
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .auth-card.entering {
          opacity: 0; transform: translateY(32px) scale(0.97);
        }
        .auth-card.entered {
          opacity: 1; transform: translateY(0) scale(1);
        }

        /* ── inputs ── */
        .auth-input-wrap {
          position: relative; margin-bottom: 16px;
        }
        .auth-input {
          width: 100%; padding: 14px 16px;
          font-family: inherit; font-size: 15px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.92);
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .auth-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(236, 255, 15, 0.12);
          background: rgba(255, 255, 255, 0.09);
        }

        /* ── password toggle ── */
        .auth-pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px; cursor: pointer; padding: 4px 6px;
          transition: color 0.2s;
        }
        .auth-pw-toggle:hover { color: rgba(255, 255, 255, 0.7); }

        /* ── submit button ── */
        .auth-submit {
          width: 100%; padding: 14px 20px;
          font-family: inherit; font-size: 15px;
          font-weight: 600; letter-spacing: 0.03em;
          color: #0a0a0a; background: var(--color-accent);
          border: none; border-radius: 12px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(236, 255, 15, 0.3);
        }
        .auth-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-submit:disabled {
          opacity: 0.6; cursor: not-allowed;
        }

        /* ── shimmer on submit button ── */
        .auth-submit::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
          background-size: 250% 100%;
          animation: auth-shimmer 2.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes auth-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── spinner ── */
        .auth-spinner {
          display: inline-block; width: 18px; height: 18px;
          border: 2px solid rgba(10, 10, 10, 0.2);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: auth-spin 0.65s linear infinite;
          vertical-align: middle;
        }
        @keyframes auth-spin { to { transform: rotate(360deg); } }

        /* ── mode toggle links ── */
        .auth-link {
          background: none; border: none;
          color: rgba(255, 255, 255, 0.45); font-size: 13px;
          cursor: pointer; padding: 4px 2px;
          font-family: inherit; transition: color 0.2s;
        }
        .auth-link:hover { color: var(--color-accent); }

        /* ── divider ── */
        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }
        .auth-divider span {
          color: rgba(255, 255, 255, 0.3); font-size: 12px;
          text-transform: uppercase; letter-spacing: 0.1em;
        }

        /* ── error / info ── */
        .auth-error {
          background: rgba(235, 87, 87, 0.12);
          border: 1px solid rgba(235, 87, 87, 0.25);
          border-radius: 10px; padding: 10px 14px;
          color: #f87171; font-size: 13px;
          margin-top: 14px;
          animation: auth-shake 0.4s ease;
        }
        @keyframes auth-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .auth-info {
          background: rgba(39, 174, 96, 0.12);
          border: 1px solid rgba(39, 174, 96, 0.25);
          border-radius: 10px; padding: 10px 14px;
          color: #4ade80; font-size: 13px;
          margin-top: 14px;
        }

        /* ── responsive ── */
        @media (max-width: 480px) {
          .auth-card {
            padding: 28px 22px 24px;
            border-radius: 16px;
          }
          .auth-title { font-size: 26px !important; }
          .auth-subtitle { font-size: 13px !important; }
        }
        @media (max-height: 600px) {
          .auth-card { padding: 20px 20px 18px; }
        }
      `}</style>

      {/* ── background ── */}
      <div className="auth-bg">
        {particles.map((p, i) => (
          <div
            key={i}
            className="auth-particle"
            style={{
              left: `${p.x}%`,
              bottom: '-10px',
              width: p.size,
              height: p.size,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              ['--p-opacity' as string]: p.opacity,
            }}
          />
        ))}

        {/* accent glow orbs */}
        <div
          style={{
            position: 'absolute',
            top: '15%', left: '20%',
            width: 320, height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,255,15,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'auth-gradient 20s ease infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%', right: '15%',
            width: 260, height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(47,128,237,0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
            animation: 'auth-gradient 14s ease infinite reverse',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── centered form ── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* brand */}
          <div
            style={{
              textAlign: 'center', marginBottom: 24,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(-16px)',
              transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s',
            }}
          >
            <h1
              className="auth-title"
              style={{
                fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em',
                color: '#fff',
                margin: 0,
                textShadow: '0 0 30px rgba(236,255,15,0.15)',
              }}
            >
              Spatia
            </h1>
            <p
              className="auth-subtitle"
              style={{
                fontSize: 15, color: 'rgba(255,255,255,0.5)',
                margin: '6px 0 0',
              }}
            >
              Immersive 3D photo spaces
            </p>
          </div>

          {/* card */}
          <div className={`auth-card ${mounted ? 'entered' : 'entering'}`}>
            {/* mode header */}
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontSize: 22, fontWeight: 600, color: '#fff',
                  margin: 0, letterSpacing: '-0.01em',
                }}
              >
                {titles[mode]}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '6px 0 0' }}>
                {subtitles[mode]}
              </p>
            </div>

            <form ref={formRef} onSubmit={onSubmit}>
              {/* Email */}
              <div className="auth-input-wrap">
                <input
                  id="auth-email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>

              {/* Password */}
              {mode !== 'magic-link' && mode !== 'forgot-password' && (
                <div className="auth-input-wrap">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                    className="auth-input"
                    style={{ paddingRight: 56 }}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}

              {/* Forgot password link (only on sign-in) */}
              {mode === 'sign-in' && (
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode('forgot-password')}
                    style={{ fontSize: 12 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                id="auth-submit"
                type="submit"
                disabled={busy}
                className="auth-submit"
              >
                {busy ? <span className="auth-spinner" /> : submitLabels[mode]}
              </button>

              {/* errors / info */}
              {error && <div className="auth-error">{error}</div>}
              {info && <div className="auth-info">{info}</div>}
            </form>

            {/* divider + mode switches */}
            <div className="auth-divider"><span>or</span></div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {mode === 'sign-in' && (
                <>
                  <button className="auth-link" onClick={() => switchMode('sign-up')}>
                    Create an account
                  </button>
                  <button className="auth-link" onClick={() => switchMode('magic-link')}>
                    Use magic link
                  </button>
                </>
              )}
              {mode === 'sign-up' && (
                <button className="auth-link" onClick={() => switchMode('sign-in')}>
                  ← Already have an account? Sign in
                </button>
              )}
              {mode === 'magic-link' && (
                <button className="auth-link" onClick={() => switchMode('sign-in')}>
                  ← Use password instead
                </button>
              )}
              {mode === 'forgot-password' && (
                <button className="auth-link" onClick={() => switchMode('sign-in')}>
                  ← Back to sign in
                </button>
              )}
            </div>
          </div>

          {/* footer */}
          <p
            style={{
              fontSize: 11, color: 'rgba(255,255,255,0.25)',
              marginTop: 20, textAlign: 'center',
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.6s ease 0.5s',
            }}
          >
            Your photos never leave your device · End-to-end private
          </p>
        </div>
      </div>
    </>
  );
}
