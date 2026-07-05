import * as Phaser from 'phaser'
import { SPECIES } from '../data/species'
import { makePlaceholderTextures } from '../ui/placeholders'
import { PALETTE, W, H } from '../ui/theme'

/**
 * Loads the real art we have (fish PNGs) and generates placeholder textures
 * for everything else. Swap placeholders by loading real PNGs here under the
 * same keys — see src/ui/placeholders.ts for the key list.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const bar = this.add.graphics()
    const box = this.add.graphics()
    box.fillStyle(PALETTE.panel, 0.8)
    box.fillRect(W / 4, H / 2 - 12, W / 2, 24)

    this.load.on('progress', (value: number) => {
      bar.clear()
      bar.fillStyle(PALETTE.panelBorder, 1)
      bar.fillRect(W / 4 + 3, H / 2 - 9, (W / 2 - 6) * value, 18)
    })
    this.load.on('complete', () => {
      bar.destroy()
      box.destroy()
    })

    for (const s of SPECIES) {
      this.load.image(s.textureKey, `assets/fish/${s.textureKey}.png`)
    }
    this.load.spritesheet('bobbers', 'assets/ui/fishing_bobbers.png', {
      frameWidth: 16,
      frameHeight: 16,
    })
  }

  create() {
    makePlaceholderTextures(this)
    this.scene.start('TitleScene')
  }
}
