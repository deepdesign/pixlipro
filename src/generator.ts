import p5 from 'p5'

import type { PixelIcon } from './data/icons'
import { getRandomIcon, pixelIcons } from './data/icons'
import { pixelArtIconAssets, pixelArtIconIds } from './data/pixelartIconAssets'
import iconFont from 'pixelarticons/fonts/pixelart-icons-font.json'
import { defaultPaletteId, getPalette, getRandomPalette, palettes } from './data/palettes'

const GRID_SIZE = 8
const ICON_BASE_SIZE = 24

const iconGlyphs = iconFont as Record<string, string[]>

const movementModes = ['sway', 'pulse', 'orbit', 'drift'] as const

export type MovementMode = (typeof movementModes)[number]

type PaletteId = (typeof palettes)[number]['id']

type BlendModeKey = 'BLEND' | 'MULTIPLY' | 'SCREEN' | 'HARD_LIGHT' | 'OVERLAY'
export type BlendModeOption = BlendModeKey | 'RANDOM'
export type SpriteMode = 'pixel-glass' | 'circle' | 'square' | 'triangle' | 'hexagon' | 'icon'

interface PixelTile {
  kind: 'pixels'
  colors: string[]
  u: number
  v: number
  scale: number
}

interface IconTile {
  kind: 'icon'
  iconId: string
  tint: string
  u: number
  v: number
  scale: number
}

type PreparedTile = PixelTile | IconTile

interface PreparedLayer {
  tiles: PreparedTile[]
  tileCount: number
  blendMode: BlendModeKey
  opacity: number
}

interface PreparedSprite {
  layers: PreparedLayer[]
  background: string
}

export interface GeneratorState {
  seed: string
  icon: PixelIcon
  paletteId: string
  paletteVariance: number
  scalePercent: number
  scaleSpread: number
  motionIntensity: number
  blendMode: BlendModeKey
  blendModeAuto: boolean
  layerOpacity: number
  spriteMode: SpriteMode
  iconAssetId: string
  movementMode: MovementMode
}

export interface SpriteControllerOptions {
  onStateChange?: (state: GeneratorState) => void
  onFrameRate?: (fps: number) => void
}

const shapeIcons: Record<'circle' | 'square' | 'triangle' | 'hexagon', PixelIcon> = {
  circle: {
    id: 'shape-circle',
    name: 'Circle',
    grid: ['00011000', '00111100', '01111110', '11111111', '11111111', '01111110', '00111100', '00011000'],
  },
  square: {
    id: 'shape-square',
    name: 'Square',
    grid: ['01111110', '11111111', '11111111', '11111111', '11111111', '11111111', '11111111', '01111110'],
  },
  triangle: {
    id: 'shape-triangle',
    name: 'Triangle',
    grid: ['00001000', '00011000', '00111100', '01111110', '11111111', '11111111', '11111111', '11111111'],
  },
  hexagon: {
    id: 'shape-hexagon',
    name: 'Hexagon',
    grid: ['00011000', '00111100', '01111110', '11111111', '11111111', '01111110', '00111100', '00011000'],
  },
}

const shapeModes = ['circle', 'square', 'triangle', 'hexagon'] as const

type ShapeMode = (typeof shapeModes)[number]

export const DEFAULT_STATE: GeneratorState = {
  seed: 'DEADBEEF',
  icon: pixelIcons[0],
  paletteId: defaultPaletteId,
  paletteVariance: 50,
  scalePercent: 80,
  scaleSpread: 140,
  motionIntensity: 48,
  blendMode: 'BLEND',
  blendModeAuto: true,
  layerOpacity: 68,
  spriteMode: 'pixel-glass',
  iconAssetId: pixelArtIconIds[0],
  movementMode: 'sway',
}

const SEED_ALPHABET = '0123456789ABCDEF'

const generateSeedString = () =>
  Array.from({ length: 8 }, () => SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)]).join('')

