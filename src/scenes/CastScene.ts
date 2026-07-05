import * as Phaser from 'phaser'
import { lureById, lineShyFactor } from '../data/lures'
import { DAY_END_MIN } from '../data/tournaments'
import type { FishSpecies } from '../data/species'
import { Game, timeActivity, weatherActivity, LIVEWELL_LIMIT } from '../state/GameState'
import { spawnFish, structureBonus } from '../systems/fishing'
import { lureIconKey } from '../ui/placeholders'
import { clockString, drawPanel, textStyle, PALETTE, TEXT, W, H } from '../ui/theme'

// Side-view water column ("underwater cam" placeholder for the SNES cast view)
const SURFACE_Y = 122
const PX_PER_FT_Y = 10
const PX_PER_FT_X = 5.8
const ROD_X = 62
const MAX_DIST = 68 // ft
const MAX_DEPTH = 30 // ft

type CastState = 'aim' | 'power' | 'flying' | 'swim' | 'bite'

interface FishEntity {
  species: FishSpecies
  weight: number
  dist: number
  depth: number
  homeDist: number
  homeDepth: number
  state: 'idle' | 'chase' | 'bite' | 'flee'
  wanderT: number
  fleeT: number
  sprite: Phaser.GameObjects.Image
}

export class CastScene extends Phaser.Scene {
  private state: CastState = 'aim'
  private spaceKey!: Phaser.Input.Keyboard.Key
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  private aimDist = 40
  private castPower = 0
  private powerDir = 1

  private lureSprite!: Phaser.GameObjects.Image
  private lureDist = 0
  private lureDepth = 0
  private lureVisible = false

  private fish: FishEntity[] = []
  private biter?: FishEntity
  private biteTimer = 0

  private gfx!: Phaser.GameObjects.Graphics
  private hudHint!: Phaser.GameObjects.Text
  private hudTime!: Phaser.GameObjects.Text
  private hudInfo!: Phaser.GameObjects.Text
  private banner!: Phaser.GameObjects.Text
  private bottomDepth = 20

  constructor() {
    super({ key: 'CastScene' })
  }

  create() {
    const ctx = Game.fishingCtx
    if (!ctx) {
      this.scene.start('LakeScene')
      return
    }
    this.bottomDepth = Math.min(ctx.depth, MAX_DEPTH)

    this.drawBackdrop()

    // boat + angler at the left edge of the water
    this.add.image(46, SURFACE_Y - 6, 'boat').setScale(2).setAngle(0)
    this.add.image(40, SURFACE_Y - 34, 'angler_back').setScale(1)

    this.gfx = this.add.graphics().setDepth(20)
    this.lureSprite = this.add
      .image(0, 0, lureIconKey(lureById(Game.tackle.lureId).category))
      .setDepth(21)
      .setVisible(false)

    // HUD
    drawPanel(this, 4, 4, W - 8, 58, 0.9)
    this.hudTime = this.add.text(16, 12, '', textStyle(11, TEXT.main, { fontStyle: 'bold' })).setDepth(30)
    this.hudInfo = this.add.text(16, 34, '', textStyle(9, TEXT.water)).setDepth(30)
    this.hudHint = this.add
      .text(W / 2, H - 14, '', textStyle(10, TEXT.accent))
      .setOrigin(0.5, 1)
      .setDepth(30)
    this.banner = this.add
      .text(W / 2, 200, '', textStyle(20, TEXT.bad, { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setDepth(30)
      .setShadow(2, 2, '#000', 0)

    this.spaceKey = this.input.keyboard!.addKey('SPACE')
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.state === 'aim' || this.state === 'swim') this.backToLake()
    })
    this.input.keyboard!.on('keydown-T', () => {
      if (this.state !== 'aim') return
      this.scene.pause()
      this.scene.launch('TackleScene', { from: 'CastScene' })
    })
    // Re-rig may have changed the lure — refresh its icon when we resume.
    this.events.on('resume', () => {
      this.lureSprite.setTexture(lureIconKey(lureById(Game.tackle.lureId).category))
    })

    // populate the water column
    this.fish = spawnFish(ctx, Game.weather, Game.timeMin, MAX_DIST).map((f) => {
      const len = Phaser.Math.Clamp(18 + f.weight * 3, 16, 60)
      const sprite = this.add
        .image(this.distToX(f.dist), this.depthToY(f.depth), f.species.textureKey)
        .setDepth(15)
        .setTint(0x2a3a55)
        .setAlpha(0.9)
      sprite.setDisplaySize(len, len * 0.45)
      return {
        species: f.species,
        weight: f.weight,
        dist: f.dist,
        depth: f.depth,
        homeDist: f.dist,
        homeDepth: f.depth,
        state: 'idle' as const,
        wanderT: Math.random() * 10,
        fleeT: 0,
        sprite,
      }
    })

    this.state = 'aim'
  }

