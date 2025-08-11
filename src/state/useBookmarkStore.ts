import { create } from 'zustand';
import { globalEventBus, type Bookmark } from '../types/infrastructure.types';
import { generateId } from '../utils/idGenerator';

interface BookmarkState {
  bookmarks: Bookmark[];
}
interface BookmarkActions {
  addBookmark: (x: number, y: number, label: string) => void;
  removeBookmark: (id: string) => void;
  togglePinned: (id: string) => void;
  renameBookmark: (id: string, label: string) => void;
  clearAll: () => void;
}

export const useBookmarkStore = create<BookmarkState & BookmarkActions>(
  (set) => ({
    bookmarks: [],
    addBookmark: (x, y, label) =>
      set((s) => {
        const bm: Bookmark = {
          id: 'bm_' + generateId('bookmark'),
          x,
          y,
          label,
          pinned: false,
          createdAt: Date.now(),
        };
        const bookmarks = [...s.bookmarks, bm];
        queueMicrotask(() =>
          globalEventBus.emit('bookmarks:changed', undefined),
        );
        return { bookmarks };
      }),
    removeBookmark: (id) =>
      set((s) => {
        const bookmarks = s.bookmarks.filter((b) => b.id !== id);
        queueMicrotask(() =>
          globalEventBus.emit('bookmarks:changed', undefined),
        );
        return { bookmarks };
      }),
    togglePinned: (id) =>
      set((s) => {
        const bookmarks = s.bookmarks.map((b) =>
          b.id === id ? { ...b, pinned: !b.pinned } : b,
        );
        queueMicrotask(() =>
          globalEventBus.emit('bookmarks:changed', undefined),
        );
        return { bookmarks };
      }),
    renameBookmark: (id, label) =>
      set((s) => {
        const bookmarks = s.bookmarks.map((b) =>
          b.id === id ? { ...b, label } : b,
        );
        queueMicrotask(() =>
          globalEventBus.emit('bookmarks:changed', undefined),
        );
        return { bookmarks };
      }),
    clearAll: () =>
      set(() => {
        queueMicrotask(() =>
          globalEventBus.emit('bookmarks:changed', undefined),
        );
        return { bookmarks: [] };
      }),
  }),
);
