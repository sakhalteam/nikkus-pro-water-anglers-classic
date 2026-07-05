import type { LureCategory, StructureKind } from './types'

export interface LureColor {
  name: string
  tint: number
}

export interface LureDef {
  id: string
  name: string
  category: LureCategory
  colors: LureColor[]
  /** Running depth in feet while being retrieved */
  runDepth: number
  /** ft/s the lure sinks while idle in the water (0 = floats) */
  sinkRate: number
  /** ft/s toward the boat while reeling */
  retrieveSpeed: number
  /** Visual wobble amplitude in the cast view, px */
  action: number
  /** Structure types this lure excels around */
  strengths: StructureKind[]
  blurb: string
}

export const LURES: LureDef[] = [
  {
    id: 'spinner', name: 'Spinnerbait', category: 'spinnerbait',
    colors: [
      { name: 'White', tint: 0xf0f0f0 },
      { name: 'Chartreuse', tint: 0xd8f04a },
      { name: 'Black', tint: 0x33333d },
    ],
    runDepth: 4, sinkRate: 1.5, retrieveSpeed: 10, action: 3,
    strengths: ['weeds', 'timber'],
    blurb: 'Flash and vibration. Burns over shallow cover.',
  },
  {
    id: 'crank_shallow', name: 'Shallow Crankbait', category: 'crankbait',
    colors: [
      { name: 'Firetiger', tint: 0xe8a33d },
      { name: 'Shad', tint: 0xc8d0e0 },
      { name: 'Craw', tint: 0xb05030 },
    ],
    runDepth: 5, sinkRate: 0, retrieveSpeed: 9, action: 4,
    strengths: ['rock', 'dock'],
    blurb: 'Wobbling plug that dives to 5 feet.',
  },
  {
    id: 'crank_deep', name: 'Deep Crankbait', category: 'crankbait',
    colors: [
      { name: 'Shad', tint: 0xc8d0e0 },
      { name: 'Chartreuse', tint: 0xd8f04a },
      { name: 'Blue Back', tint: 0x4a6cd4 },
    ],
    runDepth: 14, sinkRate: 0, retrieveSpeed: 8, action: 4,
    strengths: ['rock', 'open'],
    blurb: 'Big lip, digs down to 14 feet.',
  },
  {
    id: 'worm', name: 'Plastic Worm', category: 'worm',
    colors: [
      { name: 'Purple', tint: 0x8a4ad4 },
      { name: 'Pumpkin', tint: 0xa87838 },
      { name: 'Black', tint: 0x33333d },
    ],
    runDepth: 0, sinkRate: 3, retrieveSpeed: 4, action: 2,
    strengths: ['weeds', 'timber', 'dock'],
    blurb: 'Slow bottom crawler. Deadly on lazy bass.',
  },
  {
    id: 'popper', name: 'Topwater Popper', category: 'topwater',
    colors: [
      { name: 'Bone', tint: 0xe8e0c8 },
      { name: 'Frog', tint: 0x5fae4a },
    ],
    runDepth: 0, sinkRate: 0, retrieveSpeed: 5, action: 5,
    strengths: ['weeds', 'open'],
    blurb: 'Stays on the surface. Explosive dawn strikes.',
  },
  {
    id: 'jig', name: 'Rubber Jig', category: 'jig',
    colors: [
      { name: 'Black/Blue', tint: 0x3a4a8a },
      { name: 'Brown', tint: 0x8a6035 },
    ],
    runDepth: 0, sinkRate: 4, retrieveSpeed: 4, action: 2,
    strengths: ['rock', 'timber'],
    blurb: 'Hops along the bottom. Big-fish bait.',
  },
  {
    id: 'minnow', name: 'Jerk Minnow', category: 'minnow',
    colors: [
      { name: 'Silver', tint: 0xd8dce8 },
      { name: 'Gold', tint: 0xd4b04a },
      { name: 'Perch', tint: 0xa8c04a },
    ],
    runDepth: 3, sinkRate: 0.5, retrieveSpeed: 8, action: 5,
    strengths: ['open', 'dock'],
    blurb: 'Darting baitfish imitation.',
  },
  {
    id: 'grub', name: 'Curly Grub', category: 'jig',
    colors: [
      { name: 'White', tint: 0xf0f0f0 },
      { name: 'Smoke', tint: 0x9a9aa8 },
      { name: 'Chartreuse', tint: 0xd8f04a },
    ],
    runDepth: 8, sinkRate: 2, retrieveSpeed: 6, action: 3,
    strengths: ['open', 'rock'],
    blurb: 'Small profile swimmer. Catches everything.',
  },
]

export function lureById(id: string): LureDef {
  const l = LURES.find((x) => x.id === id)
  if (!l) throw new Error(`Unknown lure: ${id}`)
  return l
}

/** Line strength options. Heavier line survives more tension but spooks wary fish. */
export const LINE_TESTS = [8, 12, 20] as const
export type LineTest = (typeof LINE_TESTS)[number]

export function lineMaxTension(test: LineTest): number {
  return { 8: 74, 12: 84, 20: 97 }[test]
}

/** Interest multiplier — light line fools more fish. */
export function lineShyFactor(test: LineTest): number {
  return { 8: 1.15, 12: 1.0, 20: 0.85 }[test]
}
