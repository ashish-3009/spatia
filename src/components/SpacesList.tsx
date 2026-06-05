import { useEffect, useState, useRef } from 'react';
import { useSpaceStore } from '../store/spaceStore';
import { useViewStore } from '../store/viewStore';
import { useAuthStore } from '../store/authStore';
import { usePhotoStore } from '../store/photoStore';
import type { SavedSpace } from '../types/space';

const PARTICLE_COUNT = 12;

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
    size: 2 + Math.random() * 2.5,
    dur: 18 + Math.random() * 12,
    delay: Math.random() * -20,
    opacity: 0.08 + Math.random() * 0.15,
  };
}

export function SpacesList() {
  const list = useSpaceStore((s) => s.list);
  const loading = useSpaceStore((s) => s.loadingList);
  const fetchList = useSpaceStore((s) => s.fetchList);
  const loadSpace = useSpaceStore((s) => s.loadSpace);
  const deleteSpace = useSpaceStore((s) => s.deleteSpace);
  const setView = useViewStore((s) => s.setView);
  const setPhotos = usePhotoStore((s) => s.setPhotos);
  const setLayout = usePhotoStore((s) => s.setLayout);
  const signOut = useAuthStore((s) => s.signOut);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }, spawnParticle)).current;

  useEffect(() => {
    fetchList();
    requestAnimationFrame(() => setMounted(true));
  }, [fetchList]);

  const onOpen = async (space: SavedSpace) => {
    setError(null);
    setView('loading-space');
    const { error: loadErr, photos, layout, files, hashes } = await loadSpace(space);
    if (loadErr || !photos || !layout || !files || !hashes) {
      setError(loadErr ?? 'Failed to load space.');
      setView('spaces-list');
      return;
    }
    setPhotos(photos, files, hashes);
    setLayout(layout);
    setView('space');
  };

  const onDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening when clicking delete
    if (!confirm('Delete this space? Its photos will also be removed from cloud storage.')) return;
    const { error: delErr } = await deleteSpace(id);
    if (delErr) setError(delErr);
    fetchList();
  };

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

        .spaces-container {
          position: relative; z-index: 2;
          width: min(640px, 92vw);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          max-height: 60vh;
        }

        .spaces-list-scroll {
          overflow-y: auto;
          padding: 8px 24px;
          flex: 1;
        }
        
        /* Custom scrollbar styling */
        .spaces-list-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .spaces-list-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .spaces-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .spaces-list-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .space-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 16px;
          margin: 8px 0;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .space-row:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .space-info-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
          transition: color 0.2s ease;
        }
        .space-row:hover .space-info-title {
          color: var(--color-accent);
        }

        .delete-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.35);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .delete-btn:hover {
          background: rgba(235, 87, 87, 0.15);
          border-color: rgba(235, 87, 87, 0.3);
          color: #eb5757;
          transform: scale(1.05);
        }

        .back-btn {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
        }
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .signout-btn {
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          border: none;
          padding: 10px 20px;
          font-size: 13px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
        }
        .signout-btn:hover {
          color: #eb5757;
        }

        .list-spinner {
          display: inline-block; width: 24px; height: 24px;
          border: 2.5px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: list-spin 0.65s linear infinite;
        }
        @keyframes list-spin { to { transform: rotate(360deg); } }

        .error-banner {
          background: rgba(235, 87, 87, 0.12);
          border: 1px solid rgba(235, 87, 87, 0.25);
          border-radius: 10px; padding: 10px 16px;
          color: #f87171; font-size: 13px;
          max-width: 520px;
          text-align: center;
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', alignItems: 'center' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: 'clamp(28px, 6vw, 36px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: 0,
              }}
            >
              Saved spaces
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.45)', marginTop: 6 }}>
              Select a visual collection to open.
            </p>
          </div>

          {/* List panel */}
          <div className="spaces-container">
            <div className="spaces-list-scroll">
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
                  <span className="list-spinner" />
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 14 }}>Retrieving your spaces…</span>
                </div>
              )}
              
              {!loading && list.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: 14, lineHeight: 1.6 }}>
                  No saved spaces yet.<br />
                  <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.25)' }}>Go back to the home screen and upload some photos to start.</span>
                </div>
              )}

              {!loading && list.map((space) => (
                <div
                  key={space.id}
                  onClick={() => onOpen(space)}
                  className="space-row"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 16 }}>
                    <span className="space-info-title">{space.name}</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>📂 {space.photo_meta.length} {space.photo_meta.length === 1 ? 'photo' : 'photos'}</span>
                      <span>•</span>
                      <span>📅 {new Date(space.updated_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => onDelete(e, space.id)}
                    className="delete-btn"
                    aria-label="delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setView('landing')}
              className="back-btn"
            >
              ← Home
            </button>
            <button
              onClick={signOut}
              className="signout-btn"
            >
              Sign out
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
