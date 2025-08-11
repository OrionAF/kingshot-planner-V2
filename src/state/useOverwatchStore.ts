import { create } from 'zustand';
import {
  globalEventBus,
  type OverwatchSettings,
} from '../types/infrastructure.types';
import { AppConfig } from '../config/appConfig';

interface OverwatchState {
  settings: OverwatchSettings;
}
interface OverwatchActions {
  toggleCategory: (cat: string) => void;
  setCategory: (cat: string, value: boolean) => void;
  resetAll: () => void;
  setAll: (value: boolean) => void;
}

function buildDefault(): OverwatchSettings {
  const cats = new Set<string>();
  for (const key of Object.keys(AppConfig.BUILDING_CATALOG)) {
    const def: any = (AppConfig.BUILDING_CATALOG as any)[key];
    if (def.category) cats.add(def.category);
  }
  const out: OverwatchSettings = {};
  cats.forEach((c) => (out[c] = true));
  return out;
}

export const useOverwatchStore = create<OverwatchState & OverwatchActions>(
  (set) => ({
    settings: buildDefault(),
    toggleCategory: (cat) =>
      set((s) => {
        const settings = { ...s.settings, [cat]: !s.settings[cat] };
        queueMicrotask(() =>
          globalEventBus.emit('overwatch:changed', undefined),
        );
        return { settings };
      }),
    setCategory: (cat, value) =>
      set((s) => {
        const settings = { ...s.settings, [cat]: value };
        queueMicrotask(() =>
          globalEventBus.emit('overwatch:changed', undefined),
        );
        return { settings };
      }),
    resetAll: () =>
      set(() => {
        const settings = buildDefault();
        queueMicrotask(() =>
          globalEventBus.emit('overwatch:changed', undefined),
        );
        return { settings };
      }),
    setAll: (value) =>
      set((s) => {
        const settings: OverwatchSettings = {};
        for (const k of Object.keys(s.settings)) settings[k] = value;
        queueMicrotask(() =>
          globalEventBus.emit('overwatch:changed', undefined),
        );
        return { settings };
      }),
  }),
);
