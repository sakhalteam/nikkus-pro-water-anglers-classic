import * as Phaser from 'phaser'
import { Game } from '../state/GameState'
import { drawPanel, textStyle, TEXT, W, H } from '../ui/theme'

interface MenuItem {
  label: string
  enabled: boolean
  action: () => void
}

export class MenuScene extends Phaser.Scene {
  private items: MenuItem[] = []
  private labels: Phaser.GameObjects.Text[] = []
  private cursor!: Phaser.GameObjects.Text
  private index = 0

  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x10142a)
    this.add
      .text(W / 2, 60, 'MAIN MENU', textStyle(20, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)

    const hasSave = Game.hasSave()
    this.items = [
      {
        label: 'TOURNAMENT  (NEW SEASON)',
        enabled: true,
        action: () => {
          Game.newTournamentRun()
          this.scene.start('TournamentScene')
        },
      },
      {
        label: hasSave ? 'CONTINUE SEASON' : 'CONTINUE SEASON  (NO SAVE)',
        enabled: hasSave,
        action: () => {
          if (Game.load()) {
            this.scene.start(Game.circuitComplete() ? 'CircuitScene' : 'TournamentScene')
          }
        },
      },
      {
        label: 'FREE FISHING',
        enabled: true,
        action: () => this.scene.start('LakeSelectScene'),
      },
      {
        label: 'HOW TO PLAY',
        enabled: true,
        action: () => this.scene.start('HowToScene'),
      },
    ]

    drawPanel(this, W / 2 - 180, 120, 360, 190)
    this.labels = this.items.map((item, i) =>
      this.add
        .text(W / 2 - 140, 150 + i * 40, item.label, textStyle(13, item.enabled ? TEXT.main : TEXT.dim))
        .setOrigin(0, 0.5)
    )
    this.cursor = this.add.text(W / 2 - 160, 0, '>', textStyle(13, TEXT.accent)).setOrigin(0, 0.5)

    this.add
      .text(W / 2, H - 60, 'ARROWS: select   SPACE/ENTER: confirm', textStyle(10, TEXT.dim))
      .setOrigin(0.5)

    this.index = 0
    this.updateCursor()

    const kb = this.input.keyboard!
    kb.on('keydown-UP', () => this.move(-1))
    kb.on('keydown-DOWN', () => this.move(1))
    kb.on('keydown-SPACE', () => this.confirm())
    kb.on('keydown-ENTER', () => this.confirm())
  }

  private move(dir: number) {
    this.index = Phaser.Math.Wrap(this.index + dir, 0, this.items.length)
    this.updateCursor()
  }

  private confirm() {
    const item = this.items[this.index]
    if (item.enabled) item.action()
  }

  private updateCursor() {
    this.cursor.setY(this.labels[this.index].y)
    this.labels.forEach((l, i) =>
      l.setColor(i === this.index && this.items[i].enabled ? TEXT.accent : this.items[i].enabled ? TEXT.main : TEXT.dim)
    )
  }
}
