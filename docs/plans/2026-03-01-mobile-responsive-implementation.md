# Mobile-Responsive UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Mimesweeper fully playable on mobile devices with responsive layout, dynamic square sizing, touch-friendly interactions, and polished arcade styling.

**Architecture:** CSS-first responsive approach using `@media` queries, `clamp()`, and `min()`. JS changes limited to dynamic square sizing (computed from viewport), a `useWindowSize` hook, long-press touch handler, and minimal markup restructuring. No new dependencies.

**Tech Stack:** React 19, TypeScript 5.8, Konva 10, Vitest 4, Sass/CSS with custom properties, pnpm

---

### Task 1: Create `useWindowSize` Hook

**Files:**
- Create: `src/hooks/useWindowSize.ts`
- Create: `src/hooks/useWindowSize.spec.ts`

**Step 1: Write the failing test**

Create `src/hooks/useWindowSize.spec.ts`:

```typescript
import { act, renderHook } from "@testing-library/react";
import { useWindowSize } from "./useWindowSize";

describe("useWindowSize", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      value: originalInnerHeight,
    });
  });

  test("returns current window dimensions", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      value: 768,
    });

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  test("updates on window resize", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(1024);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 375,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.width).toBe(375);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/hooks/useWindowSize.spec.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/hooks/useWindowSize.ts`:

```typescript
import { useEffect, useState } from "react";

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/hooks/useWindowSize.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useWindowSize.ts src/hooks/useWindowSize.spec.ts
git commit -m "Adhoc: Added: useWindowSize hook for responsive layout"
```

---

### Task 2: Create `computeSquareSide` Utility

**Files:**
- Create: `src/utils/responsive.ts`
- Create: `src/utils/responsive.spec.ts`

**Step 1: Write the failing test**

Create `src/utils/responsive.spec.ts`:

```typescript
import { computeSquareSide } from "./responsive";

describe("computeSquareSide", () => {
  test("fits squares to available width when possible", () => {
    // 390px viewport, 16px padding each side, gridSize 10
    // available = 390 - 32 = 358, 358 / 10 = 35.8 → floor = 35
    const result = computeSquareSide(390, 10);
    expect(result).toBe(35);
  });

  test("clamps to MIN_SQUARE_SIZE when computed size is too small", () => {
    // 390px viewport, gridSize 30
    // available = 358, 358 / 30 = 11.9 → floor = 11 → clamp to 28
    const result = computeSquareSide(390, 30);
    expect(result).toBe(28);
  });

  test("clamps to MAX_SQUARE_SIZE when viewport is very wide", () => {
    // 2560px viewport, gridSize 10
    // available = 2528, 2528 / 10 = 252.8 → floor = 252 → clamp to 40
    const result = computeSquareSide(2560, 10);
    expect(result).toBe(40);
  });

  test("returns MIN_SQUARE_SIZE for zero viewport", () => {
    const result = computeSquareSide(0, 10);
    expect(result).toBe(28);
  });

  test("handles typical mobile sizes", () => {
    // iPhone SE: 375px, Small grid (10)
    // available = 343, 343 / 10 = 34.3 → 34
    expect(computeSquareSide(375, 10)).toBe(34);

    // iPhone SE: 375px, Medium grid (20)
    // available = 343, 343 / 20 = 17.15 → 17 → clamp to 28
    expect(computeSquareSide(375, 20)).toBe(28);
  });

  test("handles typical desktop sizes", () => {
    // 1440px desktop, Small grid (10)
    // available = 1200 (max cap), 1200 / 10 = 120 → clamp to 40
    expect(computeSquareSide(1440, 10)).toBe(40);

    // 1440px desktop, XL grid (40)
    // available = 1200, 1200 / 40 = 30
    expect(computeSquareSide(1440, 40)).toBe(30);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/utils/responsive.spec.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/utils/responsive.ts`:

