// src/types/map.types.ts

import { AppConfig } from '../config/appConfig';

export interface MapObject {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  borderColor?: string;
}

export interface BaseBuilding extends MapObject {
  id: string;
  displayName: string;
  imageKey?: string;
}

export interface OmitIdAndCoords {
  name: string;
  power: string;
  rallyCap: string;
  tcLevel: string;
  notes: string;
  color: string;
}

export interface Player extends OmitIdAndCoords, MapObject {
  id: number;
}

export interface Alliance {
  id: number;
  name: string;
  tag: string;
  color: string;
}

export type BuildingType = keyof (typeof AppConfig)['BUILDING_CATALOG'];

export interface UserBuilding extends MapObject {
  id: number;
  type: BuildingType;
  allianceId: number;
}

// --- NEW SHARED TYPE ---
// This defines the structure of the JSON file for import/export.
export interface PlanFile {
  version: string;
  alliances: Alliance[];
  players: Player[];
  userBuildings: UserBuilding[];
}
