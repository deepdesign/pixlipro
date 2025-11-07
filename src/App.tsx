import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from 'pixel-retroui'

import {
  createSpriteController,
  type BlendModeOption,
  type GeneratorState,
  type SpriteController,
  type SpriteMode,
  type MovementMode,
} from './generator'
import { getPixelArtIconById, pixelArtIconAssets } from './data/pixelartIconAssets'
import { palettes } from './data/palettes'

const BUTTON_PRIMARY = {
  bg: 'var(--btn-primary-bg)',
  textColor: 'var(--btn-primary-text)',
  shadow: 'var(--btn-primary-shadow)',
  borderColor: 'var(--btn-primary-border)',
}

const BUTTON_SECONDARY = {
  bg: 'var(--btn-secondary-bg)',
  textColor: 'var(--btn-secondary-text)',
  shadow: 'var(--btn-secondary-shadow)',
  borderColor: 'var(--btn-secondary-border)',
}

const BUTTON_MUTED = {
  bg: 'var(--btn-muted-bg)',
  textColor: 'var(--btn-muted-text)',
  shadow: 'var(--btn-muted-shadow)',
  borderColor: 'var(--btn-muted-border)',
}

const BLEND_MODES: BlendModeOption[] = ['RANDOM', 'BLEND', 'MULTIPLY', 'SCREEN', 'HARD_LIGHT', 'OVERLAY']

type ThemeMode = 'system' | 'light' | 'dark'
type ThemeColor = 'amber' | 'mint' | 'violet'
type ThemeShape = 'box' | 'rounded'

const THEME_MODE_STORAGE_KEY = 'retro-theme-mode'
const THEME_COLOR_STORAGE_KEY = 'retro-theme-color'
const THEME_SHAPE_STORAGE_KEY = 'retro-theme-shape'
const GITHUB_REPO_URL = 'https://github.com/deepdesign/artlab'

const THEME_COLOR_OPTIONS: Array<{ value: ThemeColor; label: string }> = [
  { value: 'amber', label: 'Amber' },
  { value: 'mint', label: 'Mint' },
  { value: 'violet', label: 'Violet' },
]

const THEME_SHAPE_OPTIONS: Array<{ value: ThemeShape; label: string }> = [
  { value: 'box', label: 'Box' },
  { value: 'rounded', label: 'Rounded' },
]

const SPRITE_MODES: Array<{ value: SpriteMode; label: string; description: string }> = [
  { value: 'pixel-glass', label: 'Pixel Glass', description: 'Dense pixel mosaics with retro motion' },
  { value: 'circle', label: 'Circle', description: 'Soft orbital clusters with rounded silhouettes' },
  { value: 'square', label: 'Square', description: 'Chunky voxel tiles snapped to a tight grid' },
  { value: 'triangle', label: 'Triangle', description: 'Angular shards with sharp tessellations' },
  { value: 'hexagon', label: 'Hexagon', description: 'Honeycomb lattices with layered depth' },
  { value: 'icon', label: 'Icon', description: 'Single pixelart icon from the library' },
]

const PALETTE_OPTIONS = palettes.map((palette) => ({ value: palette.id, label: palette.name }))

const MOVEMENT_MODES: Array<{ value: MovementMode; label: string }> = [
  { value: 'sway', label: 'Sway' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'drift', label: 'Drift' },
]

const formatBlendMode = (mode: BlendModeOption) =>
  mode === 'RANDOM'
    ? 'Auto Shuffle'
    : mode
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

const formatMovementMode = (mode: MovementMode) =>
  MOVEMENT_MODES.find((entry) => entry.value === mode)?.label ?? 'Sway'

const formatBlendStatus = (mode: BlendModeOption, auto: boolean) =>
  auto ? 'Auto Shuffle' : formatBlendMode(mode)

