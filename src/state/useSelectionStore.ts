import { create } from 'zustand';
import { type BaseBuilding } from '../types/map.types';

// This is the blueprint for a simple tile, used when clicking on empty ground.
interface MapTile {
  x: number;
  y: number;
}

// The "Selection" can now be one of three things.
export type Selection =
  | { type: 'tile'; data: MapTile }
  | { type: 'building'; data: BaseBuilding }
  | null; // Or nothing is selected

interface SelectionState {
  selection: Selection;
}

interface SelectionActions {
  setSelection: (newSelection: Selection) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState & SelectionActions>(
  (set) => ({
    // === Initial State ===
    selection: null,

    // === Actions ===
    setSelection: (newSelection) => set(() => ({ selection: newSelection })),

    clearSelection: () => set(() => ({ selection: null })),
  }),
);
