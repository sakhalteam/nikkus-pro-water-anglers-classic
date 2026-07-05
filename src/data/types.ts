/** Shared game data types. */

export type StructureKind = 'open' | 'weeds' | 'timber' | 'rock' | 'dock'

export type LureCategory =
  | 'spinnerbait'
  | 'crankbait'
  | 'worm'
  | 'topwater'
  | 'jig'
  | 'minnow'

export type Weather = 'sunny' | 'cloudy' | 'rainy'

export interface CaughtFish {
  speciesId: string
  weight: number // lbs
  day: number // tournament day (0 in free fishing)
  timeMin: number // minutes since midnight when caught
  lakeId: string
}

/** Where the boat is fishing right now — threaded between Lake/Cast/Fight/Catch scenes. */
export interface FishingContext {
  lakeId: string
  row: number
  col: number
  depth: number // bottom depth at this tile, in feet
  structure: StructureKind
}
