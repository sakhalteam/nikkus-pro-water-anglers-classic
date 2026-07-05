import * as Phaser from 'phaser'
import { PALETTE } from './theme'

/**
 * Runtime-generated placeholder textures.
 *
 * Every texture created here is a stand-in for real pixel art. To swap in a
 * real asset later: load a PNG under the same key in BootScene.preload() and
 * delete (or skip) the matching block below — nothing else needs to change.
 *
 * Keys created:
 *   tile_land, tile_shallow, tile_medium, tile_deep, tile_weeds,
 *   tile_timber, tile_rock, tile_dock, tile_launch          (16x16 map tiles)
 *   boat                                                    (top-down boat)
 *   lure_spinnerbait, lure_crankbait, lure_worm,
 *   lure_topwater, lure_jig, lure_minnow                    (lure icons)
 *   angler_back                                             (cast-view angler)
 *   px                                                      (1x1 white pixel)
 */
export function makePlaceholderTextures(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const gen = (key: string, w: number, h: number) => {
    g.generateTexture(key, w, h)
    g.clear()
  }

  // --- 1x1 white pixel, tint-and-stretch utility ---
  g.fillStyle(0xffffff, 1)
  g.fillRect(0, 0, 2, 2)
  gen('px', 2, 2)

  // --- map tiles (16x16) ---
  const tile = (base: number, speckle: number, n = 5) => {
    g.fillStyle(base, 1)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(speckle, 1)
    for (let i = 0; i < n; i++) {
      g.fillRect((i * 7 + 3) % 14, (i * 5 + 2) % 14, 2, 2)
    }
  }

  tile(PALETTE.land, PALETTE.landDark, 6)
  gen('tile_land', 16, 16)

  tile(PALETTE.waterShallow, 0x5a95d4, 3)
  gen('tile_shallow', 16, 16)

  tile(PALETTE.waterMedium, 0x3a70b5, 3)
  gen('tile_medium', 16, 16)

  tile(PALETTE.waterDeep, 0x255090, 3)
  gen('tile_deep', 16, 16)

  // weeds: shallow water + green tufts
  tile(PALETTE.waterShallow, 0x5a95d4, 2)
  g.fillStyle(PALETTE.weed, 1)
  g.fillRect(3, 8, 2, 6)
  g.fillRect(7, 5, 2, 9)
  g.fillRect(11, 9, 2, 5)
  gen('tile_weeds', 16, 16)

  // timber: medium water + brown trunks
  tile(PALETTE.waterMedium, 0x3a70b5, 2)
  g.fillStyle(PALETTE.wood, 1)
  g.fillRect(4, 2, 2, 12)
  g.fillRect(10, 4, 2, 10)
  g.fillStyle(PALETTE.woodDark, 1)
  g.fillRect(7, 7, 6, 2)
  gen('tile_timber', 16, 16)

  // rock: deeper water + gray boulders
  tile(0x27548f, 0x2f60a0, 2)
  g.fillStyle(PALETTE.rock, 1)
  g.fillRect(3, 9, 5, 4)
  g.fillRect(9, 6, 4, 4)
  g.fillStyle(0x6a6a76, 1)
  g.fillRect(4, 11, 3, 2)
  gen('tile_rock', 16, 16)

  // dock: shallow water + plank walkway
  tile(PALETTE.waterShallow, 0x5a95d4, 2)
  g.fillStyle(PALETTE.wood, 1)
  g.fillRect(0, 5, 16, 6)
  g.fillStyle(PALETTE.woodDark, 1)
  for (let x = 2; x < 16; x += 4) g.fillRect(x, 5, 1, 6)
  gen('tile_dock', 16, 16)

  // launch ramp: shallow water + concrete strip and flag
  tile(PALETTE.waterShallow, 0x5a95d4, 2)
  g.fillStyle(0xb8b8c0, 1)
  g.fillRect(5, 6, 6, 10)
  g.fillStyle(0xd8433b, 1)
  g.fillRect(7, 1, 5, 3)
  g.fillStyle(0xffffff, 1)
  g.fillRect(7, 1, 1, 6)
  gen('tile_launch', 16, 16)

  // --- top-down bass boat (pointing right, 22x10) ---
  g.fillStyle(0xd8dce8, 1)
  g.fillTriangle(14, 0, 22, 5, 14, 10)
  g.fillRect(2, 0, 12, 10)
  g.fillStyle(0x8a92b8, 1)
  g.fillRect(0, 2, 2, 6) // outboard motor
  g.fillStyle(0x4a6cd4, 1)
  g.fillRect(4, 2, 8, 6) // deck stripe
  g.fillStyle(0x33333d, 1)
  g.fillRect(9, 3, 3, 4) // console
  gen('boat', 22, 10)

  // --- lure category icons (14x14) ---
  g.fillStyle(0xffffff, 1) // drawn white, tinted per color at runtime
  g.fillTriangle(2, 2, 8, 6, 2, 8) // blade
  g.fillRect(7, 6, 5, 4) // skirt body
  g.fillRect(9, 10, 1, 3)
  g.fillRect(11, 10, 1, 3)
  gen('lure_spinnerbait', 14, 14)

  g.fillStyle(0xffffff, 1)
  g.fillEllipse(7, 6, 10, 6) // plug body
  g.fillTriangle(1, 6, 4, 10, 5, 6) // diving lip
  gen('lure_crankbait', 14, 14)

  g.fillStyle(0xffffff, 1)
  g.fillRect(2, 3, 2, 2)
  g.fillRect(3, 5, 2, 2)
  g.fillRect(5, 7, 2, 2)
  g.fillRect(7, 8, 3, 2)
  g.fillRect(10, 9, 3, 2) // wiggly worm
  gen('lure_worm', 14, 14)

  g.fillStyle(0xffffff, 1)
  g.fillEllipse(8, 7, 9, 6)
  g.fillRect(2, 5, 3, 5) // cupped popper face
  gen('lure_topwater', 14, 14)

  g.fillStyle(0xffffff, 1)
  g.fillEllipse(5, 5, 6, 6) // jig head
  g.fillRect(6, 7, 6, 2)
  g.fillRect(8, 9, 5, 2) // trailer
  gen('lure_jig', 14, 14)

  g.fillStyle(0xffffff, 1)
  g.fillEllipse(7, 7, 11, 4) // slender minnow
  g.fillTriangle(12, 7, 14, 4, 14, 10)
  gen('lure_minnow', 14, 14)

  // --- cast-view angler seen from behind (32x48) ---
  g.fillStyle(0x2a3050, 1)
  g.fillRect(10, 14, 12, 20) // torso
  g.fillStyle(0xc89a72, 1)
  g.fillRect(12, 6, 8, 8) // head
  g.fillStyle(0xd8433b, 1)
  g.fillRect(11, 4, 10, 4) // cap
  g.fillStyle(0x2a3050, 1)
  g.fillRect(10, 34, 5, 12) // legs
  g.fillRect(17, 34, 5, 12)
  g.fillStyle(0x8a6035, 1)
  g.fillRect(21, 8, 2, 20) // rod arm up
  gen('angler_back', 32, 48)

  g.destroy()
}

/** Icon texture key for a lure category. */
export function lureIconKey(category: string): string {
  return `lure_${category}`
}
