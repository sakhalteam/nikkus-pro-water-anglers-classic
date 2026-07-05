import * as Phaser from 'phaser'
import { LAKES, LAKE_COLS, LAKE_ROWS, tileInfo } from '../data/lakes'
import { Game } from '../state/GameState'
import { drawPanel, textStyle, TEXT, W, H } from '../ui/theme'

/** Free-fishing lake picker with a mini-map preview. */
export class LakeSelectScene extends Phaser.Scene {
  private index = 0
  private nameText!: Phaser.GameObjects.Text
  private blurbText!: Phaser.GameObjects.Text
  private miniMap!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'LakeSelectScene' })
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x10142a)
    this.add
      .text(W / 2, 44, 'SELECT LAKE', textStyle(18, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)

    drawPanel(this, 56, 76, W - 112, H - 170)
    this.nameText = this.add.text(W / 2, 102, '', textStyle(15, TEXT.main, { fontStyle: 'bold' })).setOrigin(0.5)
    this.miniMap = this.add.graphics()
    this.blurbText = this.add
      .text(W / 2, H - 130, '', textStyle(11, TEXT.water, { wordWrap: { width: W - 160 }, align: 'center' }))
      .setOrigin(0.5, 0)

    this.add
      .text(W / 2, H - 46, 'LEFT/RIGHT: lake   SPACE: fish it   ESC: back', textStyle(10, TEXT.dim))
      .setOrigin(0.5)

    this.index = 0
    this.render()

    const kb = this.input.keyboard!
    kb.on('keydown-LEFT', () => {
      this.index = Phaser.Math.Wrap(this.index - 1, 0, LAKES.length)
      this.render()
    })
    kb.on('keydown-RIGHT', () => {
      this.index = Phaser.Math.Wrap(this.index + 1, 0, LAKES.length)
      this.render()
    })
    kb.once('keydown-SPACE', () => {
      Game.newFreeFishing(LAKES[this.index].id)
      this.scene.start('LakeScene')
    })
    kb.once('keydown-ESC', () => this.scene.start('MenuScene'))
  }

  private render() {
    const lake = LAKES[this.index]
    this.nameText.setText(`< ${lake.name} >  (${this.index + 1}/${LAKES.length})`)
    this.blurbText.setText(lake.blurb)

    // mini-map: 8px tiles
    const px = 8
    const ox = W / 2 - (LAKE_COLS * px) / 2
    const oy = 124
    this.miniMap.clear()
    for (let r = 0; r < LAKE_ROWS; r++) {
      for (let c = 0; c < LAKE_COLS; c++) {
        const t = tileInfo(lake.grid[r][c])
        let color = 0x4a7a3a // land
        if (t.water) {
          color = t.depth <= 5 ? 0x4585c9 : t.depth <= 12 ? 0x2d61a8 : 0x1c4283
          if (t.structure === 'weeds') color = 0x2f8a4a
          if (t.structure === 'timber') color = 0x8a6035
          if (t.structure === 'rock') color = 0x8a8a96
          if (t.structure === 'dock') color = 0xb08a50
          if (t.launch) color = 0xd8433b
        }
        this.miniMap.fillStyle(color, 1)
        this.miniMap.fillRect(ox + c * px, oy + r * px, px - 1, px - 1)
      }
    }
  }
}
