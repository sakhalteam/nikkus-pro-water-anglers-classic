import * as Phaser from 'phaser'
import { lakeById, lakeTile, LAKE_COLS, LAKE_ROWS, tileInfo } from '../data/lakes'
import { lureById } from '../data/lures'
import { DAY_END_MIN, DAY_START_MIN } from '../data/tournaments'
import { Game, LIVEWELL_LIMIT } from '../state/GameState'
import { effectiveStructure, spotScore } from '../systems/fishing'
import { speciesById } from '../data/species'
import { clockString, drawPanel, textStyle, PALETTE, TEXT, W, H } from '../ui/theme'

const TILE = 16
const MAP_X = (W - LAKE_COLS * TILE) / 2 // 64
const MAP_Y = 96

const TILE_TEXTURES: Record<string, string> = {
  '#': 'tile_land',
  '.': 'tile_shallow',
  ',': 'tile_medium',
  ':': 'tile_deep',
  W: 'tile_weeds',
  T: 'tile_timber',
  R: 'tile_rock',
  D: 'tile_dock',
  S: 'tile_launch',
}

/** Top-down boat navigation on the lake map — the tournament-day hub. */
export class LakeScene extends Phaser.Scene {
  private boat!: Phaser.GameObjects.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private spaceKey!: Phaser.Input.Keyboard.Key

  private hudTime!: Phaser.GameObjects.Text
  private hudDay!: Phaser.GameObjects.Text
  private hudLivewell!: Phaser.GameObjects.Text
  private hudLure!: Phaser.GameObjects.Text
  private hudHint!: Phaser.GameObjects.Text
  private finderText!: Phaser.GameObjects.Text
  private finderMarks!: Phaser.GameObjects.Graphics

  private idleClockMs = 0
  private moveClockMs = 0
  private confirmingEnd = false
  private livewellPanel?: Phaser.GameObjects.Container
  private ending = false

  constructor() {
    super({ key: 'LakeScene' })
  }

  create() {
    this.ending = false
    this.confirmingEnd = false
    const lake = lakeById(Game.lakeId)

    this.add.rectangle(W / 2, H / 2, W, H, 0x0c1022)

    // --- map tiles ---
    for (let r = 0; r < LAKE_ROWS; r++) {
      for (let c = 0; c < LAKE_COLS; c++) {
        this.add
          .image(MAP_X + c * TILE, MAP_Y + r * TILE, TILE_TEXTURES[lake.grid[r][c]])
          .setOrigin(0)
      }
    }

    // --- boat ---
    this.boat = this.add.image(MAP_X + Game.boatX, MAP_Y + Game.boatY, 'boat').setDepth(10)

    // --- top HUD ---
    drawPanel(this, 4, 4, W - 8, 84, 0.9)
    this.hudDay = this.add.text(16, 12, '', textStyle(11, TEXT.accent, { fontStyle: 'bold' }))
    this.hudTime = this.add.text(16, 32, '', textStyle(13, TEXT.main, { fontStyle: 'bold' }))
    this.hudLivewell = this.add.text(16, 56, '', textStyle(10, TEXT.water))
    this.hudLure = this.add.text(W - 16, 12, '', textStyle(10, TEXT.main)).setOrigin(1, 0)
    this.add
      .text(W - 16, 32, `${lake.name}  -  ${Game.weather.toUpperCase()}`, textStyle(10, TEXT.dim))
      .setOrigin(1, 0)
    this.hudHint = this.add.text(W - 16, 56, '', textStyle(9, TEXT.dim)).setOrigin(1, 0)

    // --- depth finder (bottom) ---
    drawPanel(this, 4, MAP_Y + LAKE_ROWS * TILE + 8, W - 8, H - (MAP_Y + LAKE_ROWS * TILE) - 12, 0.9)
    this.add.text(16, MAP_Y + LAKE_ROWS * TILE + 16, 'DEPTH FINDER', textStyle(9, TEXT.dim))
    this.finderText = this.add.text(16, MAP_Y + LAKE_ROWS * TILE + 32, '', textStyle(11, TEXT.good))
    this.finderMarks = this.add.graphics()

    // --- input ---
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.spaceKey = this.input.keyboard!.addKey('SPACE')

    this.input.keyboard!.on('keydown-T', () => {
      if (this.livewellPanel) return
      this.scene.pause()
      this.scene.launch('TackleScene', { from: 'LakeScene' })
    })
    this.input.keyboard!.on('keydown-L', () => this.toggleLivewell())
    this.input.keyboard!.on('keydown-ENTER', () => this.handleEndKey())
    this.input.keyboard!.on('keydown-ESC', () => {
      if (Game.mode === 'free') this.scene.start('MenuScene')
      else this.confirmingEnd = false
    })

    this.updateHud()
  }