```typescript
export const MIN_SQUARE_SIZE = 28;
export const MAX_SQUARE_SIZE = 40;
const CONTAINER_PADDING = 32; // 16px each side
const MAX_BOARD_WIDTH = 1200;

export function computeSquareSide(
  viewportWidth: number,
  gridSize: number,
): number {
  const available = Math.min(
    Math.max(0, viewportWidth - CONTAINER_PADDING),
    MAX_BOARD_WIDTH,
  );
  const computed = Math.floor(available / gridSize);
  return Math.max(MIN_SQUARE_SIZE, Math.min(MAX_SQUARE_SIZE, computed));
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/utils/responsive.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/responsive.ts src/utils/responsive.spec.ts
git commit -m "Adhoc: Added: computeSquareSide utility for dynamic board sizing"
```

---

### Task 3: Wire Dynamic Square Sizing into App

**Files:**
- Modify: `src/App.tsx` (lines 11, 15, 74-76, 123-127, 137, 243-246)
- Modify: `src/gameReducer.ts` (lines 5, 86-94)
- Modify: `src/App.spec.tsx` (add/update tests)

**Context:** Currently `SQUARE_SIDE` is imported from `gameLogic.ts` as a fixed `25`. The reducer uses it in `INIT_BOARD` to call `newGame(state.boardSize, SQUARE_SIDE)`. We need to:
1. Make `squareSide` part of `GameState` so the reducer can use it
2. Pass `squareSide` in the `START_GAME` and `INIT_BOARD` actions
3. Compute `squareSide` in `App.tsx` using `useWindowSize` + `computeSquareSide`

**Step 1: Write failing tests for reducer changes**

Add to `src/gameReducer.spec.ts` — find the existing `INIT_BOARD` test section and add:

```typescript
test("INIT_BOARD uses squareSide from state", () => {
  const startState = gameReducer(initialState, {
    type: "START_GAME",
    boardSize: GridSize.S,
    numMimes: MimeSize.S,
    squareSide: 35,
  });
  const result = gameReducer(startState, { type: "INIT_BOARD" });
  const firstSquare = result.game?.values().next().value;
  // With squareSide 35 and position (1,0), x should be 35
  // Find the square at 1|0
  const square = result.game?.get("1|0" as Coordinate);
  expect(square?.x).toBe(35); // 1 * 35
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/gameReducer.spec.ts`
Expected: FAIL — `squareSide` not in action type

**Step 3: Update gameReducer**

In `src/gameReducer.ts`:

Add `squareSide` to `GameState` (after line 23):

```typescript
export interface GameState {
  game: Map<Coordinate, GameSquare> | null;
  boardSize: GridSize;
  status: GameStatus;
  numMimes: MimeSize;
  numFlags: number;
  numOpenSpaces: number;
  playTime: number;
  score: number;
  showRules: boolean;
  squareSide: number;
}
```

Add `squareSide` to `START_GAME` action type (line 27):

```typescript
| { type: "START_GAME"; boardSize: GridSize; numMimes: MimeSize; squareSide: number }
```

Add `squareSide` to `initialState` (after line 44):

```typescript
squareSide: SQUARE_SIDE,
```

Update `START_GAME` case (around line 74) to include:

```typescript
squareSide: action.squareSide,
```

Update `INIT_BOARD` case (around line 90) to use `state.squareSide`:

```typescript
case "INIT_BOARD":
  if (state.status !== "waitingStart") return state;
  return {
    ...state,
    game: newGame(state.boardSize, state.squareSide),
  };
```

**Step 4: Run gameReducer tests to verify they pass**

Run: `pnpm test -- --run src/gameReducer.spec.ts`
Expected: Existing tests may fail if they dispatch `START_GAME` without `squareSide`. Fix by adding `squareSide: 25` to all existing `START_GAME` dispatches in the test file.

**Step 5: Update App.tsx to use dynamic sizing**

In `src/App.tsx`:

Add imports:

```typescript
import { useWindowSize } from "./hooks/useWindowSize.ts";
import { computeSquareSide } from "./utils/responsive.ts";
```

Inside `App()`, after the `useReducer` call, add:

```typescript
const { width: viewportWidth } = useWindowSize();
const squareSide = useMemo(
  () => computeSquareSide(viewportWidth, boardSize),
  [viewportWidth, boardSize],
);
```

