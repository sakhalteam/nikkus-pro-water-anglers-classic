import Phaser from 'phaser'

/** Direction keys matching the sprite sheet file naming convention */
const DIRECTIONS = [
  'Down',        // S
  'Left_Down',   // SW
  '',             // W (the default/unnamed sheet = left/right facing)
  'Left_Up',     // NW
  'Up',           // N
  'Right_Up',    // NE
  '',             // E (mirror of W — we'll flip)
  'Right_Down',  // SE
] as const

/** The 8 direction names we use in-game */
export const DIR_NAMES = [
  'south', 'southwest', 'west', 'northwest',
  'north', 'northeast', 'east', 'southeast',
] as const

export type Direction = typeof DIR_NAMES[number]

const FISH_LIST = [
  'large_mouth_bass', 'black_bass', 'rock_bass', 'spotted_bass',
  'black_crappie', 'bluegill_panfish', 'redbreast_sunfish_panfish',
  'muskie', 'channel_catfish', 'flathead_catfish',
  'yellow_perch', 'walleye',
]

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Loading bar
    const w = this.cameras.main.width
    const h = this.cameras.main.height
    const bar = this.add.graphics()
    const box = this.add.graphics()
    box.fillStyle(0x222244, 0.8)
    box.fillRect(w / 4, h / 2 - 15, w / 2, 30)

    this.load.on('progress', (value: number) => {
      bar.clear()
      bar.fillStyle(0x44aaff, 1)
      bar.fillRect(w / 4 + 4, h / 2 - 11, (w / 2 - 8) * value, 22)
    })

    this.load.on('complete', () => {
      bar.destroy()
      box.destroy()
    })

    // Load character sprites — each direction is its own sheet, 8 frames, 48x64
    const idleDirs = ['Down', 'Left_Down', 'Left_Up', 'Right_Down', 'Right_Up', 'Up']
    const walkDirs = ['Down', 'Left_Down', 'Left_Up', 'Right_Down', 'Right_Up', 'Up']

    // The unnamed sheets (Idle.png, walk.png) are the multi-row master sheets.
    // We'll use the individual direction sheets for cleanliness.
    for (const dir of idleDirs) {
      this.load.spritesheet(`idle_${dir}`, `assets/character/idle/Idle_${dir}.png`, {
        frameWidth: 48, frameHeight: 64,
      })
    }
    // The main Idle.png has all directions — row 0 is the "right" facing
    // We'll load it for east/west
    this.load.spritesheet('idle_Right', 'assets/character/idle/Idle.png', {
      frameWidth: 48, frameHeight: 64,
    })

    for (const dir of walkDirs) {
      this.load.spritesheet(`walk_${dir}`, `assets/character/walk/walk_${dir}.png`, {
        frameWidth: 48, frameHeight: 64,
      })
    }
    this.load.spritesheet('walk_Right', 'assets/character/walk/walk.png', {
      frameWidth: 48, frameHeight: 64,
    })

    // Load terrain tiles — we'll build a spritesheet from the export
    for (let i = 0; i <= 114; i++) {
      const key = `tile_${String(i).padStart(3, '0')}`
      this.load.image(key, `assets/tiles/${key}.png`)
    }

    // Fish
    for (const fish of FISH_LIST) {
      this.load.image(fish, `assets/fish/${fish}.png`)
    }

    // UI
    this.load.spritesheet('bobbers', 'assets/ui/fishing_bobbers.png', {
      frameWidth: 16, frameHeight: 16,
    })
    this.load.spritesheet('rod_cast1', 'assets/ui/rod_cast1.png', {
      frameWidth: 100, frameHeight: 100,
    })
  }

  create() {
    // Create animations for each direction
    // Idle animations
    const idleDirMap: Record<string, string> = {
      south: 'Down',
      southwest: 'Left_Down',
      west: 'Right',       // row 0 of master sheet, we'll flipX
      northwest: 'Left_Up',
      north: 'Up',
      northeast: 'Right_Up',
      east: 'Right',       // row 0 of master sheet
      southeast: 'Right_Down',
    }

    for (const [dir, sheetDir] of Object.entries(idleDirMap)) {
      const key = `idle_${sheetDir}`
      // For the master sheet (Right), use only row 0 (frames 0-7)
      const startFrame = 0
      const endFrame = 7

      this.anims.create({
        key: `idle_${dir}`,
        frames: this.anims.generateFrameNumbers(key, { start: startFrame, end: endFrame }),
        frameRate: 8,
        repeat: -1,
      })
    }

    // Walk animations
    const walkDirMap: Record<string, string> = {
      south: 'Down',
      southwest: 'Left_Down',
      west: 'Right',
      northwest: 'Left_Up',
      north: 'Up',
      northeast: 'Right_Up',
      east: 'Right',
      southeast: 'Right_Down',
    }

    for (const [dir, sheetDir] of Object.entries(walkDirMap)) {
      const key = `walk_${sheetDir}`
      this.anims.create({
        key: `walk_${dir}`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      })
    }

    this.scene.start('GameScene')
  }
}
