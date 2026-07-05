import { CPU_ANGLERS } from '../data/anglers'
import { lakeById, findLaunch } from '../data/lakes'
import { CIRCUIT, DAY_START_MIN, pointsForPlace } from '../data/tournaments'
import type { CaughtFish, FishingContext, Weather } from '../data/types'
import type { LineTest } from '../data/lures'

export const LIVEWELL_LIMIT = 5

export interface TackleSetup {
  lureId: string
  colorIndex: number
  lineTest: LineTest
}

export interface TournamentProgress {
  circuitIndex: number
  day: number // 1-based
  /** dayWeights[anglerIndex][dayIndex]; angler 0 is the player */
  dayWeights: number[][]
  weather: Weather
}

interface SaveData {
  version: number
  circuitIndex: number
  pointsByAngler: number[]
  tournament: TournamentProgress | null
  bestFish: CaughtFish | null
}

const SAVE_KEY = 'nikkus-pwac-save-v1'
export const ANGLER_COUNT = CPU_ANGLERS.length + 1 // + player

function rollWeather(): Weather {
  const r = Math.random()
  return r < 0.45 ? 'sunny' : r < 0.8 ? 'cloudy' : 'rainy'
}

export function weatherActivity(w: Weather): number {
  return { sunny: 0.85, cloudy: 1.1, rainy: 1.3 }[w]
}

/** Fish activity by time of day — dawn bite, midday lull. */
export function timeActivity(timeMin: number): number {
  const h = timeMin / 60
  if (h < 8) return 1.3
  if (h < 11) return 1.0
  if (h < 13) return 0.7
  return 0.95
}

/**
 * All persistent + session game state. Scenes read/write this singleton;
 * saving happens between tournament days via localStorage.
 */
class GameState {
  mode: 'tournament' | 'free' = 'free'

  // --- Circuit (persistent) ---
  circuitIndex = 0
  pointsByAngler: number[] = new Array(ANGLER_COUNT).fill(0)
  tournament: TournamentProgress | null = null
  bestFish: CaughtFish | null = null

  // --- Current day session (not persisted mid-day) ---
  lakeId = 'nikku'
  timeMin = DAY_START_MIN
  weather: Weather = 'sunny'
  livewell: CaughtFish[] = []
  catchLog: CaughtFish[] = []
  boatX = 0
  boatY = 0
  tackle: TackleSetup = { lureId: 'spinner', colorIndex: 0, lineTest: 12 }
  fishingCtx: FishingContext | null = null

  // ---------------------------------------------------------------- setup

  newTournamentRun() {
    this.mode = 'tournament'
    this.circuitIndex = 0
    this.pointsByAngler = new Array(ANGLER_COUNT).fill(0)
    this.bestFish = null
    this.startTournament()
    this.save()
  }

  startTournament() {
    const t = CIRCUIT[this.circuitIndex]
    this.tournament = {
      circuitIndex: this.circuitIndex,
      day: 1,
      dayWeights: Array.from({ length: ANGLER_COUNT }, () => []),
      weather: rollWeather(),
    }
    this.startDaySession(t.lakeId, this.tournament.weather)
  }

  newFreeFishing(lakeId: string) {
    this.mode = 'free'
    this.tournament = null
    this.startDaySession(lakeId, rollWeather())
  }

  /** Reset the boat, clock, and livewell for a fresh day on the water. */
  startDaySession(lakeId: string, weather: Weather) {
    this.lakeId = lakeId
    this.weather = weather
    this.timeMin = DAY_START_MIN
    this.livewell = []
    this.catchLog = []
    this.fishingCtx = null
    const launch = findLaunch(lakeById(lakeId))
    this.boatX = (launch.col + 0.5) * 16
    this.boatY = (launch.row + 0.5) * 16
  }

  currentTournamentDef() {
    return CIRCUIT[this.tournament?.circuitIndex ?? this.circuitIndex]
  }

  // ---------------------------------------------------------------- livewell

  livewellWeight(): number {
    return this.livewell.reduce((s, f) => s + f.weight, 0)
  }

