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
        if (id === beforeId) return s;
        const list = s.bookmarks.map((b) => ({ ...b })); // shallow clone
        const fromIndex = list.findIndex((b) => b.id === id);
        if (fromIndex === -1) return s;
        const [moved] = list.splice(fromIndex, 1);
        let toIndex: number;
        if (beforeId === null) {
          toIndex = list.length;
        } else {
          toIndex = list.findIndex((b) => b.id === beforeId);
          if (toIndex === -1) toIndex = list.length;
        }
        list.splice(toIndex, 0, moved);
        list.forEach((b, i) => (b.order = i + 1));
        queueMicrotask(() =>
          globalEventBus.emit('bookmarks:changed', undefined),
        );
        return { bookmarks: list };
      }),
  }),
);
