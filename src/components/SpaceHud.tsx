import { useState, useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useViewStore } from '../store/viewStore';
import { usePhotoStore } from '../store/photoStore';
import { useHandStore } from '../store/handStore';
import { useSpaceStore } from '../store/spaceStore';
import { SaveSpaceModal } from './SaveSpaceModal';
import { loadPhotoWithHash } from '../lib/loadPhoto';

const ACCEPTED = /\.(jpe?g|png|webp)$/i;

export function SpaceHud() {
  const setView = useViewStore((s) => s.setView);
  const triggerReset = useViewStore((s) => s.triggerReset);
  const photos = usePhotoStore((s) => s.photos);
  const handEnabled = useHandStore((s) => s.enabled);
  const toggleHand = useHandStore((s) => s.toggle);
  const hashes = usePhotoStore((s) => s.hashes);
  const addPhotos = usePhotoStore((s) => s.addPhotos);
  const clear = usePhotoStore((s) => s.clear);
  const [showSave, setShowSave] = useState(false);
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onClear = () => {
    clear();
    useSpaceStore.getState().setCurrentSpace(null);
    setView('landing');
  };

  const canSave = photos.length > 0 && hashes.length === photos.length && hashes.every((h) => h);

  const onAddPhotos = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFilesPicked = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files;
      if (!picked || picked.length === 0) return;
      const filesArray = Array.from(picked);
      e.target.value = '';

      const jpgs = filesArray.filter((f) => ACCEPTED.test(f.name));
      if (jpgs.length === 0) {
        alert('No valid images selected. Please choose JPEG, PNG, or WebP files.');
        return;
      }

      setAdding(true);

      const newPhotos: Awaited<ReturnType<typeof loadPhotoWithHash>>['photo'][] = [];
      const newFiles: File[] = [];
      const newHashes: string[] = [];
      let loadErrors: string[] = [];

      for (let i = 0; i < jpgs.length; i++) {
        try {
          const { photo, contentHash } = await loadPhotoWithHash(jpgs[i]);
          newPhotos.push(photo);
          newFiles.push(jpgs[i]);
          newHashes.push(contentHash);
        } catch (err) {
          console.error(`Error loading ${jpgs[i].name}:`, err);
          loadErrors.push(`${jpgs[i].name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (loadErrors.length > 0) {
        alert(`Failed to load some images:\n${loadErrors.join('\n')}`);
      }

      if (newPhotos.length > 0) {
        const preCount = usePhotoStore.getState().photos.length;
        addPhotos(newPhotos, newFiles, newHashes);
        const postCount = usePhotoStore.getState().photos.length;
        if (postCount === preCount) {
          alert('The selected photo(s) are already in this space (duplicate detection).');
        }
      }

      setAdding(false);
    },
    [addPhotos],
  );

  return (
    <>
      <style>{`
        .hud-wrapper {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          z-index: 100;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          pointer-events: none;
        }

        .hud-group {
          display: flex;
          gap: 4px;
          background: rgba(18, 18, 22, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
          align-items: center;
        }

        .hud-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.85);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .hud-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .hud-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .hud-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hud-btn-active {
          background: var(--color-accent) !important;
          color: #0a0a0a !important;
          font-weight: 600;
          box-shadow: 0 0 12px rgba(236, 255, 15, 0.4);
        }

        .hud-btn-save {
          color: var(--color-accent);
          font-weight: 600;
        }
        .hud-btn-save:hover {
          background: rgba(236, 255, 15, 0.12) !important;
          color: var(--color-accent) !important;
        }

        .hud-meta-pill {
          padding: 8px 14px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Responsive refinements for mobile devices */
        @media (max-width: 600px) {
          .hud-wrapper {
            top: 10px;
            left: 10px;
            right: 10px;
            gap: 6px;
          }
          .hud-group {
            border-radius: 10px;
            padding: 2px;
          }
          .hud-btn {
            padding: 6px 10px;
            font-size: 11px;
            gap: 4px;
          }
          .hud-btn span {
            display: none; /* Hide button text if we have icons, or keep layout neat */
          }
          .hud-btn-with-label span {
            display: inline !important; /* Force show important labels */
          }
          .hud-meta-pill {
            padding: 6px 8px;
            font-size: 10px;
          }
        }
      `}</style>

      <div className="hud-wrapper">
        {/* Navigation Group */}
        <div className="hud-group">
          <button onClick={onClear} className="hud-btn hud-btn-with-label" title="Exit to main screen">
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Exit</span>
          </button>
        </div>

        {/* View Controls Group */}
        <div className="hud-group">
          <button onClick={triggerReset} className="hud-btn" title="Reset camera position">
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 119 9m-9-9H3m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Reset view</span>
          </button>
          
          <button
            onClick={toggleHand}
            className={`hud-btn ${handEnabled ? 'hud-btn-active' : ''}`}
            title="Toggle webcam gesture control"
          >
            <span style={{ fontSize: 13, display: 'inline-block', lineHeight: 1 }}>🖐</span>
            <span>Gestures</span>
          </button>
        </div>

        {/* Photo Action Group */}
        <div className="hud-group">
          <button onClick={onAddPhotos} disabled={adding} className="hud-btn" title="Add more photos">
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>{adding ? 'Adding…' : 'Add photos'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={onFilesPicked}
            style={{ display: 'none' }}
          />

          {canSave && (
            <button onClick={() => setShowSave(true)} className="hud-btn hud-btn-save" title="Save or update space">
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save space</span>
            </button>
          )}
        </div>

        {/* Info Pill */}
        <div className="hud-group">
          <div className="hud-meta-pill">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </div>
        </div>
      </div>

      {showSave && <SaveSpaceModal onClose={() => setShowSave(false)} />}
    </>
  );
}
