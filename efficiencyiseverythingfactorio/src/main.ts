import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { FactoryScene } from './scenes/FactoryScene'
import { UIScene } from './scenes/UIScene'
import { ReportScene } from './scenes/ReportScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1d22',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, MenuScene, FactoryScene, UIScene, ReportScene],
  pixelArt: false,
  antialias: true,
  render: { powerPreference: 'high-performance' },
}

const game = new Phaser.Game(config)

window.addEventListener('load', () => {
  const el = document.getElementById('loading')
  if (el) el.remove()
})

// Expose for debug tools / future tweakpane integration.
;(window as unknown as { game: Phaser.Game }).game = game
