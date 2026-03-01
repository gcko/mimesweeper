# Mobile-Responsive UI Refresh Design

**Date:** 2026-03-01
**Branch:** feature/design-refactor
**Status:** Approved

## Problem

The Mimesweeper UI is unusable on mobile devices:

- `.container` has `min-width: 1000px` forcing horizontal scroll on all mobile devices
- Modal `.content` is fixed at `30rem` (480px), Scoreboard at `35rem` (560px) — both overflow on phones
- Game squares are 25x25px, well below the 44px minimum touch target
- Zero `@media` queries exist in the codebase
- Header text and buttons wrap unpredictably on narrow screens
- No mobile flagging mechanism (right-click unavailable on touch devices)

## Design Decisions

- **Approach:** CSS-First Responsive (media queries, `clamp()`, `min()`/`max()`)
- **Board sizing:** Hybrid fit + zoom threshold — auto-shrink squares to fit viewport, clamp to minimum 28px, enable scroll/pan when board exceeds viewport
- **Visual direction:** Polish current look — keep dark header, retro font, light grid, mime imagery; enhance button styling, spacing, stat display, and modals
- **Mobile flagging:** Long-press (~500ms) to toggle flag

## Breakpoints

| Breakpoint | Target |
|-----------|--------|
| `< 768px` | Mobile (phones, small tablets) |
| `< 1024px` | Tablet |
| `>= 1024px` | Desktop (current behavior preserved) |

## Section 1: Responsive Layout Foundation

Remove the hard `min-width: 1000px` from `.container` and the inline `minWidth` style. Replace with:

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
  overflow-x: hidden;
}
```

Add `overflow-x: hidden` to body/html. Make background image cover properly.

## Section 2: Dynamic Square Sizing

Replace fixed `SQUARE_SIDE = 25` with a computed value in `App.tsx`:

```text
availableWidth = min(window.innerWidth - padding, maxDesktopWidth)
computedSize = floor(availableWidth / gridSize)
squareSide = clamp(computedSize, MIN_SQUARE_SIZE, MAX_SQUARE_SIZE)
```

- `MIN_SQUARE_SIZE = 28` — floor for touch-friendliness
- `MAX_SQUARE_SIZE = 40` — cap so desktop boards aren't absurdly large
- Default desktop behavior: ~25px preserved when viewport is wide enough

When `squareSide * gridSize > availableWidth`, the board gets a scrollable container with `-webkit-overflow-scrolling: touch`.

A `useWindowSize` hook or `ResizeObserver` recalculates on resize. The `x`/`y` positions in `GameSquare` are recomputed on `START_GAME`/`INIT_BOARD`, so changing `squareSide` before dispatching is sufficient.

## Section 3: Mobile Modals (Full-Screen < 1024px)

On screens below 1024px, modals go full-screen:

```css
@media (max-width: 1023px) {
  .overlay .content {
    width: 100%;
    height: 100%;
    max-width: none;
    border-radius: 0;
    padding: 1.5rem;
    overflow-y: auto;
    box-sizing: border-box;
  }
}
```

Desktop (>= 1024px) retains the current centered card style.

Scoreboard tabs stack 2x2 grid on mobile:

```css
@media (max-width: 767px) {
  .scoreboard-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}
```

## Section 4: Header & Controls Responsive Layout

Restructure to vertical stack on mobile:

```text
[Mobile]                    [Desktop]
Mimesweeper                 Mimesweeper  [How to play] [Scoreboard]
[How to play] [Scoreboard]  Play time: 0s | Score: 1000 | Flags: 10
Play time: 0s               [mime strip]
Score: 1000
Flags: 10
[mime strip]
```

Font scaling with `clamp()`:

```css
h4 { font-size: clamp(0.7rem, 2.5vw, 1.2rem); }
button { font-size: clamp(0.6rem, 2vw, 1rem); }
.stats { font-size: clamp(0.5rem, 1.8vw, 0.85rem); }
```

## Section 5: Mobile Touch — Long-Press to Flag

Add long-press handler to `Square.tsx`:

- `onTouchStart` → start 500ms timer, record touch position
- `onTouchEnd` / `onTouchMove` (> 10px) → cancel timer
- Timer fires → dispatch flag toggle (same as right-click)
- Regular `onTap` (< 500ms, no movement) → open square
- `onDblTap` → open adjacent unflagged (existing)

Prevent default context menu on long-press.

Update "How to Play" to detect touch and show appropriate instructions:
- "Tap to open a space"
- "Long-press to flag a space"
- "Double-tap to open all adjacent un-flagged spaces"

## Section 6: Button & DifficultyButtons Styling

Arcade-button polish:
- `border-radius: 4px`
- Subtle inset shadow for 3D pressed feel
- `min-height: 44px` on mobile for touch targets
- DifficultyButtons wrap to 2-column grid on mobile

```css
@media (max-width: 767px) {
  .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}
```

## Section 7: Game Board Scroll Container

When board exceeds viewport width:

```css
.board-scroll {
  width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
}
```

The Konva `<Stage>` sits inside this container for pan/scroll on larger boards.
