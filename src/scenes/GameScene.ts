import Phaser from 'phaser'
import type { Direction } from './BootScene'

/**
 * Isometric tile map layout.
 * Each number maps to a tile_XXX image key.
 * The map is arranged as a grid that we render in isometric projection.
 *
 * Tile legend (from visual inspection):
 *  90 = deep water     100 = shallow water edge
 *  40 = grass          30 = bush/shrub
 *  0  = dark dirt      1  = light dirt
 *  10 = dirt path      20 = flowers on dirt
 *  70 = rocks/stones   80 = ice/mountain
 */

// W = deep water, S = shallow/shore, G = grass, D = dirt, B = bush, R = rock
const TILE_DEEP_WATER = 90
const TILE_WATER_EDGE_N = 95
const TILE_WATER_EDGE_S = 91
const TILE_WATER_EDGE_W = 94
const TILE_WATER_EDGE_E = 92
const TILE_WATER_NW = 98
const TILE_WATER_NE = 96
const TILE_WATER_SW = 99
const TILE_WATER_SE = 93
const TILE_WATER_LIGHT = 114  // the animated-looking water tile
const TILE_GRASS = 40
const TILE_GRASS_DARK = 41
const TILE_DIRT = 0
const TILE_DIRT_LIGHT = 1
const TILE_BUSH = 30
const TILE_FLOWERS = 20
const TILE_ROCK_SM = 70
const TILE_ROCK_LG = 60
const TILE_PATH = 10

// Simple 16x16 map: lakeside scene
// g=grass, w=deep water, d=dirt, b=bush, r=rock, p=path
// Numbers are actual tile indices
const MAP_DATA: number[][] = [
  [30, 30, 41, 41, 40, 40, 40, 40, 40, 40, 98, 90, 90, 90, 90, 90],
  [30, 41, 41, 40, 40, 40, 40, 40, 40, 98, 90, 90, 90, 90, 90, 90],
  [41, 41, 40, 40, 40, 30, 40, 40, 98, 90, 90,114, 90, 90,114, 90],
  [41, 40, 40, 30, 40, 40, 40, 94, 90, 90,114, 90, 90, 90, 90, 90],
  [40, 40, 40, 40, 40, 40, 94, 90, 90, 90, 90, 90,114, 90, 90, 90],
  [40, 40, 20, 40, 40, 40, 94, 90, 90,114, 90, 90, 90, 90,114, 90],
  [40, 40, 40, 40, 10, 10, 99, 91, 90, 90, 90,114, 90, 90, 90, 90],
  [40, 30, 40, 10, 10,  1,  1, 99, 91, 91, 90, 90, 90, 90, 90, 90],
  [40, 40, 40, 10,  1,  1,  0,  0, 99, 91, 91, 91, 93, 90, 90, 90],
  [40, 40, 10, 10,  1,  0,  0,  0,  0, 99, 91, 93, 90, 90, 90, 90],
  [40, 40, 40, 10,  1,  1,  0, 70,  0,  0, 93, 90, 90, 90,114, 90],
  [40, 30, 40, 40, 10, 10,  1,  0,  0, 99, 91, 91, 93, 90, 90, 90],
  [40, 40, 40, 40, 40, 40, 10, 10, 94, 90, 90, 90, 90, 90, 90, 90],
  [30, 40, 40, 60, 40, 40, 40, 94, 90, 90,114, 90, 90, 90, 90, 90],
  [30, 40, 40, 40, 40, 30, 98, 90, 90, 90, 90, 90, 90,114, 90, 90],
  [30, 30, 40, 40, 40, 98, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90],
]

const MAP_ROWS = MAP_DATA.length
const MAP_COLS = MAP_DATA[0].length
const TILE_W = 32
const TILE_H = 32
// Isometric half-dims
const ISO_TILE_W = TILE_W  // 32
const ISO_TILE_H = TILE_H / 2  // 16 — isometric tiles are typically half height

// Water tiles that block player movement
const WATER_TILES = new Set([
  90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 114,
])

