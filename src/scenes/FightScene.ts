import * as Phaser from 'phaser'
import { lineMaxTension } from '../data/lures'
import { speciesById } from '../data/species'
import { Game } from '../state/GameState'
import { drawPanel, textStyle, PALETTE, TEXT, W, H } from '../ui/theme'

const SURFACE_Y = 150

interface FightData {
  speciesId: string
  weight: number
  hookDist: number
}

/** Reel-vs-run tug of war. Hold SPACE to gain line, release to protect it. */
export class FightScene extends Phaser.Scene {
  private fight!: FightData
  private spaceKey!: Phaser.Input.Keyboard.Key

  private distance = 40
  private startDistance = 40
  private tension = 40
  private stamina = 100
  private maxStamina = 100
  private slackT = 0
  private phase: 'run' | 'rest' = 'run'
  private phaseT = 1.5
  private over = false

  private fishSprite!: Phaser.GameObjects.Image
  private gfx!: Phaser.GameObjects.Graphics
  private statusText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'FightScene' })
  }

  create(data: FightData) {
    this.fight = data
    this.over = false
    this.slackT = 0
    this.tension = 40
    this.startDistance = Math.max(12, data.hookDist)
    this.distance = this.startDistance
    const species = speciesById(data.speciesId)
    this.maxStamina = 15 + data.weight * 6 * species.fight
    this.stamina = this.maxStamina
    this.phase = 'run'
    this.phaseT = 1.2

    // backdrop: sky + water
    const g = this.add.graphics()
    g.fillStyle(0x8ab4e8, 1)
    g.fillRect(0, 0, W, SURFACE_Y)
    g.fillGradientStyle(PALETTE.waterShallow, PALETTE.waterShallow, PALETTE.waterDeep, PALETTE.waterDeep, 1)
    g.fillRect(0, SURFACE_Y, W, H - SURFACE_Y)

    this.add.image(46, SURFACE_Y - 8, 'boat').setScale(2)
    this.add.image(40, SURFACE_Y - 36, 'angler_back')

    this.fishSprite = this.add
      .image(this.fishX(), SURFACE_Y + 60, species.textureKey)
      .setTint(0x33475f)
    const len = Phaser.Math.Clamp(24 + data.weight * 4, 24, 90)
    this.fishSprite.setDisplaySize(len, len * 0.45)
    this.fishSprite.setFlipX(true)

    this.gfx = this.add.graphics().setDepth(10)

    drawPanel(this, 4, 4, W - 8, 78, 0.9)
    this.add.text(16, 12, 'FISH ON!', textStyle(13, TEXT.accent, { fontStyle: 'bold' })).setDepth(11)
    this.statusText = this.add.text(W - 16, 12, '', textStyle(10, TEXT.main)).setOrigin(1, 0).setDepth(11)
    this.add.text(284, 36, 'TENSION', textStyle(8, TEXT.dim)).setDepth(11)
    this.add.text(284, 56, 'LINE GAINED', textStyle(8, TEXT.dim)).setDepth(11)
    this.hintText = this.add
      .text(W / 2, H - 14, 'HOLD SPACE: reel   RELEASE: let it run', textStyle(10, TEXT.accent))
      .setOrigin(0.5, 1)
      .setDepth(11)

    this.spaceKey = this.input.keyboard!.addKey('SPACE')
  }

  private fishX(): number {
    // distance 0 = boatside, startDistance = far right
    return 90 + (this.distance / this.startDistance) * (W - 150)
  }

  update(_t: number, delta: number) {
    if (this.over) return
    const dt = delta / 1000
    const species = speciesById(this.fight.speciesId)
    const reeling = this.spaceKey.isDown
    const tired = this.stamina <= 0

    // fish alternates runs and rests; tired fish barely pulls
    this.phaseT -= dt
    if (this.phaseT <= 0) {
      if (this.phase === 'run') {
        this.phase = 'rest'
        this.phaseT = 0.8 + Math.random() * 1.6
      } else {
        this.phase = 'run'
        this.phaseT = tired ? 0.5 + Math.random() * 0.6 : 1.0 + Math.random() * 1.8
        // occasional jump on a fresh run
        if (!tired && Math.random() < 0.35) this.jump()
      }
    }

    const pullStrength = (16 + this.fight.weight * 2.6 * species.fight) * (tired ? 0.3 : 1)

    if (this.phase === 'run') {
      this.tension += pullStrength * dt * (reeling ? 1.6 : 0.7)
      if (!reeling) this.distance += (tired ? 1 : 4) * dt
    } else {
      this.tension += reeling ? 14 * dt : 0
    }

    if (reeling) {
      const reelSpeed = Math.max(2.5, 8 - this.fight.weight * 0.18)
      this.distance -= reelSpeed * dt
    } else {
      this.tension -= 34 * dt
    }
    this.tension = Phaser.Math.Clamp(this.tension, 0, 110)

    // working the fish in the mid-tension band wears it down
    if (this.tension > 30) {
      this.stamina -= dt * (this.tension / 22)
    }

    // slack line lets the hook fall out
    if (this.tension < 6) {
      this.slackT += dt
      if (this.slackT > 2.2) {
        this.finish('threw', 'The hook pulled free... too much slack!')
        return
      }
    } else {
      this.slackT = Math.max(0, this.slackT - dt)
    }

    if (this.tension >= lineMaxTension(Game.tackle.lineTest)) {
      this.finish('snap', `SNAP! The ${Game.tackle.lineTest} lb line broke!`)
      return
    }

    if (this.distance <= 1) {
      this.finish('landed', '')
      return
    }

    // --- render ---
    this.fishSprite.setX(this.fishX())
    this.fishSprite.setY(SURFACE_Y + 50 + Math.sin(this.time.now / 150) * 8)
    this.statusText.setText(
      tired ? "It's giving up!" : this.phase === 'run' ? "It's running!" : "It's resting..."
    )
    this.drawMeters()
  }

  private jump() {
    this.tension = Math.min(108, this.tension + 10)
    this.tweens.add({
      targets: this.fishSprite,
      y: SURFACE_Y - 30,
      duration: 260,
      yoyo: true,
      ease: 'Quad.easeOut',
    })
    this.cameras.main.shake(120, 0.004)
  }

  private drawMeters() {
    const max = lineMaxTension(Game.tackle.lineTest)
    this.gfx.clear()

    // tension bar
    this.gfx.fillStyle(0x10142a, 0.9)
    this.gfx.fillRect(16, 34, 260, 14)
    const frac = this.tension / 110
    const color = this.tension > max * 0.85 ? PALETTE.bad : this.tension > max * 0.6 ? PALETTE.warn : PALETTE.good
    this.gfx.fillStyle(color, 1)
    this.gfx.fillRect(18, 36, 256 * frac, 10)
    // break point marker
    this.gfx.fillStyle(0xffffff, 0.9)
    this.gfx.fillRect(18 + 256 * (max / 110), 32, 2, 18)

    // line remaining bar
    this.gfx.fillStyle(0x10142a, 0.9)
    this.gfx.fillRect(16, 56, 260, 10)
    this.gfx.fillStyle(0x4a90d4, 1)
    this.gfx.fillRect(18, 58, 256 * (1 - this.distance / this.startDistance), 6)

    // fishing line to the fish
    this.gfx.lineStyle(1, 0xe8e8f0, 0.8)
    this.gfx.beginPath()
    this.gfx.moveTo(60, SURFACE_Y - 46)
    this.gfx.lineTo(this.fishSprite.x, this.fishSprite.y)
    this.gfx.strokePath()
  }

  private finish(result: 'landed' | 'snap' | 'threw', msg: string) {
    this.over = true
    Game.timeMin += 3 // a fight eats clock

    if (result === 'landed') {
      this.scene.start('CatchScene', { speciesId: this.fight.speciesId, weight: this.fight.weight })
      return
    }

    this.cameras.main.flash(250, 255, 60, 50)
    this.hintText.setText('')
    this.statusText.setText('')
    this.add
      .text(W / 2, H / 2 - 20, msg, textStyle(13, TEXT.bad, { fontStyle: 'bold', align: 'center', wordWrap: { width: 380 } }))
      .setOrigin(0.5)
      .setDepth(20)
    this.add
      .text(W / 2, H / 2 + 16, 'SPACE: keep fishing', textStyle(10, TEXT.dim))
      .setOrigin(0.5)
      .setDepth(20)
    this.tweens.add({ targets: this.fishSprite, x: W + 100, alpha: 0.4, duration: 700 })
    this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('CastScene'))
  }
}
