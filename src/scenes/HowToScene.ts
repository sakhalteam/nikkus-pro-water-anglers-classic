import * as Phaser from 'phaser'
import { drawPanel, textStyle, TEXT, W, H } from '../ui/theme'

const PAGES = [
  `TOURNAMENT BASICS

Fish a circuit of 4 tournaments. Each
day runs 6:00 AM to 2:00 PM.

Only BASS count at the weigh-in:
largemouth, smallmouth, and spotted.
Your livewell holds 5 fish - catch a
bigger one and cull the smallest.

Heaviest total weight wins the day.
Place high to earn circuit points.`,

  `ON THE LAKE

ARROWS ........ drive the boat
SPACE ......... fish this spot
T ............. open tackle box
L ............. view livewell
ENTER ......... end day / weigh in

Watch the depth finder: it shows
depth, bottom cover, and fish marks.
Weeds, timber, rock and docks hold
more fish than open water.`,

  `CASTING & RETRIEVE

LEFT/RIGHT .... aim
SPACE ......... start cast, then set power
HOLD SPACE .... reel / tap to twitch
ESC ........... back to the boat

Match the lure to the cover and depth.
Worms and jigs sink - let them fall,
then hop them. Crankbaits dive while
you reel. When a fish strikes: !!!
press SPACE fast to set the hook.`,

  `THE FIGHT

HOLD SPACE .... reel in
RELEASE ....... let the fish run

Watch the tension bar. Redline and
your line SNAPS. Too slack too long
and the hook falls out. Tire the fish
out, get it to the boat, and it's
yours.

Light line hooks more bites but
breaks sooner. Rig up in the tackle
box (T).`,
]

export class HowToScene extends Phaser.Scene {
  private page = 0
  private body!: Phaser.GameObjects.Text
  private pageLabel!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'HowToScene' })
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x10142a)
    this.add
      .text(W / 2, 46, 'HOW TO PLAY', textStyle(18, TEXT.accent, { fontStyle: 'bold' }))
      .setOrigin(0.5)

    drawPanel(this, 46, 76, W - 92, H - 160)
    this.body = this.add.text(66, 96, '', textStyle(12, TEXT.main, { lineSpacing: 5 }))
    this.pageLabel = this.add.text(W / 2, H - 66, '', textStyle(10, TEXT.dim)).setOrigin(0.5)
    this.add
      .text(W / 2, H - 44, 'LEFT/RIGHT: page   ESC/SPACE: back', textStyle(10, TEXT.dim))
      .setOrigin(0.5)

    this.page = 0
    this.render()

    const kb = this.input.keyboard!
    kb.on('keydown-LEFT', () => {
      this.page = Phaser.Math.Wrap(this.page - 1, 0, PAGES.length)
      this.render()
    })
    kb.on('keydown-RIGHT', () => {
      this.page = Phaser.Math.Wrap(this.page + 1, 0, PAGES.length)
      this.render()
    })
    kb.once('keydown-ESC', () => this.scene.start('MenuScene'))
    kb.once('keydown-SPACE', () => this.scene.start('MenuScene'))
  }

  private render() {
    this.body.setText(PAGES[this.page])
    this.pageLabel.setText(`PAGE ${this.page + 1}/${PAGES.length}`)
  }
}
