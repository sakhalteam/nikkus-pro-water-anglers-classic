import * as Phaser from 'phaser'
import { textStyle, TEXT, PALETTE, W, H } from '../ui/theme'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    // Sunset-over-water backdrop, all placeholder rectangles
    const g = this.add.graphics()
    g.fillGradientStyle(0x2a2a5c, 0x2a2a5c, 0xd86a3d, 0xd86a3d, 1)
    g.fillRect(0, 0, W, H * 0.55)
    g.fillStyle(PALETTE.waterMedium, 1)
    g.fillRect(0, H * 0.55, W, H * 0.45)
    // sun
    g.fillStyle(0xffd24a, 1)
    g.fillCircle(W / 2, H * 0.53, 36)
    g.fillStyle(0xffd24a, 0.35)
    g.fillRect(W / 2 - 40, H * 0.57, 80, 6)
    g.fillRect(W / 2 - 30, H * 0.62, 60, 4)
    g.fillRect(W / 2 - 20, H * 0.67, 40, 3)

    // animated wave strips
    for (let i = 0; i < 5; i++) {
      const wave = this.add.image(
        Phaser.Math.Between(40, W - 40),
        H * 0.6 + i * 30,
        'px'
      )
      wave.setTint(0x9ac4ee).setAlpha(0.5)
      wave.setDisplaySize(Phaser.Math.Between(30, 70), 2)
      this.tweens.add({
        targets: wave,
        x: wave.x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(1500, 2600),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    this.add
      .text(W / 2, 84, "NIKKU'S", textStyle(30, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setShadow(3, 3, '#000000', 0)
    this.add
      .text(W / 2, 124, 'PRO WATER ANGLERS', textStyle(34, TEXT.main, { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setShadow(3, 3, '#000000', 0)
    this.add
      .text(W / 2, 162, 'CLASSIC', textStyle(26, TEXT.water, { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setShadow(3, 3, '#000000', 0)

    const press = this.add
      .text(W / 2, H - 90, 'PRESS SPACE', textStyle(14, TEXT.main, { fontStyle: 'bold' }))
      .setOrigin(0.5)
    this.tweens.add({ targets: press, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 })

    this.add
      .text(W / 2, H - 30, '(c) 2026 SAKHAL TEAM  -  PLACEHOLDER BUILD', textStyle(9, TEXT.dim))
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('MenuScene'))
    this.input.keyboard!.once('keydown-ENTER', () => this.scene.start('MenuScene'))
  }
}