// Fish species data
const FISH_SPECIES = [
  { key: 'large_mouth_bass', name: 'Largemouth Bass', weight: [1, 8], rarity: 0.15 },
  { key: 'black_bass', name: 'Black Bass', weight: [0.5, 5], rarity: 0.2 },
  { key: 'rock_bass', name: 'Rock Bass', weight: [0.3, 2], rarity: 0.2 },
  { key: 'spotted_bass', name: 'Spotted Bass', weight: [0.5, 4], rarity: 0.15 },
  { key: 'black_crappie', name: 'Black Crappie', weight: [0.2, 2], rarity: 0.15 },
  { key: 'bluegill_panfish', name: 'Bluegill', weight: [0.1, 1], rarity: 0.25 },
  { key: 'redbreast_sunfish_panfish', name: 'Redbreast Sunfish', weight: [0.1, 0.8], rarity: 0.2 },
  { key: 'muskie', name: 'Muskie', weight: [5, 30], rarity: 0.03 },
  { key: 'channel_catfish', name: 'Channel Catfish', weight: [1, 15], rarity: 0.08 },
  { key: 'flathead_catfish', name: 'Flathead Catfish', weight: [2, 20], rarity: 0.05 },
  { key: 'yellow_perch', name: 'Yellow Perch', weight: [0.2, 2], rarity: 0.2 },
  { key: 'walleye', name: 'Walleye', weight: [1, 10], rarity: 0.1 },
]

