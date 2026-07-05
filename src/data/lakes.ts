import type { StructureKind } from './types'

/**
 * Lake maps are ASCII grids, 24 cols x 16 rows. Legend:
 *   '#' land        '.' shallow water (3 ft)   ',' medium water (10 ft)
 *   ':' deep water (22 ft)                     'W' weed bed (4 ft)
 *   'T' standing timber (11 ft)                'R' rock pile (15 ft)
 *   'D' boat dock (5 ft)                       'S' launch ramp / weigh-in (4 ft)
 * Edit these strings to reshape a lake — a validator throws on bad rows.
 */

export const LAKE_COLS = 24
export const LAKE_ROWS = 16

export interface TileInfo {
  water: boolean
  depth: number
  structure: StructureKind
  launch: boolean
}

export function tileInfo(ch: string): TileInfo {
  switch (ch) {
    case '#': return { water: false, depth: 0, structure: 'open', launch: false }
    case '.': return { water: true, depth: 3, structure: 'open', launch: false }
    case ',': return { water: true, depth: 10, structure: 'open', launch: false }
    case ':': return { water: true, depth: 22, structure: 'open', launch: false }
    case 'W': return { water: true, depth: 4, structure: 'weeds', launch: false }
    case 'T': return { water: true, depth: 11, structure: 'timber', launch: false }
    case 'R': return { water: true, depth: 15, structure: 'rock', launch: false }
    case 'D': return { water: true, depth: 5, structure: 'dock', launch: false }
    case 'S': return { water: true, depth: 4, structure: 'open', launch: true }
    default: throw new Error(`Unknown tile char: '${ch}'`)
  }
}

export interface LakeDef {
  id: string
  name: string
  blurb: string
  grid: string[]
  /** Average fish size multiplier for the lake */
  quality: number
  /** Relative species abundance; species not listed use weight 0.3 */
  speciesWeights: Record<string, number>
}

export const LAKES: LakeDef[] = [
  {
    id: 'nikku',
    name: 'Lake Nikku',
    blurb: 'A weedy backwater bowl. Lots of eager, average-size largemouth.',
    quality: 0.85,
    speciesWeights: {
      largemouth: 3, bluegill: 2, sunfish: 1.5, crappie: 1, muskie: 0.15,
    },
    grid: [
      '########################',
      '#.....WW......WW.......#',
      '#..WWW..........WW.....#',
      '#..WW...,,,,,,....W....#',
      '#.......,,,,,,,........#',
      '#....,,,,::::,,,,......#',
      '#..D.,,::::::::,,,..W..#',
      '#....,,::::::::,,...WW.#',
      '#....,,,::::::,,,...WW.#',
      '#.....,,,,::,,,,.......#',
      '#WW.....,,,,,,......T..#',
      '#WWW......,,.......TT..#',
      '#.WW..............TT...#',
      '#......S...............#',
      '#####..................#',
      '########################',
    ],
  },
  {
    id: 'clearwater',
    name: 'Clearwater Reservoir',
    blurb: 'Deep, rocky, and clear. Smallmouth country — go light on the line.',
    quality: 1.0,
    speciesWeights: {
      smallmouth: 3, spotted: 2, walleye: 1.5, perch: 1.5, rockbass: 1,
    },
    grid: [
      '########################',
      '#,,....RR....,,,,......#',
      '#,,,..RRR..,,::::,,....#',
      '#.,,,,,,,,,::::::,,,...#',
      '#..,,::::::::::::::,,..#',
      '#..,::::RR::::::::,,...#',
      '#.,,::::RR:::::::,,....#',
      '#.,,:::::::::R:::,,....#',
      '#..,,::::::::R::,,,....#',
      '#...,,,:::::::,,,..##..#',
      '#.D...,,,,,,,,,...##...#',
      '#......,,,,,,....##....#',
      '#..,,...,,......#......#',
      '#...............#..S...#',
      '####...####....##......#',
      '########################',
    ],
  },
  {
    id: 'stumpfield',
    name: 'Stumpfield Lake',
    blurb: 'A flooded forest. Flip the timber for big largemouth and slab crappie.',
    quality: 1.1,
    speciesWeights: {
      largemouth: 2.5, crappie: 2, flathead: 0.8, channelcat: 1, spotted: 1,
    },
    grid: [
      '########################',
      '#..TT......,,,....TT...#',
      '#.TTT..,,,,,,,,,..TTT..#',
      '#..T..,,TT,,,,,,,..T...#',
      '#.....,,TT,,::,,,......#',
      '#...,,,,,,::::,,,,.....#',
      '#..,,,T,,::::::,,T,....#',
      '#..,,TT,::::::::,TT....#',
      '#...,,T,,::::::,,T,....#',
      '#....,,,,,::::,,,......#',
      '#..S..,,,,,,,,,....WW..#',
      '#.....,,,,,,,,....WWW..#',
      '#..##....,,,,......W...#',
      '#.####.....,,..........#',
      '#..##.......D..........#',
      '########################',
    ],
  },
  {
    id: 'champions',
    name: "Champion's Basin",
    blurb: 'The classic. Every kind of cover, and the biggest bass in the circuit.',
    quality: 1.3,
    speciesWeights: {
      largemouth: 2.5, smallmouth: 2, spotted: 1.5, muskie: 0.3, walleye: 1,
    },
    grid: [
      '########################',
      '#.WW..,,,,::::,,,..RR..#',
      '#.WWW,,,::::::::,,.RRR.#',
      '#..W,,,::::::::::,,,R..#',
      '#...,,::::TTT:::::,,...#',
      '#..,,:::::TTT::::::,,..#',
      '#.,,::::::::::::::::,,.#',
      '#.,,:::RR::::::::::,,..#',
      '#..,,::RR:::::::::,,...#',
      '#...,,,:::::::::,,,....#',
      '#.D..,,,,:::::,,,..TT..#',
      '#......,,,,,,,,....TT..#',
      '#.WW....,,,,,..........#',
      '#.WWW.....,,....S......#',
      '#..W...................#',
      '########################',
    ],
  },
]

// Validate grids at module load so a bad edit fails loudly.
for (const lake of LAKES) {
  if (lake.grid.length !== LAKE_ROWS) {
    throw new Error(`Lake ${lake.id}: expected ${LAKE_ROWS} rows, got ${lake.grid.length}`)
  }
  lake.grid.forEach((row, i) => {
    if (row.length !== LAKE_COLS) {
      throw new Error(`Lake ${lake.id} row ${i}: expected ${LAKE_COLS} cols, got ${row.length}`)
    }
    for (const ch of row) tileInfo(ch)
  })
  if (!lake.grid.some((r) => r.includes('S'))) {
    throw new Error(`Lake ${lake.id}: missing launch tile 'S'`)
  }
}

export function lakeById(id: string): LakeDef {
  const l = LAKES.find((x) => x.id === id)
  if (!l) throw new Error(`Unknown lake: ${id}`)
  return l
}

export function lakeTile(lake: LakeDef, row: number, col: number): TileInfo {
  if (row < 0 || row >= LAKE_ROWS || col < 0 || col >= LAKE_COLS) {
    return { water: false, depth: 0, structure: 'open', launch: false }
  }
  return tileInfo(lake.grid[row][col])
}

export function findLaunch(lake: LakeDef): { row: number; col: number } {
  for (let r = 0; r < LAKE_ROWS; r++) {
    const c = lake.grid[r].indexOf('S')
    if (c >= 0) return { row: r, col: c }
  }
  throw new Error('no launch')
}
