import { Fragment, useEffect, useRef, useState } from 'react';
import { useHandStore } from '../store/handStore';
import { handTracker } from '../lib/handTracking';

/**
 * Full-screen AR passthrough: the live (mirrored) webcam fills the viewport behind the
 * transparent 3D canvas, so photos appear to float in the room around you. Also owns the
 * webcam start/stop lifecycle driven by the hand-control toggle.
 */
export function CameraLayer() {
  const enabled = useHandStore((s) => s.enabled);
  const status = useHandStore((s) => s.status);
  const errorMessage = useHandStore((s) => s.errorMessage);
  const setStatus = useHandStore((s) => s.setStatus);
  const bgRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (!enabled) {
      handTracker.stop();
      setStatus('off');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setStatus('requesting-permission');
        await handTracker.start();
        if (cancelled) {
          handTracker.stop();
          return;
        }
        setStatus('active');
        const video = handTracker.getVideoElement();
        if (video && bgRef.current) {
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          // Mirror so the user sees themselves naturally (matches the mirrored landmarks).
          video.style.transform = 'scaleX(-1)';
          bgRef.current.appendChild(video);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
              ? 'Camera permission denied. Enable it in your browser settings.'
              : err.message
            : 'Failed to start hand tracking.';
        setStatus('error', msg);
      }
    })();

    return () => {
      cancelled = true;
      handTracker.stop();
      if (bgRef.current) bgRef.current.replaceChildren();
    };
  }, [enabled, setStatus]);

  // Auto-dismiss the gesture cheat sheet after a few seconds.
  useEffect(() => {
    if (status !== 'active') return;
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 9000);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <>
      <style>{`
        .camera-fallback-dark {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #060608;
          transition: background 0.5s ease;
        }

        .cam-status-panel {
          position: fixed;
          inset: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .cam-status-card {
          padding: 16px 24px;
          background: rgba(20, 20, 24, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cam-status-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: cam-spin 0.65s linear infinite;
        }
        @keyframes cam-spin { to { transform: rotate(360deg); } }

        .gesture-hud-panel {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: min(580px, 94vw);
          pointer-events: none;
        }

        .gesture-cheat-sheet {
          background: rgba(15, 15, 20, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          pointer-events: auto;
          width: 100%;
        }

        .gesture-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 16px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.4;
          max-height: 25vh;
          overflow-y: auto;
        }
        .gesture-grid::-webkit-scrollbar {
          width: 4px;
        }
        .gesture-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .gesture-icon-pill {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 2px 6px;
          font-family: inherit;
          color: var(--color-accent);
          font-weight: 600;
          white-space: nowrap;
        }

        .gesture-toggle-btn {
          background: rgba(18, 18, 22, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 16px;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .gesture-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
      `}</style>

      {/* Webcam fills the viewport */}
      <div
        ref={bgRef}
        className="camera-fallback-dark"
      />

      {enabled && status !== 'active' && (
        <div className="cam-status-panel">
          <div className="cam-status-card">
            {status !== 'error' && <div className="cam-status-spinner" />}
            <span>
              {status === 'requesting-permission' && 'Accessing camera feed…'}
              {status === 'loading-model' && 'Initializing hand engine…'}
              {status === 'off' && 'Camera off'}
              {status === 'error' && (errorMessage ?? '⚠ Camera unavailable')}
            </span>
          </div>
        </div>
      )}

      {enabled && status === 'active' && (
        <div className="gesture-hud-panel">
          {showHint && (
            <div className="gesture-cheat-sheet">
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: 12,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                Gesture cheat sheet
              </div>
              <div className="gesture-grid">
                {GESTURES.map(([icon, label]) => (
                  <Fragment key={label}>
                    <div>
                      <span className="gesture-icon-pill">{icon}</span>
                    </div>
                    <div style={{ alignSelf: 'center' }}>{label}</div>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowHint((v) => !v)}
            className="gesture-toggle-btn"
          >
            <span>{showHint ? '✕ Close details' : '✋ Show cheat sheet'}</span>
          </button>
        </div>
      )}
    </>
  );
}

const GESTURES: [string, string][] = [
  ['☝️ + 🤏', 'Point at a photo and pinch to grab it'],
  ['↔', 'While holding: move your hand to reposition it'],
  ['👋→📷', 'While holding: move your hand toward the camera to pull it closer'],
  ['🤏 spread', 'While holding: thumb + middle finger to resize'],
  ['🙌 two hands', 'While holding: spread both hands to resize larger'],
  ['🌀 twist wrist', 'While holding: roll your wrist to rotate the photo'],
  ['✐ let go', 'Release the pinch to drop it there'],
  ['🤲 apart / together', 'Both open hands — zoom the whole space in / out'],
  ['🔄 two-hand twist', 'Both pinched hands — turn the whole space'],
  ['👋 swipe', 'Flick one open hand — spin the space'],
  ['✊ fist', 'Make a fist — stop the spin'],
  ['🤏 empty space', 'Pinch + drag where no photo is — pan the view'],
];
