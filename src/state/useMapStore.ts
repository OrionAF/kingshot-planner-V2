import { create } from 'zustand'
import { type BaseBuilding } from '../types/map.types'
import { type Alliance } from '../types/map.types'
import { type Player } from '../types/map.types'
import baseMapData from '../assets/baseMap.json'

// Define the shape of our map state. For now, it just holds an
// array of the default buildings from the JSON file.
interface MapState {
  baseBuildings: BaseBuilding[]
  buildingMap: Map<string, BaseBuilding>
  alliances: Alliance[]
  players: Player[] // Add this
}

interface MapActions {
  createAlliance: (newAllianceData: Omit<Alliance, 'id'>) => void
  createPlayer: (newPlayerData: Omit<Player, 'id'>) => void
  importPlan: (data: { alliances: Alliance[] }) => void
}

function processBaseMapData(): {
  buildings: BaseBuilding[]
  map: Map<string, BaseBuilding>
} {
  const allBuildings: BaseBuilding[] = []
  const buildingMap = new Map<string, BaseBuilding>()

  for (const b of baseMapData.defaultBuildings) {
    const buildingWithId = { ...b, id: `${b.x},${b.y}` }
    allBuildings.push(buildingWithId)

    // For every tile this building occupies, add an entry to our map
    // that points back to the building object.
    for (let dx = 0; dx < b.w; dx++) {
      for (let dy = 0; dy < b.h; dy++) {
        buildingMap.set(`${b.x + dx},${b.y + dy}`, buildingWithId)
      }
    }
  }
  return { buildings: allBuildings, map: buildingMap }
}

const initialMapData = processBaseMapData()

export const useMapStore = create<MapState & MapActions>((set) => ({
  // === Initial State ===
  baseBuildings: initialMapData.buildings,
  buildingMap: initialMapData.map,
  alliances: [],
  players: [],

  // === Actions ===
  createAlliance: (newAllianceData) =>
    set((state) => {
      // Logic to create a full alliance object from the provided data
      const newAlliance: Alliance = {
        id: Date.now(), // Generate a unique ID
        ...newAllianceData,
      }
      // Return the new state object with the new alliance appended
      return { alliances: [...state.alliances, newAlliance] }
    }),

  importPlan: (data) =>
    set(() => ({
      alliances: data.alliances,
    })),

  createPlayer: (newPlayerData) =>
    set((state) => {
      const newPlayer: Player = {
        id: Date.now(),
        ...newPlayerData,
      }
      return { players: [...state.players, newPlayer] }
    }),
}))
