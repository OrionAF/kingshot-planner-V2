// A generic structure for any object that has a position and size on the map.
export interface MapObject {
  id: string | number // A unique identifier
  x: number
  y: number
  w: number
  h: number
}

// This represents a static, default building that comes from baseMap.json.
// It "extends" MapObject, meaning it has all of its properties, plus some more.
export interface BaseBuilding extends MapObject {
  id: string // For base buildings, the ID is usually their coordinate string
  displayName: string
  fillColor: string
  borderColor: string
  imageKey?: string // Optional property for buildings with special images
  // We will add more properties like 'ruins', etc. as needed.
}

export interface Alliance {
  id: number
  name: string
  tag: string
  color: string
}

export interface Player {
  id: number
  name: string
  rallyCap: string // RENAMED from 'power' to match the label
  power: string // NEW field for player power
  tcLevel: string // Your new field
  notes?: string
  color: string
}