const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`

const buildGradient = () => {
  const colors = Array.from({ length: 4 }, () => randomColor())
  return `linear-gradient(120deg, ${colors.join(', ')})`
}

const caretMaskSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><path d="M32 16h16v16h16v16h16v16h16v16h-16v16h-16v16h-16v16h-16v16h-16z" fill="currentColor"/></svg>'
const caretMask = `url("data:image/svg+xml,${encodeURIComponent(caretMaskSvg)}")`

const ControlSlider = ({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  displayValue,
  disabled,
}: {
  id: string
  label: string
  min: number
  max: number
  step?: number
  value: number
  displayValue: string
  onChange: (value: number) => void
  disabled?: boolean
}) => (
  <div className="control-group">
    <label className="control-label" htmlFor={id}>
      <span>{label}</span>
      <span className="control-value">{displayValue}</span>
    </label>
    <input
      id={id}
      className="retro-slider"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      disabled={disabled}
    />
  </div>
)

const Dropdown = ({
  label,
  current,
  activeValue,
  onSelect,
  options,
  disabled,
  hideLabel = false,
}: {
  label: string
  current: string
  activeValue?: string | null
  onSelect: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled: boolean
  hideLabel?: boolean
}) => {
  const handleSelect = useCallback(
    (value: string) => {
      if (disabled) return
      onSelect(value)
      window.requestAnimationFrame(() => {
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      })
    },
    [disabled, onSelect],
  )

  const selectedValue = activeValue ?? null

  return (
    <DropdownMenu className={`retro-select${disabled ? ' retro-select-disabled' : ''}`}>
      <DropdownMenuTrigger
        className={`retro-btn retro-btn--md retro-select-trigger${disabled ? ' retro-select-trigger-disabled' : ''}`}
        disabled={disabled}
        aria-haspopup="listbox"
      >
        <div className="retro-select-meta">
          {!hideLabel && <span className="retro-select-label">{label}</span>}
          <span className="retro-select-value">{current}</span>
        </div>
        <span
          className="retro-select-caret"
          aria-hidden="true"
          style={{ maskImage: caretMask, WebkitMaskImage: caretMask }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="retro-select-menu">
        <div role="listbox" aria-label={label} className="retro-select-options">
          {options.map((option) => {
            const isActive = option.value === selectedValue
            return (
              <button
                key={option.value}
                type="button"
                className={`retro-select-option${isActive ? ' retro-select-option-active' : ''}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isActive}
              >
                {option.label}
                {isActive && <span className="retro-select-dot" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'system'
  }
  const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

const getStoredThemeColor = (): ThemeColor => {
  if (typeof window === 'undefined') {
    return 'amber'
  }
  const stored = window.localStorage.getItem(THEME_COLOR_STORAGE_KEY)
  return stored === 'mint' || stored === 'violet' ? (stored as ThemeColor) : 'amber'
}

const getStoredThemeShape = (): ThemeShape => {
  if (typeof window === 'undefined') {
    return 'box'
  }
  const stored = window.localStorage.getItem(THEME_SHAPE_STORAGE_KEY)
  return stored === 'rounded' ? 'rounded' : 'box'
}