type GameState = 'exploring' | 'casting' | 'waiting' | 'reeling' | 'caught'

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>
  private facing: Direction = 'south'
  private state: GameState = 'exploring'
  private speed = 120

  // Casting
  private castPower = 0
  private castDir = 0
  private castBar!: Phaser.GameObjects.Graphics
  private castPowerText!: Phaser.GameObjects.Text
  private spaceKey!: Phaser.Input.Keyboard.Key

  // Fishing
  private bobber?: Phaser.GameObjects.Sprite
  private fishLine?: Phaser.GameObjects.Graphics
  private waitTimer = 0
  private biteTime = 0
  private biteIndicator?: Phaser.GameObjects.Text

  // Reeling
  private tensionBar!: Phaser.GameObjects.Graphics
  private tension = 50
  private reelProgress = 0
  private currentFish?: typeof FISH_SPECIES[number]
  private tensionText!: Phaser.GameObjects.Text

  // UI
  private stateText!: Phaser.GameObjects.Text
  private instructionText!: Phaser.GameObjects.Text
  private tileGroup!: Phaser.GameObjects.Group

  // Map offset to center the isometric map
  private mapOffsetX = 0
  private mapOffsetY = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // Calculate map offset to center it
    this.mapOffsetX = 400 // center of 800 wide
    this.mapOffsetY = 80

    this.tileGroup = this.add.group()

    // Render isometric tile map
    this.renderMap()

    // Create player at a walkable spot (row 7, col 4 — on the dirt near shore)
    const startPos = this.tileToScreen(7, 4)
    this.player = this.add.sprite(startPos.x, startPos.y - 16, 'idle_Down')
    this.player.setScale(1)
    this.player.setDepth(100)
    this.player.play('idle_south')
    this.facing = 'south'

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setZoom(2)

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
    }
    this.spaceKey = this.input.keyboard!.addKey('SPACE')

    // UI — fixed to camera
    this.stateText = this.add.text(10, 10, '', {
      fontSize: '8px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(1000)

    this.instructionText = this.add.text(400, 290, '', {
      fontSize: '7px',
      color: '#ffdd44',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(1000).setOrigin(0.5, 1)

    // Cast power bar (hidden initially)
    this.castBar = this.add.graphics().setScrollFactor(0).setDepth(1000)
    this.castPowerText = this.add.text(400, 260, '', {
      fontSize: '8px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(1000).setOrigin(0.5)

    // Tension bar (hidden initially)
    this.tensionBar = this.add.graphics().setScrollFactor(0).setDepth(1000)
    this.tensionText = this.add.text(400, 240, '', {
      fontSize: '7px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(1000).setOrigin(0.5)

    // Fish line graphic
    this.fishLine = this.add.graphics().setDepth(99)

    this.updateUI()
  }

  private renderMap() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileIndex = MAP_DATA[row][col]
        const key = `tile_${String(tileIndex).padStart(3, '0')}`
        const pos = this.tileToScreen(row, col)

        const tile = this.add.image(pos.x, pos.y, key)
        tile.setDepth(row + col) // simple depth sort
        this.tileGroup.add(tile)
      }
    }
  }

  /** Convert tile grid coords to isometric screen position */
  private tileToScreen(row: number, col: number): { x: number; y: number } {
    const x = (col - row) * (ISO_TILE_W / 2) + this.mapOffsetX
    const y = (col + row) * (ISO_TILE_H / 2) + this.mapOffsetY
    return { x, y }
  }

  /** Convert screen position to approximate tile grid coords */
  private screenToTile(sx: number, sy: number): { row: number; col: number } {
    const rx = sx - this.mapOffsetX
    const ry = sy - this.mapOffsetY
    const col = Math.round((rx / (ISO_TILE_W / 2) + ry / (ISO_TILE_H / 2)) / 2)
    const row = Math.round((ry / (ISO_TILE_H / 2) - rx / (ISO_TILE_W / 2)) / 2)
    return { row, col }
  }

  private isWalkable(row: number, col: number): boolean {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false
    return !WATER_TILES.has(MAP_DATA[row][col])
  }

  update(_time: number, delta: number) {
    switch (this.state) {
      case 'exploring':
        this.updateExploring(delta)
        break
      case 'casting':
        this.updateCasting(delta)
        break
      case 'waiting':
        this.updateWaiting(delta)
        break
      case 'reeling':
        this.updateReeling(delta)
        break
    }

    this.updateUI()
  }

  private updateExploring(delta: number) {
    const up = this.cursors.up.isDown || this.wasd.W.isDown
    const down = this.cursors.down.isDown || this.wasd.S.isDown
    const left = this.cursors.left.isDown || this.wasd.A.isDown
    const right = this.cursors.right.isDown || this.wasd.D.isDown

    let dx = 0
    let dy = 0

    // Isometric movement: up = NW, down = SE, left = SW, right = NE
    if (up && left) { dx = -1; dy = 0; this.facing = 'west' }
    else if (up && right) { dx = 0; dy = -1; this.facing = 'north' }
    else if (down && left) { dx = 0; dy = 1; this.facing = 'south' }
    else if (down && right) { dx = 1; dy = 0; this.facing = 'east' }
    else if (up) { dx = -0.5; dy = -0.5; this.facing = 'northwest' }
    else if (down) { dx = 0.5; dy = 0.5; this.facing = 'southeast' }
    else if (left) { dx = -0.5; dy = 0.5; this.facing = 'southwest' }
    else if (right) { dx = 0.5; dy = -0.5; this.facing = 'northeast' }

    const moving = dx !== 0 || dy !== 0

    if (moving) {
      // Convert isometric direction to screen movement
      const screenDx = (dx - dy) * (ISO_TILE_W / 2)
      const screenDy = (dx + dy) * (ISO_TILE_H / 2)
      const len = Math.sqrt(screenDx * screenDx + screenDy * screenDy)
      const speed = this.speed * (delta / 1000)

      const newX = this.player.x + (screenDx / len) * speed
      const newY = this.player.y + 16 + (screenDy / len) * speed // +16 for feet offset

      // Check if destination tile is walkable
      const destTile = this.screenToTile(newX, newY)
      if (this.isWalkable(destTile.row, destTile.col)) {
        this.player.x = newX
        this.player.y = newY - 16
        // Update depth based on tile position
        this.player.setDepth(destTile.row + destTile.col + 50)
      }

      // Play walk anim
      const animKey = `walk_${this.facing}`
      if (this.player.anims.currentAnim?.key !== animKey) {
        this.player.play(animKey)
      }

      // Flip for west-facing directions
      this.player.flipX = this.facing === 'west' || this.facing === 'southwest' || this.facing === 'northwest'
    } else {
      // Idle
      const animKey = `idle_${this.facing}`
      if (this.player.anims.currentAnim?.key !== animKey) {
        this.player.play(animKey)
      }
      this.player.flipX = this.facing === 'west' || this.facing === 'southwest' || this.facing === 'northwest'
    }

    // Space to start casting — check if near water
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.isNearWater()) {
        this.startCasting()
      }
    }
  }

  private isNearWater(): boolean {
    const playerTile = this.screenToTile(this.player.x, this.player.y + 16)
    // Check adjacent tiles for water
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = playerTile.row + dr
        const c = playerTile.col + dc
        if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
          if (WATER_TILES.has(MAP_DATA[r][c])) return true
        }
      }
    }
    return false
  }

  private startCasting() {
    this.state = 'casting'
    this.castPower = 0
    this.castDir = 1
  }

  private updateCasting(delta: number) {
    // Power bar oscillates
    this.castPower += this.castDir * (delta / 1000) * 80
    if (this.castPower >= 100) { this.castPower = 100; this.castDir = -1 }
    if (this.castPower <= 0) { this.castPower = 0; this.castDir = 1 }

    // Draw cast bar
    this.castBar.clear()
    this.castBar.fillStyle(0x333333, 0.8)
    this.castBar.fillRect(325, 270, 150, 12)
    // Power fill — green to red
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(0, 200, 0),
      new Phaser.Display.Color(255, 50, 0),
      100,
      this.castPower
    )
    const fillColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b)
    this.castBar.fillStyle(fillColor, 1)
    this.castBar.fillRect(327, 272, (this.castPower / 100) * 146, 8)

    this.castPowerText.setText(`Power: ${Math.round(this.castPower)}%`)

    // Space to confirm cast
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.confirmCast()
    }

    // ESC to cancel
    if (this.input.keyboard!.addKey('ESC').isDown) {
      this.state = 'exploring'
      this.castBar.clear()
      this.castPowerText.setText('')
    }
  }

  private confirmCast() {
    this.castBar.clear()
    this.castPowerText.setText('')

    // Calculate bobber landing position based on facing direction and power
    const power = this.castPower
    const dist = (power / 100) * 120 + 30

    // Direction vectors for isometric cast
    const dirVectors: Record<string, { x: number; y: number }> = {
      north: { x: 0, y: -1 },
      northeast: { x: 0.7, y: -0.7 },
      east: { x: 1, y: 0 },
      southeast: { x: 0.7, y: 0.7 },
      south: { x: 0, y: 1 },
      southwest: { x: -0.7, y: 0.7 },
      west: { x: -1, y: 0 },
      northwest: { x: -0.7, y: -0.7 },
    }

    const dir = dirVectors[this.facing]
    const targetX = this.player.x + dir.x * dist
    const targetY = this.player.y + dir.y * dist

    // Check if target is on water
    const targetTile = this.screenToTile(targetX, targetY)
    if (targetTile.row >= 0 && targetTile.row < MAP_ROWS &&
        targetTile.col >= 0 && targetTile.col < MAP_COLS &&
        WATER_TILES.has(MAP_DATA[targetTile.row][targetTile.col])) {

      // Create bobber
      this.bobber = this.add.sprite(targetX, targetY, 'bobbers', 0)
      this.bobber.setDepth(targetTile.row + targetTile.col + 1)
      this.bobber.setScale(1)

      // Transition to waiting
      this.state = 'waiting'
      this.waitTimer = 0
      this.biteTime = Phaser.Math.Between(2000, 6000) // 2-6 seconds
    } else {
      // Missed water — line falls on land
      this.state = 'exploring'
    }
  }

  private updateWaiting(delta: number) {
    this.waitTimer += delta

    // Draw fishing line from player to bobber
    if (this.fishLine && this.bobber) {
      this.fishLine.clear()
      this.fishLine.lineStyle(1, 0xcccccc, 0.8)
      this.fishLine.beginPath()
      this.fishLine.moveTo(this.player.x, this.player.y - 8)
      this.fishLine.lineTo(this.bobber.x, this.bobber.y)
      this.fishLine.strokePath()
    }

    // Bobber gentle bob
    if (this.bobber) {
      this.bobber.y += Math.sin(this.waitTimer / 300) * 0.15
    }

    // Check for bite
    if (this.waitTimer >= this.biteTime) {
      if (!this.biteIndicator) {
        // Fish bite! Show indicator
        this.biteIndicator = this.add.text(
          this.bobber!.x, this.bobber!.y - 20, '!!',
          { fontSize: '10px', color: '#ff4444', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(1000)

        // Bobber dips
        this.bobber!.y += 3

        // Player has 1.5 seconds to press space
        this.time.delayedCall(1500, () => {
          if (this.state === 'waiting') {
            // Missed it!
            this.cleanupFishing()
            this.state = 'exploring'
          }
        })
      }
    }

    // Space to hook the fish
    if (this.biteIndicator && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startReeling()
    }

    // ESC to reel in empty
    if (this.input.keyboard!.addKey('ESC').isDown) {
      this.cleanupFishing()
      this.state = 'exploring'
    }
  }

  private startReeling() {
    this.state = 'reeling'
    this.tension = 50
    this.reelProgress = 0

    // Pick a random fish
    const totalRarity = FISH_SPECIES.reduce((sum, f) => sum + f.rarity, 0)
    let roll = Math.random() * totalRarity
    for (const fish of FISH_SPECIES) {
      roll -= fish.rarity
      if (roll <= 0) {
        this.currentFish = fish
        break
      }
    }
    if (!this.currentFish) this.currentFish = FISH_SPECIES[0]

    // Clean up bite indicator
    this.biteIndicator?.destroy()
    this.biteIndicator = undefined
  }

  private updateReeling(delta: number) {
    const dt = delta / 1000

    // Fish pulls — tension increases over time randomly
    this.tension += (Math.sin(Date.now() / 200) * 25 + 10) * dt

    // Player reels with space — decreases tension and increases progress
    if (this.spaceKey.isDown) {
      this.reelProgress += 30 * dt
      this.tension += 15 * dt // reeling also adds tension
    } else {
      // Not reeling — tension slowly decreases
      this.tension -= 20 * dt
    }

    // Clamp tension
    this.tension = Phaser.Math.Clamp(this.tension, 0, 100)

    // Draw tension bar
    this.tensionBar.clear()
    // Background
    this.tensionBar.fillStyle(0x333333, 0.8)
    this.tensionBar.fillRect(300, 15, 200, 14)
    // Tension fill
    let barColor = 0x44aa44 // green
    if (this.tension > 70) barColor = 0xffaa00 // yellow
    if (this.tension > 85) barColor = 0xff3333 // red
    this.tensionBar.fillStyle(barColor, 1)
    this.tensionBar.fillRect(302, 17, (this.tension / 100) * 196, 10)
    // Sweet spot indicators
    this.tensionBar.fillStyle(0xffffff, 0.3)
    this.tensionBar.fillRect(302 + 196 * 0.3, 15, 2, 14)
    this.tensionBar.fillRect(302 + 196 * 0.7, 15, 2, 14)

    // Progress bar
    this.tensionBar.fillStyle(0x333333, 0.8)
    this.tensionBar.fillRect(300, 32, 200, 8)
    this.tensionBar.fillStyle(0x4488ff, 1)
    this.tensionBar.fillRect(302, 34, (this.reelProgress / 100) * 196, 4)

    this.tensionText.setText(`Tension: ${Math.round(this.tension)}%  |  Reel: ${Math.round(this.reelProgress)}%`)

    // Draw fish line
    if (this.fishLine && this.bobber) {
      this.fishLine.clear()
      this.fishLine.lineStyle(1, 0xcccccc, 0.8)
      this.fishLine.beginPath()
      this.fishLine.moveTo(this.player.x, this.player.y - 8)
      this.fishLine.lineTo(this.bobber.x, this.bobber.y)
      this.fishLine.strokePath()

      // Bobber thrashes
      this.bobber.x += Math.sin(Date.now() / 100) * 0.5
      this.bobber.y += Math.cos(Date.now() / 130) * 0.3
    }

    // Line snapped!
    if (this.tension >= 100) {
      this.cleanupFishing()
      this.tensionBar.clear()
      this.tensionText.setText('')
      this.state = 'exploring'
      // Flash red
      this.cameras.main.flash(300, 255, 50, 50)
    }

    // Fish caught!
    if (this.reelProgress >= 100) {
      const fish = this.currentFish!
      const weight = Phaser.Math.FloatBetween(fish.weight[0], fish.weight[1])

      this.cleanupFishing()
      this.tensionBar.clear()
      this.tensionText.setText('')

      this.scene.launch('CatchScene', { fish, weight })
      this.scene.pause()
      this.state = 'exploring'
    }
  }

  private cleanupFishing() {
    this.bobber?.destroy()
    this.bobber = undefined
    this.fishLine?.clear()
    this.biteIndicator?.destroy()
    this.biteIndicator = undefined
    this.currentFish = undefined
  }

  private updateUI() {
    const tile = this.screenToTile(this.player.x, this.player.y + 16)
    let stateLabel = ''
    switch (this.state) {
      case 'exploring': stateLabel = 'Exploring'; break
      case 'casting': stateLabel = 'Casting...'; break
      case 'waiting': stateLabel = 'Waiting for bite...'; break
      case 'reeling': stateLabel = 'FISH ON!'; break
    }
    this.stateText.setText(stateLabel)

    let hint = ''
    switch (this.state) {
      case 'exploring':
        hint = this.isNearWater()
          ? 'SPACE to cast  |  WASD/Arrows to move'
          : 'Walk to the water\'s edge  |  WASD/Arrows to move'
        break
      case 'casting':
        hint = 'SPACE to cast  |  ESC to cancel'
        break
      case 'waiting':
        hint = this.biteIndicator ? 'SPACE NOW!!' : 'Waiting... ESC to reel in'
        break
      case 'reeling':
        hint = 'Hold SPACE to reel  |  Keep tension in the green!'
        break
    }
    this.instructionText.setText(hint)
  }
}
