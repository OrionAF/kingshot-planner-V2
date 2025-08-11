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
  reorder: (id: string, beforeId: string | null) => void; // beforeId null => move to end
}

export const useBookmarkStore = create<BookmarkState & BookmarkActions>(
  (set) => ({
    bookmarks: [],
    addBookmark: (x, y, label) =>
      set((s) => {
        const nextOrder =
          (s.bookmarks.reduce((m, b) => Math.max(m, b.order ?? 0), 0) || 0) + 1;
        const bm: Bookmark = {
          id: 'bm_' + generateId('bookmark'),
          x,
          y,
          label,
          pinned: false,
          createdAt: Date.now(),
          order: nextOrder,
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
    reorder: (id, beforeId) =>
      set((s) => {
        const list = [...s.bookmarks];
        const idx = list.findIndex((b) => b.id === id);
        if (idx === -1) return s;
        const [item] = list.splice(idx, 1);
        let insertIndex =
          beforeId === null
            ? list.length
            : list.findIndex((b) => b.id === beforeId);
        if (insertIndex === -1) insertIndex = list.length;
        list.splice(insertIndex, 0, item);
        // reassign contiguous order values
        list.forEach((b, i) => (b.order = i + 1));
        queueMicrotask(() =>
          globalEventBus.emit('bookmarks:changed', undefined),
        );
        return { bookmarks: list };
      }),
  }),
);
