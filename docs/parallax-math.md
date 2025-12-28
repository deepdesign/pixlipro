# Parallax Animation Mathematics

## Complete Formula Documentation

This document explains the complete mathematical formulas used for parallax animation, spawning, and despawning, including how canvas size and shape are accounted for.

---

## 1. Depth-Based Speed Calculation

### Formula:
```
depth ∈ [0, 1]  // 0 = farthest, 1 = closest

depthSpeedMultiplier = 1.0 + depth × 1.5
// Range: [1.0, 2.5]
// Closer sprites (higher depth) move faster

baseParallaxSpeed = 7  // pixels per animation second

speedAlongAngle = baseParallaxSpeed × depthSpeedMultiplier × motionScale
```

**Explanation:**
- `depth` determines how close/far the sprite appears (0 = background, 1 = foreground)
- Speed increases linearly with depth: farthest sprites move at 1.0× speed, closest at 2.5× speed
- `motionScale` is the user-controlled motion speed multiplier (0-12.5 range)

---

## 2. Angle-Based Movement Direction

### Formulas:
```
angleDegrees ∈ [0, 360)  // User-controlled parallax angle

angleRad = (angleDegrees × π) / 180  // Convert to radians

cosAngle = cos(angleRad)  // X component of unit vector
sinAngle = sin(angleRad)  // Y component of unit vector
```

**Movement Vector:**
```
movementDistance = currentTime × speedAlongAngle

deltaX = movementDistance × cosAngle
deltaY = movementDistance × sinAngle
```

**Position Update:**
```
currentWorldX = initialX + deltaX
currentWorldY = initialY + deltaY
```

**Explanation:**
- Angle 0° = right (cos=1, sin=0)
- Angle 90° = down (cos=0, sin=1)
- Angle 180° = left (cos=-1, sin=0)
- Angle 270° = up (cos=0, sin=-1)
- Movement is a straight line along the angle direction

---

## 3. Canvas Bounds and Sprite Size

### Formulas:
```
exitBuffer = baseSvgSize × 0.5  // Half sprite size (radius)

// Extended canvas bounds (accounting for sprite size)
canvasLeft = 0 - exitBuffer
canvasRight = canvasWidth + exitBuffer
canvasTop = 0 - exitBuffer
canvasBottom = canvasHeight + exitBuffer
```

**Explanation:**
- `exitBuffer` represents the sprite radius
- Sprite is completely off-screen when its center is beyond extended bounds
- For a sprite to be off-screen left: `centerX < -exitBuffer`
- For a sprite to be off-screen right: `centerX > canvasWidth + exitBuffer`

---

## 4. Exit Point Calculation (Line-Rectangle Intersection)

### Problem:
Given a starting position `(startX, startY)` and a movement angle, find where the sprite exits the canvas.

### Method:
Test intersection with all four edges and find the closest valid intersection.

### Formulas for Each Edge:

#### Left Edge (x = canvasLeft):
```
if cosAngle ≠ 0:
  t = (canvasLeft - startX) / cosAngle
  
  if t > 0:  // Moving in direction that could hit this edge
    y = startY + t × sinAngle
    
    if canvasTop ≤ y ≤ canvasBottom:  // Intersection is on edge
      distance = |t|
      exitPoint = (canvasLeft, y)
```

#### Right Edge (x = canvasRight):
```
if cosAngle ≠ 0:
  t = (canvasRight - startX) / cosAngle
  
  if t > 0:
    y = startY + t × sinAngle
    
    if canvasTop ≤ y ≤ canvasBottom:
      distance = |t|
      exitPoint = (canvasRight, y)
```

#### Top Edge (y = canvasTop):
```
if sinAngle ≠ 0:
  t = (canvasTop - startY) / sinAngle
  
  if t > 0:
    x = startX + t × cosAngle
    
    if canvasLeft ≤ x ≤ canvasRight:
      distance = |t|
      exitPoint = (x, canvasTop)
```

#### Bottom Edge (y = canvasBottom):
```
if sinAngle ≠ 0:
  t = (canvasBottom - startY) / sinAngle
  
  if t > 0:
    x = startX + t × cosAngle
    
    if canvasLeft ≤ x ≤ canvasRight:
      distance = |t|
      exitPoint = (x, canvasBottom)
```

**Final Result:**
```
exitPoint = closest intersection among all four edges
travelDistance = distance from start to exitPoint
```

**Explanation:**
- Uses parametric line equation: `point(t) = start + t × direction`
- For each edge, solve for `t` where the line intersects the edge
- `t > 0` ensures we're moving forward, not backward
- Choose the intersection with minimum `t` (closest to start point)
- This accounts for canvas aspect ratio automatically (wider canvas = longer horizontal travel for horizontal angles)

