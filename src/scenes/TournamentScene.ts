import * as Phaser from 'phaser'
import { CPU_ANGLERS, PLAYER_NAME } from '../data/anglers'
import { lakeById } from '../data/lakes'
import { CIRCUIT } from '../data/tournaments'
import { Game } from '../state/GameState'
import { drawPanel, textStyle, TEXT, W, H } from '../ui/theme'

/** Pre-day briefing: tournament name, day, weather, and current standings. */
export class TournamentScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TournamentScene' })
  }

  create() {
    if (!Game.tournament) {
      // Continuing a season between tournaments
      if (Game.circuitComplete()) {
        this.scene.start('CircuitScene')
        return
      }
      Game.startTournament()
      Game.save()
    }

    const t = Game.tournament!
    const def = CIRCUIT[t.circuitIndex]
    const lake = lakeById(def.lakeId)

    this.add.rectangle(W / 2, H / 2, W, H, 0x10142a)
    this.add
      .text(W / 2, 40, def.name.toUpperCase(), textStyle(17, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)
    this.add
      .text(
        W / 2,
        66,
        `${lake.name}   -   DAY ${t.day} OF ${def.days}   -   ${t.weather.toUpperCase()}`,
        textStyle(11, TEXT.water)
      )
      .setOrigin(0.5)
    this.add
      .text(W / 2, 86, `Event ${t.circuitIndex + 1} of ${CIRCUIT.length} on the circuit`, textStyle(9, TEXT.dim))
      .setOrigin(0.5)

    // Standings after completed days (or entry list on day 1)
    drawPanel(this, 70, 104, W - 140, 264)
    const header = t.day === 1 ? 'FIELD' : `STANDINGS AFTER DAY ${t.day - 1}`
    this.add.text(W / 2, 118, header, textStyle(11, TEXT.main, { fontStyle: 'bold' })).setOrigin(0.5)

    const names = [PLAYER_NAME, ...CPU_ANGLERS.map((a) => a.name)]
    const totals = Game.totalsForTournament()
    const rows = names
      .map((name, i) => ({ name, total: totals[i] ?? 0, isPlayer: i === 0 }))
      .sort((a, b) => b.total - a.total)

    rows.forEach((row, i) => {
      const col = i < 8 ? 0 : 1
      const y = 140 + (i % 8) * 26
      const x = 92 + col * 190
      const color = row.isPlayer ? TEXT.accent : TEXT.main
      this.add.text(x, y, `${String(i + 1).padStart(2)}.`, textStyle(10, TEXT.dim))
      this.add.text(x + 26, y, row.name, textStyle(10, color))
      this.add
        .text(x + 160, y, t.day === 1 ? '--' : `${row.total.toFixed(1)}`, textStyle(10, color))
        .setOrigin(1, 0)
    })

    const press = this.add
      .text(W / 2, H - 52, `PRESS SPACE  -  BLAST OFF, DAY ${t.day}`, textStyle(13, TEXT.main, { fontStyle: 'bold' }))
      .setOrigin(0.5)
    this.tweens.add({ targets: press, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 })
    this.add
      .text(W / 2, H - 26, 'ESC: save & quit to menu', textStyle(9, TEXT.dim))
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('LakeScene'))
    this.input.keyboard!.once('keydown-ESC', () => {
      Game.save()
      this.scene.start('MenuScene')
    })
  }
}
