import { create } from 'zustand';

interface MetaState {
  lastSeenVersion: string | null;
  showPatchNotes: boolean;
}
interface MetaActions {
  markVersionSeen: (v: string) => void;
  dismissPatchNotes: () => void;
}

export const useMetaStore = create<MetaState & MetaActions>((set) => ({
  lastSeenVersion: null,
  showPatchNotes: false,
  markVersionSeen: (v) => set({ lastSeenVersion: v, showPatchNotes: false }),
  dismissPatchNotes: () => set({ showPatchNotes: false }),
}));
