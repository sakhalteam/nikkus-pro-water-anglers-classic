/** The tournament circuit, fished in order. Placement earns circuit points. */

export interface TournamentDef {
  id: string
  name: string
  lakeId: string
  days: number
}

export const CIRCUIT: TournamentDef[] = [
  { id: 'open', name: 'Backwater Open', lakeId: 'nikku', days: 2 },
  { id: 'clear', name: 'Clearwater Invitational', lakeId: 'clearwater', days: 2 },
  { id: 'stump', name: 'Stumpfield Pro-Am', lakeId: 'stumpfield', days: 3 },
  { id: 'classic', name: "Anglers Classic Championship", lakeId: 'champions', days: 3 },
]

/** Circuit points by finishing place (1st, 2nd, ...). Beyond the table: floor. */
const POINTS_TABLE = [300, 260, 235, 215, 200, 188, 178, 170, 163, 157, 152, 148, 144, 141, 138, 135]

export function pointsForPlace(place: number): number {
  return POINTS_TABLE[Math.min(place - 1, POINTS_TABLE.length - 1)]
}

/** Tournament day runs 6:00 AM to 2:00 PM. */
export const DAY_START_MIN = 6 * 60
export const DAY_END_MIN = 14 * 60
