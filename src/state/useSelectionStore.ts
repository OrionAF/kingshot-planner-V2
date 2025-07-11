// src/state/useSelectionStore.ts

import { create } from 'zustand';
import {
  type BaseBuilding,
  type Player,
  type UserBuilding,
} from '../types/map.types';

interface MapTile {
  x: number;
  y: number;
}

export type Selection =
  | { type: 'tile'; data: MapTile }
  | { type: 'baseBuilding'; data: BaseBuilding }
  | { type: 'userBuilding'; data: UserBuilding }
  | { type: 'player'; data: Player }
  | null;

interface SelectionState {
  selection: Selection;
}

interface SelectionActions {
  setSelection: (newSelection: Selection) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState & SelectionActions>(
  (set) => ({
    selection: null,

    setSelection: (newSelection) => set(() => ({ selection: newSelection })),

    clearSelection: () => set(() => ({ selection: null })),
  }),
);
