import type { LureCategory, StructureKind } from './types'

export interface FishSpecies {
  id: string
  name: string
  /** Texture key of the loaded PNG in public/assets/fish */
  textureKey: string
  minWeight: number
  maxWeight: number
  /** Counts toward tournament weigh-in (bass species only, like Bassin's) */
  scoring: boolean
  /** 0..1 baseline willingness to strike */
  aggression: number
  /** Fight strength multiplier */
  fight: number
  /** Preferred depth band in feet [min, max] */
  depthPref: [number, number]
  structurePref: StructureKind[]
  lurePref: LureCategory[]
  /** Swim speed in the cast view, ft/s */
  speed: number
}

export const SPECIES: FishSpecies[] = [
  {
    id: 'largemouth', name: 'Largemouth Bass', textureKey: 'large_mouth_bass',
    minWeight: 0.8, maxWeight: 11, scoring: true,
    aggression: 0.55, fight: 1.0, depthPref: [2, 12],
    structurePref: ['weeds', 'timber', 'dock'],
    lurePref: ['spinnerbait', 'worm', 'crankbait', 'topwater'], speed: 7,
  },
  {
    id: 'smallmouth', name: 'Smallmouth Bass', textureKey: 'black_bass',
    minWeight: 0.6, maxWeight: 6.5, scoring: true,
    aggression: 0.6, fight: 1.25, depthPref: [6, 20],
    structurePref: ['rock', 'open'],
    lurePref: ['crankbait', 'jig', 'minnow'], speed: 8,
  },
  {
    id: 'spotted', name: 'Spotted Bass', textureKey: 'spotted_bass',
    minWeight: 0.5, maxWeight: 5, scoring: true,
    aggression: 0.6, fight: 1.1, depthPref: [5, 18],
    structurePref: ['rock', 'timber'],
    lurePref: ['crankbait', 'jig', 'spinnerbait'], speed: 8,
  },
  {
    id: 'rockbass', name: 'Rock Bass', textureKey: 'rock_bass',
    minWeight: 0.2, maxWeight: 1.5, scoring: false,
    aggression: 0.75, fight: 0.5, depthPref: [2, 12],
    structurePref: ['rock', 'dock'],
    lurePref: ['jig', 'worm', 'minnow'], speed: 6,
  },
  {
    id: 'crappie', name: 'Black Crappie', textureKey: 'black_crappie',
    minWeight: 0.2, maxWeight: 2.5, scoring: false,
    aggression: 0.65, fight: 0.5, depthPref: [4, 15],
    structurePref: ['timber', 'dock'],
    lurePref: ['jig', 'minnow'], speed: 5,
  },
  {
    id: 'bluegill', name: 'Bluegill', textureKey: 'bluegill_panfish',
    minWeight: 0.1, maxWeight: 1.2, scoring: false,
    aggression: 0.85, fight: 0.35, depthPref: [1, 8],
    structurePref: ['weeds', 'dock'],
    lurePref: ['worm', 'jig'], speed: 4,
  },
  {
    id: 'sunfish', name: 'Redbreast Sunfish', textureKey: 'redbreast_sunfish_panfish',
    minWeight: 0.1, maxWeight: 1, scoring: false,
    aggression: 0.85, fight: 0.3, depthPref: [1, 6],
    structurePref: ['weeds', 'open'],
    lurePref: ['worm', 'jig'], speed: 4,
  },
  {
    id: 'perch', name: 'Yellow Perch', textureKey: 'yellow_perch',
    minWeight: 0.2, maxWeight: 2, scoring: false,
    aggression: 0.7, fight: 0.4, depthPref: [6, 20],
    structurePref: ['open', 'weeds'],
    lurePref: ['minnow', 'jig'], speed: 5,
  },
  {
    id: 'walleye', name: 'Walleye', textureKey: 'walleye',
    minWeight: 1, maxWeight: 10, scoring: false,
    aggression: 0.4, fight: 0.9, depthPref: [12, 30],
    structurePref: ['rock', 'open'],
    lurePref: ['crankbait', 'minnow', 'jig'], speed: 7,
  },
  {
    id: 'channelcat', name: 'Channel Catfish', textureKey: 'channel_catfish',
    minWeight: 1.5, maxWeight: 18, scoring: false,
    aggression: 0.3, fight: 1.3, depthPref: [10, 30],
    structurePref: ['open', 'timber'],
    lurePref: ['worm', 'jig'], speed: 5,
  },
  {
    id: 'flathead', name: 'Flathead Catfish', textureKey: 'flathead_catfish',
    minWeight: 3, maxWeight: 30, scoring: false,
    aggression: 0.2, fight: 1.5, depthPref: [15, 30],
    structurePref: ['timber', 'open'],
    lurePref: ['worm', 'jig'], speed: 4,
  },
  {
    id: 'muskie', name: 'Muskie', textureKey: 'muskie',
    minWeight: 5, maxWeight: 35, scoring: false,
    aggression: 0.15, fight: 1.8, depthPref: [8, 25],
    structurePref: ['weeds', 'open'],
    lurePref: ['crankbait', 'minnow', 'spinnerbait'], speed: 10,
  },
]

export function speciesById(id: string): FishSpecies {
  const s = SPECIES.find((f) => f.id === id)
  if (!s) throw new Error(`Unknown species: ${id}`)
  return s
}
