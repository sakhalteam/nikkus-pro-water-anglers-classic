import * as Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { TitleScene } from './scenes/TitleScene'
import { MenuScene } from './scenes/MenuScene'
import { HowToScene } from './scenes/HowToScene'
import { LakeSelectScene } from './scenes/LakeSelectScene'
import { TournamentScene } from './scenes/TournamentScene'
import { LakeScene } from './scenes/LakeScene'
import { TackleScene } from './scenes/TackleScene'
import { CastScene } from './scenes/CastScene'
import { FightScene } from './scenes/FightScene'
import { CatchScene } from './scenes/CatchScene'
import { WeighInScene } from './scenes/WeighInScene'
import { CircuitScene } from './scenes/CircuitScene'
import { Game } from './state/GameState'
import { W, H } from './ui/theme'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: document.body,
  backgroundColor: '#10142a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    TitleScene,
    MenuScene,
    HowToScene,
    LakeSelectScene,
    TournamentScene,
    LakeScene,
    TackleScene,
    CastScene,
    FightScene,
    CatchScene,
    WeighInScene,
    CircuitScene,
  ],
}

const game = new Phaser.Game(config)

// Handy for debugging and for automated smoke tests.
;(window as unknown as { __game: Phaser.Game }).__game = game
;(window as unknown as { __state: typeof Game }).__state = Game
