import { create } from 'zustand';
import { type BaseBuilding } from '../types/map.types';

interface MapTile {
  x: number;
  y: number;
}

export type Selection =
  | { type: 'tile'; data: MapTile }
  | { type: 'building'; data: BaseBuilding }
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