const createMulberry32 = (seed: number) => {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const hashSeed = (seed: string) => {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  return h ^ (h >>> 16)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const hexToHsl = (hex: string): [number, number, number] => {
  const sanitized = hex.replace('#', '')
  const bigint = parseInt(sanitized, 16)
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

const hueToRgb = (p: number, q: number, t: number) => {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

const hslToHex = (h: number, s: number, l: number) => {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 100)
  l = clamp(l, 0, 100)

  const sat = s / 100
  const light = l / 100

  if (sat === 0) {
    const gray = Math.round(light * 255)
    return `#${gray.toString(16).padStart(2, '0').repeat(3)}`
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
  const p = 2 * light - q
  const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255)
  const g = Math.round(hueToRgb(p, q, h / 360) * 255)
  const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255)

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex)
  const hueShift = (random() - 0.5) * variance * 60
  const satShift = (random() - 0.5) * variance * 50
  const lightShift = (random() - 0.5) * variance * 40
  return hslToHex(h + hueShift, s + satShift, l + lightShift)
}

const blendModePool: BlendModeKey[] = ['BLEND', 'MULTIPLY', 'SCREEN', 'HARD_LIGHT', 'OVERLAY']

const resolveIconAssetId = (id: string | undefined) =>
  id && pixelArtIconIds.includes(id) ? id : pixelArtIconIds[0]

const getRandomAssetId = () => pixelArtIconIds[Math.floor(Math.random() * pixelArtIconIds.length)]

const getPixelIconForMode = (mode: SpriteMode, fallback: PixelIcon): PixelIcon => {
  if ((shapeModes as readonly string[]).includes(mode)) {
    return shapeIcons[mode as ShapeMode]
  }
  return fallback
}

const computeMovementOffsets = (
  mode: MovementMode,
  data: {
    frame: number
    phase: number
    motionScale: number
    layerIndex: number
    baseUnit: number
    layerTileSize: number
  },
): { offsetX: number; offsetY: number; scaleMultiplier: number } => {
  const { frame, phase, motionScale, layerIndex, baseUnit, layerTileSize } = data
  const layerFactor = 1 + layerIndex * 0.12
  const time = frame + phase
  const clampScale = (value: number) => Math.max(0.35, value)

  switch (mode) {
    case 'pulse': {
      const pulse = Math.sin(time * 0.08) * motionScale
      const scaleMultiplier = clampScale(1 + pulse * 0.55)
      const offsetY = Math.sin(time * 0.04) * baseUnit * motionScale * 0.25 * layerFactor
      return { offsetX: 0, offsetY, scaleMultiplier }
    }
    case 'orbit': {
      const radius = layerTileSize * 0.12 * motionScale * layerFactor
      const speed = 0.05 + layerIndex * 0.01
      const offsetX = Math.cos(frame * speed + phase) * radius
      const offsetY = Math.sin(frame * speed + phase) * radius
      return { offsetX, offsetY, scaleMultiplier: 1 }
    }
    case 'drift': {
      const offsetX = Math.cos(frame * 0.02 + phase * 0.45) * layerTileSize * 0.08 * motionScale
      const offsetY = Math.sin(frame * 0.018 + phase * 0.3) * layerTileSize * 0.06 * motionScale
      return { offsetX, offsetY, scaleMultiplier: clampScale(1 + Math.sin(phase) * motionScale * 0.15) }
    }
    case 'sway':
    default: {
      const offsetX = Math.sin(time * 0.13) * baseUnit * motionScale * 0.45
      const offsetY = Math.sin((frame + phase * 0.5) * 0.07 + layerIndex * 0.4) * baseUnit * motionScale * 0.6
      return { offsetX, offsetY, scaleMultiplier: 1 }
    }
  }
}

const computeSprite = (state: GeneratorState): PreparedSprite => {
  const rng = createMulberry32(hashSeed(state.seed))
  const palette = getPalette(state.paletteId)
  const variance = clamp(state.paletteVariance / 100, 0, 1)

  const chosenPalette = palette.colors.map((color) => jitterColor(color, variance, rng))
  const backgroundBase = palette.colors[0]
  const background = jitterColor(backgroundBase, variance * 0.5, rng)

  const densityValue = clamp(state.scalePercent, 20, 400)
  const densityT = (densityValue - 20) / (400 - 20)
  const baseIconId = resolveIconAssetId(state.iconAssetId)
  const isIconMode = state.spriteMode === 'icon'
  const isPixelMode = !isIconMode
  const basePixelIcon = getPixelIconForMode(state.spriteMode, state.icon)
  const isGlassMode = state.spriteMode === 'pixel-glass'

  const layers: PreparedLayer[] = []
  const spreadFactor = clamp(state.scaleSpread / 100, 0.25, 4)
  const opacityBase = clamp(state.layerOpacity / 100, 0.12, 1)
  const layerCount = 3

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const pixelTileMin = 1
    const pixelTileMax = 9
    const iconTileMin = 1
    const iconTileMax = 6

    const baseTileCount = isPixelMode
      ? Math.round(pixelTileMin + densityT * (pixelTileMax - pixelTileMin))
      : Math.round(iconTileMin + densityT * (iconTileMax - iconTileMin))

    const densityBoost = 1 + layerIndex * (isPixelMode ? 0.35 : 0.25)
    const tileCount = Math.max(1, Math.min(Math.round(baseTileCount * densityBoost), isPixelMode ? pixelTileMax : iconTileMax))
    const skipProbability = isPixelMode
      ? 0
      : clamp(0.4 - densityT * 0.3 + layerIndex * 0.12, 0, 0.6)
    const blendMode = state.blendModeAuto
      ? blendModePool[Math.floor(rng() * blendModePool.length)]
      : state.blendMode
    const opacity = clamp(opacityBase + (rng() - 0.5) * 0.35, 0.12, 0.95)
    const tiles: PreparedTile[] = []

    for (let index = 0; index < tileCount * tileCount; index += 1) {
      const col = index % tileCount
      const row = Math.floor(index / tileCount)
      const jitterX = (rng() - 0.5) * 0.65
      const jitterY = (rng() - 0.5) * 0.65
      const u = (col + 0.5 + jitterX) / tileCount
      const v = (row + 0.5 + jitterY) / tileCount

      if (!isPixelMode && layerIndex > 0 && rng() < skipProbability) {
        continue
      }

      if (isPixelMode) {
        const primaryPixelIcon = basePixelIcon ?? state.icon
        const sourceIcon = isGlassMode
          ? layerIndex === 0 && index === 0
            ? primaryPixelIcon
            : getRandomIcon()
          : primaryPixelIcon
        const colors: string[] = []
        sourceIcon.grid.forEach((gridRow) => {
          gridRow.split('').forEach((cell) => {
            if (cell === '1') {
              const color = chosenPalette[Math.floor(rng() * chosenPalette.length)]
              colors.push(color)
            } else {
              colors.push('transparent')
            }
          })
        })
        const minScale = (layerIndex === 0 ? 0.7 : 0.35) * spreadFactor
        const maxScale = (layerIndex === 0 ? 3.6 : 2.3) * spreadFactor * (1 + layerIndex * 0.25)
        const scale = clamp(minScale + rng() * (maxScale - minScale), 0.25, 4.2)
        tiles.push({ kind: 'pixels', colors, u, v, scale })
      } else {
        const iconId = baseIconId
        const tint = chosenPalette[Math.floor(rng() * chosenPalette.length)]
        const minScale = (layerIndex === 0 ? 0.9 : 0.55) * spreadFactor
        const maxScale = (layerIndex === 0 ? 3.8 : 2.8) * spreadFactor * (1 + layerIndex * 0.35)
        const scale = clamp(minScale + rng() * (maxScale - minScale), 0.3, 5.5)
        tiles.push({ kind: 'icon', iconId, tint, u, v, scale })
      }
    }

    layers.push({ tiles, tileCount, blendMode, opacity })
  }

  return { layers, background }
}