const App = () => {
  const sketchContainerRef = useRef<HTMLDivElement | null>(null)
  const controllerRef = useRef<SpriteController | null>(null)
  const [spriteState, setSpriteState] = useState<GeneratorState | null>(null)
  const [frameRate, setFrameRate] = useState<number>(60)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode())
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => getStoredThemeColor())
  const [themeShape, setThemeShape] = useState<ThemeShape>(() => getStoredThemeShape())
  const [controlTab, setControlTab] = useState<'sprites' | 'fx'>('sprites')
  const [logoGradient, setLogoGradient] = useState<string>(() => buildGradient())

  const cycleThemeMode = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === 'system') return 'light'
      if (prev === 'light') return 'dark'
      return 'system'
    })
  }, [])

  const themeModeText = useMemo(() => {
    switch (themeMode) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      default:
        return 'System'
    }
  }, [themeMode])

  const themeModeIcon = useMemo(() => {
    switch (themeMode) {
      case 'light':
        return '☀'
      case 'dark':
        return '☾'
      default:
        return '◎'
    }
  }, [themeMode])

  const ready = spriteState !== null && controllerRef.current !== null

  const currentPalette = useMemo(
    () => palettes.find((item) => item.id === spriteState?.paletteId) ?? palettes[0],
    [spriteState?.paletteId],
  )

  const currentModeLabel = useMemo(() => {
    if (!spriteState) return SPRITE_MODES[0].label
    return SPRITE_MODES.find((mode) => mode.value === spriteState.spriteMode)?.label ?? SPRITE_MODES[0].label
  }, [spriteState])

  const currentIconAsset = useMemo(() => {
    if (!spriteState || spriteState.spriteMode !== 'icon') {
      return null
    }
    return getPixelArtIconById(spriteState.iconAssetId) ?? pixelArtIconAssets[0]
  }, [spriteState?.iconAssetId, spriteState?.spriteMode])

  useEffect(() => {
    const container = sketchContainerRef.current
    if (!container) {
      return
    }

    const controller = createSpriteController(container, {
      onStateChange: (state) => {
        setSpriteState(state)
      },
      onFrameRate: setFrameRate,
    })

    controllerRef.current = controller
    setSpriteState(controller.getState())
    controller.randomizeAll()

    return () => {
      controller.destroy()
      controllerRef.current = null
    }
  }, [])

  const handlePaletteSelection = useCallback((paletteId: string) => {
    controllerRef.current?.usePalette(paletteId)
  }, [])

  const handleBlendSelect = useCallback((mode: BlendModeOption) => {
    controllerRef.current?.setBlendMode(mode)
  }, [])

  const handleBlendAutoToggle = useCallback((checked: boolean) => {
    controllerRef.current?.setBlendModeAuto(checked)
  }, [])

  const handleModeChange = useCallback((mode: SpriteMode) => {
    controllerRef.current?.setSpriteMode(mode)
  }, [])

  const handleMovementSelect = useCallback((mode: MovementMode) => {
    controllerRef.current?.setMovementMode(mode)
  }, [])

  const handleIconAssetSelect = useCallback((iconId: string) => {
    controllerRef.current?.setIconAsset(iconId)
  }, [])

  const randomiseIconControls = useCallback(() => {
    if (!controllerRef.current) {
      return
    }
    controllerRef.current.randomizeIcon()
  }, [])

  const randomiseBlend = useCallback(() => {
    controllerRef.current?.randomizeBlendMode()
  }, [])

  const handleLogoClick = useCallback(() => {
    setLogoGradient(buildGradient())
  }, [])

  const handleRandomiseAll = useCallback(() => {
    controllerRef.current?.randomizeAll()
  }, [])

  const logoStyle = useMemo(
    () => ({
      background: logoGradient,
      backgroundSize: '200% 200%',
      animation: 'logoGradientShift 12s ease infinite',
      WebkitMaskImage: 'url(/artlab-logo-white.svg)',
      maskImage: 'url(/artlab-logo-white.svg)',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
    }),
    [logoGradient],
  )

  const statusSeed = spriteState?.seed ?? '----'
  const statusPalette = currentPalette.name
  const statusMode = currentModeLabel
  const statusMotif = useMemo(() => {
    if (!spriteState) {
      return '—'
    }
    if (spriteState.spriteMode === 'icon') {
      return currentIconAsset?.label ?? 'Icon'
    }
    if (spriteState.spriteMode === 'pixel-glass') {
      return spriteState.icon?.name ?? 'Pixel Glass'
    }
    return (
      SPRITE_MODES.find((entry) => entry.value === spriteState.spriteMode)?.label ?? spriteState.spriteMode
    )
  }, [spriteState, currentIconAsset])
  const statusBlend = spriteState ? formatBlendStatus(spriteState.blendMode as BlendModeOption, spriteState.blendModeAuto) : 'Auto'

  const applyDocumentTheme = useCallback(
    (mode: ThemeMode, color: ThemeColor, shape: ThemeShape) => {
      if (typeof document === 'undefined') {
        return
      }
      const root = document.documentElement
      const prefersDark =
        mode === 'system' && typeof window !== 'undefined' && typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : false
      const resolved: Exclude<ThemeMode, 'system'> = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode
      root.setAttribute('data-theme-mode', mode)
      root.setAttribute('data-theme', resolved)
      root.setAttribute('data-theme-color', color)
      root.setAttribute('data-theme-shape', shape)
      root.style.setProperty('color-scheme', resolved)
    },
    [],
  )

  useEffect(() => {
    applyDocumentTheme(themeMode, themeColor, themeShape)
  }, [applyDocumentTheme, themeMode, themeColor, themeShape])

  useEffect(() => {
    if (themeMode !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyDocumentTheme('system', themeColor, themeShape)
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handler)
      return () => media.removeEventListener('change', handler)
    }
    media.addListener(handler)
    return () => media.removeListener(handler)
  }, [applyDocumentTheme, themeColor, themeMode, themeShape])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(THEME_COLOR_STORAGE_KEY, themeColor)
  }, [themeColor])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(THEME_SHAPE_STORAGE_KEY, themeShape)
  }, [themeShape])

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="app-logo-button"
          style={logoStyle}
          onClick={handleLogoClick}
          aria-label="Regenerate ArtLab gradient"
        />
        <div className="header-actions">
          <button
            type="button"
            className="theme-cycle-button"
            onClick={cycleThemeMode}
            aria-label={`Switch theme mode (current ${themeModeText})`}
            title={`Theme: ${themeModeText}`}
          >
            <span aria-hidden="true">{themeModeIcon}</span>
          </button>
          <Button
            {...BUTTON_SECONDARY}
            type="button"
            className="retro-btn retro-btn--sm header-star"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(GITHUB_REPO_URL, '_blank', 'noreferrer')
              }
            }}
          >
            ★ Star on GitHub
          </Button>
        </div>
      </header>

      <main className="app-main">
        <Card {...BUTTON_SECONDARY} className="control-card">
          <div className="panel">
            <div className="panel-heading">Controls</div>
            <div className="retro-tabs" role="tablist" aria-label="Control Panels">
              <button
                type="button"
                id="tab-sprites"
                role="tab"
                aria-controls="panel-sprites"
                aria-selected={controlTab === 'sprites'}
                className={`retro-tab${controlTab === 'sprites' ? ' retro-tab-active' : ''}`}
                onClick={() => setControlTab('sprites')}
              >
                Sprites
              </button>
              <button
                type="button"
                id="tab-fx"
                role="tab"
                aria-controls="panel-fx"
                aria-selected={controlTab === 'fx'}
                className={`retro-tab${controlTab === 'fx' ? ' retro-tab-active' : ''}`}
                onClick={() => setControlTab('fx')}
              >
                FX & Motion
              </button>
            </div>

            <div className="control-tab-content">
              <section
                id="panel-sprites"
                role="tabpanel"
                aria-labelledby="tab-sprites"
                hidden={controlTab !== 'sprites'}
                className="tab-panel"
              >
                {spriteState && controlTab === 'sprites' && (
                  <>
                    <div className="section">
                      <h3 className="section-title">Generation</h3>
                      <Dropdown
                        label="Render Mode"
                        current={currentModeLabel}
                        activeValue={spriteState.spriteMode}
                        disabled={!ready}
                        onSelect={(value) => handleModeChange(value as SpriteMode)}
                        options={SPRITE_MODES.map((mode) => ({ value: mode.value, label: mode.label }))}
                      />

                      <ControlSlider
                        id="density-range"
                        label="Tile Density"
                        min={20}
                        max={400}
                        value={Math.round(spriteState.scalePercent)}
                        displayValue={`${Math.round(spriteState.scalePercent)}%`}
                        onChange={(value) => controllerRef.current?.setScalePercent(value)}
                        disabled={!ready}
                      />
                      <ControlSlider
                        id="scale-range"
                        label="Scale Range"
                        min={30}
                        max={360}
                        value={Math.round(spriteState.scaleSpread)}
                        displayValue={`${Math.round(spriteState.scaleSpread)}%`}
                        onChange={(value) => controllerRef.current?.setScaleSpread(value)}
                        disabled={!ready}
                      />
                    </div>

                    {spriteState.spriteMode === 'icon' && (
                      <div className="section">
                        <h3 className="section-title">Icon Selection</h3>
                        <p className="section-hint">Choose one icon from the Pixelarticons library.</p>
                        <div className="icon-selector">
                          {currentIconAsset && (
                            <div className="icon-selector-preview">
                              <img src={currentIconAsset.url} alt={currentIconAsset.label} width={28} height={28} />
                            </div>
                          )}
                          <Dropdown
                            label="Library Icon"
                            current={currentIconAsset?.label ?? 'Select Icon'}
                            activeValue={spriteState.iconAssetId}
                            disabled={!ready}
                            onSelect={handleIconAssetSelect}
                            options={pixelArtIconAssets.map((assetOption) => ({
                              value: assetOption.id,
                              label: assetOption.label,
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section id="panel-fx" role="tabpanel" aria-labelledby="tab-fx" hidden={controlTab !== 'fx'} className="tab-panel">
                {spriteState && controlTab === 'fx' && (
                  <>
                    <div className="section">
                      <h3 className="section-title">Motion & Blend</h3>
                      <Dropdown
                        label="Movement"
                        current={formatMovementMode(spriteState.movementMode)}
                        activeValue={spriteState.movementMode}
                        disabled={!ready}
                        onSelect={(value) => handleMovementSelect(value as MovementMode)}
                        options={MOVEMENT_MODES.map((mode) => ({ value: mode.value, label: mode.label }))}
                      />
                      <ControlSlider
                        id="motion-range"
                        label="Motion Intensity"
                        min={0}
                        max={100}
                        value={Math.round(spriteState.motionIntensity)}
                        displayValue={`${Math.round(spriteState.motionIntensity)}%`}
                        onChange={(value) => controllerRef.current?.setMotionIntensity(value)}
                        disabled={!ready}
                      />
                      <ControlSlider
                        id="opacity-range"
                        label="Layer Opacity"
                        min={15}
                        max={100}
                        value={Math.round(spriteState.layerOpacity)}
                        displayValue={`${Math.round(spriteState.layerOpacity)}%`}
                        onChange={(value) => controllerRef.current?.setLayerOpacity(value)}
                        disabled={!ready}
                      />
                      <Dropdown
                        label="Blend Mode"
                        current={formatBlendStatus(spriteState.blendMode as BlendModeOption, spriteState.blendModeAuto)}
                        activeValue={spriteState.blendModeAuto ? 'RANDOM' : (spriteState.blendMode as string)}
                        disabled={!ready}
                        onSelect={(value) => handleBlendSelect(value as BlendModeOption)}
                        options={BLEND_MODES.map((mode) => ({ value: mode, label: formatBlendMode(mode) }))}
                      />
                      <label className="retro-checkbox">
                        <input
                          type="checkbox"
                          checked={spriteState.blendModeAuto}
                          onChange={(event) => handleBlendAutoToggle(event.target.checked)}
                          disabled={!ready}
                        />
                        <span>Apply random blend to each sprite</span>
                      </label>
                    </div>

                    <div className="section">
                      <h3 className="section-title">Palette & Variance</h3>
                      <ControlSlider
                        id="palette-range"
                        label="Palette Variance"
                        min={0}
                        max={100}
                        value={Math.round(spriteState.paletteVariance)}
                        displayValue={`${Math.round(spriteState.paletteVariance)}%`}
                        onChange={(value) => controllerRef.current?.setPaletteVariance(value)}
                        disabled={!ready}
                      />
                      <Dropdown
                        label="Palette Presets"
                        current={currentPalette.name}
                        activeValue={currentPalette.id}
                        disabled={!ready}
                        onSelect={(value) => handlePaletteSelection(value)}
                        options={PALETTE_OPTIONS}
                      />
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">Utilities</div>
            <div className="retro-button-group" role="group" aria-label="Randomise parameters">
              <span className="group-heading">Randomise Parameters</span>
              <small className="group-subtext">Each button shuffles the specific setting labelled below.</small>
              <Button
                {...BUTTON_PRIMARY}
                type="button"
                className="retro-btn retro-btn--md control-button"
                onClick={randomiseIconControls}
                disabled={!ready}
              >
                <span className="control-button-label">Icon</span>
              </Button>
              <Button
                {...BUTTON_PRIMARY}
                type="button"
                className="retro-btn retro-btn--md control-button"
                onClick={() => controllerRef.current?.randomizeColors()}
                disabled={!ready}
              >
                <span className="control-button-label">Palette</span>
              </Button>
              <Button
                {...BUTTON_PRIMARY}
                type="button"
                className="retro-btn retro-btn--md control-button"
                onClick={() => {
                  controllerRef.current?.randomizeScale()
                  controllerRef.current?.randomizeScaleRange()
                }}
                disabled={!ready}
              >
                <span className="control-button-label">Scale</span>
              </Button>
              <Button
                {...BUTTON_PRIMARY}
                type="button"
                className="retro-btn retro-btn--md control-button"
                onClick={() => controllerRef.current?.randomizeMotion()}
                disabled={!ready}
              >
                <span className="control-button-label">Motion</span>
              </Button>
              <Button
                {...BUTTON_PRIMARY}
                type="button"
                className="retro-btn retro-btn--md control-button"
                onClick={randomiseBlend}
                disabled={!ready}
              >
                <span className="control-button-label">Blend</span>
              </Button>
              <Button
                {...BUTTON_MUTED}
                type="button"
                className="retro-btn retro-btn--md control-button"
                onClick={() => controllerRef.current?.reset()}
                disabled={!ready}
              >
                <span className="control-button-label">Reset</span>
              </Button>
            </div>
            <div className="utilities-actions">
              <Button
                {...BUTTON_PRIMARY}
                type="button"
                className="retro-btn retro-btn--lg utilities-button"
                onClick={handleRandomiseAll}
                disabled={!ready}
              >
                Randomise All
              </Button>
              <Button {...BUTTON_MUTED} type="button" className="retro-btn retro-btn--lg utilities-button" disabled>
                Save Preset
              </Button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">Theme Styling</div>
            <div className="section">
              <div className="toggle-stack">
                <span className="toggle-label">Colour</span>
                <div className="retro-toggle-group" role="group" aria-label="Theme colour">
                  {THEME_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`retro-toggle${themeColor === option.value ? ' retro-toggle-active' : ''}`}
                      onClick={() => setThemeColor(option.value)}
                      aria-pressed={themeColor === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="toggle-stack">
                <span className="toggle-label">Corners</span>
                <div className="retro-toggle-group" role="group" aria-label="Corner style">
                  {THEME_SHAPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`retro-toggle${themeShape === option.value ? ' retro-toggle-active' : ''}`}
                      onClick={() => setThemeShape(option.value)}
                      aria-pressed={themeShape === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </Card>

        <div className="display-column">
          <Card {...BUTTON_SECONDARY} className="canvas-card">
            <div className="canvas-wrapper">
              <div className="sketch-container" ref={sketchContainerRef} aria-live="polite" />
            </div>
            <div className="status-bar">
              <span className="status-chip">Seed · {statusSeed}</span>
              <span className="status-chip">Palette · {statusPalette}</span>
              <span className="status-chip">Mode · {statusMode}</span>
              <span className="status-chip">Motif · {statusMotif}</span>
              <span className="status-chip">Blend · {statusBlend}</span>
              <span className="status-chip">{frameRate.toFixed(0)} FPS</span>
            </div>
          </Card>

          <Card {...BUTTON_SECONDARY} className="notes-card">
            <h2 className="control-label">Session Notes</h2>
            <p className="notes-text">
              Sculpt vivid voxel compositions inside ArtLab. Iterate on iconography, mutate colour systems, elevate motion envelopes,
              and layer blend modes to surface unexpected pixel poetry.
            </p>
            <div className="external-links">
              <a href="https://github.com/halfmage/pixelarticons" target="_blank" rel="noreferrer">
                Pixel Art Icons
              </a>
              <a href="https://p5js.org/" target="_blank" rel="noreferrer">
                p5.js
              </a>
              <a href="https://www.retroui.dev/docs" target="_blank" rel="noreferrer">
                RetroUI Docs
              </a>
            </div>
          </Card>
        </div>
      </main>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} ArtLab · Generative Playground</span>
        <span>
          Inspired by{' '}
          <a href="https://github.com/djnavarro/series-advent" target="_blank" rel="noreferrer">
            Series Advent
          </a>{' '}
          ·{' '}
          <a href="https://github.com/djnavarro/series-pastiche" target="_blank" rel="noreferrer">
            Series Pastiche
          </a>
        </span>
      </footer>
    </div>
  )
}

export default App