  private drawBackdrop() {
    const g = this.add.graphics()
    // sky
    g.fillStyle(0x8ab4e8, 1)
    g.fillRect(0, 0, W, SURFACE_Y)
    // water bands, darker with depth
    const bandColors = [0x4585c9, 0x3a74b8, 0x2d61a8, 0x255494, 0x1c4283, 0x163570]
    const bandH = (MAX_DEPTH * PX_PER_FT_Y) / bandColors.length
    bandColors.forEach((c, i) => {
      g.fillStyle(c, 1)
      g.fillRect(0, SURFACE_Y + i * bandH, W, bandH + 1)
    })
    // bottom
    const bottomY = this.depthToY(this.bottomDepth)
    g.fillStyle(0x5a4a32, 1)
    g.fillRect(0, bottomY, W, H - bottomY)
    g.fillStyle(0x4a3c28, 1)
    for (let x = 0; x < W; x += 24) g.fillRect(x, bottomY, 12, 4)

    // structure decoration on the bottom
    const ctx = Game.fishingCtx!
    if (ctx.structure === 'weeds') {
      g.fillStyle(PALETTE.weed, 0.9)
      for (let x = 90; x < W; x += 34) {
        const h = 30 + ((x * 7) % 40)
        g.fillTriangle(x, bottomY, x + 6, bottomY - h, x + 12, bottomY)
      }
    } else if (ctx.structure === 'timber') {
      g.fillStyle(PALETTE.wood, 0.9)
      for (let x = 110; x < W; x += 70) {
        g.fillRect(x, bottomY - 70 - ((x * 3) % 30), 8, 70 + ((x * 3) % 30))
      }
    } else if (ctx.structure === 'rock') {
      g.fillStyle(PALETTE.rock, 0.9)
      for (let x = 100; x < W; x += 52) {
        g.fillEllipse(x, bottomY - 6, 34, 20)
      }
    } else if (ctx.structure === 'dock') {
      g.fillStyle(PALETTE.woodDark, 0.9)
      g.fillRect(120, SURFACE_Y - 8, 90, 8)
      g.fillRect(128, SURFACE_Y, 6, 60)
      g.fillRect(196, SURFACE_Y, 6, 60)
    }

    // depth ruler
    for (let ft = 5; ft <= MAX_DEPTH; ft += 5) {
      const y = this.depthToY(ft)
      g.fillStyle(0xffffff, 0.4)
      g.fillRect(0, y, 10, 1)
      this.add.text(14, y - 5, `${ft}`, textStyle(8, 'rgba(255,255,255,0.5)'))
    }
  }

  private distToX(dist: number): number {
    return ROD_X + dist * PX_PER_FT_X
  }

  private depthToY(depth: number): number {
    return SURFACE_Y + depth * PX_PER_FT_Y
  }

  // ------------------------------------------------------------------ update

