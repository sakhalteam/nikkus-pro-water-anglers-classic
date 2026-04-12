import Phaser from 'phaser'

export class CatchScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CatchScene' })
  }

  create(data: { fish: { key: string; name: string }; weight: number }) {
    const { fish, weight } = data

    // Dim overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7)
    overlay.setScrollFactor(0)

    // Banner
    const banner = this.add.rectangle(400, 200, 350, 180, 0x1a3a5c, 0.95)
    banner.setStrokeStyle(2, 0x44aaff)

    // Title
    this.add.text(400, 135, 'YOU CAUGHT A FISH!', {
      fontSize: '14px',
      color: '#ffdd44',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Fish sprite — scale it up since these are tiny pixel art
    const fishSprite = this.add.image(400, 195, fish.key)
    fishSprite.setScale(4)
    // Apply nearest-neighbor filtering for pixel art crispness
    fishSprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)

    // Fish name
    this.add.text(400, 230, fish.name, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Weight
    this.add.text(400, 248, `${weight.toFixed(1)} lbs`, {
      fontSize: '10px',
      color: '#aaddff',
    }).setOrigin(0.5)

    // Continue prompt
    const continueText = this.add.text(400, 275, 'Press SPACE to continue', {
      fontSize: '8px',
      color: '#888888',
    }).setOrigin(0.5)

    // Blink the continue text
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // Wait for space
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.resume('GameScene')
      this.scene.stop()
    })
  }
}
