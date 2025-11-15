# Layout and Responsive Design Changes - January 18, 2025

This document details all layout and responsive design changes made on January 18, 2025. These changes should be reapplied carefully after rolling back to ensure core functionality is preserved.

## Summary

Today's changes focused on:
1. Status bar badge ordering and spacing
2. Loading screen styling improvements
3. Layout alignment and spacing refinements
4. Responsive layout improvements (commented out column splitting)
5. Header overflow menu implementation
6. Footer positioning
7. Canvas card shadow clipping fixes
8. Various spacing adjustments

## File Changes

### 1. `src/App.tsx`

#### Status Bar Badge Order
- **Changed**: Badge order from `Palette, Sprite, Blend, Motion` to `Sprite, Palette, Blend, Motion`
- **Locations**: 
  - `badgeMeasureRef` element (hidden measurement)
  - Status bar popover (when badges are compact)
  - Main status bar (when not compact)
  - Mobile status info (`status-bar-info-mobile`)

#### Removed Redundant Loader Overlay
- **Removed**: `app-loading-overlay` div from JSX (we're using inline loader in `index.html` now)
- **Reason**: The overlay was blocking interactions with z-index 2147483000

#### Header Overflow Menu
- **Added**: Logic to detect when header theme tools don't fit horizontally
- **Added**: Hamburger menu button that appears when space is constrained
- **Added**: Popover containing theme tools when overflow is active
- **Implementation**: Uses `ResizeObserver` to watch header toolbar and actions
- **Features**: Debouncing and hysteresis to prevent flickering
- **Initialization**: State initialized based on `window.innerWidth < 640`

#### Status Bar Badge Collapse
- **Changed**: Icon button now uses `Info` icon instead of `HelpCircle` icon

#### Loader Removal Logic
- **Simplified**: Logic to hide initial loader from `index.html` on component mount

### 2. `src/index.css`

#### Status Bar Badge Spacing
- **Changed**: `.status-bar-left` gap from `spacing.3` to `spacing.2` (to match icon button spacing)
- **Changed**: `.status-bar-badges-measure` gap from `spacing.3` to `spacing.2`

#### Layout Frames
- **Added**: `.app-frame`, `.app-frame--header`, `.app-frame--main`, `.app-frame--footer` classes
- **Purpose**: Consistent max-width alignment across header, main content, and footer
- **Behavior**: Frames lock to edge of main card and stay aligned

#### Header Overflow Menu Styling
- **Added**: `.header-actions--overflow`, `.header-overflow-trigger`, `.header-overflow-popover`, `.header-overflow-content`
- **Features**: 
  - Popover positioned above and to the right of trigger
  - Tools aligned in a row within popover
  - Icon buttons use proper sizing (36px)
  - Theme selector has minimum width (140px)

#### Canvas Card Shadow Clipping Fix
- **Changed**: `.app-main` to `overflow: visible` to prevent shadow clipping
- **Adjusted**: Canvas wrapper and sketch container styles

#### Responsive Layout Adjustments
- **Added**: `.app-layout--small-canvas` class for stacking canvas above controls on small viewports
- **Trigger**: When viewport width is below 892px (initially 480px, then 400px, then 480px, then 892px)
- **Features**: 
  - Flex direction column
  - Consistent `spacing.5` vertical gap
  - Cards can scale down to 320px minimum width

#### Spacing Refinements
- **Canvas card**: Restored `spacing.5` internal padding at top and bottom
- **Footer**: 64px margin-top (initially 128px, then reduced)
- **Status bar to canvas**: `spacing.5` gap
- **Header to cards**: Adjusted to `spacing.5` gap

#### Breakpoint Changes
- **900px**: Header and footer use `grid-template-columns: auto 1fr`, progressive padding reduction
- **640px**: Header actions stay horizontal when overflow menu is active
- **Various**: Removed vertical stacking of theme tools, they roll into overflow menu instead

### 3. `index.html`

#### Loading Screen Styling
- **Changed**: Gap between logo and text from `24px` to `40px`
- **Changed**: Loading text style:
  - Font size: `0.58rem` (was `10px`)
  - Text transform: `uppercase` (was `lowercase`)
  - Letter spacing: `0.24em` (was `0.05em`)
- **Purpose**: Match label style used throughout the app

### 4. `src/generator.ts`

#### Canvas Sizing
- **Changed**: Minimum canvas size logic to support smaller cards (down to 320px)
- **Updated**: `minCanvasSize` calculation to account for card padding and border
- **Minimum**: 276px canvas (derived from 320px card - 40px padding - 4px border)

#### windowResized Handler Fix (KEEP THIS)
- **Changed**: `const resizeCanvas = () => {` to `const resizeCanvas = (_event?: UIEvent) => {`
- **Reason**: p5.js expects `windowResized` to receive a UIEvent parameter, fixing Zod validation errors
- **Status**: ✅ KEEP - This fix is correct

## Key Behaviors to Preserve

1. **Header Overflow Menu**:
   - Appears when viewport is below 640px wide (or when tools don't fit)
   - Uses debouncing/hysteresis to prevent flickering
   - Tools roll back out when space becomes available
   - Popover aligns tools in a row

2. **Responsive Stacking**:
   - Canvas stacks above controls when viewport is below 892px
   - Consistent `spacing.5` gap between stacked cards
   - Cards can scale down to 320px minimum

3. **Layout Alignment**:
   - Header, main content, and footer align to main card edges
   - Theme tools and footer text lock to card edges and don't expand beyond card width

4. **Status Bar**:
   - Badges order: Sprite, Palette, Blend, Motion
   - Badge spacing matches icon button spacing (`spacing.2`)
   - Badge collapse uses Info icon

5. **Shadow Clipping**:
   - Main card drop shadow should not be cut off
   - Parent containers use `overflow: visible`

## Files Modified

- `src/App.tsx`
- `src/index.css`
- `index.html`
- `src/generator.ts` (canvas sizing only)

## Files NOT Modified (Core Functionality)

- `src/generator.ts` (except canvas sizing - no changes to sprite computation, state management, or draw loop)
- Canvas rendering logic
- Controller methods (except canvas sizing)
- State management

## Critical Notes

⚠️ **IMPORTANT**: When reapplying these changes:
1. Do NOT modify the `p.draw` function or any canvas rendering logic
2. Do NOT modify controller methods except canvas sizing
3. Do NOT add `redraw()` calls to controller methods
4. Do NOT change `applyState` from `state = { ...state, ...partial }` to `Object.assign(state, partial)` - this breaks controls
5. The draw loop runs continuously and reads from `state` and `prepared` each frame
6. Only modify CSS, layout structure, and UI elements

## Changes Made Later That BROKE Functionality

### ❌ BROKEN: Object.assign in applyState (REVERT THIS)
- **Changed**: `applyState` from `state = { ...state, ...partial }` to `Object.assign(state, partial)`
- **Changed**: `controller.applyState` from `state = { ...newState }` to `Object.assign(state, newState)`
- **Changed**: `reset` from `state = { ...DEFAULT_STATE, ... }` to `Object.assign(state, { ...DEFAULT_STATE, ... })`
- **Added**: Debug logging to `setLayerOpacity` and `p.draw`
- **Fixed**: `windowResized` handler to accept optional `UIEvent` parameter (this is OK, keep this)
- **REMOVED**: `p.redraw()` calls from `resizeCanvas` and `handleFullscreenChange` (this is OK, keep removed)
- **Result**: Controls update UI but canvas doesn't update - controls are broken
- **Action**: REVERT all Object.assign changes, restore original object replacement pattern

### ✅ KEEP: windowResized Fix
- **Fixed**: `windowResized` handler signature to accept optional `UIEvent` parameter
- **Changed**: `const resizeCanvas = () => {` to `const resizeCanvas = (_event?: UIEvent) => {`
- **Reason**: p5.js expects `windowResized` to receive a UIEvent, causing Zod validation errors
- **Status**: This fix is correct and should be kept

### ✅ KEEP: Removed redraw() calls
- **Removed**: `p.redraw()` calls from `resizeCanvas` and `handleFullscreenChange`
- **Reason**: The draw loop runs continuously, so manual redraw is unnecessary
- **Status**: This is correct and should be kept

