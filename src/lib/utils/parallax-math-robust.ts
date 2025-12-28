/**
 * parallax-math-robust.ts
 * 
 * Robust spawn + despawn maths for any canvas aspect ratio, any angle, any sprite size.
 * Key idea: cull against a padded rectangle and respawn on an infinite line outside it.
 * 
 * This replaces the time-based parallax calculations with a stateful per-sprite approach.
 */

export type Vec2 = { x: number; y: number };

export type Rect = {
  // Axis-aligned rect in world pixels
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type SpriteState = {
  x: number; // centre in world pixels
  y: number;
};

export type SpawnConfig = {
  canvasWidth: number;
  canvasHeight: number;

  // Sprite bounds in pixels (after all scaling). If you only have "size", pass width=size, height=size.
  spriteWidthPx: number;
  spriteHeightPx: number;

  // Extra safety margin in pixels - helps with anti-aliasing, stroke widths, and fast motion.
  safetyMarginPx?: number;

  // If you want a bit of depth-based spacing, push spawns further back (optional).
  // Default 0.
  spawnBackoffPx?: number;
};

export type MotionConfig = {
  // Direction of motion (unit vector)
  dir: Vec2;

  // Delta time in seconds for this frame
  dt: number;

  // Speed in pixels per second (already includes depth multiplier and motionScale)
  speed: number;
};

// ------------------------------
// Vector helpers
// ------------------------------
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const mul = (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s });

export const perp = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x });

export const len = (v: Vec2): number => Math.hypot(v.x, v.y);

export const normalise = (v: Vec2): Vec2 => {
  const l = len(v);
  if (l === 0) return { x: 1, y: 0 };
  return { x: v.x / l, y: v.y / l };
};

// ------------------------------
// Core geometry
// ------------------------------

/**
 * Conservative radius for "never spawn/de-spawn while visible":
 * half-diagonal of the sprite's pixel bounds + a small safety margin.
 */
export const computeSpriteRadiusPx = (w: number, h: number, safetyMarginPx = 1): number => {
  const halfDiag = 0.5 * Math.hypot(w, h);
  return halfDiag + safetyMarginPx;
};

export const canvasRect = (w: number, h: number): Rect => ({
  left: 0,
  top: 0,
  right: w,
  bottom: h,
});

export const padRect = (r: Rect, pad: number): Rect => ({
  left: r.left - pad,
  top: r.top - pad,
  right: r.right + pad,
  bottom: r.bottom + pad,
});

export const isPointInsideRect = (p: Vec2, r: Rect): boolean =>
  p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;

/**
 * Projection "support distance" from the rect centre to its boundary along a unit axis.
 * For an AABB with half extents (hx, hy) and unit axis u:
 * max |dot(u, v)| for v inside rect = |u.x|*hx + |u.y|*hy
 */
const supportDistance = (uUnit: Vec2, hx: number, hy: number): number =>
  Math.abs(uUnit.x) * hx + Math.abs(uUnit.y) * hy;

/**
 * Returns a spawn base point outside the padded rect on the *incoming* side,
 * plus the half-length of the perpendicular spawn segment that fully covers the rect.
 */
export const computeSpawnLine = (
  padded: Rect,
  dirUnit: Vec2,
  extraBackoffPx: number
): { base: Vec2; perpUnit: Vec2; halfSpan: number } => {
  const centre: Vec2 = {
    x: (padded.left + padded.right) * 0.5,
    y: (padded.top + padded.bottom) * 0.5,
  };

  const hx = (padded.right - padded.left) * 0.5;
  const hy = (padded.bottom - padded.top) * 0.5;

  const d = normalise(dirUnit);
  const p = normalise(perp(d));

  // Distance from centre to padded-rect boundary along direction d:
  const distAlongDir = supportDistance(d, hx, hy);

  // Place spawn line on the incoming side: move opposite the direction of travel.
  // Any point with dot(d, point-centre) < -distAlongDir is outside the rect.
  const base = add(centre, mul(d, -(distAlongDir + extraBackoffPx)));

  // Half-span needed so the perpendicular line covers the rect's projection on that axis.
  const halfSpan = supportDistance(p, hx, hy);

  return { base, perpUnit: p, halfSpan };
};

/**
 * Sample a point on the spawn line (perpendicular to movement direction)
 * u is uniform in [-halfSpan, +halfSpan]
 */
