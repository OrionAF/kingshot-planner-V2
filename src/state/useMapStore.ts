// src/state/useMapStore.ts

import { create } from 'zustand';
import {
  type BaseBuilding,
  type Alliance,
  type Player,
  type OmitIdAndCoords,
  type UserBuilding,
  type BuildingType,
} from '../types/map.types';
import baseMapData from '../assets/baseMap.json';
import { AppConfig } from '../config/appConfig';
import { generateId } from '../utils/idGenerator';

interface MapState {
  baseBuildings: BaseBuilding[];
  buildingMap: Map<string, BaseBuilding>;
  alliances: Alliance[];
  players: Player[];
  userBuildings: UserBuilding[];
}

interface MapActions {
  createAlliance: (newAllianceData: Omit<Alliance, 'id'>) => void;
  placePlayer: (data: OmitIdAndCoords, x: number, y: number) => void;
  updatePlayer: (id: number, updatedData: Partial<OmitIdAndCoords>) => void;
  deletePlayer: (id: number) => void;
  placeBuilding: (
    type: BuildingType,
    x: number,
    y: number,
    allianceId: number,
  ) => void;
  deleteBuilding: (id: number) => void;
  importPlan: (data: {
    alliances: Alliance[];
    players: Player[];
    userBuildings: UserBuilding[];
  }) => void;

  checkPlacementValidity: (
    x: number,
    y: number,
    w: number,
    h: number,
    allianceId?: number | null,
    rule?: string,
  ) => boolean;
}

interface RawBuilding {
  x: number;
  y: number;
  w: number;
  h: number;
  displayName: string;
  fillColor: string;
  borderColor?: string;
}

function processBaseMapData(): {
  buildings: BaseBuilding[];
  map: Map<string, BaseBuilding>;
} {
  const allBuildings: BaseBuilding[] = [];
  const buildingMap = new Map<string, BaseBuilding>();
  for (const b of baseMapData.defaultBuildings as RawBuilding[]) {
    const buildingWithId: BaseBuilding = {
      ...b,
      id: `${b.x},${b.y}`,
      color: b.fillColor,
      borderColor: b.borderColor,
    };
    allBuildings.push(buildingWithId);
    for (let dx = 0; dx < b.w; dx++) {
      for (let dy = 0; dy < b.h; dy++) {
        buildingMap.set(`${b.x + dx},${b.y + dy}`, buildingWithId);
      }
    }
  }
  return { buildings: allBuildings, map: buildingMap };
}

const initialMapData = processBaseMapData();

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  baseBuildings: initialMapData.buildings,
  buildingMap: initialMapData.map,
  alliances: [],
  players: [],
  userBuildings: [],

  createAlliance: (newAllianceData) =>
    set((state) => ({
      alliances: [...state.alliances, { id: generateId(), ...newAllianceData }],
    })),

  placePlayer: (data, x, y) =>
    set((state) => {
      const newPlayer: Player = {
        ...data,
        id: generateId(),
        x,
        y,
        w: AppConfig.player.width,
        h: AppConfig.player.height,
      };
      return { players: [...state.players, newPlayer] };
    }),

  updatePlayer: (id, updatedData) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, ...updatedData } : p,
      ),
    })),

  deletePlayer: (id) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

  placeBuilding: (type, x, y, allianceId) =>
    set((state) => {
      const definition = AppConfig.BUILDING_CATALOG[type];
      const alliance = state.alliances.find((a) => a.id === allianceId);
      if (!definition || !alliance) return {};

      const newBuilding: UserBuilding = {
        id: generateId(),
        type,
        x,
        y,
        allianceId,
        w: definition.w,
        h: definition.h,
        color: alliance.color,
      };
      return { userBuildings: [...state.userBuildings, newBuilding] };
    }),
  deleteBuilding: (id) =>
    set((state) => ({
      userBuildings: state.userBuildings.filter((b) => b.id !== id),
    })),

  importPlan: (data) =>
    set(() => ({
      alliances: data.alliances ?? [],
      players: data.players ?? [],
      userBuildings: data.userBuildings ?? [],
    })),

  checkPlacementValidity: (x, y, w, h, allianceId = null, rule = 'any') => {
    const { buildingMap, players, userBuildings } = get();
    const N = AppConfig.N;

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const checkX = x + i;
        const checkY = y + j;

        if (checkX < 0 || checkX >= N || checkY < 0 || checkY >= N)
          return false;

        if (buildingMap.has(`${checkX},${checkY}`)) return false;
        for (const b of userBuildings) {
          if (
            checkX >= b.x &&
            checkX < b.x + b.w &&
            checkY >= b.y &&
            checkY < b.y + b.h
          )
            return false;
        }

        for (const p of players) {
          if (
            checkX >= p.x &&
            checkX < p.x + p.w &&
            checkY >= p.y &&
            checkY < p.y + p.h
          )
            return false;
        }
      }
    }
    return true;
  },
}));
