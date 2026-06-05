import { create } from 'zustand';
import type { Photo } from '../types/photo';
import type { PhotoSlot } from '../lib/computeLayout';

interface PhotoState {
  photos: Photo[];
  files: (File | null)[];   // parallel — original files (for upload). null when loaded from cloud.
  hashes: string[];          // parallel — content hashes
  selectedId: string | null;
  layout: PhotoSlot[] | null;
  setPhotos: (photos: Photo[], files: (File | null)[], hashes: string[]) => void;
  addPhotos: (newPhotos: Photo[], newFiles: File[], newHashes: string[]) => void;
  setLayout: (layout: PhotoSlot[] | null) => void;
  clear: () => void;
  setSelected: (id: string | null) => void;
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: [],
  files: [],
  hashes: [],
  selectedId: null,
  layout: null,
  setPhotos: (photos, files, hashes) => set({ photos, files, hashes }),
  addPhotos: (newPhotos, newFiles, newHashes) => {
    const state = get();
    const existingHashSet = new Set(state.hashes);
    const addedPhotos: Photo[] = [];
    const addedFiles: File[] = [];
    const addedHashes: string[] = [];
    for (let i = 0; i < newPhotos.length; i++) {
      if (!existingHashSet.has(newHashes[i])) {
        addedPhotos.push(newPhotos[i]);
        addedFiles.push(newFiles[i]);
        addedHashes.push(newHashes[i]);
        existingHashSet.add(newHashes[i]);
      }
    }
    if (addedPhotos.length === 0) return;
    set({
      photos: [...state.photos, ...addedPhotos],
      files: [...state.files, ...addedFiles],
      hashes: [...state.hashes, ...addedHashes],
    });
  },
  setLayout: (layout) => set({ layout }),
  clear: () => {
    for (const p of get().photos) {
      URL.revokeObjectURL(p.blobUrl);
    }
    set({ photos: [], files: [], hashes: [], selectedId: null, layout: null });
  },
  setSelected: (id) => set({ selectedId: id }),
}));
