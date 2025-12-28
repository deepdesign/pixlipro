/**
 * PARALLAX ANIMATION - COMPLETE MATHEMATICAL FORMULAS
 * 
 * This is an annotated version of the parallax movement code showing all formulas and equations.
 * See parallax-math.md for detailed explanations.
 */

// ============================================================================
// 1. DEPTH-BASED SPEED CALCULATION
// ============================================================================

// Formula: depth ∈ [0, 1] where 0 = farthest, 1 = closest
const depth = tile.parallaxDepth ?? (normalizedU * 0.5 + 0.25);

// Formula: depthSpeedMultiplier = 1.0 + depth × 1.5
// Range: [1.0, 2.5] - closer sprites move faster
const depthSpeedMultiplier = 1.0 + depth * 1.5;

// Formula: speedAlongAngle = baseParallaxSpeed × depthSpeedMultiplier × motionScale
// baseParallaxSpeed = 7 pixels per animation second
const baseParallaxSpeed = 7;
const speedAlongAngle = baseParallaxSpeed * depthSpeedMultiplier * motionScale;

// ============================================================================
// 2. SPRITE SIZE AND CANVAS BOUNDS
// ============================================================================

// Formula: exitBuffer = baseSvgSize × 0.5 (sprite radius)
const exitBuffer = baseSvgSize * 0.5;

// Extended canvas bounds accounting for sprite size:
// canvasLeft = 0 - exitBuffer
// canvasRight = canvasWidth + exitBuffer
// canvasTop = 0 - exitBuffer
// canvasBottom = canvasHeight + exitBuffer
// Sprite is off-screen when center is beyond these bounds

// ============================================================================
// 3. INITIAL POSITION (from grid, no angle applied)
// ============================================================================

// Initial position in world coordinates (normal grid positions)
const initialU = tile.parallaxInitialU ?? ((tile.u % 1) + 1) % 1;
const initialX = initialU * p.width;  // X = normalizedU × canvasWidth
const initialY = isLineSpriteTile 
  ? tile.v * p.height   // Line sprites: Y = normalizedV × canvasHeight
  : normalizedV * p.height;  // Other sprites: Y = normalizedV × canvasHeight

// ============================================================================
// 4. ANGLE CONVERSION AND DIRECTION VECTOR
// ============================================================================

// Formula: angleRad = (angleDegrees × π) / 180
const angleRad = (currentState.parallaxAngle * Math.PI) / 180;

// Unit direction vector components:
// cosAngle = cos(angleRad)  // X component
// sinAngle = sin(angleRad)  // Y component
const cosAngle = Math.cos(angleRad);
const sinAngle = Math.sin(angleRad);

// Movement along angle:
// deltaX = movementDistance × cosAngle
// deltaY = movementDistance × sinAngle

// ============================================================================
// 5. EXIT POINT CALCULATION (Line-Rectangle Intersection)
// ============================================================================

/**
 * Find where sprite exits canvas when moving along angle from start position.
 * 
 * Method: Test intersection with all four edges, find closest valid intersection.
 * 
 * Parametric line equation: point(t) = start + t × direction
 * For each edge, solve for t where line intersects edge.
 * 
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @returns {distance, exitX, exitY} - Distance along angle to exit, and exit point coordinates
 */
