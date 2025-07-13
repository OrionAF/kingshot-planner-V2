// src/state/useAssetStore.ts

import { create } from 'zustand';

interface AssetState {
  images: Map<string, HTMLImageElement>;
  isLoading: boolean;
  error: string | null;
  loadAssets: () => Promise<void>;
}

// Helper function to load a single image
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

// Define the assets to be loaded
const IMAGE_ASSETS = {
  'armory&arsenal': '/src/assets/images/armory&arsenal.png',
  fortress: '/src/assets/images/fortress.png',
  'frontier&drill': '/src/assets/images/frontier&drill.png',
  'harvest&forager': '/src/assets/images/harvest&forager.png',
  kings_castle: '/src/assets/images/kings_castle.png',
  sanctuary: '/src/assets/images/sanctuary.png',
  'scholar&builder': '/src/assets/images/scholar&builder.png',
};

export const useAssetStore = create<AssetState>((set) => ({
  images: new Map(),
  isLoading: true,
  error: null,

  loadAssets: async () => {
    try {
      set({ isLoading: true, error: null });

      const imagePromises = Object.entries(IMAGE_ASSETS).map(
        async ([key, src]) => {
          const image = await loadImage(src);
          return [key, image] as const;
        },
      );

      const loadedImages = await Promise.all(imagePromises);
      const imageMap = new Map(loadedImages);

      set({ images: imageMap, isLoading: false });
      console.log('All image assets loaded successfully.');
    } catch (e) {
      console.error('Failed to load image assets:', e);
      set({ isLoading: false, error: 'Could not load required image assets.' });
    }
  },
}));
