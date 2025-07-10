// src/types/map.types.ts

// A generic object that can be drawn on the map
export interface MapObject {
  x: number
  y: number
  w: number
  h: number
  color: string // The main fill color for the object
  borderColor?: string // Optional border color
}

export interface BaseBuilding extends MapObject {
  id: string
  displayName: string
  imageKey?: string
}

// Data needed from the form to start player placement
export interface OmitIdAndCoords {
  name: string
  power: string
  rallyCap: string
  tcLevel: string
  notes: string
  color: string
}

export interface Player extends OmitIdAndCoords, MapObject {
  id: number
}

export interface Alliance {
  id: number
  name: string
  tag: string
  color: string
}

// --- FIX: ADDED AND EXPORTED MISSING TYPES ---
// Derives a union type of all possible building keys from our config
export type BuildingType =
  keyof (typeof import('../config/appConfig').AppConfig)['BUILDING_CATALOG']

// Defines a building that a user has placed on the map
export interface UserBuilding extends MapObject {
  id: number
  type: BuildingType
  allianceId: number
}
