import * as Phaser from 'phaser'
import { speciesById } from '../data/species'
import { DAY_END_MIN } from '../data/tournaments'
import type { CaughtFish } from '../data/types'
import { Game, LIVEWELL_LIMIT } from '../state/GameState'
import { drawPanel, textStyle, TEXT, W, H } from '../ui/theme'

/** Landed-fish card: species, weight, and livewell/cull handling. */
export class CatchScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CatchScene' })
  }

  create(data: { speciesId: string; weight: number }) {
    const species = speciesById(data.speciesId)
    const fish: CaughtFish = {
      speciesId: data.speciesId,
      weight: Math.round(data.weight * 10) / 10,
      day: Game.tournament?.day ?? 0,
      timeMin: Game.timeMin,
      lakeId: Game.lakeId,
    }
    Game.recordCatch(fish)

    this.add.rectangle(W / 2, H / 2, W, H, 0x10142a)
    drawPanel(this, W / 2 - 170, 70, 340, 300)

    const isNewBest = Game.bestFish === fish
    this.add
      .text(W / 2, 96, isNewBest ? 'NEW PERSONAL BEST!' : 'NICE CATCH!', textStyle(16, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)

    const img = this.add.image(W / 2, 180, species.textureKey)
    const scale = Math.min(5, 200 / Math.max(1, img.width))
    img.setScale(scale)

    this.add
      .text(W / 2, 258, species.name.toUpperCase(), textStyle(14, TEXT.main, { fontStyle: 'bold' }))
      .setOrigin(0.5)
    this.add
      .text(W / 2, 282, `${fish.weight.toFixed(1)} LBS`, textStyle(13, TEXT.water, { fontStyle: 'bold' }))
      .setOrigin(0.5)

    // livewell handling
    let note = ''
    if (Game.mode === 'tournament') {
      if (!species.scoring) {
        note = "Not a bass - it won't count. Released."
      } else {
        const result = Game.addToLivewell(fish)
        if (!result.kept) {
          note = `Livewell full of bigger fish - released.`
        } else if (result.culled) {
          note = `In the livewell! Culled a ${result.culled.weight.toFixed(1)} lb fish.`
        } else {
          note = `In the livewell! (${Game.livewell.length}/${LIVEWELL_LIMIT}, ${Game.livewellWeight().toFixed(1)} lb total)`
        }
      }
    } else {
      note = 'Logged to your free-fishing records. Released.'
    }
    this.add
      .text(W / 2, 320, note, textStyle(10, TEXT.good, { align: 'center', wordWrap: { width: 300 } }))
      .setOrigin(0.5)

    const press = this.add
      .text(W / 2, H - 54, 'SPACE: keep fishing', textStyle(11, TEXT.main))
      .setOrigin(0.5)
    this.tweens.add({ targets: press, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 })

    this.input.keyboard!.once('keydown-SPACE', () => {
      if (Game.mode === 'tournament' && Game.timeMin >= DAY_END_MIN) {
        this.scene.start('WeighInScene')
      } else {
        this.scene.start('CastScene')
      }
    })
  }
}