  update(_t: number, delta: number) {
    if (!Game.fishingCtx) return
    const dt = delta / 1000

    switch (this.state) {
      case 'aim':
        this.updateAim(dt)
        break
      case 'power':
        this.updatePower(dt)
        break
      case 'swim':
        this.updateSwim(dt)
        break
      case 'bite':
        this.updateBite(dt)
        break
    }

    this.updateFish(dt)
    this.redrawOverlay()
    this.updateHud()
  }

  private updateAim(dt: number) {
    if (this.cursors.left.isDown) this.aimDist = Math.max(10, this.aimDist - 40 * dt)
    if (this.cursors.right.isDown) this.aimDist = Math.min(MAX_DIST, this.aimDist + 40 * dt)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.state = 'power'
      this.castPower = 0
      this.powerDir = 1
    }
  }

  private updatePower(dt: number) {
    this.castPower += this.powerDir * 130 * dt
    if (this.castPower >= 100) {
      this.castPower = 100
      this.powerDir = -1
    } else if (this.castPower <= 0) {
      this.castPower = 0
      this.powerDir = 1
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.confirmCast()
  }

  private confirmCast() {
    // power is accuracy: distance from full power overshoots/undershoots the aim
    const err = (this.castPower - 80) / 80 // sweet spot at 80%
    const dist = Phaser.Math.Clamp(this.aimDist * (1 + err * 0.5), 6, MAX_DIST)
    this.state = 'flying'
    Game.timeMin += 2 // each cast burns a couple minutes

    this.lureDist = dist
    this.lureDepth = 0
    this.lureVisible = true
    this.lureSprite.setVisible(true)
    const lure = lureById(Game.tackle.lureId)
    this.lureSprite.setTint(lure.colors[Game.tackle.colorIndex].tint)

    // arc the lure out to the splash point
    const targetX = this.distToX(dist)
    this.lureSprite.setPosition(ROD_X, SURFACE_Y - 40)
    this.tweens.add({
      targets: this.lureSprite,
      x: targetX,
      duration: 450,
      ease: 'Linear',
      onUpdate: (tw) => {
        const p = tw.progress
        this.lureSprite.y = SURFACE_Y - 40 + 40 * p - Math.sin(p * Math.PI) * 50
      },
      onComplete: () => {
        this.state = 'swim'
        this.splash(dist)
      },
    })
  }

  private splash(dist: number) {
    // spook anything near the splash
    for (const f of this.fish) {
      if (Math.abs(f.dist - dist) < 6 && f.depth < 8 && f.state !== 'flee') {
        f.state = 'flee'
        f.fleeT = 99
      }
    }
    const ring = this.add.image(this.distToX(dist), SURFACE_Y, 'px').setDisplaySize(6, 2).setTint(0xffffff)
    this.tweens.add({
      targets: ring,
      displayWidth: 40,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    })
  }

  private updateSwim(dt: number) {
    const lure = lureById(Game.tackle.lureId)
    const reeling = this.spaceKey.isDown
    const bottom = this.bottomDepth - 0.4

    if (reeling) {
      this.lureDist -= lure.retrieveSpeed * dt
      // crankbaits dive toward run depth while moving; sinking lures rise a bit
      const target = Math.min(lure.runDepth, bottom)
      this.lureDepth += (target - this.lureDepth) * Math.min(1, 2.2 * dt)
    } else if (lure.sinkRate > 0) {
      this.lureDepth = Math.min(bottom, this.lureDepth + lure.sinkRate * dt)
    } else if (lure.runDepth > 0) {
      // floating diver rises when paused
      this.lureDepth = Math.max(0, this.lureDepth - 2.5 * dt)
    }
    // near the boat the line lifts the lure
    if (this.lureDist < 6) {
      this.lureDepth = Math.min(this.lureDepth, (this.lureDist / 6) * this.bottomDepth)
    }

    const wobble = reeling ? Math.sin(this.time.now / 60) * lure.action : 0
    this.lureSprite.setPosition(this.distToX(this.lureDist), this.depthToY(this.lureDepth) + wobble)

    if (this.lureDist <= 1.5) {
      this.endRetrieve()
    }
  }

  private endRetrieve() {
    this.lureVisible = false
    this.lureSprite.setVisible(false)
    // day over? head in from the water
    if (Game.mode === 'tournament' && Game.timeMin >= DAY_END_MIN) {
      this.scene.start('WeighInScene')
      return
    }
    if (Game.mode === 'free' && Game.timeMin >= 20 * 60) {
      Game.timeMin = 6 * 60 // free fishing: night skips to next dawn
    }
    this.state = 'aim'
  }

  private updateBite(dt: number) {
    this.biteTimer -= dt
    // shake the lure
    this.lureSprite.setPosition(
      this.distToX(this.lureDist) + Math.sin(this.time.now / 30) * 3,
      this.depthToY(this.lureDepth)
    )
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.setHook()
      return
    }
    if (this.biteTimer <= 0 && this.biter) {
      // spit it out
      this.biter.state = 'flee'
      this.biter.fleeT = 99
      this.biter = undefined
      this.banner.setText('')
      this.state = 'swim'
    }
  }

  private setHook() {
    const f = this.biter!
    this.banner.setText('')
    Game.timeMin += 1
    this.scene.start('FightScene', {
      speciesId: f.species.id,
      weight: f.weight,
      hookDist: this.lureDist,
    })
  }

  // ------------------------------------------------------------------ fish AI

  private lureInterest(f: FishEntity): number {
    const ctx = Game.fishingCtx!
    const lure = lureById(Game.tackle.lureId)
    const reeling = this.spaceKey.isDown

    let match = f.species.lurePref.includes(lure.category) ? 1.6 : 0.7
    if (lure.strengths.includes(ctx.structure)) match *= 1.25
    if (f.species.structurePref.includes(ctx.structure)) match *= 1.15

    const depthGap = Math.abs(f.depth - this.lureDepth)
    const depthProx = Math.max(0, 1 - depthGap / 8)

    // moving bait draws attention; dead-sticking on the bottom does not
    const falling = !reeling && lure.sinkRate > 0 && this.lureDepth < this.bottomDepth - 0.6
    const moveFactor = reeling ? 1.2 : falling ? 1.0 : 0.25

    // color luck rotates by day so no single color is always right
    const day = Game.tournament?.day ?? 1
    const colorLuck = 0.85 + (((day * 7 + Game.tackle.colorIndex * 13) % 7) / 10) * 0.5

    return (
      f.species.aggression *
      match *
      depthProx *
      moveFactor *
      colorLuck *
      weatherActivity(Game.weather) *
      timeActivity(Game.timeMin) *
      lineShyFactor(Game.tackle.lineTest) *
      structureBonus(ctx.structure)
    )
  }

  private updateFish(dt: number) {
    for (const f of this.fish) {
      switch (f.state) {
        case 'idle': {
          f.wanderT += dt
          f.dist = f.homeDist + Math.sin(f.wanderT * 0.5) * 6
          f.depth = Phaser.Math.Clamp(
            f.homeDepth + Math.sin(f.wanderT * 0.8) * 1.5,
            0.5,
            this.bottomDepth - 0.3
          )
          if (this.state === 'swim' && this.lureVisible) {
            const dGap = Math.abs(f.dist - this.lureDist)
            if (dGap < 16 && Math.random() < this.lureInterest(f) * dt * 0.55) {
              f.state = 'chase'
            }
          }
          break
        }
        case 'chase': {
          if (this.state !== 'swim' || !this.lureVisible) {
            f.state = 'idle'
            break
          }
          const speed = f.species.speed * 1.6
          const dx = this.lureDist - f.dist
          const dy = this.lureDepth - f.depth
          const len = Math.hypot(dx, dy)
          if (len < 1.2) {
            // commit or refuse at the last moment
            if (Math.random() < 0.8) {
              f.state = 'bite'
              this.biter = f
              this.biteTimer = 0.85
              this.state = 'bite'
              this.banner.setText('!!! STRIKE !!!')
            } else {
              f.state = 'flee'
              f.fleeT = 99
            }
          } else {
            f.dist += (dx / len) * speed * dt
            f.depth += (dy / len) * speed * dt
          }
          break
        }
        case 'bite': {
          f.dist = this.lureDist
          f.depth = this.lureDepth
          break
        }
        case 'flee': {
          f.dist += f.species.speed * 2 * dt
          f.depth = Math.min(this.bottomDepth - 0.3, f.depth + 2 * dt)
          break
        }
      }

      const x = this.distToX(f.dist)
      f.sprite.setPosition(x, this.depthToY(f.depth))
      f.sprite.setFlipX(f.state === 'chase' || f.state === 'bite')
      if (f.state === 'flee' && x > W + 60) {
        f.sprite.setVisible(false)
      }
    }
  }

  // ------------------------------------------------------------------ drawing

  private redrawOverlay() {
    this.gfx.clear()

    // fishing line
    if (this.lureVisible || this.state === 'flying') {
      this.gfx.lineStyle(1, 0xe8e8f0, 0.7)
      this.gfx.beginPath()
      this.gfx.moveTo(ROD_X, SURFACE_Y - 44)
      this.gfx.lineTo(this.lureSprite.x, Math.min(this.lureSprite.y, SURFACE_Y))
      if (this.lureSprite.y > SURFACE_Y) {
        this.gfx.lineTo(this.lureSprite.x, this.lureSprite.y)
      }
      this.gfx.strokePath()
    }

    // aim marker
    if (this.state === 'aim' || this.state === 'power') {
      const x = this.distToX(this.aimDist)
      this.gfx.fillStyle(0xffd24a, 0.9)
      this.gfx.fillTriangle(x - 6, SURFACE_Y - 14, x + 6, SURFACE_Y - 14, x, SURFACE_Y - 4)
    }

    // power meter
    if (this.state === 'power') {
      this.gfx.fillStyle(0x10142a, 0.85)
      this.gfx.fillRect(W / 2 - 80, 74, 160, 16)
      const c = this.castPower > 92 ? PALETTE.bad : this.castPower > 65 ? PALETTE.good : PALETTE.warn
      this.gfx.fillStyle(c, 1)
      this.gfx.fillRect(W / 2 - 78, 76, 156 * (this.castPower / 100), 12)
      // sweet spot marker at 80%
      this.gfx.fillStyle(0xffffff, 0.9)
      this.gfx.fillRect(W / 2 - 78 + 156 * 0.8, 72, 2, 20)
    }
  }

  private updateHud() {
    const ctx = Game.fishingCtx!
    const lure = lureById(Game.tackle.lureId)
    const deadline = Game.mode === 'tournament' ? `  (in at ${clockString(DAY_END_MIN)})` : ''
    this.hudTime.setText(`${clockString(Game.timeMin)}${deadline}`)
    this.hudInfo.setText(
      `${ctx.depth} FT / ${ctx.structure.toUpperCase()}   ${lure.name} (${lure.colors[Game.tackle.colorIndex].name})   ` +
        `LIVEWELL ${Game.livewell.length}/${LIVEWELL_LIMIT}`
    )
    switch (this.state) {
      case 'aim':
        this.hudHint.setText('LEFT/RIGHT: aim   SPACE: cast   T: tackle   ESC: boat')
        break
      case 'power':
        this.hudHint.setText('SPACE: set power (white line = sweet spot)')
        break
      case 'swim':
        this.hudHint.setText('HOLD SPACE: reel   TAP: twitch   ESC: give up cast')
        break
      case 'bite':
        this.hudHint.setText('SPACE! SET THE HOOK!')
        break
      default:
        this.hudHint.setText('')
    }
  }

  private backToLake() {
    this.scene.start('LakeScene')
  }
}