const findExitPoint = (startX: number, startY: number): { 
  distance: number; 
  exitX: number; 
  exitY: number 
} => {
  // Extended canvas bounds (accounting for sprite size)
  const canvasLeft = 0 - exitBuffer;
  const canvasRight = p.width + exitBuffer;
  const canvasTop = 0 - exitBuffer;
  const canvasBottom = p.height + exitBuffer;
  
  let minDistance = Infinity;
  let exitX = startX;
  let exitY = startY;
  
  // ========================================================================
  // LEFT EDGE INTERSECTION (x = canvasLeft)
  // ========================================================================
  // Formula: t = (canvasLeft - startX) / cosAngle
  //          y = startY + t × sinAngle
  // Condition: t > 0 (forward direction) AND canvasTop ≤ y ≤ canvasBottom
  if (cosAngle !== 0) {
    const t = (canvasLeft - startX) / cosAngle;
    if (t > 0) {
      const y = startY + t * sinAngle;
      if (y >= canvasTop && y <= canvasBottom) {
        const dist = Math.abs(t);
        if (dist < minDistance) {
          minDistance = dist;
          exitX = canvasLeft;
          exitY = y;
        }
      }
    }
  }
  
  // ========================================================================
  // RIGHT EDGE INTERSECTION (x = canvasRight)
  // ========================================================================
  // Formula: t = (canvasRight - startX) / cosAngle
  //          y = startY + t × sinAngle
  if (cosAngle !== 0) {
    const t = (canvasRight - startX) / cosAngle;
    if (t > 0) {
      const y = startY + t * sinAngle;
      if (y >= canvasTop && y <= canvasBottom) {
        const dist = Math.abs(t);
        if (dist < minDistance) {
          minDistance = dist;
          exitX = canvasRight;
          exitY = y;
        }
      }
    }
  }
  
  // ========================================================================
  // TOP EDGE INTERSECTION (y = canvasTop)
  // ========================================================================
  // Formula: t = (canvasTop - startY) / sinAngle
  //          x = startX + t × cosAngle
  if (sinAngle !== 0) {
    const t = (canvasTop - startY) / sinAngle;
    if (t > 0) {
      const x = startX + t * cosAngle;
      if (x >= canvasLeft && x <= canvasRight) {
        const dist = Math.abs(t);
        if (dist < minDistance) {
          minDistance = dist;
          exitX = x;
          exitY = canvasTop;
        }
      }
    }
  }
  
  // ========================================================================
  // BOTTOM EDGE INTERSECTION (y = canvasBottom)
  // ========================================================================
  // Formula: t = (canvasBottom - startY) / sinAngle
  //          x = startX + t × cosAngle
  if (sinAngle !== 0) {
    const t = (canvasBottom - startY) / sinAngle;
    if (t > 0) {
      const x = startX + t * cosAngle;
      if (x >= canvasLeft && x <= canvasRight) {
        const dist = Math.abs(t);
        if (dist < minDistance) {
          minDistance = dist;
          exitX = x;
          exitY = canvasBottom;
        }
      }
    }
  }
  
  return { distance: minDistance, exitX, exitY };
};

// ============================================================================
// 6. TRAVEL DISTANCE AND TIMING CALCULATION
// ============================================================================

// Calculate exit point from initial position
const exitFromInitial = findExitPoint(initialX, initialY);

// Formula: travelDistance = distance from initial position to exit point along angle
// This is the actual path length, not horizontal distance
// Accounts for canvas aspect ratio automatically
const travelDistance = exitFromInitial.distance;

// Formula: travelTime = travelDistance / speedAlongAngle
const travelTime = travelDistance / speedAlongAngle;

// Formula: recycleCycleTime = travelTime + delay
// Total time for one complete cycle (travel + delay before respawn)
const recycleCycleTime = travelTime + delay;

// ============================================================================
// 7. CURRENT TIME AND MOVEMENT DISTANCE
// ============================================================================

// Formula: currentTime = (scaledAnimationTime × animationTimeMultiplier) + startPhase
// startPhase can be negative (sprite already moving) or positive (sprite hasn't started)
const currentTime = (scaledAnimationTime * tile.animationTimeMultiplier) + startPhase;

// Formula: movementDistance = currentTime × speedAlongAngle
// Distance traveled along angle from time 0
const movementDistance = currentTime * speedAlongAngle;

// ============================================================================
// 8. FIRST JOURNEY VS RECYCLING
// ============================================================================

// Condition: isFirstJourney = (movementDistance ≥ 0) AND (movementDistance < travelDistance)
const isFirstJourney = movementDistance >= 0 && movementDistance < travelDistance;

