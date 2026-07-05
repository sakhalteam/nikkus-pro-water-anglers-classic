import * as Phaser from 'phaser'
import { LURES, LINE_TESTS, lureById } from '../data/lures'
import { Game } from '../state/GameState'
import { lureIconKey } from '../ui/placeholders'
import { drawPanel, textStyle, PALETTE, TEXT, W, H } from '../ui/theme'

/** Tackle box overlay — launched on top of LakeScene or CastScene. */
export class TackleScene extends Phaser.Scene {
  private from = 'LakeScene'
  private index = 0
  private rows: Phaser.GameObjects.Text[] = []
  private icon!: Phaser.GameObjects.Image
  private detail!: Phaser.GameObjects.Text
  private rigText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'TackleScene' })
  }

  create(data: { from?: string }) {
    this.from = data.from ?? 'LakeScene'
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
    drawPanel(this, 40, 40, W - 80, H - 80)
    this.add
      .text(W / 2, 60, 'TACKLE BOX', textStyle(15, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)

    this.index = LURES.findIndex((l) => l.id === Game.tackle.lureId)
    if (this.index < 0) this.index = 0

    this.rows = LURES.map((lure, i) =>
      this.add.text(64, 92 + i * 26, lure.name, textStyle(11))
    )

    // details panel on the right
    const dx = W / 2 + 20
    this.add.graphics().fillStyle(PALETTE.panelDark, 1).fillRect(dx - 10, 88, 200, 216)
    this.icon = this.add.image(dx + 90, 120, lureIconKey('spinnerbait')).setScale(3)
    this.detail = this.add.text(dx, 152, '', textStyle(9, TEXT.water, { wordWrap: { width: 185 }, lineSpacing: 4 }))
    this.rigText = this.add.text(64, H - 116, '', textStyle(11, TEXT.good))

    this.add.text(
      64,
      H - 76,
      'UP/DOWN: lure   C: color   X: line test\nSPACE/ESC: close',
      textStyle(9, TEXT.dim, { lineSpacing: 4 })
    )

    const kb = this.input.keyboard!
    kb.on('keydown-UP', () => this.move(-1))
    kb.on('keydown-DOWN', () => this.move(1))
    kb.on('keydown-C', () => this.cycleColor())
    kb.on('keydown-X', () => this.cycleLine())
    kb.on('keydown-SPACE', () => this.close())
    kb.on('keydown-ESC', () => this.close())

    this.render()
  }

  private move(dir: number) {
    this.index = Phaser.Math.Wrap(this.index + dir, 0, LURES.length)
    Game.tackle.lureId = LURES[this.index].id
    Game.tackle.colorIndex = 0
    this.render()
  }

  private cycleColor() {
    const lure = lureById(Game.tackle.lureId)
    Game.tackle.colorIndex = (Game.tackle.colorIndex + 1) % lure.colors.length
    this.render()
  }

  private cycleLine() {
    const i = LINE_TESTS.indexOf(Game.tackle.lineTest)
    Game.tackle.lineTest = LINE_TESTS[(i + 1) % LINE_TESTS.length]
    this.render()
  }

  private render() {
    this.rows.forEach((row, i) => {
      const selected = i === this.index
      row.setColor(selected ? TEXT.accent : TEXT.main)
      row.setText(`${selected ? '> ' : '  '}${LURES[i].name}`)
    })
    const lure = LURES[this.index]
    const color = lure.colors[Game.tackle.colorIndex]
    this.icon.setTexture(lureIconKey(lure.category))
    this.icon.setTint(color.tint)
    const depthDesc = lure.sinkRate > 0 ? `sinks ${lure.sinkRate} ft/s` : 'floats'
    this.detail.setText(
      `${lure.blurb}\n\nRuns: ${lure.runDepth} ft (${depthDesc})\nSpeed: ${lure.retrieveSpeed} ft/s\nBest: ${lure.strengths.join(', ')}`
    )
    this.rigText.setText(
      `RIGGED: ${lure.name} - ${color.name} - ${Game.tackle.lineTest} lb test`
    )
  }

  private close() {
    this.scene.stop()
    this.scene.resume(this.from)
  }
}
