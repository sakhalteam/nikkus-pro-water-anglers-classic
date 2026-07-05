import * as Phaser from 'phaser'
import { CPU_ANGLERS, PLAYER_NAME } from '../data/anglers'
import { CIRCUIT } from '../data/tournaments'
import { Game } from '../state/GameState'
import { drawPanel, textStyle, TEXT, W, H } from '../ui/theme'

/** Season points standings between tournaments, and the champion screen. */
export class CircuitScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CircuitScene' })
  }

  create(data: { justFinishedPlace?: number }) {
    const done = Game.circuitComplete()

    this.add.rectangle(W / 2, H / 2, W, H, 0x10142a)
    this.add
      .text(W / 2, 36, done ? 'FINAL CIRCUIT STANDINGS' : 'CIRCUIT STANDINGS', textStyle(16, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)
    if (data.justFinishedPlace) {
      this.add
        .text(W / 2, 60, `Tournament result: #${data.justFinishedPlace}`, textStyle(10, TEXT.water))
        .setOrigin(0.5)
    }

    drawPanel(this, 76, 78, W - 152, 290)
    const names = [PLAYER_NAME, ...CPU_ANGLERS.map((a) => a.name)]
    const rows = names
      .map((name, i) => ({ name, pts: Game.pointsByAngler[i], isPlayer: i === 0 }))
      .sort((a, b) => b.pts - a.pts)

    rows.forEach((row, i) => {
      const y = 96 + i * 16
      const color = row.isPlayer ? TEXT.accent : TEXT.main
      this.add.text(100, y, `${String(i + 1).padStart(2)}.  ${row.name}`, textStyle(10, color))
      this.add.text(W - 104, y, `${row.pts} pts`, textStyle(10, color)).setOrigin(1, 0)
    })

    const playerPlace = rows.findIndex((r) => r.isPlayer) + 1

    if (done) {
      const champ = rows[0]
      const msg = champ.isPlayer
        ? 'YOU ARE THE ANGLER OF THE YEAR!'
        : `${champ.name} takes Angler of the Year. You finished #${playerPlace}.`
      this.add
        .text(W / 2, H - 66, msg, textStyle(12, champ.isPlayer ? TEXT.accent : TEXT.main, { fontStyle: 'bold', align: 'center', wordWrap: { width: 400 } }))
        .setOrigin(0.5)
      this.add.text(W / 2, H - 34, 'SPACE: main menu', textStyle(10, TEXT.dim)).setOrigin(0.5)
      this.input.keyboard!.once('keydown-SPACE', () => {
        Game.clearSave()
        this.scene.start('MenuScene')
      })
    } else {
      const next = CIRCUIT[Game.circuitIndex]
      this.add
        .text(W / 2, H - 60, `NEXT: ${next.name} (${next.days} days)`, textStyle(11, TEXT.main, { fontStyle: 'bold' }))
        .setOrigin(0.5)
      this.add
        .text(W / 2, H - 34, 'SPACE: continue   ESC: save & quit to menu', textStyle(10, TEXT.dim))
        .setOrigin(0.5)
      this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('TournamentScene'))
      this.input.keyboard!.once('keydown-ESC', () => {
        Game.save()
        this.scene.start('MenuScene')
      })
    }
  }
}