export const sampleSpawnPoint = (
  rng01: () => number,
  spawnLine: { base: Vec2; perpUnit: Vec2; halfSpan: number }
): Vec2 => {
  const u = (rng01() * 2 - 1) * spawnLine.halfSpan;
  return add(spawnLine.base, mul(spawnLine.perpUnit, u));
};

// ------------------------------
// Update step (move, cull, respawn)
// ------------------------------

/**
 * Main update function: move sprite, check if it left the padded canvas, respawn if needed.
 * 
 * @param state - Current sprite position (x, y in world pixels)
 * @param motion - Movement configuration (direction, delta time, speed)
 * @param spawnCfg - Canvas and sprite size configuration
 * @param rng01 - Seeded RNG function returning values in [0, 1)
 * @returns New sprite position
 */
export const stepSprite = (
  state: SpriteState,
  motion: MotionConfig,
  spawnCfg: SpawnConfig,
  rng01: () => number
): SpriteState => {
  const safety = spawnCfg.safetyMarginPx ?? 1;
  const radius = computeSpriteRadiusPx(
    spawnCfg.spriteWidthPx,
    spawnCfg.spriteHeightPx,
    safety
  );

  // Create two rects:
  // 1. Inner rect (canvas) - sprite is visible when inside this
  // 2. Outer rect (padded) - sprite only respawns when it leaves this
  const canvas = canvasRect(spawnCfg.canvasWidth, spawnCfg.canvasHeight);
  const outer = padRect(canvas, radius);

  const dir = normalise(motion.dir);

  // 1) Move
  const next: Vec2 = {
    x: state.x + dir.x * motion.speed * motion.dt,
    y: state.y + dir.y * motion.speed * motion.dt,
  };

  // 2) If still inside outer (padded) rect, keep moving
  // This means sprite is either on canvas or just slightly off-screen
  if (isPointInsideRect(next, outer)) {
    return { x: next.x, y: next.y };
  }

  // 3) Sprite has fully exited - respawn on the INCOMING edge
  // Spawn just outside the outer rect on the opposite side of travel
  // Use minimal backoff so sprite enters on next frame (immediate respawn)
  const backoff = 0.1; // Just 0.1 pixels outside for immediate entry (no delay)
  
  const spawnLine = computeSpawnLine(outer, dir, backoff);
  const spawn = sampleSpawnPoint(rng01, spawnLine);

  return { x: spawn.x, y: spawn.y };
};

/**
 * Initialize sprite position for parallax mode.
 * Called once when a sprite enters parallax mode or on first render.
 * 
 * Instead of starting all sprites at grid positions (which creates clumping),
 * we distribute sprites randomly along their entire journey - from spawn edge
 * to exit edge. This creates a natural spread from the beginning.
 * 
 * @param _initialX - Initial X position from grid (unused - we distribute randomly)
 * @param _initialY - Initial Y position from grid (unused - we distribute randomly)
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param spriteSize - Sprite size in pixels
 * @param rng01 - Seeded RNG function
 * @param dir - Movement direction (unit vector)
 * @returns Initial sprite position
 */
export const initSpritePosition = (
  _initialX: number,
  _initialY: number,
  canvasWidth: number,
  canvasHeight: number,
  spriteSize: number,
  rng01: () => number,
  dir: Vec2
): SpriteState => {
  const safety = 2;
  const radius = computeSpriteRadiusPx(spriteSize, spriteSize, safety);
  const padded = padRect(canvasRect(canvasWidth, canvasHeight), radius);
  
  // Calculate spawn line (where sprites enter from)
  const backoff = 1;
  const spawnLine = computeSpawnLine(padded, dir, backoff);
  
  // Sample a random starting point on the spawn line
  const spawnPoint = sampleSpawnPoint(rng01, spawnLine);
  
  // Calculate the distance the sprite can travel across the canvas
  // This is approximately the diagonal of the padded rect in the direction of travel
  const d = normalise(dir);
  const hx = (padded.right - padded.left) * 0.5;
  const hy = (padded.bottom - padded.top) * 0.5;
  const travelDistance = 2 * (Math.abs(d.x) * hx + Math.abs(d.y) * hy) + backoff * 2;
  
  // Place sprite at a random position along its journey (0 = just spawned, 1 = about to exit)
  const progress = rng01();
  const distanceAlongPath = progress * travelDistance;
  
  return {
    x: spawnPoint.x + d.x * distanceAlongPath,
    y: spawnPoint.y + d.y * distanceAlongPath,
  };
};

