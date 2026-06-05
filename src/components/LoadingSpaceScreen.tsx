import { useSpaceStore } from '../store/spaceStore';

export function LoadingSpaceScreen() {
  const progress = useSpaceStore((s) => s.loadProgress);
  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <>
      <style>{`
        .loader-bg {
          position: fixed; inset: 0;
          background: linear-gradient(135deg, #0a0a0a 0%, #11101f 40%, #0d1622 70%, #0a0a0a 100%);
          z-index: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .loader-ring {
          width: 56px;
          height: 56px;
          border: 3px solid rgba(255, 255, 255, 0.05);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          margin-bottom: 24px;
          box-shadow: 0 0 15px rgba(236, 255, 15, 0.15);
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .loader-title {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
        }

        .loader-track {
          width: 280px;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .loader-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent) 0%, #a3ff12 100%);
          box-shadow: 0 0 8px rgba(236, 255, 15, 0.4);
          transition: width 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .loader-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          font-variant-numeric: tabular-nums;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
      `}</style>

      <div className="loader-bg">
        <div className="loader-ring" />
        <div className="loader-title">Restoring your space…</div>
        <div className="loader-track">
          <div className="loader-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="loader-subtitle">
          {current} / {total} photos ({pct}%)
        </div>
      </div>
    </>
  );
}