Update `handleRestart` to pass `squareSide`:

```typescript
const handleRestart = useCallback(
  (mimes: MimeSize, size: GridSize) => {
    const newSquareSide = computeSquareSide(viewportWidth, size);
    dispatch({ type: "START_GAME", boardSize: size, numMimes: mimes, squareSide: newSquareSide });
    setPlayerName("");
    setScoreSubmitted(false);
  },
  [viewportWidth],
);
```

Remove `import { SQUARE_SIDE } from "./utils/gameLogic.ts"` (line 11).

Update the container `style` (line 137):

```typescript
style={{ maxWidth: `${squareSide * boardSize + 32}px` }}
```

Update `<Stage>` width and height (around line 244):

```typescript
<Stage
  className="stage"
  width={squareSide * boardSize}
  height={squareSide * boardSize}
>
```

Update `<Square>` size prop (around line 260):

```typescript
size={squareSide}
```

**Step 6: Update App.spec.tsx**

The test mock for `Square` doesn't use `size`, so most tests should still pass. Update any tests that dispatch `START_GAME` to include `squareSide: 25`.

Mock `useWindowSize` at the top of `App.spec.tsx`:

```typescript
vi.mock("./hooks/useWindowSize.ts", () => ({
  useWindowSize: () => ({ width: 1440, height: 900 }),
}));
```

**Step 7: Run full test suite**

Run: `pnpm test`
Expected: All 230+ tests pass

**Step 8: Commit**

```bash
git add src/App.tsx src/gameReducer.ts src/App.spec.tsx src/gameReducer.spec.ts
git commit -m "Adhoc: Modified: Wire dynamic square sizing into App and gameReducer"
```

---

### Task 4: Responsive CSS Foundation

**Files:**
- Modify: `src/App.css` (major rewrite)
- Modify: `src/index.css` (body background)

**Step 1: Update `src/index.css`**

Replace the `body` rule to make the background cover properly:

```css
body {
  margin: 0;
  font-family:
    "Press Start 2P", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: url("images/bg.jpg") white no-repeat;
  background-size: cover;
  background-position: center;
  overflow-x: hidden;
}
```

**Step 2: Rewrite `src/App.css`**

Replace `.container` (lines 7-11):

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
  box-sizing: border-box;
}
```

Keep `.container > h4` color rule unchanged.

Add responsive font scaling to the `h4`:

```css
.container > h4 {
  color: var(--white);
  font-size: clamp(0.6rem, 2.5vw, 1.2rem);
  word-break: break-word;
}
```

Update `.container button` — add touch-friendly sizing:

```css
.container button {
  background-color: var(--button-bg-color);
  transition: background-color 200ms;
  border: 2px solid var(--black);
  border-radius: 4px;
  color: #f5f5f5ff;
  padding: 0.75rem 1.25rem;
  text-align: center;
  text-decoration: none;
  font-size: clamp(0.55rem, 1.8vw, 1rem);
  display: inline-block;
  font-family: "Press Start 2P", cursive;
  min-height: 44px;
  cursor: pointer;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.3);

  /* existing hover/focus/active/spacing rules unchanged */
}
```

Update `.container .overlay .content` — remove fixed width, add responsive:

```css
.container .overlay .content {
  width: 30rem;
  max-width: 90vw;
  max-height: 90vh;
  height: fit-content;
  background-color: var(--white);
  padding: 2rem;
  box-shadow: 0 0 1rem 0.2rem var(--black);
  overflow-y: auto;
  box-sizing: border-box;
}

