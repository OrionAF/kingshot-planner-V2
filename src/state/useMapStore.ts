// src/state/useMapStore.ts

import { create } from 'zustand'
import {
  type BaseBuilding,
  type Alliance,
  type Player,
  type OmitIdAndCoords,
} from '../types/map.types'
import baseMapData from '../assets/baseMap.json'
import { AppConfig } from '../config/appConfig'

interface MapState {
  baseBuildings: BaseBuilding[]
  buildingMap: Map<string, BaseBuilding>
  alliances: Alliance[]
  players: Player[]
}

interface MapActions {
  createAlliance: (newAllianceData: Omit<Alliance, 'id'>) => void
  placePlayer: (data: OmitIdAndCoords, x: number, y: number) => void
  updatePlayer: (id: number, updatedData: Partial<OmitIdAndCoords>) => void // NEW
  deletePlayer: (id: number) => void
  importPlan: (data: { alliances: Alliance[]; players: Player[] }) => void
  checkPlacementValidity: (
    x: number,
    y: number,
    w: number,
    h: number
  ) => boolean
}

interface RawBuilding {
  x: number
  y: number
  w: number
  h: number
  displayName: string
  fillColor: string
  borderColor?: string
}

function processBaseMapData(): {
  buildings: BaseBuilding[]
  map: Map<string, BaseBuilding>
} {
  // ... this function remains the same
  const allBuildings: BaseBuilding[] = []
  const buildingMap = new Map<string, BaseBuilding>()
  for (const b of baseMapData.defaultBuildings as RawBuilding[]) {
    const buildingWithId: BaseBuilding = {
      ...b,
      id: `${b.x},${b.y}`,
      color: b.fillColor,
      borderColor: b.borderColor,
    }
    allBuildings.push(buildingWithId)
    for (let dx = 0; dx < b.w; dx++) {
      for (let dy = 0; dy < b.h; dy++) {
        buildingMap.set(`${b.x + dx},${b.y + dy}`, buildingWithId)
      }
    }
  }
  return { buildings: allBuildings, map: buildingMap }
}

const initialMapData = processBaseMapData()

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  // === State ===
  baseBuildings: initialMapData.buildings,
  buildingMap: initialMapData.map,
  alliances: [],
  players: [],

  // === Actions ===
  createAlliance: (newAllianceData) =>
    set((state) => ({
      alliances: [...state.alliances, { id: Date.now(), ...newAllianceData }],
    })),

  placePlayer: (data, x, y) =>
    set((state) => {
      const newPlayer: Player = {
        ...data,
        id: Date.now(),
        x,
        y,
        w: AppConfig.player.width,
        h: AppConfig.player.height,
      }
      return { players: [...state.players, newPlayer] }
    }),

  // NEW update action
  updatePlayer: (id, updatedData) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, ...updatedData } : p
      ),
    })),

  deletePlayer: (id) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

  importPlan: (data) =>
    set(() => ({
      alliances: data.alliances ?? [],
      players: data.players ?? [],
    })),

  checkPlacementValidity: (x, y, w, h) => {
    const { buildingMap, players } = get()
    const N = AppConfig.N

    // Loop through each tile the object would occupy
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const checkX = x + i
        const checkY = y + j

        // 1. NEW: Check if the tile is outside the map boundaries.
        if (checkX < 0 || checkX >= N || checkY < 0 || checkY >= N) {
          return false // Invalid: Out of bounds
        }

        // 2. Check for collision with a base building
        if (buildingMap.has(`${checkX},${checkY}`)) {
          return false // Invalid: Collision with building
        }

        // 3. Check for collision with another player
        for (const p of players) {
          if (
            checkX >= p.x &&
            checkX < p.x + p.w &&
            checkY >= p.y &&
            checkY < p.y + p.h
          ) {
            return false // Invalid: Collision with player
          }
        }
      }
    }
    return true // If all checks pass, placement is valid
  },
}))
