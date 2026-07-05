import * as Phaser from 'phaser'
import { CPU_ANGLERS, PLAYER_NAME } from '../data/anglers'
import { CIRCUIT } from '../data/tournaments'
import { Game } from '../state/GameState'
import { drawPanel, textStyle, TEXT, W, H } from '../ui/theme'

/** End-of-day weigh-in: commits weights, shows the leaderboard. */
export class WeighInScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WeighInScene' })
  }

  create() {
    if (!Game.tournament) {
      this.scene.start('MenuScene')
      return
    }

    Game.finishDay()
    const t = Game.tournament
    const def = CIRCUIT[t.circuitIndex]
    const dayIdx = t.day - 1

    this.add.rectangle(W / 2, H / 2, W, H, 0x10142a)
    this.add
      .text(W / 2, 36, `WEIGH-IN  -  DAY ${t.day} OF ${def.days}`, textStyle(16, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)
    this.add.text(W / 2, 60, def.name, textStyle(10, TEXT.dim)).setOrigin(0.5)

    drawPanel(this, 56, 78, W - 112, 296)
    const names = [PLAYER_NAME, ...CPU_ANGLERS.map((a) => a.name)]
    const totals = Game.totalsForTournament()
    const rows = names
      .map((name, i) => ({
        name,
        today: t.dayWeights[i][dayIdx] ?? 0,
        total: totals[i],
        isPlayer: i === 0,
      }))
      .sort((a, b) => b.total - a.total)

    this.add.text(84, 92, 'PLACE  ANGLER', textStyle(9, TEXT.dim))
    this.add.text(W - 84, 92, 'TODAY    TOTAL', textStyle(9, TEXT.dim)).setOrigin(1, 0)

    rows.forEach((row, i) => {
      const y = 112 + i * 16
      const color = row.isPlayer ? TEXT.accent : TEXT.main
      this.add.text(84, y, `${String(i + 1).padStart(2)}.  ${row.name}`, textStyle(10, color))
      this.add
        .text(W - 84, y, `${row.today.toFixed(1).padStart(5)}  ${row.total.toFixed(1).padStart(7)}`, textStyle(10, color))
        .setOrigin(1, 0)
    })

    const playerPlace = rows.findIndex((r) => r.isPlayer) + 1
    const lastDay = t.day >= def.days
    this.add
      .text(
        W / 2,
        H - 56,
        lastDay
          ? `FINAL: you placed #${playerPlace}!  SPACE: circuit standings`
          : `You're in #${playerPlace}.  SPACE: on to day ${t.day + 1}`,
        textStyle(11, TEXT.main, { fontStyle: 'bold' })
      )
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      if (Game.advanceDay()) {
        this.scene.start('TournamentScene')
      } else {
        this.scene.start('CircuitScene', { justFinishedPlace: Game.finishTournament() })
      }
    })
  }
}
