import * as Phaser from 'phaser'

/** Internal render resolution — 2x SNES (256x224) for that 16-bit feel. */
export const W = 512
export const H = 448

export const PALETTE = {
  bgDark: 0x10142a,
  panel: 0x1c2447,
  panelDark: 0x131a38,
  panelBorder: 0x4a6cd4,
  good: 0x3fae5a,
  warn: 0xe8a33d,
  bad: 0xd8433b,
  waterShallow: 0x4585c9,
  waterMedium: 0x2d61a8,
  waterDeep: 0x1c4283,
  land: 0x4a7a3a,
  landDark: 0x3a6030,
  wood: 0x8a6035,
  woodDark: 0x6a4825,
  rock: 0x8a8a96,
  weed: 0x2f8a4a,
}

export const TEXT = {
  main: '#e8e8f0',
  accent: '#ffd24a',
  dim: '#8a92b8',
  good: '#5fd07a',
  bad: '#ff6a5f',
  water: '#9ac4ee',
}

const FONT = '"Courier New", Courier, monospace'

export function textStyle(
  size: number,
  color: string = TEXT.main,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {}
): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT, fontSize: `${size}px`, color, ...extra }
}

/** Bordered rectangle panel, the standard UI chrome. */
export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 0.95
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics()
  g.fillStyle(PALETTE.panel, alpha)
  g.fillRect(x, y, w, h)
  g.lineStyle(2, PALETTE.panelBorder, 1)
  g.strokeRect(x, y, w, h)
  return g
}

/** Format minutes-since-midnight as a 12h clock string, e.g. 390 -> "6:30 AM". */
export function clockString(timeMin: number): string {
  const h24 = Math.floor(timeMin / 60) % 24
  const m = Math.floor(timeMin % 60)
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
