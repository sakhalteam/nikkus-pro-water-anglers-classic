/** CPU tournament competitors. Skill 0..1 drives their daily weigh-in weights. */

export interface AnglerDef {
  name: string
  skill: number
}

export const CPU_ANGLERS: AnglerDef[] = [
  { name: 'B. Hawg', skill: 0.92 },
  { name: 'R. Lunker', skill: 0.88 },
  { name: 'K. Shimano', skill: 0.85 },
  { name: 'T. Weedline', skill: 0.8 },
  { name: 'J. Crankshaw', skill: 0.78 },
  { name: 'M. Topwater', skill: 0.74 },
  { name: 'S. Jigging', skill: 0.7 },
  { name: 'D. Backlash', skill: 0.66 },
  { name: 'P. Livewell', skill: 0.62 },
  { name: 'A. Spinner', skill: 0.58 },
  { name: 'G. Stumpy', skill: 0.54 },
  { name: 'L. Driftwood', skill: 0.5 },
  { name: 'C. Skunked', skill: 0.42 },
  { name: 'F. Tangles', skill: 0.36 },
  { name: 'E. Dockside', skill: 0.3 },
]

export const PLAYER_NAME = 'YOU'
