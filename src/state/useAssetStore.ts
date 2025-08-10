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

// Define the assets to be loaded (use Vite URL imports for reliability in dev/build)
const IMAGE_ASSETS = {
  'armory&arsenal': new URL(
    '../assets/images/armory&arsenal.png',
    import.meta.url,
  ).href,
  fortress: new URL('../assets/images/fortress.png', import.meta.url).href,
  'frontier&drill': new URL(
    '../assets/images/frontier&drill.png',
    import.meta.url,
  ).href,
  'harvest&forager': new URL(
    '../assets/images/harvest&forager.png',
    import.meta.url,
  ).href,
  kings_castle: new URL('../assets/images/kings_castle.png', import.meta.url)
    .href,
  sanctuary: new URL('../assets/images/sanctuary.png', import.meta.url).href,
  'scholar&builder': new URL(
    '../assets/images/scholar&builder.png',
    import.meta.url,
  ).href,
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
      if (import.meta.env.DEV) {
        console.log('All image assets loaded successfully.');
      }
    } catch (e) {
      console.error('Failed to load image assets:', e);
      set({ isLoading: false, error: 'Could not load required image assets.' });
    }
  },
}));
