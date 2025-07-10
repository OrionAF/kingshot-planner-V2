// src/state/useMapStore.ts

import { create } from 'zustand'
import {
  type BaseBuilding,
  type Alliance,
  type Player,
  type OmitIdAndCoords,
  type UserBuilding,
  type BuildingType,
} from '../types/map.types'
import baseMapData from '../assets/baseMap.json'
import { AppConfig } from '../config/appConfig'

interface MapState {
  baseBuildings: BaseBuilding[]
  buildingMap: Map<string, BaseBuilding>
  alliances: Alliance[]
  players: Player[]
  userBuildings: UserBuilding[] // NEW: Array for user buildings
}

interface MapActions {
  createAlliance: (newAllianceData: Omit<Alliance, 'id'>) => void
  placePlayer: (data: OmitIdAndCoords, x: number, y: number) => void
  updatePlayer: (id: number, updatedData: Partial<OmitIdAndCoords>) => void
  deletePlayer: (id: number) => void
  placeBuilding: (
    type: BuildingType,
    x: number,
    y: number,
    allianceId: number
  ) => void // NEW
  deleteBuilding: (id: number) => void // NEW
  importPlan: (data: {
    alliances: Alliance[]
    players: Player[]
    userBuildings: UserBuilding[]
  }) => void // Updated
  // Updated signature to accept more context for rules
  checkPlacementValidity: (
    x: number,
    y: number,
    w: number,
    h: number,
    allianceId?: number | null,
    rule?: string
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
  userBuildings: [], // NEW

  // === Actions ===
  createAlliance: (newAllianceData) =>
    set((state) => ({
      alliances: [...state.alliances, { id: Date.now(), ...newAllianceData }],
    })),

  // Player actions remain the same
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

  // NEW building actions
  placeBuilding: (type, x, y, allianceId) =>
    set((state) => {
      const definition = AppConfig.BUILDING_CATALOG[type]
      const alliance = state.alliances.find((a) => a.id === allianceId)
      if (!definition || !alliance) return {} // Safety check

      const newBuilding: UserBuilding = {
        id: Date.now(),
        type,
        x,
        y,
        allianceId,
        w: definition.w,
        h: definition.h,
        color: alliance.color,
      }
      return { userBuildings: [...state.userBuildings, newBuilding] }
    }),
  deleteBuilding: (id) =>
    set((state) => ({
      userBuildings: state.userBuildings.filter((b) => b.id !== id),
    })),

  importPlan: (data) =>
    set(() => ({
      alliances: data.alliances ?? [],
      players: data.players ?? [],
      userBuildings: data.userBuildings ?? [], // NEW
    })),

  checkPlacementValidity: (x, y, w, h, allianceId = null, rule = 'any') => {
    // get() gives us access to the current state inside the function
    const { buildingMap, players, userBuildings } = get()
    const N = AppConfig.N

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const checkX = x + i
        const checkY = y + j

        if (checkX < 0 || checkX >= N || checkY < 0 || checkY >= N) return false

        // Check for collision with a base or user building
        if (buildingMap.has(`${checkX},${checkY}`)) return false
        for (const b of userBuildings) {
          if (
            checkX >= b.x &&
            checkX < b.x + b.w &&
            checkY >= b.y &&
            checkY < b.y + b.h
          )
            return false
        }

        // Check for collision with a player
        for (const p of players) {
          if (
            checkX >= p.x &&
            checkX < p.x + p.w &&
            checkY >= p.y &&
            checkY < p.y + p.h
          )
            return false
        }

        // FUTURE: This is where we will check territory rules based on allianceId and rule
      }
    }
    return true
  },
}))
