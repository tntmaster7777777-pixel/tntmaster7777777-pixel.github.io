import Phaser from 'phaser'
import { TEX } from '../game/types'

/**
 * Generates all placeholder art procedurally so the game is playable without
 * external assets. To swap in Kenney sprites, drop PNGs into
 * public/assets/sprites/ and replace the makeTex() calls with this.load.image().
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload(): void {
    // Slot for Kenney art:
    // this.load.image(TEX.station, 'assets/sprites/kenney-station.png')
    // this.load.image(TEX.belt,    'assets/sprites/kenney-belt.png')
    // …etc
  }

  create(): void {
    this.makeFloor()
    this.makeBelt()
    this.makeBeltArrow()
    this.makeStation('station', 0x3a5a7a, 0x6aa3d8)
    this.makeStation('stationBusy', 0x2a6a3a, 0x6ae36a)
    this.makeStation('stationStarved', 0x1f4a7a, 0x4db1ff)
    this.makeStation('stationBlocked', 0x7a4a1f, 0xffa04d)
    this.makeSource()
    this.makeSink()
    this.makeItem()
    this.makePixel()
    this.scene.start('Menu')
  }

  private makeFloor(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0x1f2228, 1)
    g.fillRect(0, 0, 32, 32)
    g.lineStyle(1, 0x2a2e36, 1)
    g.strokeRect(0, 0, 32, 32)
    g.generateTexture(TEX.floor, 32, 32)
    g.destroy()
  }

  private makeBelt(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0x3a3f48, 1)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x2a2f36, 1)
    g.fillRect(0, 0, 32, 4)
    g.fillRect(0, 28, 32, 4)
    g.generateTexture(TEX.belt, 32, 32)
    g.destroy()
  }

  private makeBeltArrow(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0x6a7080, 1)
    g.beginPath()
    g.moveTo(8, 10)
    g.lineTo(22, 16)
    g.lineTo(8, 22)
    g.closePath()
    g.fillPath()
    g.generateTexture(TEX.beltArrow, 32, 32)
    g.destroy()
  }

  private makeStation(
    key: 'station' | 'stationBusy' | 'stationStarved' | 'stationBlocked',
    body: number,
    accent: number,
  ): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0x14171c, 1)
    g.fillRect(0, 0, 72, 72)
    g.fillStyle(body, 1)
    g.fillRect(4, 4, 64, 64)
    g.fillStyle(accent, 1)
    g.fillRect(10, 10, 52, 10)
    g.fillStyle(0x14171c, 1)
    g.fillRect(14, 28, 44, 28)
    g.fillStyle(accent, 1)
    g.fillRect(18, 32, 36, 6)
    g.fillRect(18, 44, 36, 6)
    g.generateTexture(TEX[key], 72, 72)
    g.destroy()
  }

  private makeSource(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0x14171c, 1)
    g.fillRect(0, 0, 72, 72)
    g.fillStyle(0x7a6a3a, 1)
    g.fillRect(4, 4, 64, 64)
    g.fillStyle(0xe0c070, 1)
    for (let y = 12; y < 64; y += 12) {
      for (let x = 12; x < 64; x += 12) g.fillRect(x, y, 8, 8)
    }
    g.generateTexture(TEX.source, 72, 72)
    g.destroy()
  }

  private makeSink(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0x14171c, 1)
    g.fillRect(0, 0, 72, 72)
    g.fillStyle(0x3a3f48, 1)
    g.fillRect(4, 4, 64, 64)
    g.fillStyle(0x1a1d22, 1)
    g.fillRect(10, 14, 52, 44)
    g.fillStyle(0x6a7080, 1)
    g.fillRect(32, 8, 8, 56)
    g.generateTexture(TEX.sink, 72, 72)
    g.destroy()
  }

  private makeItem(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0xe0c070, 1)
    g.fillCircle(8, 8, 6)
    g.fillStyle(0x8a6a20, 1)
    g.fillCircle(8, 8, 3)
    g.generateTexture(TEX.item, 16, 16)
    g.destroy()
  }

  private makePixel(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0xffffff, 1)
    g.fillRect(0, 0, 2, 2)
    g.generateTexture(TEX.pixel, 2, 2)
    g.destroy()
  }
}
