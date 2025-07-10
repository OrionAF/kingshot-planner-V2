// src/types/map.types.ts

export interface MapObject {
  x: number
  y: number
  w: number
  h: number
  color: string
  borderColor?: string
}

export interface BaseBuilding extends MapObject {
  id: string
  displayName: string
  imageKey?: string
}

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

export type BuildingType =
  keyof (typeof import('../config/appConfig').AppConfig)['BUILDING_CATALOG']

export interface UserBuilding extends MapObject {
  id: number
  type: BuildingType
  allianceId: number
}