if (isFirstJourney) {
  // ========================================================================
  // FIRST JOURNEY: Move from initial position along angle
  // ========================================================================
  // Formula: deltaX = movementDistance × cosAngle
  //          deltaY = movementDistance × sinAngle
  const deltaX = movementDistance * cosAngle;
  const deltaY = movementDistance * sinAngle;
  
  // Formula: currentWorldX = initialX + deltaX
  //          currentWorldY = initialY + deltaY
  currentWorldX = initialX + deltaX;
  currentWorldY = initialY + deltaY;
  
} else {
  // ========================================================================
  // RECYCLING: Calculate entry point and position
  // ========================================================================
  
  // Calculate time since exit
  let timeSinceExit: number;
  if (movementDistance < 0) {
    // Sprite started off-screen (negative start phase)
    // Formula: timeSinceExit = |movementDistance| / speedAlongAngle
    timeSinceExit = Math.abs(movementDistance) / speedAlongAngle;
  } else {
    // Sprite exited from initial position
    // Formula: timeSinceExit = currentTime - travelTime
    timeSinceExit = currentTime - travelTime;
  }
  
  // Calculate which recycle cycle we're in
  // Formula: recycleCycleNumber = floor(timeSinceExit / recycleCycleTime)
  const recycleCycleNumber = Math.floor(timeSinceExit / recycleCycleTime);
  
  // Formula: timeInRecycleCycle = timeSinceExit mod recycleCycleTime
  const timeInRecycleCycle = timeSinceExit % recycleCycleTime;
  
  // ========================================================================
  // 9. ENTRY EDGE DETERMINATION
  // ========================================================================
  
  // Normalize angle to [0, 360) range
  // Formula: normalizedAngle = ((angle mod 360) + 360) mod 360
  let normalizedAngle = ((currentState.parallaxAngle % 360) + 360) % 360;
  
  // Determine entry edge based on movement direction
  let entryEdgeX: number;
  let entryEdgeY: number;
  let perpLineLength: number;
  
  if (normalizedAngle >= 315 || normalizedAngle < 45) {
    // Moving right (0°): enter from left edge
    // Entry edge center: (0 - exitBuffer, canvasHeight / 2)
    entryEdgeX = -exitBuffer;
    entryEdgeY = p.height / 2;
    // Perpendicular line length = canvasHeight + 2×exitBuffer
    perpLineLength = p.height + exitBuffer * 2;
    
  } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
    // Moving down (90°): enter from top edge
    // Entry edge center: (canvasWidth / 2, 0 - exitBuffer)
    entryEdgeX = p.width / 2;
    entryEdgeY = -exitBuffer;
    // Perpendicular line length = canvasWidth + 2×exitBuffer
    perpLineLength = p.width + exitBuffer * 2;
    
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    // Moving left (180°): enter from right edge
    // Entry edge center: (canvasWidth + exitBuffer, canvasHeight / 2)
    entryEdgeX = p.width + exitBuffer;
    entryEdgeY = p.height / 2;
    // Perpendicular line length = canvasHeight + 2×exitBuffer
    perpLineLength = p.height + exitBuffer * 2;
    
  } else {
    // Moving up (270°): enter from bottom edge
    // Entry edge center: (canvasWidth / 2, canvasHeight + exitBuffer)
    entryEdgeX = p.width / 2;
    entryEdgeY = p.height + exitBuffer;
    // Perpendicular line length = canvasWidth + 2×exitBuffer
    perpLineLength = p.width + exitBuffer * 2;
  }
  
  // ========================================================================
  // 10. PERPENDICULAR LINE CALCULATION
  // ========================================================================
  
  // Perpendicular angle is 90 degrees from movement angle
  // Formula: perpAngle = angleRad + π/2
  const perpAngle = angleRad + Math.PI / 2;
  
  // Perpendicular direction vector
  const perpCos = Math.cos(perpAngle);
  const perpSin = Math.sin(perpAngle);
  
  // ========================================================================
  // 11. SPAWN POINT CALCULATION
  // ========================================================================
  
  // Random offset along perpendicular line (deterministic based on cycle number)
  const entryRng = createMulberry32(hashSeed(
    `${currentState.seed}-parallax-entry-${layerIndex}-${tileIndex}-${recycleCycleNumber}`
  ));
  
  // Formula: perpOffset = (random() - 0.5) × perpLineLength
  // Range: [-perpLineLength/2, +perpLineLength/2]
  const perpOffset = (entryRng() - 0.5) * perpLineLength;
  
  // Distance to move back along angle (ensure off-screen)
  // Formula: offScreenDistance = exitBuffer × 2.5
  const offScreenDistance = exitBuffer * 2.5;
  
  // Entry point calculation:
  // Formula: entryX = entryEdgeX + perpOffset × perpCos - offScreenDistance × cosAngle
  //          entryY = entryEdgeY + perpOffset × perpSin - offScreenDistance × sinAngle
  const entryX = entryEdgeX + perpOffset * perpCos - offScreenDistance * cosAngle;
  const entryY = entryEdgeY + perpOffset * perpSin - offScreenDistance * sinAngle;
  
  // ========================================================================
  // 12. RECYCLING POSITION CALCULATION
  // ========================================================================
  
  if (timeInRecycleCycle < delay) {
    // Delay phase: sprite is off-screen, waiting to enter
    currentWorldX = entryX;
    currentWorldY = entryY;
    
  } else {
    // Moving phase: sprite travels along angle from entry point
    // Formula: moveTime = timeInRecycleCycle - delay
    const moveTime = timeInRecycleCycle - delay;
    
    // Formula: moveDistance = moveTime × speedAlongAngle
    const moveDistance = moveTime * speedAlongAngle;
    
    // Formula: currentWorldX = entryX + moveDistance × cosAngle
    //          currentWorldY = entryY + moveDistance × sinAngle
    currentWorldX = entryX + (moveDistance * cosAngle);
    currentWorldY = entryY + (moveDistance * sinAngle);
  }
}

