import { useState, useEffect } from 'react';
import { useSpaceStore } from '../store/spaceStore';
import { usePhotoStore } from '../store/photoStore';

export function SaveSpaceModal({ onClose }: { onClose: () => void }) {
  const photos = usePhotoStore((s) => s.photos);
  const files = usePhotoStore((s) => s.files);
  const hashes = usePhotoStore((s) => s.hashes);
  const layout = usePhotoStore((s) => s.layout);
  const saveCurrent = useSpaceStore((s) => s.saveCurrent);
  const saveProgress = useSpaceStore((s) => s.saveProgress);
  const currentSpace = useSpaceStore((s) => s.currentSpace);

  const [name, setName] = useState(currentSpace?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Small timeout to trigger CSS animations on mount
    const t = setTimeout(() => setAnimateIn(true), 20);
    return () => clearTimeout(t);
  }, []);

  const canSave =
    photos.length > 0 &&
    hashes.length === photos.length &&
    hashes.every((h) => h);

  const onSave = async () => {
    if (!canSave || !layout) {
      setError(
        !layout
          ? 'Layout not ready yet — please wait a moment and try again.'
          : 'Cannot save this space.',
      );
      return;
    }
    setBusy(true);
    setError(null);

    const photoMeta = photos.map((p, i) => {
      const file = files[i];
      return {
        name: p.name,
        size: file ? file.size : (currentSpace?.photo_meta.find((m) => m.contentHash === hashes[i])?.size ?? 0),
        contentHash: hashes[i],
        aspectRatio: p.aspectRatio,
        scale: layout[i].scale,
        position: layout[i].position,
      };
    });

    const seed = currentSpace?.layout_seed ?? Math.floor(Math.random() * 1_000_000_000);
    const result = await saveCurrent(name || 'Untitled space', seed, photoMeta, files);
    setBusy(false);
    if (result.error) setError(result.error);
    else onClose();
  };

  const progressPct =
    saveProgress && saveProgress.total > 0
      ? Math.round((saveProgress.current / saveProgress.total) * 100)
      : 0;

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 12, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .modal-overlay.active {
          opacity: 1;
        }

        .modal-card {
          width: min(440px, 92vw);
          padding: 32px;
          background: rgba(25, 25, 30, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transform: translateY(20px) scale(0.96);
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .modal-overlay.active .modal-card {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }

        .modal-input {
          width: 100%;
          padding: 12px 14px;
          font-family: inherit;
          font-size: 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.9);
          outline: none;
          margin-bottom: 20px;
          transition: all 0.2s ease;
        }
        .modal-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .modal-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(236, 255, 15, 0.12);
          background: rgba(255, 255, 255, 0.08);
        }

        .modal-btn-cancel {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .modal-btn-save {
          background: var(--color-accent);
          color: #0a0a0a;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .modal-btn-save:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(236, 255, 15, 0.35);
        }
        .modal-btn-save:active:not(:disabled) {
          transform: translateY(0);
        }

        .modal-btn-save:disabled, .modal-btn-cancel:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .modal-spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(10, 10, 10, 0.2);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: modal-spin 0.65s linear infinite;
        }
        @keyframes modal-spin { to { transform: rotate(360deg); } }

        .modal-error {
          color: #f87171;
          background: rgba(235, 87, 87, 0.12);
          border: 1px solid rgba(235, 87, 87, 0.2);
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .prog-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
        }
        .prog-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .prog-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent) 0%, #a3ff12 100%);
          transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 0 8px rgba(236, 255, 15, 0.4);
        }
      `}</style>

      <div
        className={`modal-overlay ${animateIn ? 'active' : ''}`}
        onClick={busy ? undefined : onClose}
      >
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">
            {currentSpace ? 'Update Space' : 'Save Space'}
          </div>

          <input
            type="text"
            placeholder="Name your space"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={busy}
            className="modal-input"
          />

          {saveProgress && (
            <div>
              <div className="prog-label">
                Uploading photo {saveProgress.current} of {saveProgress.total}…
              </div>
              <div className="prog-track">
                <div className="prog-bar" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          {error && <div className="modal-error">{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              disabled={busy}
              className="modal-btn-cancel"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={busy || !canSave}
              className="modal-btn-save"
            >
              {busy ? <span className="modal-spinner" /> : currentSpace ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