---

## 5. Travel Distance and Timing

### Formulas:
```
exitFromInitial = findExitPoint(initialX, initialY)

travelDistance = exitFromInitial.distance
// Distance along angle from initial position to exit point

travelTime = travelDistance / speedAlongAngle
// Time to travel from initial position to exit

recycleCycleTime = travelTime + delay
// Total time for one complete cycle (travel + delay before respawn)
```

**Explanation:**
- `travelDistance` is the actual path length along the angle, not horizontal distance
- For a 16:9 canvas with 45° angle, travel distance is longer than canvas width
- `travelTime` accounts for both canvas size and movement speed
- `delay` adds randomness to prevent all sprites from respawning simultaneously

---

## 6. First Journey vs Recycling

### Condition:
```
movementDistance = currentTime × speedAlongAngle

isFirstJourney = (movementDistance ≥ 0) AND (movementDistance < travelDistance)
```

### First Journey Position:
```
if isFirstJourney:
  deltaX = movementDistance × cosAngle
  deltaY = movementDistance × sinAngle
  
  currentWorldX = initialX + deltaX
  currentWorldY = initialY + deltaY
```

**Explanation:**
- First journey: sprite moves from initial grid position along angle
- `movementDistance < 0` means sprite started off-screen (negative phase)
- `movementDistance ≥ travelDistance` means sprite has exited

---

## 7. Entry Edge Determination

### Formula:
```
normalizedAngle = ((parallaxAngle mod 360) + 360) mod 360
// Normalize to [0, 360) range
```

### Edge Selection Based on Angle:

```
if 315° ≤ angle < 45° OR angle < 45°:  // Moving right
  entryEdgeX = -exitBuffer
  entryEdgeY = canvasHeight / 2
  perpLineLength = canvasHeight + exitBuffer × 2

else if 45° ≤ angle < 135°:  // Moving down
  entryEdgeX = canvasWidth / 2
  entryEdgeY = -exitBuffer
  perpLineLength = canvasWidth + exitBuffer × 2

else if 135° ≤ angle < 225°:  // Moving left
  entryEdgeX = canvasWidth + exitBuffer
  entryEdgeY = canvasHeight / 2
  perpLineLength = canvasHeight + exitBuffer × 2

else:  // 225° ≤ angle < 315°: Moving up
  entryEdgeX = canvasWidth / 2
  entryEdgeY = canvasHeight + exitBuffer
  perpLineLength = canvasWidth + exitBuffer × 2
```

**Explanation:**
- Entry edge is opposite to movement direction
- `perpLineLength` is the length of the perpendicular line along which sprites spawn
- Accounts for canvas dimensions: wider canvas = longer perpendicular line for horizontal movement

---

## 8. Perpendicular Line for Spawn Distribution

### Formulas:
```
perpAngle = angleRad + π/2  // 90 degrees from movement angle

perpCos = cos(perpAngle)
perpSin = sin(perpAngle)
```

**Explanation:**
- Perpendicular line is at 90° to movement direction
- Used to distribute spawn points along the entry edge
- Ensures sprites spawn in a line perpendicular to their movement

---

## 9. Spawn Point Calculation

### Formulas:
```
// Random offset along perpendicular line
entryRng = seededRNG(seed, layerIndex, tileIndex, recycleCycleNumber)
perpOffset = (entryRng() - 0.5) × perpLineLength
// Range: [-perpLineLength/2, +perpLineLength/2]

// Distance to move back along angle (ensure off-screen)
offScreenDistance = exitBuffer × 2.5

// Entry point calculation
entryX = entryEdgeX + perpOffset × perpCos - offScreenDistance × cosAngle
entryY = entryEdgeY + perpOffset × perpSin - offScreenDistance × sinAngle
```

**Explanation:**
- `perpOffset` randomly distributes sprites along the perpendicular line
- `offScreenDistance × 2.5` ensures sprites spawn completely off-screen
- Subtracting `offScreenDistance × cosAngle/sinAngle` moves sprite back along angle direction
- This guarantees sprites are off-screen regardless of angle

---

## 10. Recycling Position Calculation

### Formulas:
```
if movementDistance < 0:
  // Sprite started off-screen
  timeSinceExit = |movementDistance| / speedAlongAngle
else:
  // Sprite exited from initial position
  timeSinceExit = currentTime - travelTime

recycleCycleNumber = floor(timeSinceExit / recycleCycleTime)
timeInRecycleCycle = timeSinceExit mod recycleCycleTime
```