// ============================================================================
// 13. VISIBILITY CHECK
// ============================================================================

// Sprite radius (half size)
const spriteRadius = exitBuffer;

// Visibility check: sprite is visible if any part overlaps canvas
// Formula: isVisible = (currentWorldX ≥ -spriteRadius) AND
//                    (currentWorldX ≤ canvasWidth + spriteRadius) AND
//                    (currentWorldY ≥ -spriteRadius) AND
//                    (currentWorldY ≤ canvasHeight + spriteRadius)
const isVisible = currentWorldX >= -spriteRadius && 
                 currentWorldX <= p.width + spriteRadius &&
                 currentWorldY >= -spriteRadius && 
                 currentWorldY <= p.height + spriteRadius;

// ============================================================================
// 14. NORMALIZED COORDINATE CONVERSION
// ============================================================================

if (isVisible) {
  // Convert world coordinates to normalized [0, 1] range
  // Formula: normalizedU = currentWorldX / canvasWidth
  normalizedU = currentWorldX / p.width;
  
  // For non-line sprites: normalizedV = currentWorldY / canvasHeight
  if (!isLineSpriteTile) {
    normalizedV = currentWorldY / p.height;
  }
  // Line sprites: preserve original normalizedV for uniform distribution
  
} else {
  // Sprite is off-screen - position far off-screen to prevent rendering
  normalizedU = currentWorldX < 0 ? -10 : 10;
  if (!isLineSpriteTile) {
    normalizedV = currentWorldY < 0 ? -10 : 10;
  }
}

// ============================================================================
// SUMMARY: KEY FORMULAS
// ============================================================================

/*
SPEED:
  speedAlongAngle = 7 × (1.0 + depth × 1.5) × motionScale

MOVEMENT:
  movementDistance = currentTime × speedAlongAngle
  deltaX = movementDistance × cos(angleRad)
  deltaY = movementDistance × sin(angleRad)

POSITION (First Journey):
  currentWorldX = initialX + deltaX
  currentWorldY = initialY + deltaY

EXIT POINT (Line-Rectangle Intersection):
  For edge x = canvasLeft: t = (canvasLeft - startX) / cosAngle
  For edge y = canvasTop: t = (canvasTop - startY) / sinAngle
  Choose minimum t > 0 where intersection is valid

TRAVEL DISTANCE:
  travelDistance = distance from initial to exit point along angle
  travelTime = travelDistance / speedAlongAngle

SPAWN POINT:
  perpOffset = (random() - 0.5) × perpLineLength
  entryX = entryEdgeX + perpOffset × perpCos - (exitBuffer × 2.5) × cosAngle
  entryY = entryEdgeY + perpOffset × perpSin - (exitBuffer × 2.5) × sinAngle

CANVAS SIZE ACCOUNTING:
  - Exit detection uses actual canvas dimensions (width, height)
  - Perpendicular line length = canvas dimension perpendicular to movement + 2×exitBuffer
  - Travel distance automatically accounts for aspect ratio via line-rectangle intersection
  - Entry edge position = canvas midpoint along perpendicular dimension
*/

