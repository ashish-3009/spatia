import { useState, useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { FrostPanel } from './ui/FrostPanel';
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

  // Allow Save when there are photos with hashes (supports both new and loaded spaces).
  const canSave = photos.length > 0 && hashes.length === photos.length && hashes.every((h) => h);

  const onAddPhotos = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFilesPicked = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files;
      if (!picked || picked.length === 0) return;
      const filesArray = Array.from(picked);
      // Reset the input so the same files can be re-picked if needed.
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
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 10,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <FrostPanel style={{ padding: '8px 14px' }}>
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-md)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ← New space
          </button>
        </FrostPanel>
        <FrostPanel style={{ padding: '8px 14px' }}>
          <button
            onClick={triggerReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-md)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ⊙ Reset view
          </button>
        </FrostPanel>
        <FrostPanel style={{ padding: '8px 14px' }}>
          <button
            onClick={toggleHand}
            style={{
              background: 'transparent',
              border: 'none',
              color: handEnabled ? 'var(--color-accent)' : 'var(--text-primary)',
              fontSize: 'var(--font-size-md)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: handEnabled ? 600 : 400,
            }}
          >
            🖐 Hands
          </button>
        </FrostPanel>
        <FrostPanel style={{ padding: '8px 14px' }}>
          <button
            onClick={onAddPhotos}
            disabled={adding}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-md)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              opacity: adding ? 0.5 : 1,
            }}
          >
            {adding ? '⏳ Adding…' : '＋ Add photos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={onFilesPicked}
            style={{ display: 'none' }}
          />
        </FrostPanel>
        {canSave && (
          <FrostPanel style={{ padding: '8px 14px' }}>
            <button
              onClick={() => setShowSave(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: 'var(--font-size-md)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              ⬛ Save space
            </button>
          </FrostPanel>
        )}
        <FrostPanel style={{ padding: '8px 14px' }}>
          <span
            style={{
              fontSize: 'var(--font-size-md)',
              color: 'var(--text-secondary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </span>
        </FrostPanel>
      </div>
      {showSave && <SaveSpaceModal onClose={() => setShowSave(false)} />}
    </>
  );
}