  update(_time: number, delta: number) {
    if (this.ending) return
    if (this.livewellPanel) return // paused while viewing livewell

    const left = this.cursors.left.isDown
    const right = this.cursors.right.isDown
    const up = this.cursors.up.isDown
    const down = this.cursors.down.isDown
    let dx = (right ? 1 : 0) - (left ? 1 : 0)
    let dy = (down ? 1 : 0) - (up ? 1 : 0)
    const moving = dx !== 0 || dy !== 0

    if (moving) {
      const len = Math.hypot(dx, dy)
      const speed = 70 * (delta / 1000)
      const nx = Game.boatX + (dx / len) * speed
      const ny = Game.boatY + (dy / len) * speed
      const lake = lakeById(Game.lakeId)
      const tile = lakeTile(lake, Math.floor(ny / TILE), Math.floor(nx / TILE))
      if (tile.water) {
        Game.boatX = nx
        Game.boatY = ny
        this.boat.setPosition(MAP_X + nx, MAP_Y + ny)
        this.boat.setRotation(Math.atan2(dy, dx))
      }
    }

    // --- clock: running the boat burns daylight faster than sitting still ---
    if (moving) {
      this.moveClockMs += delta
      if (this.moveClockMs >= 400) {
        this.moveClockMs -= 400
        this.tickClock(1)
      }
    } else {
      this.idleClockMs += delta
      if (this.idleClockMs >= 1400) {
        this.idleClockMs -= 1400
        this.tickClock(1)
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startFishing()
    }

    this.updateHud()
  }

  private tickClock(min: number) {
    Game.timeMin += min
    if (Game.mode === 'tournament' && Game.timeMin >= DAY_END_MIN) {
      this.goToWeighIn('TIME! Heading to the weigh-in...')
    } else if (Game.mode === 'free' && Game.timeMin >= 20 * 60) {
      Game.timeMin = DAY_START_MIN // free fishing: night skips to next dawn
    }
  }

  private handleEndKey() {
    if (Game.mode !== 'tournament') return
    if (!this.confirmingEnd) {
      this.confirmingEnd = true
      return
    }
    this.goToWeighIn('Heading in early...')
  }

  private goToWeighIn(msg: string) {
    if (this.ending) return
    this.ending = true
    this.hudHint.setText('')
    const banner = this.add
      .text(W / 2, H / 2, msg, textStyle(14, TEXT.accent, { fontStyle: 'bold', backgroundColor: '#10142a' }))
      .setOrigin(0.5)
      .setDepth(100)
      .setPadding(12, 8, 12, 8)
    this.tweens.add({ targets: banner, alpha: { from: 0, to: 1 }, duration: 200 })
    this.time.delayedCall(1400, () => this.scene.start('WeighInScene'))
  }

  private startFishing() {
    const row = Math.floor(Game.boatY / TILE)
    const col = Math.floor(Game.boatX / TILE)
    const lake = lakeById(Game.lakeId)
    const t = lakeTile(lake, row, col)
    if (!t.water) return
    Game.fishingCtx = {
      lakeId: Game.lakeId,
      row,
      col,
      depth: t.depth,
      structure: effectiveStructure(Game.lakeId, row, col),
    }
    this.scene.start('CastScene')
  }

  private toggleLivewell() {
    if (this.livewellPanel) {
      this.livewellPanel.destroy()
      this.livewellPanel = undefined
      return
    }
    const c = this.add.container(0, 0).setDepth(200)
    const g = this.add.graphics()
    g.fillStyle(PALETTE.panelDark, 0.96)
    g.fillRect(W / 2 - 150, 120, 300, 200)
    g.lineStyle(2, PALETTE.panelBorder, 1)
    g.strokeRect(W / 2 - 150, 120, 300, 200)
    c.add(g)
    c.add(
      this.add
        .text(W / 2, 136, `LIVEWELL  ${Game.livewell.length}/${LIVEWELL_LIMIT}`, textStyle(12, TEXT.accent, { fontStyle: 'bold' }))
        .setOrigin(0.5)
    )
    if (Game.livewell.length === 0) {
      c.add(this.add.text(W / 2, 210, 'Empty. Go catch some bass!', textStyle(10, TEXT.dim)).setOrigin(0.5))
    } else {
      Game.livewell
        .slice()
        .sort((a, b) => b.weight - a.weight)
        .forEach((f, i) => {
          c.add(
            this.add.text(W / 2 - 130, 158 + i * 24, speciesById(f.speciesId).name, textStyle(10, TEXT.main))
          )
          c.add(
            this.add
              .text(W / 2 + 130, 158 + i * 24, `${f.weight.toFixed(1)} lb`, textStyle(10, TEXT.water))
              .setOrigin(1, 0)
          )
        })
      c.add(
        this.add
          .text(W / 2, 296, `TOTAL: ${Game.livewellWeight().toFixed(1)} lb`, textStyle(11, TEXT.good, { fontStyle: 'bold' }))
          .setOrigin(0.5)
      )
    }
    this.livewellPanel = c
  }

  private updateHud() {
    const t = Game.tournament
    this.hudDay.setText(
      Game.mode === 'tournament' && t
        ? `${Game.currentTournamentDef().name.toUpperCase()}  -  DAY ${t.day}`
        : 'FREE FISHING'
    )
    const deadline = Game.mode === 'tournament' ? `  (weigh-in ${clockString(DAY_END_MIN)})` : ''
    this.hudTime.setText(`${clockString(Game.timeMin)}${deadline}`)
    this.hudLivewell.setText(
      `LIVEWELL: ${Game.livewell.length}/${LIVEWELL_LIMIT}  ${Game.livewellWeight().toFixed(1)} lb`
    )
    const lure = lureById(Game.tackle.lureId)
    this.hudLure.setText(
      `${lure.name} / ${lure.colors[Game.tackle.colorIndex].name} / ${Game.tackle.lineTest} lb line`
    )
    this.hudHint.setText(
      this.confirmingEnd
        ? 'ENTER again: weigh in now!  ESC: cancel'
        : Game.mode === 'tournament'
          ? 'SPACE fish  T tackle  L livewell  ENTER weigh-in'
          : 'SPACE fish  T tackle  L livewell  ESC menu'
    )

    // depth finder
    const row = Math.floor(Game.boatY / TILE)
    const col = Math.floor(Game.boatX / TILE)
    const lake = lakeById(Game.lakeId)
    const tile = lakeTile(lake, row, col)
    if (tile.water) {
      const structure = effectiveStructure(Game.lakeId, row, col)
      const score = spotScore(
        { lakeId: Game.lakeId, row, col, depth: tile.depth, structure },
        Game.weather,
        Game.timeMin
      )
      this.finderText.setText(
        `${tile.depth} FT   BOTTOM: ${structure.toUpperCase()}${tile.launch ? '   [LAUNCH RAMP]' : ''}`
      )
      // fish marks: fuzzy activity readout, 0-4 arches
      const marks = Math.min(4, Math.round(score * 1.8))
      const gx = W - 130
      const gy = MAP_Y + LAKE_ROWS * TILE + 34
      this.finderMarks.clear()
      this.finderMarks.lineStyle(2, 0x5fd07a, 1)
      for (let i = 0; i < marks; i++) {
        this.finderMarks.beginPath()
        this.finderMarks.arc(gx + i * 26, gy + 8, 8, Math.PI * 1.15, Math.PI * 1.85)
        this.finderMarks.strokePath()
      }
    } else {
      this.finderText.setText('---')
      this.finderMarks.clear()
    }
  }
}
