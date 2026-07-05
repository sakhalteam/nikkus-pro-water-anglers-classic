import { lakeById, lakeTile } from '../data/lakes'
import { SPECIES, type FishSpecies } from '../data/species'
import { timeActivity, weatherActivity } from '../state/GameState'
import type { FishingContext, StructureKind, Weather } from '../data/types'

export function structureBonus(s: StructureKind): number {
  return { open: 0.6, weeds: 1.35, timber: 1.4, rock: 1.25, dock: 1.3 }[s]
}

/**
 * How good a spot is right now, ~0.2..2. Drives the depth-finder fish marks
 * and how many fish spawn in the cast view.
 */
export function spotScore(ctx: FishingContext, weather: Weather, timeMin: number): number {
  return structureBonus(ctx.structure) * weatherActivity(weather) * timeActivity(timeMin)
}

/** Best structure in the tile or its 4 neighbors — fish relate to nearby cover. */
export function effectiveStructure(lakeId: string, row: number, col: number): StructureKind {
  const lake = lakeById(lakeId)
  const candidates: StructureKind[] = []
  for (const [dr, dc] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const t = lakeTile(lake, row + dr, col + dc)
    if (t.water) candidates.push(t.structure)
  }
  let best: StructureKind = 'open'
  for (const s of candidates) {
    if (structureBonus(s) > structureBonus(best)) best = s
  }
  return best
}

export interface FishSpawn {
  species: FishSpecies
  weight: number
  /** distance from the boat in feet */
  dist: number
  /** depth in feet */
  depth: number
}

function pickSpecies(ctx: FishingContext, lakeId: string): FishSpecies {
  const lake = lakeById(lakeId)
  const weighted = SPECIES.map((s) => {
    let w = lake.speciesWeights[s.id] ?? 0.3
    if (s.structurePref.includes(ctx.structure)) w *= 1.8
    // depth suitability: does the species' band overlap this water column?
    if (ctx.depth < s.depthPref[0] * 0.5) w *= 0.25
    return { s, w }
  })
  const total = weighted.reduce((sum, e) => sum + e.w, 0)
  let roll = Math.random() * total
  for (const e of weighted) {
    roll -= e.w
    if (roll <= 0) return e.s
  }
  return weighted[weighted.length - 1].s
}

/** Populate the water column at a spot for the cast view. */
export function spawnFish(
  ctx: FishingContext,
  weather: Weather,
  timeMin: number,
  maxDist: number
): FishSpawn[] {
  const lake = lakeById(ctx.lakeId)
  const score = spotScore(ctx, weather, timeMin)
  const count = Math.max(1, Math.min(7, Math.round(score * 2.5 + Math.random() * 2)))

  const fish: FishSpawn[] = []
  for (let i = 0; i < count; i++) {
    const species = pickSpecies(ctx, ctx.lakeId)
    // squared roll biases toward small fish; structure + lake quality lift the ceiling
    const roll = Math.random() ** 2
    const sizeMult = lake.quality * (0.85 + structureBonus(ctx.structure) * 0.25)
    const weight = Math.min(
      species.maxWeight,
      (species.minWeight + roll * (species.maxWeight - species.minWeight)) * sizeMult
    )
    const dMin = Math.min(species.depthPref[0], ctx.depth - 1)
    const dMax = Math.min(species.depthPref[1], ctx.depth - 0.5)
    fish.push({
      species,
      weight: Math.max(species.minWeight, Math.round(weight * 10) / 10),
      dist: 8 + Math.random() * (maxDist - 12),
      depth: Math.max(1, dMin + Math.random() * Math.max(0.5, dMax - dMin)),
    })
  }
  return fish
}