export interface SpriteController {
  getState: () => GeneratorState
  randomizeAll: () => void
  randomizeIcon: () => void
  randomizeColors: () => void
  randomizeScale: () => void
  randomizeScaleRange: () => void
  randomizeMotion: () => void
  randomizeBlendMode: () => void
  setScalePercent: (value: number) => void
  setScaleSpread: (value: number) => void
  setPaletteVariance: (value: number) => void
  setMotionIntensity: (value: number) => void
  setBlendMode: (mode: BlendModeOption) => void
  setBlendModeAuto: (value: boolean) => void
  setLayerOpacity: (value: number) => void
  setSpriteMode: (mode: SpriteMode) => void
  setMovementMode: (mode: MovementMode) => void
  setIconAsset: (iconId: string) => void
  usePalette: (paletteId: PaletteId) => void
  reset: () => void
  destroy: () => void
}

export const createSpriteController = (
  container: HTMLElement,
  options: SpriteControllerOptions = {},
): SpriteController => {
  let state: GeneratorState = {
    ...DEFAULT_STATE,
    icon: getRandomIcon(),
    iconAssetId: resolveIconAssetId(DEFAULT_STATE.iconAssetId),
  }
  let prepared = computeSprite(state)
  let p5Instance: p5 | null = null
  const iconGraphics: Record<string, p5.Graphics | null> = Object.fromEntries(
    pixelArtIconAssets.map(({ id }) => [id, null]),
  )

  const notifyState = () => {
    options.onStateChange?.({ ...state })
  }

  const updateSprite = () => {
    prepared = computeSprite(state)
    notifyState()
  }

  const updateSeed = (seed?: string) => {
    state.seed = seed ?? generateSeedString()
  }

  const sketch = (p: p5) => {
    let canvas: p5.Renderer

    p.setup = () => {
      const size = container.clientWidth || 640
      canvas = p.createCanvas(size, size)
      canvas.parent(container)
      p.pixelDensity(1)
      p.noStroke()
      p.noSmooth()
      p.imageMode(p.CENTER)

      if (typeof Path2D !== 'undefined') {
        pixelArtIconAssets.forEach(({ id }) => {
          const paths = iconGlyphs[id]
          if (!paths || iconGraphics[id]) {
            return
          }
          const graphics = p.createGraphics(ICON_BASE_SIZE, ICON_BASE_SIZE)
          graphics.pixelDensity(1)
          const ctx = graphics.drawingContext as CanvasRenderingContext2D
          ctx.clearRect(0, 0, ICON_BASE_SIZE, ICON_BASE_SIZE)
          ctx.imageSmoothingEnabled = false
          ctx.fillStyle = '#ffffff'
          paths.forEach((path) => {
            try {
              const shape = new Path2D(path)
              ctx.fill(shape)
            } catch (error) {
              console.warn(`Failed to render pixel icon path for ${id}`, error)
            }
          })
          iconGraphics[id] = graphics
        })
      }
    }

    p.windowResized = () => {
      const size = container.clientWidth || 640
      p.resizeCanvas(size, size)
    }

    p.draw = () => {
      const gridCount = GRID_SIZE
      const drawSize = Math.min(p.width, p.height) * 0.95
      const offsetX = (p.width - drawSize) / 2
      const offsetY = (p.height - drawSize) / 2
      const motionScale = clamp(state.motionIntensity / 100, 0, 1.5)
      const baseIconId = resolveIconAssetId(state.iconAssetId)

      p.background(prepared.background)
      const ctx = p.drawingContext as CanvasRenderingContext2D
      ctx.imageSmoothingEnabled = false

      const blendMap: Record<BlendModeKey, p5.BLEND_MODE> = {
        BLEND: p.BLEND,
        MULTIPLY: p.MULTIPLY,
        SCREEN: p.SCREEN,
        HARD_LIGHT: p.HARD_LIGHT ?? p.OVERLAY,
        OVERLAY: p.OVERLAY,
      }

      prepared.layers.forEach((layer, layerIndex) => {
        if (layer.tiles.length === 0) {
          return
        }
        const tileDivisor = Math.max(layer.tileCount, 1)
        const layerTileSize = drawSize / tileDivisor
        const pixelSize = layerTileSize / gridCount

        p.push()
        p.blendMode(blendMap[layer.blendMode] ?? p.BLEND)

        layer.tiles.forEach((tile, tileIndex) => {
          const normalizedU = ((tile.u % 1) + 1) % 1
          const normalizedV = ((tile.v % 1) + 1) % 1
          const baseX = offsetX + normalizedU * drawSize
          const baseY = offsetY + normalizedV * drawSize

          if (tile.kind === 'pixels') {
            const tileScale = tile.scale * (1 + layerIndex * 0.1)
            const baseRenderPixel = pixelSize * tileScale
            let colorIndex = 0

            for (let y = 0; y < gridCount; y += 1) {
              for (let x = 0; x < gridCount; x += 1) {
                const color = tile.colors[colorIndex]
                if (color !== 'transparent') {
                  const phase = tileIndex * 13 + colorIndex * 1.4
                  const movement = computeMovementOffsets(state.movementMode, {
                    frame: p.frameCount,
                    phase,
                    motionScale,
                    layerIndex,
                    baseUnit: baseRenderPixel,
                    layerTileSize,
                  })
                  const localJitter = Math.sin((p.frameCount + colorIndex * 1.7 + tileIndex * 5) * 0.11) *
                    baseRenderPixel * motionScale * 0.18
                  const renderPixel = baseRenderPixel * movement.scaleMultiplier
                  const offsetXLocal = movement.offsetX + localJitter - (gridCount * renderPixel) / 2
                  const offsetYLocal = movement.offsetY - (gridCount * renderPixel) / 2
                  const fillColor = p.color(color)
                  fillColor.setAlpha(Math.round(layer.opacity * 255))
                  p.fill(fillColor)
                  p.rect(
                    baseX + x * renderPixel + offsetXLocal,
                    baseY + y * renderPixel + offsetYLocal,
                    renderPixel,
                    renderPixel,
                    renderPixel * 0.22,
                  )
                }
                colorIndex += 1
              }
            }
          } else {
            const iconGraphic = iconGraphics[tile.iconId] ?? iconGraphics[baseIconId]
            if (!iconGraphic) {
              return
            }
            const baseIconSize = layerTileSize * tile.scale * (1 + layerIndex * 0.08)
            const movement = computeMovementOffsets(state.movementMode, {
              frame: p.frameCount,
              phase: tileIndex * 9,
              motionScale,
              layerIndex,
              baseUnit: baseIconSize,
              layerTileSize,
            })
            const iconSize = baseIconSize * movement.scaleMultiplier

            p.push()
            p.tint(tile.tint)
            p.image(iconGraphic, baseX + movement.offsetX, baseY + movement.offsetY, iconSize, iconSize)
            p.pop()
          }
        })

        p.pop()
      })

      if (p.frameCount % 24 === 0) {
        options.onFrameRate?.(Math.round(p.frameRate()))
      }
    }
  }

  p5Instance = new p5(sketch)

  const applyState = (partial: Partial<GeneratorState>) => {
    state = { ...state, ...partial }
    updateSprite()
  }

  const controller: SpriteController = {
    getState: () => ({ ...state }),
    randomizeAll: () => {
      updateSeed()
      state.icon = getRandomIcon()
      state.iconAssetId = getRandomAssetId()
      state.paletteId = getRandomPalette().id
      state.scalePercent = 20 + Math.floor(Math.random() * 380)
      state.scaleSpread = 60 + Math.floor(Math.random() * 220)
      state.paletteVariance = Math.floor(Math.random() * 100)
      state.motionIntensity = Math.floor(Math.random() * 100)
      state.layerOpacity = 35 + Math.floor(Math.random() * 55)
      state.blendMode = blendModePool[Math.floor(Math.random() * blendModePool.length)]
      state.blendModeAuto = true
      state.movementMode = movementModes[Math.floor(Math.random() * movementModes.length)]
      updateSprite()
    },
    randomizeIcon: () => {
      updateSeed()
      if (state.spriteMode === 'pixel-glass') {
        state.icon = getRandomIcon()
      } else if (state.spriteMode === 'icon') {
        state.iconAssetId = getRandomAssetId()
      }
      updateSprite()
    },
    randomizeColors: () => {
      updateSeed()
      state.paletteId = getRandomPalette().id
      state.paletteVariance = Math.floor(Math.random() * 100)
      updateSprite()
    },
    randomizeScale: () => {
      state.scalePercent = 20 + Math.floor(Math.random() * 380)
      updateSprite()
    },
    randomizeScaleRange: () => {
      state.scaleSpread = 50 + Math.floor(Math.random() * 260)
      updateSprite()
    },
    randomizeMotion: () => {
      state.motionIntensity = Math.floor(Math.random() * 100)
      state.movementMode = movementModes[Math.floor(Math.random() * movementModes.length)]
      updateSprite()
    },
    randomizeBlendMode: () => {
      state.blendModeAuto = true
      state.blendMode = blendModePool[Math.floor(Math.random() * blendModePool.length)]
      updateSprite()
    },
    setScalePercent: (value: number) => {
      applyState({ scalePercent: clamp(value, 20, 400) })
    },
    setScaleSpread: (value: number) => {
      applyState({ scaleSpread: clamp(value, 30, 360) })
    },
    setPaletteVariance: (value: number) => {
      applyState({ paletteVariance: clamp(value, 0, 100) })
    },
    setMotionIntensity: (value: number) => {
      applyState({ motionIntensity: clamp(value, 0, 100) })
    },
    setBlendMode: (mode: BlendModeOption) => {
      if (mode === 'RANDOM') {
        controller.setBlendModeAuto(true)
      } else {
        applyState({ blendModeAuto: false, blendMode: mode })
      }
    },
    setBlendModeAuto: (value: boolean) => {
      if (value) {
        applyState({
          blendModeAuto: true,
          blendMode: blendModePool[Math.floor(Math.random() * blendModePool.length)],
        })
      } else {
        applyState({ blendModeAuto: false })
      }
    },
    setLayerOpacity: (value: number) => {
      applyState({ layerOpacity: clamp(value, 15, 100) })
    },
    setSpriteMode: (mode: SpriteMode) => {
      if (mode === 'icon') {
        applyState({ spriteMode: mode })
        return
      }
      if (mode === 'pixel-glass') {
        applyState({ spriteMode: mode, icon: getRandomIcon() })
        return
      }
      if ((shapeModes as readonly string[]).includes(mode)) {
        applyState({ spriteMode: mode, icon: shapeIcons[mode as ShapeMode] })
      }
    },
    setMovementMode: (mode: MovementMode) => {
      if (movementModes.includes(mode)) {
        applyState({ movementMode: mode })
      }
    },
    setIconAsset: (iconId: string) => {
      const resolved = resolveIconAssetId(iconId)
      applyState({ iconAssetId: resolved })
    },
    usePalette: (paletteId: PaletteId) => {
      if (getPalette(paletteId)) {
        applyState({ paletteId })
      }
    },
    reset: () => {
      state = {
        ...DEFAULT_STATE,
        seed: generateSeedString(),
        icon: getRandomIcon(),
        iconAssetId: pixelArtIconIds[0],
      }
      updateSprite()
    },
    destroy: () => {
      p5Instance?.remove()
      p5Instance = null
    },
  }

  notifyState()

  return controller
}