  smallestInLivewell(): CaughtFish | null {
    if (this.livewell.length === 0) return null
    return this.livewell.reduce((a, b) => (a.weight <= b.weight ? a : b))
  }

  addToLivewell(fish: CaughtFish): { kept: boolean; culled: CaughtFish | null } {
    if (this.livewell.length < LIVEWELL_LIMIT) {
      this.livewell.push(fish)
      return { kept: true, culled: null }
    }
    const smallest = this.smallestInLivewell()!
    if (fish.weight > smallest.weight) {
      this.livewell = this.livewell.filter((f) => f !== smallest)
      this.livewell.push(fish)
      return { kept: true, culled: smallest }
    }
    return { kept: false, culled: null }
  }

  recordCatch(fish: CaughtFish) {
    this.catchLog.push(fish)
    if (!this.bestFish || fish.weight > this.bestFish.weight) {
      this.bestFish = fish
    }
  }

  // ---------------------------------------------------------------- weigh-in

  /** Commit the player's livewell + simulated CPU weights for the current day. */
  finishDay() {
    if (!this.tournament) return
    const t = this.tournament
    const lake = lakeById(CIRCUIT[t.circuitIndex].lakeId)
    t.dayWeights[0][t.day - 1] = Math.round(this.livewellWeight() * 10) / 10
    CPU_ANGLERS.forEach((cpu, i) => {
      const blankDay = Math.random() < 0.06
      const w = blankDay
        ? 0
        : cpu.skill * 11 * lake.quality * weatherActivity(t.weather) * (0.4 + Math.random() * 1.1)
      t.dayWeights[i + 1][t.day - 1] = Math.round(w * 10) / 10
    })
  }

  totalsForTournament(): number[] {
    if (!this.tournament) return []
    return this.tournament.dayWeights.map((days) =>
      Math.round(days.reduce((s, w) => s + w, 0) * 10) / 10
    )
  }

  /** True if there is another day to fish in the current tournament. */
  advanceDay(): boolean {
    if (!this.tournament) return false
    const def = CIRCUIT[this.tournament.circuitIndex]
    if (this.tournament.day < def.days) {
      this.tournament.day += 1
      this.tournament.weather = rollWeather()
      this.startDaySession(def.lakeId, this.tournament.weather)
      this.save()
      return true
    }
    return false
  }

  /** Award circuit points for the finished tournament. Returns player place (1-based). */
  finishTournament(): number {
    const totals = this.totalsForTournament()
    const order = totals
      .map((w, i) => ({ w, i }))
      .sort((a, b) => b.w - a.w)
    order.forEach((entry, rank) => {
      this.pointsByAngler[entry.i] += pointsForPlace(rank + 1)
    })
    const place = order.findIndex((e) => e.i === 0) + 1
    this.circuitIndex += 1
    this.tournament = null
    this.save()
    return place
  }

  circuitComplete(): boolean {
    return this.circuitIndex >= CIRCUIT.length
  }

  // ---------------------------------------------------------------- save/load

  save() {
    const data: SaveData = {
      version: 1,
      circuitIndex: this.circuitIndex,
      pointsByAngler: this.pointsByAngler,
      tournament: this.tournament,
      bestFish: this.bestFish,
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch {
      // storage unavailable (private mode etc.) — play on without saving
    }
  }

  hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null
    } catch {
      return false
    }
  }

  /** Load a saved tournament run. Returns false if none/corrupt. */
  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return false
      const data = JSON.parse(raw) as SaveData
      if (data.version !== 1) return false
      this.mode = 'tournament'
      this.circuitIndex = data.circuitIndex
      this.pointsByAngler = data.pointsByAngler
      this.tournament = data.tournament
      this.bestFish = data.bestFish
      if (this.tournament) {
        const def = CIRCUIT[this.tournament.circuitIndex]
        this.startDaySession(def.lakeId, this.tournament.weather)
      } else if (!this.circuitComplete()) {
        this.startTournament()
      }
      return true
    } catch {
      return false
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      // ignore
    }
  }
}

export const Game = new GameState()