### Position During Recycling:
```
if timeInRecycleCycle < delay:
  // Delay phase: waiting off-screen
  currentWorldX = entryX
  currentWorldY = entryY
else:
  // Moving phase: traveling along angle
  moveTime = timeInRecycleCycle - delay
  moveDistance = moveTime × speedAlongAngle
  
  currentWorldX = entryX + moveDistance × cosAngle
  currentWorldY = entryY + moveDistance × sinAngle
```

**Explanation:**
- `recycleCycleNumber` ensures deterministic spawn positions (same cycle = same entry point)
- `delay` phase keeps sprite off-screen before entering
- Movement phase moves sprite along angle from entry point

---

## 11. Visibility Check

### Formula:
```
spriteRadius = exitBuffer

isVisible = (currentWorldX ≥ -spriteRadius) AND
           (currentWorldX ≤ canvasWidth + spriteRadius) AND
           (currentWorldY ≥ -spriteRadius) AND
           (currentWorldY ≤ canvasHeight + spriteRadius)
```

**Explanation:**
- Sprite is visible if any part of it overlaps the canvas
- Uses extended bounds (canvas ± spriteRadius) to account for sprite size
- Prevents sprites from appearing/disappearing while on canvas

---

## 12. Canvas Size and Shape Accounting

### How Canvas Dimensions Affect Calculations:

1. **Exit Point Calculation:**
   - Wider canvas → longer horizontal travel for horizontal angles
   - Taller canvas → longer vertical travel for vertical angles
   - Diagonal angles → travel distance = √(width² + height²) for corner-to-corner

2. **Perpendicular Line Length:**
   - Horizontal movement (0°/180°): `perpLineLength = canvasHeight + 2×exitBuffer`
   - Vertical movement (90°/270°): `perpLineLength = canvasWidth + 2×exitBuffer`
   - Ensures spawn points cover entire entry edge

3. **Travel Distance:**
   - Automatically accounts for aspect ratio via line-rectangle intersection
   - 16:9 canvas with 45° angle: travel distance > canvas width
   - 1:1 canvas with 45° angle: travel distance = canvas diagonal

4. **Entry Edge Position:**
   - Entry edge center is at canvas midpoint along perpendicular dimension
   - For horizontal movement: entry at `(0, height/2)` or `(width, height/2)`
   - For vertical movement: entry at `(width/2, 0)` or `(width/2, height)`

---

## Complete Function Pseudocode

```
function calculateParallaxPosition(
  initialX, initialY,        // Initial grid position
  canvasWidth, canvasHeight,  // Canvas dimensions
  angleDegrees,              // Movement angle (0-360)
  depth,                     // Sprite depth (0-1)
  currentTime,              // Current animation time
  spriteSize,               // Sprite size
  motionScale               // User speed control
):
  // 1. Calculate speed
  depthSpeedMultiplier = 1.0 + depth × 1.5
  speedAlongAngle = 7 × depthSpeedMultiplier × motionScale
  
  // 2. Convert angle
  angleRad = (angleDegrees × π) / 180
  cosAngle = cos(angleRad)
  sinAngle = sin(angleRad)
  
  // 3. Calculate exit point
  exitBuffer = spriteSize × 0.5
  exitPoint = findExitPoint(initialX, initialY, angleRad, canvasWidth, canvasHeight, exitBuffer)
  travelDistance = exitPoint.distance
  
  // 4. Calculate movement
  movementDistance = currentTime × speedAlongAngle
  
  // 5. Determine position
  if movementDistance ≥ 0 AND movementDistance < travelDistance:
    // First journey
    currentWorldX = initialX + movementDistance × cosAngle
    currentWorldY = initialY + movementDistance × sinAngle
  else:
    // Recycling
    entryPoint = calculateEntryPoint(angleRad, canvasWidth, canvasHeight, exitBuffer, ...)
    currentWorldX = entryPoint.x + (moveDistance × cosAngle)
    currentWorldY = entryPoint.y + (moveDistance × sinAngle)
  
  // 6. Check visibility
  isVisible = checkVisibility(currentWorldX, currentWorldY, canvasWidth, canvasHeight, exitBuffer)
  
  return (currentWorldX, currentWorldY, isVisible)
```

---

## Key Mathematical Properties

1. **Straight Line Movement:** All movement follows `position = start + distance × direction`
2. **Aspect Ratio Independent:** Exit detection works for any canvas size/shape
3. **Deterministic:** Same seed + cycle number = same spawn position
4. **Continuous:** No jumps or discontinuities in position
5. **Off-Screen Guarantee:** Spawn points are always off-screen via `offScreenDistance × 2.5`