.container .overlay .content.scoreboard {
  width: 35rem;
  max-width: 90vw;
}
```

Add board scroll container:

```css
.board-scroll {
  width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 auto;
}
```

Add the media query block at the end of `App.css`:

```css
/* Mobile: < 768px */
@media (max-width: 767px) {
  .container {
    padding: 0 0.5rem;
  }

  .container > h4 {
    font-size: clamp(0.5rem, 3vw, 0.8rem);
    margin: 0.5rem 0;
  }

  .container button {
    padding: 0.5rem 0.75rem;
    font-size: clamp(0.45rem, 2.5vw, 0.7rem);
  }

  .container .mimes {
    height: 2.5rem;
    background-size: 2.5rem;
  }

  .container .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    padding: 0 0.5rem;
  }

  .container .scoreboard-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .container .scoreboard-list li {
    font-size: 0.6rem;
  }

  .container .overlay .content .high-score-entry input {
    font-size: 0.6rem;
    max-width: 8rem;
  }
}

/* Full-screen modals: < 1024px */
@media (max-width: 1023px) {
  .container .overlay .content,
  .container .overlay .content.scoreboard {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
    padding: 1.5rem;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
```

**Step 3: Run lint to verify CSS is valid**

Run: `pnpm run lint` and check for Stylelint issues if configured.

**Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests pass (CSS changes don't affect unit tests)

**Step 5: Commit**

```bash
git add src/App.css src/index.css
git commit -m "Adhoc: Modified: Responsive CSS foundation with media queries and fluid typography"
```

---

### Task 5: Restructure Header Layout in App.tsx

**Files:**
- Modify: `src/App.tsx` (lines 214-242)
- Modify: `src/App.css` (add header-specific responsive rules)
- Modify: `src/App.spec.tsx` (update selectors if needed)

**Step 1: Update the header markup in App.tsx**

Replace the current header section (lines 214-242 approximately) with semantic structure:

```tsx
<header className="game-header">
  <h1 className="game-title">Mimesweeper</h1>
  <nav className="game-nav">
    <button
      type="button"
      onClick={() => {
        dispatch({ type: "TOGGLE_RULES" });
      }}
    >
      How to play
    </button>
    <button
      type="button"
      onClick={() => {
        setShowScoreboard(true);
      }}
    >
      Scoreboard
    </button>
  </nav>
  <div className="game-stats">
    <span>Play time: {playTime}s</span>
    <span>Score: {score}</span>
    <span>Flags Remaining: {numFlags}</span>
  </div>
</header>
<div
  className="mimes"
  style={{ width: `${squareSide * boardSize}px` }}
/>
```

**Step 2: Add header CSS to App.css**

```css
.game-header {
  padding: 0.5rem 0;
}

.game-title {
  color: var(--white);
  font-size: clamp(0.8rem, 3vw, 1.5rem);
  margin: 0.5rem 0;
}

.game-nav {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.game-stats {
  color: var(--white);
  font-size: clamp(0.45rem, 1.8vw, 0.8rem);
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

@media (max-width: 767px) {
  .game-stats {
    flex-direction: column;
    gap: 0.25rem;
  }

  .game-nav {
    gap: 0.25rem;
  }
}
```

**Step 3: Update App.spec.tsx**

Tests currently query for "Play time: 0s" as part of the text. The stats are now in `<span>` elements instead of inside `<small>` within `<h4>`. Update test assertions if any use specific selectors. Most tests use `screen.getByText()` with regex, so they should work without changes. Verify by running.

**Step 4: Run tests**

Run: `pnpm test`
Expected: All pass. If any fail due to text matching changes (e.g., "Play time: 0s | Score: 1000 | Flags Remaining: 10" was a single string, now split into separate spans), update the test assertions to match individual text fragments.

**Step 5: Commit**

```bash
git add src/App.tsx src/App.css src/App.spec.tsx
git commit -m "Adhoc: Refactored: Restructure header with semantic markup for responsive layout"
```

---

### Task 6: Add Board Scroll Container

**Files:**
- Modify: `src/App.tsx` (wrap Stage in scroll container)

**Step 1: Wrap the Stage**

In `src/App.tsx`, wrap the `<Stage>` in a scrollable div:

```tsx
<div className="board-scroll">
  <Stage
    className="stage"
    width={squareSide * boardSize}
    height={squareSide * boardSize}
  >
    <Layer>
      {gameEntries.map(([key, square]) => (
        <Square
          key={key}
          coOrd={key}
          size={squareSide}
          isGameOver={isGameOver}
          onSelect={handleSquareSelect}
          onRightClick={handleSquareSelect}
          onDoubleClick={handleSquareSelect}
          {...square}
        />
      ))}
    </Layer>
  </Stage>
</div>
```

The `.board-scroll` CSS was already added in Task 4.

**Step 2: Run tests**

Run: `pnpm test`
Expected: All pass (Stage is mocked to a div, extra wrapper div doesn't affect test queries)

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "Adhoc: Added: Board scroll container for large grids on mobile"
```

---

### Task 7: Add Long-Press to Flag on Square

**Files:**
- Modify: `src/Square.tsx` (add touch handlers)
- Modify: `src/Square.spec.tsx` (add long-press tests)

**Step 1: Write the failing tests**

Add to `src/Square.spec.tsx` in the "event handlers" describe block:

```typescript
describe("long-press to flag", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("long-press triggers right-click handler", () => {
    const onRightClick = vi.fn();
    renderSquare({ onRightClick });

    const group = screen.getByTestId("konva-group");
    fireEvent.touchStart(group, {
      touches: [{ clientX: 10, clientY: 10 }],
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onRightClick).toHaveBeenCalledWith("0|0", "contextmenu");
  });

  test("short tap does not trigger flag", () => {
    const onRightClick = vi.fn();
    renderSquare({ onRightClick });

    const group = screen.getByTestId("konva-group");
    fireEvent.touchStart(group, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchEnd(group);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onRightClick).not.toHaveBeenCalled();
  });

  test("moving finger cancels long-press", () => {
    const onRightClick = vi.fn();
    renderSquare({ onRightClick });

    const group = screen.getByTestId("konva-group");
    fireEvent.touchStart(group, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(group, {
      touches: [{ clientX: 30, clientY: 30 }],
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onRightClick).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/Square.spec.tsx`
Expected: FAIL — long-press does not trigger right-click

**Step 3: Implement long-press in Square.tsx**

Add `useRef` to imports. Inside the `Square` function, add:

```typescript
const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const touchStartPos = useRef<{ x: number; y: number } | null>(null);
const longPressTriggered = useRef(false);

const LONG_PRESS_DURATION = 500;
const MOVE_THRESHOLD = 10;

const handleTouchStart = useCallback(
  (e: KonvaEventObject<TouchEvent>) => {
    const touch = e.evt.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTriggered.current = false;

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onRightClick(coOrd, "contextmenu");
    }, LONG_PRESS_DURATION);
  },
  [coOrd, onRightClick],
);

const handleTouchMove = useCallback(
  (e: KonvaEventObject<TouchEvent>) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    const touch = e.evt.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  },
  [],
);

const handleTouchEnd = useCallback(() => {
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }
}, []);
```

Update the existing `handleTap` to skip if long-press was triggered:

```typescript
const handleTap = useCallback(() => {
  if (longPressTriggered.current) return;
  onSelect(coOrd, "click");
}, [coOrd, onSelect]);
```

Add the new handlers to the `<Group>` element:

```tsx
<Group
  onClick={handleClick}
  onDblClick={handleDblClick}
  onContextMenu={handleContextMenu}
  onTap={handleTap}
  onDblTap={handleDblTap}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
```

**Step 4: Update the Group mock in Square.spec.tsx**

The `konva-group` mock needs to forward `onTouchStart`, `onTouchMove`, `onTouchEnd`. Update the mock to forward these events:

```typescript
Group: ({ children, onTouchStart, onTouchMove, onTouchEnd, ...props }: Record<string, unknown>) => (
  <div
    data-testid="konva-group"
    onTouchStart={(e) => onTouchStart?.({ evt: e.nativeEvent })}
    onTouchMove={(e) => onTouchMove?.({ evt: e.nativeEvent })}
    onTouchEnd={(e) => onTouchEnd?.({ evt: e.nativeEvent })}
    /* ... existing event forwarding */
  >
    {children}
  </div>
),
```

**Step 5: Run tests**

Run: `pnpm test -- --run src/Square.spec.tsx`
Expected: PASS

**Step 6: Run full test suite**

Run: `pnpm test`
Expected: All pass

**Step 7: Commit**

```bash
git add src/Square.tsx src/Square.spec.tsx
git commit -m "Adhoc: Added: Long-press to flag on mobile touch devices"
```

---

### Task 8: Update "How to Play" Instructions for Touch

**Files:**
- Modify: `src/App.tsx` (rules overlay section)
- Modify: `src/App.spec.tsx` (update/add rules tests)

**Step 1: Write the failing test**

Add to `src/App.spec.tsx` in the "rules overlay" describe block:

```typescript
test("shows touch instructions text", async () => {
  render(<App />);
  const button = screen.getByText("How to play");
  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.getByText(/Tap to open a space/i)).toBeInTheDocument();
  expect(screen.getByText(/Long-press to flag/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/App.spec.tsx`
Expected: FAIL — text not found

**Step 3: Update the rules overlay in App.tsx**

Replace the `<ol>` in the rules overlay with instructions that cover both desktop and mobile:

```tsx
{showRules ? (
  <div className="overlay">
    <div className="content">
      <h4>How to Play</h4>
      <ol>
        <li>Click or tap to open a space</li>
        <li>Right-click or long-press to flag a space</li>
        <li>Double-click or double-tap to open all adjacent un-flagged spaces</li>
      </ol>
      <div className="buttons">
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "TOGGLE_RULES" });
          }}
        >
          Let's play!
        </button>
      </div>
    </div>
  </div>
) : null}
```

**Step 4: Update existing test assertions**

The existing test that checks for "Left click to open a space" needs to be updated to "Click or tap to open a space". Find and update.

**Step 5: Run tests**

Run: `pnpm test`
Expected: All pass

**Step 6: Commit**

```bash
git add src/App.tsx src/App.spec.tsx
git commit -m "Adhoc: Modified: How to Play instructions include touch controls"
```

---

### Task 9: Prevent Context Menu on Long-Press

**Files:**
- Modify: `src/App.tsx` (add event listener to prevent mobile context menu on canvas)

**Step 1: Add context menu prevention**

In `App.tsx`, add a `useEffect` that prevents the default context menu on the game board to avoid mobile browser interference with long-press:

```typescript
useEffect(() => {
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".board-scroll")) {
      e.preventDefault();
    }
  };
  document.addEventListener("contextmenu", handleContextMenu);
  return () => document.removeEventListener("contextmenu", handleContextMenu);
}, []);
```

**Step 2: Run tests**

Run: `pnpm test`
Expected: All pass

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "Adhoc: Added: Prevent context menu on board for mobile long-press"
```

---

### Task 10: Final Integration Verification

**Step 1: Run full test suite with coverage**

Run: `pnpm test -- --coverage`
Expected: All tests pass, coverage >= 80% on all metrics

**Step 2: Run linter**

Run: `pnpm run lint`
Expected: No errors

**Step 3: Run markdown lint**

Run: `pnpm run lint:markdown`
Expected: No errors

**Step 4: Run build**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 5: Manual verification checklist**

Start dev server: `pnpm start`

Test in Chrome DevTools device emulation:
- [ ] iPhone SE (375px): Small game fits, squares are touch-friendly
- [ ] iPhone 14 Pro Max (430px): Small game fits, Medium scrolls
- [ ] iPad (768px): All sizes work, modals full-screen
- [ ] Desktop (1440px): Current behavior preserved, modals centered cards
- [ ] Modals go full-screen below 1024px
- [ ] Scoreboard tabs wrap to 2x2 grid on mobile
- [ ] DifficultyButtons wrap to 2-column grid on mobile
- [ ] Long-press on a square opens flag (test on real device or touch emulation)
- [ ] Header stacks vertically on mobile
- [ ] Stats line is readable on mobile
- [ ] No horizontal scrollbar on any mobile size
- [ ] Board scrolls smoothly on larger grids

**Step 6: Commit any fixes from manual testing**

```bash
git add -A
git commit -m "Adhoc: BugFix: Address issues found during manual mobile testing"
```
