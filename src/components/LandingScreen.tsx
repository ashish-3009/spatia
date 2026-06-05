import { useCallback, useState, useEffect, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useViewStore } from '../store/viewStore';
import { usePhotoStore } from '../store/photoStore';
import { loadPhotoWithHash } from '../lib/loadPhoto';

const ACCEPTED = /\.(jpe?g|png|webp)$/i;
const PARTICLE_COUNT = 16;

interface Particle {
  x: number;
  y: number;
  size: number;
  dur: number;
  delay: number;
  opacity: number;
}

function spawnParticle(): Particle {
  return {
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    dur: 15 + Math.random() * 15,
    delay: Math.random() * -20,
    opacity: 0.1 + Math.random() * 0.2,
  };
}

export function LandingScreen() {
  const setView = useViewStore((s) => s.setView);
  const setProgress = useViewStore((s) => s.setProgress);
  const setPhotos = usePhotoStore((s) => s.setPhotos);
  const [dragOver, setDragOver] = useState(false);
  const [mounted, setMounted] = useState(false);
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }, spawnParticle)).current;

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const ingest = useCallback(
    async (files: File[]) => {
      const jpgs = files.filter((f) => ACCEPTED.test(f.name));
      if (jpgs.length === 0) return;

      setProgress(0, jpgs.length);
      setView('processing');

      const photos: Awaited<ReturnType<typeof loadPhotoWithHash>>['photo'][] = [];
      const accepted: File[] = [];
      const hashes: string[] = [];
      for (let i = 0; i < jpgs.length; i++) {
        try {
          const { photo, contentHash } = await loadPhotoWithHash(jpgs[i]);
          photos.push(photo);
          accepted.push(jpgs[i]);
          hashes.push(contentHash);
        } catch (err) {
          console.warn(`Skipping ${jpgs[i].name}:`, err);
        }
        setProgress(i + 1, jpgs.length);
      }

      setPhotos(photos, accepted, hashes);
      setView('space');
    },
    [setView, setProgress, setPhotos],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragOver(false);
      const items = e.dataTransfer.files;
      ingest(Array.from(items));
    },
    [ingest],
  );

  const onPick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      ingest(Array.from(files));
    },
    [ingest],
  );

  return (
    <>
      <style>{`
        .screen-bg {
          position: fixed; inset: 0;
          background: linear-gradient(135deg, #0a0a0a 0%, #11101f 40%, #0d1622 70%, #0a0a0a 100%);
          background-size: 400% 400%;
          animation: bg-gradient 20s ease infinite;
          z-index: 0;
          overflow: hidden;
        }
        @keyframes bg-gradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .bg-particle {
          position: absolute; border-radius: 50%;
          background: var(--color-accent);
          pointer-events: none;
          animation: float-up linear infinite;
        }
        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: var(--p-opacity); }
          90%  { opacity: var(--p-opacity); }
          100% { transform: translateY(-110vh) translateX(25px); opacity: 0; }
        }

        .landing-card {
          position: relative; z-index: 2;
          width: min(520px, 92vw);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .dropzone-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          border-radius: 16px;
          border: 2px dashed rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .dropzone-label.active {
          border-color: var(--color-accent);
          background: rgba(236, 255, 15, 0.04);
          box-shadow: 0 0 24px rgba(236, 255, 15, 0.08);
        }
        .dropzone-label:hover:not(.active) {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.02);
        }

        .cta-btn {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 500;
          font-size: 14px;
          letter-spacing: 0.02em;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .cta-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .cta-btn:active {
          transform: translateY(0);
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 20px;
          color: rgba(255, 255, 255, 0.4);
          transition: all 0.3s ease;
        }
        .dropzone-label:hover .upload-icon, .dropzone-label.active .upload-icon {
          color: var(--color-accent);
          transform: translateY(-4px);
        }
      `}</style>

      {/* ── background ── */}
      <div className="screen-bg">
        {particles.map((p, i) => (
          <div
            key={i}
            className="bg-particle"
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
        <div
          style={{
            position: 'absolute',
            top: '20%', left: '10%',
            width: 400, height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,255,15,0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── content wrapper ── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%', alignItems: 'center' }}>
          
          {/* header */}
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <h1
              style={{
                fontSize: 'clamp(38px, 8vw, 54px)',
                fontWeight: 750,
                letterSpacing: '-0.04em',
                color: '#fff',
                margin: 0,
                textShadow: '0 0 40px rgba(236,255,15,0.12)',
              }}
            >
              Spatia
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 4.5vw, 17px)',
                color: 'rgba(255, 255, 255, 0.55)',
                margin: '12px 0 0',
                lineHeight: 1.5,
              }}
            >
              Bring your photos alive inside a beautifully calculated 3D interaction space.
            </p>
          </div>

          {/* dropzone card */}
          <div className="landing-card" style={{ padding: 18 }}>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`dropzone-label ${dragOver ? 'active' : ''}`}
            >
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={onPick}
                style={{ display: 'none' }}
              />
              
              {/* upload icon (SVG) */}
              <svg
                className="upload-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: 8,
                }}
              >
                Drop your photo folder here
              </div>
              
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.4)',
                  lineHeight: 1.6,
                  textAlign: 'center',
                  maxWidth: 360,
                }}
              >
                Accepts JPEG, PNG, or WebP. Or click to select files. Processing is done securely right in your browser.
              </div>
            </label>
          </div>

          {/* saved spaces button */}
          <button
            onClick={() => useViewStore.getState().setView('spaces-list')}
            className="cta-btn"
          >
            <span>Open saved spaces</span>
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
