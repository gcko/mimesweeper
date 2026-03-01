# Codebase Modernization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize the Mimesweeper codebase by extracting composable/testable functions, replacing 8 `useState` hooks with `useReducer`, eliminating code duplication, fixing bugs, and adding performance optimizations.

**Architecture:** Bottom-up refactoring — fix bugs first, then extract pure utilities, build the game reducer, refactor React components to use it, and finally add memoization. Every step runs `pnpm test && pnpm run lint && pnpm run type:check` before committing.

**Tech Stack:** React 19, TypeScript 5.8+, Vitest 4, Konva 10, Biome

**Verification command (run after EVERY task):**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

---

### Task 1: Fix `adjacentMimes` type — missing `6`

**Files:**

- Modify: `src/types.d.ts:8`
- Modify: `src/Square.spec.tsx:129`

**Step 1: Write the failing test**

In `src/Square.spec.tsx`, update the adjacentMimes values test to include `6`:

```typescript
test("renders with all adjacentMimes values", () => {
  const values: GameSquare["adjacentMimes"][] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (const adj of values) {
    expect(() =>
      renderSquare({ opened: true, adjacentMimes: adj }),
    ).not.toThrow();
  }
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/Square.spec.tsx`
Expected: TypeScript error — `6` is not assignable to the union type.

**Step 3: Fix the type**

In `src/types.d.ts` line 8, change:

```typescript
adjacentMimes: 0 | 1 | 2 | 3 | 4 | 5 | 7 | 8;
```

to:

```typescript
adjacentMimes: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
```

**Step 4: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass.

**Step 5: Commit**

```bash
git add src/types.d.ts src/Square.spec.tsx
git commit -m "Adhoc: BugFix: Add missing 6 to adjacentMimes union type"
```

---

### Task 2: Move `use-image` to dependencies

**Files:**

- Modify: `package.json`

**Step 1: Move the dependency**

Run:

```bash
pnpm remove use-image && pnpm add use-image
```

**Step 2: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass. `use-image` now in `dependencies` instead of `devDependencies`.

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Adhoc: BugFix: Move use-image from devDependencies to dependencies"
```

---

### Task 3: Simplify `getCoOrd` parsing in coordinates.ts

**Files:**

- Modify: `src/utils/coordinates.ts:17-30`
- Test: `src/utils/coordinates.spec.ts` (existing tests cover this)

**Step 1: Run existing tests to confirm green baseline**

Run: `pnpm test -- src/utils/coordinates.spec.ts`
Expected: All 15 tests pass.

**Step 2: Refactor `getCoOrd` to use `split` once**

Replace the entire `getCoOrd` function in `src/utils/coordinates.ts` (lines 17-30):

```typescript
// Given a Coordinate, return the values as an array of [x, y]
export function getCoOrd(location: Coordinate): [number, number] {
  const [xStr, yStr] = location.split("|");
  const x = parseInt(xStr, 10);
  const y = parseInt(yStr, 10);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    throw new Error(
      `Unable to correctly parse x and y coordinates from given location string: "${location}"`,
    );
  }
  return [x, y];
}
```

**Step 3: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass — same behavior, cleaner code.

**Step 4: Commit**

```bash
git add src/utils/coordinates.ts
git commit -m "Adhoc: Refactored: Simplify getCoOrd to use split instead of repeated indexOf/parseInt"
```

---

### Task 4: Extract `getNeighborCoords` utility

The `Array.of(x-1, x, x+1).forEach(...)` pattern is duplicated in `updateAdjacent` (line 31-32) and `allAdjacentMimesAreFlagged` (line 75-76). Extract a shared utility.

**Files:**

- Create: `src/utils/neighbors.ts`
- Create: `src/utils/neighbors.spec.ts`
- Modify: `src/utils/gameLogic.ts:24-65, 68-90`

**Step 1: Write the failing test**

Create `src/utils/neighbors.spec.ts`:

```typescript
import { coOrdKey } from "./coordinates.ts";
import { getNeighborCoords } from "./neighbors.ts";

describe("getNeighborCoords", () => {
  test("returns 8 neighbors for a center position", () => {
    const neighbors = getNeighborCoords("2|2");
    expect(neighbors).toHaveLength(8);
    expect(neighbors).toContain(coOrdKey(1, 1));
    expect(neighbors).toContain(coOrdKey(1, 2));
    expect(neighbors).toContain(coOrdKey(1, 3));
    expect(neighbors).toContain(coOrdKey(2, 1));
    expect(neighbors).toContain(coOrdKey(2, 3));
    expect(neighbors).toContain(coOrdKey(3, 1));
    expect(neighbors).toContain(coOrdKey(3, 2));
    expect(neighbors).toContain(coOrdKey(3, 3));
  });

  test("does NOT include the center coordinate itself", () => {
    const neighbors = getNeighborCoords("2|2");
    expect(neighbors).not.toContain(coOrdKey(2, 2));
  });

  test("returns coordinates for corner position (0,0)", () => {
    const neighbors = getNeighborCoords("0|0");
    expect(neighbors).toHaveLength(8);
    // Includes negative coordinates — filtering is the caller's job
    expect(neighbors).toContain(coOrdKey(-1, -1));
    expect(neighbors).toContain(coOrdKey(1, 1));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/neighbors.spec.ts`
Expected: FAIL — module not found.

**Step 3: Implement `getNeighborCoords`**

Create `src/utils/neighbors.ts`:

```typescript
import type { Coordinate } from "types.d";
import { coOrdKey, getCoOrd } from "./coordinates.ts";

const OFFSETS = [-1, 0, 1] as const;

/** Returns all 8 neighbor coordinates around a given location. */
export function getNeighborCoords(location: Coordinate): Coordinate[] {
  const [x, y] = getCoOrd(location);
  const neighbors: Coordinate[] = [];
  for (const dx of OFFSETS) {
    for (const dy of OFFSETS) {
      if (dx !== 0 || dy !== 0) {
        neighbors.push(coOrdKey(x + dx, y + dy));
      }
    }
  }
  return neighbors;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/neighbors.spec.ts`
Expected: PASS.

**Step 5: Refactor `updateAdjacent` to use `getNeighborCoords`**

In `src/utils/gameLogic.ts`, add import and replace the nested forEach loops:

```typescript
import { getNeighborCoords } from "./neighbors.ts";
```

Replace `updateAdjacent` function body (lines 28-64):

```typescript
export function updateAdjacent({
  location,
  upcomingGame,
  type = AdjacentUpdate.mimes,
}: AdjacentProps): number {
  let count = 0;
  for (const neighborCoord of getNeighborCoords(location)) {
    const square = upcomingGame.get(neighborCoord);
    if (!square) {
      continue;
    }
    if (type === AdjacentUpdate.mimes) {
      if (!square.mime) {
        (square as { adjacentMimes: number }).adjacentMimes += 1;
        upcomingGame.set(neighborCoord, square);
      }
    }
    if (!square.flagged && !square.opened) {
      if (type === AdjacentUpdate.open && !square.mime) {
        square.opened = true;
        count += 1;
        if (square.adjacentMimes === 0) {
          count += updateAdjacent({
            location: neighborCoord,
            upcomingGame,
            type: AdjacentUpdate.open,
          });
        }
      } else if (type === AdjacentUpdate.forceOpen) {
        square.opened = true;
        count += 1;
      }
    }
  }
  return count;
}
```

Replace `allAdjacentMimesAreFlagged` function body (lines 71-89):

```typescript
export function allAdjacentMimesAreFlagged({
  location,
  upcomingGame,
}: FlaggedAdjacentProps): boolean {
  let flaggedAdjacent = 0;
  let adjacentMimes = 0;
  for (const neighborCoord of getNeighborCoords(location)) {
    const square = upcomingGame.get(neighborCoord);
    if (square?.mime) {
      adjacentMimes += 1;
      if (square.flagged) {
        flaggedAdjacent += 1;
      }
    }
  }
  return flaggedAdjacent === adjacentMimes;
}
```

**Step 6: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All 133+ tests pass.

**Step 7: Commit**

```bash
git add src/utils/neighbors.ts src/utils/neighbors.spec.ts src/utils/gameLogic.ts
git commit -m "Adhoc: Refactored: Extract getNeighborCoords utility to DRY up neighbor iteration"
```

---

### Task 5: Improve `populateMimes` — use Set for deduplication

**Files:**

- Modify: `src/utils/gameLogic.ts:92-128`
- Test: `src/utils/gameLogic.spec.ts` (existing tests cover this)

**Step 1: Run existing tests for baseline**

Run: `pnpm test -- src/utils/gameLogic.spec.ts`
Expected: All pass.

**Step 2: Refactor `populateMimes` to use a Set**

Replace lines 92-128 of `src/utils/gameLogic.ts`:

```typescript
export function populateMimes(
  entries: [Coordinate, GameSquare][],
  numMimes: number,
  boardSize: number,
  currentPieceCoOrds: Coordinate = "-1|-1",
): Map<Coordinate, GameSquare> {
  const mimeLocations = new Set<Coordinate>();
  let failSafe = numMimes * INITIAL_FAILSAFE;
  while (mimeLocations.size < numMimes && failSafe > 0) {
    const candidate = generateRandomCoOrd(boardSize);
    if (candidate !== currentPieceCoOrds) {
      mimeLocations.add(candidate);
    }
    failSafe -= 1;
  }
  const upcomingGame = new Map<Coordinate, GameSquare>(entries);
  for (const mimeLocation of mimeLocations) {
    const square = upcomingGame.get(mimeLocation);
    if (square) {
      square.mime = true;
      upcomingGame.set(mimeLocation, square);
    }
  }
  for (const mimeLocation of mimeLocations) {
    const square = upcomingGame.get(mimeLocation);
    if (square) {
      updateAdjacent({ location: mimeLocation, upcomingGame });
    }
  }
  return upcomingGame;
}
```

**Step 3: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass. No duplicate mines possible now.

**Step 4: Commit**

```bash
git add src/utils/gameLogic.ts
git commit -m "Adhoc: Refactored: Use Set in populateMimes to guarantee unique mine placement"
```

---

### Task 6: Clean up Square.tsx — hoist gradient, replace useState+useEffect with useMemo

**Files:**

- Modify: `src/Square.tsx`
- Test: `src/Square.spec.tsx` (existing tests cover rendering)

**Step 1: Run existing tests for baseline**

Run: `pnpm test -- src/Square.spec.tsx`
Expected: All 17 tests pass.

**Step 2: Hoist `gradientArray` to module scope and replace `useState`+`useEffect` with `useMemo`**

Rewrite `src/Square.tsx`:

```typescript
import Gradient from "javascript-color-gradient";
import type Konva from "konva";
import { useCallback, useMemo } from "react";
import { Group, Image, Rect, Text } from "react-konva";
import type { Coordinate, EventType, GameSquare } from "types";
import useImage from "use-image";

type KonvaEventObject<T> = Konva.KonvaEventObject<T>;

import gameOverImage from "./images/mime_color.png";
import flagImage from "./images/stop.png";

interface SquareProps {
  x: number;
  y: number;
  size: number;
  coOrd: Coordinate;
  onSelect: (coOrd: Coordinate, type: EventType) => void;
  onRightClick: (coOrd: Coordinate, type: EventType) => void;
  onDoubleClick: (coOrd: Coordinate, type: EventType) => void;
}

// Capture all the colors and magic number settings in Square
const unopenedColor = "#FFFFFF";
const openedColor = "#1bbb00";
const gradientEnd = "#ffea00";
const mimeColor = "#f80000";
const shadowColor = "#000000";
const shadowBlurSize = 7;
const textPadding = 5;
const gradientMidpoint = 4;

// Hoisted to module scope — inputs are constants, no need to recompute
const gradientArray = new Gradient()
  .setColorGradient(openedColor, gradientEnd)
  .setMidpoint(gradientMidpoint)
  .getColors();

function Square({
  coOrd,
  x,
  y,
  size,
  onSelect,
  onRightClick,
  onDoubleClick,
  mime,
  opened,
  flagged,
  isGameOver,
  adjacentMimes,
}: SquareProps & GameSquare) {
  const [flagImg] = useImage(flagImage, undefined, "same-origin");
  const [gameOverMime] = useImage(gameOverImage, undefined, "same-origin");

  const color = useMemo(() => {
    if (opened && mime) {
      return mimeColor;
    }
    if (opened) {
      return gradientArray[adjacentMimes];
    }
    return unopenedColor;
  }, [opened, mime, adjacentMimes]);

  // Handler for the left-click Mouse event
  const handleClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // Only fire if this is a main button mouse click
      if (e.evt.button === 0) {
        onSelect(coOrd, "click");
      }
      e.evt.preventDefault();
    },
    [coOrd, onSelect],
  );

  // Handler for a double click event
  const handleDblClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 0) {
        onDoubleClick(coOrd, "dblclick");
      }
    },
    [coOrd, onDoubleClick],
  );

  // Handler for the right-click event
  const handleContextMenu = useCallback(
    (e: KonvaEventObject<PointerEvent>) => {
      onRightClick(coOrd, "contextmenu");
      e.evt.preventDefault();
    },
    [coOrd, onRightClick],
  );

  const handleTap = useCallback(() => {
    onSelect(coOrd, "click");
  }, [coOrd, onSelect]);

  const handleDblTap = useCallback(() => {
    onDoubleClick(coOrd, "dblclick");
  }, [coOrd, onDoubleClick]);

  return (
    <Group
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      onTap={handleTap}
      onDblTap={handleDblTap}
    >
      <Rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={color}
        shadowBlur={shadowBlurSize}
        shadowColor={shadowColor}
      />
      {flagged && flagImg && (
        <Image image={flagImg} height={size} width={size} x={x} y={y} />
      )}
      {opened && mime && isGameOver ? (
        <Image image={gameOverMime} height={size} width={size} x={x} y={y} />
      ) : (
        <Text
          x={x}
          y={y}
          width={size}
          height={size}
          padding={textPadding}
          align="center"
          text={opened ? String(adjacentMimes) : ``}
          fontFamily="Press Start 2P"
        />
      )}
    </Group>
  );
}

export default Square;
```

**Step 3: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass. Gradient computed once at module load. No more useEffect/useState churn.

**Step 4: Commit**

```bash
git add src/Square.tsx
git commit -m "Adhoc: Refactored: Hoist gradient to module scope, replace useState+useEffect with useMemo, add useCallback"
```

---

### Task 7: Create `gameReducer` with tests

This is the central refactoring — extract all game state transitions into a pure, testable reducer function.

**Files:**

- Create: `src/gameReducer.ts`
- Create: `src/gameReducer.spec.ts`

**Step 1: Write the failing tests**

Create `src/gameReducer.spec.ts`:

```typescript
import type { Coordinate, GameSquare } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import {
  gameReducer,
  initialState,
  type GameAction,
  type GameState,
} from "./gameReducer.ts";
import * as gameLogic from "./utils/gameLogic.ts";
import { createTestBoard } from "./utils/testHelpers.ts";

describe("gameReducer", () => {
  describe("initialState", () => {
    test("has correct default values", () => {
      expect(initialState.game).toBeNull();
      expect(initialState.boardSize).toBe(GridSize.S);
      expect(initialState.status).toBe("waitingStart");
      expect(initialState.numMimes).toBe(MimeSize.S);
      expect(initialState.numFlags).toBe(MimeSize.S);
      expect(initialState.numOpenSpaces).toBe(0);
      expect(initialState.playTime).toBe(0);
      expect(initialState.showRules).toBe(false);
    });
  });

  describe("START_GAME", () => {
    test("resets all state for new difficulty", () => {
      const state: GameState = {
        ...initialState,
        status: "gameOverLost",
        playTime: 42,
        numOpenSpaces: 10,
      };
      const next = gameReducer(state, {
        type: "START_GAME",
        boardSize: GridSize.M,
        numMimes: MimeSize.M,
      });
      expect(next.status).toBe("waitingStart");
      expect(next.boardSize).toBe(GridSize.M);
      expect(next.numMimes).toBe(MimeSize.M);
      expect(next.numFlags).toBe(MimeSize.M);
      expect(next.numOpenSpaces).toBe(0);
      expect(next.playTime).toBe(0);
    });
  });

  describe("INIT_BOARD", () => {
    test("creates a new game board when status is waitingStart", () => {
      const next = gameReducer(initialState, { type: "INIT_BOARD" });
      expect(next.game).not.toBeNull();
      expect(next.game?.size).toBe(GridSize.S * GridSize.S);
    });

    test("is a no-op when status is not waitingStart", () => {
      const state: GameState = {
        ...initialState,
        status: "inProgress",
        game: createTestBoard(5),
      };
      const next = gameReducer(state, { type: "INIT_BOARD" });
      expect(next).toBe(state);
    });
  });

  describe("TICK", () => {
    test("increments playTime by 1", () => {
      const state: GameState = { ...initialState, playTime: 5 };
      const next = gameReducer(state, { type: "TICK" });
      expect(next.playTime).toBe(6);
    });
  });

  describe("TOGGLE_RULES", () => {
    test("toggles showRules", () => {
      const next1 = gameReducer(initialState, { type: "TOGGLE_RULES" });
      expect(next1.showRules).toBe(true);
      const next2 = gameReducer(next1, { type: "TOGGLE_RULES" });
      expect(next2.showRules).toBe(false);
    });
  });

  describe("SQUARE_CLICK", () => {
    test("populates mines on first click and transitions to inProgress", () => {
      const game = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game,
        boardSize: GridSize.XS,
        numMimes: MimeSize.XS,
        status: "waitingStart",
      };

      vi.spyOn(gameLogic, "populateMines" as never);
      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 1,
        lost: false,
      });

      const next = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "2|2",
      });

      expect(next.status).toBe("inProgress");

      vi.restoreAllMocks();
    });

    test("triggers game over on mine click", () => {
      const game = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game,
        status: "inProgress",
      };

      vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
        openedCount: 0,
        lost: true,
      });

      const next = gameReducer(state, {
        type: "SQUARE_CLICK",
        coordinate: "2|2",
      });

      expect(next.status).toBe("gameOverLost");

      vi.restoreAllMocks();
    });
  });

  describe("SQUARE_RIGHT_CLICK", () => {
    test("decrements numFlags when flagging", () => {
      const game = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game,
        status: "inProgress",
        numFlags: 10,
      };

      vi.spyOn(gameLogic, "processRightClick").mockReturnValue(-1);

      const next = gameReducer(state, {
        type: "SQUARE_RIGHT_CLICK",
        coordinate: "2|2",
      });

      expect(next.numFlags).toBe(9);

      vi.restoreAllMocks();
    });
  });

  describe("SQUARE_DOUBLE_CLICK", () => {
    test("triggers game over on unsafe double click", () => {
      const game = createTestBoard(5);
      const state: GameState = {
        ...initialState,
        game,
        status: "inProgress",
      };

      vi.spyOn(gameLogic, "processDoubleClick").mockReturnValue({
        openedCount: 0,
        lost: true,
      });

      const next = gameReducer(state, {
        type: "SQUARE_DOUBLE_CLICK",
        coordinate: "2|2",
      });

      expect(next.status).toBe("gameOverLost");

      vi.restoreAllMocks();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/gameReducer.spec.ts`
Expected: FAIL — module not found.

**Step 3: Implement the reducer**

Create `src/gameReducer.ts`:

```typescript
import type { Coordinate, GameSquare, GameStatus } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import {
  isWin,
  newGame,
  populateMimes,
  processDoubleClick,
  processRightClick,
  processSquareClick,
  SQUARE_SIDE,
} from "./utils/gameLogic.ts";

export interface GameState {
  game: Map<Coordinate, GameSquare> | null;
  boardSize: GridSize;
  status: GameStatus;
  numMimes: MimeSize;
  numFlags: number;
  numOpenSpaces: number;
  playTime: number;
  showRules: boolean;
}

export type GameAction =
  | { type: "START_GAME"; boardSize: GridSize; numMimes: MimeSize }
  | { type: "INIT_BOARD" }
  | { type: "SQUARE_CLICK"; coordinate: Coordinate }
  | { type: "SQUARE_DOUBLE_CLICK"; coordinate: Coordinate }
  | { type: "SQUARE_RIGHT_CLICK"; coordinate: Coordinate }
  | { type: "TICK" }
  | { type: "TOGGLE_RULES" };

export const initialState: GameState = {
  game: null,
  boardSize: GridSize.S,
  status: "waitingStart",
  numMimes: MimeSize.S,
  numFlags: MimeSize.S,
  numOpenSpaces: 0,
  playTime: 0,
  showRules: false,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...state,
        status: "waitingStart",
        boardSize: action.boardSize,
        numMimes: action.numMimes,
        numFlags: action.numMimes,
        numOpenSpaces: 0,
        playTime: 0,
      };

    case "INIT_BOARD": {
      if (state.status !== "waitingStart") {
        return state;
      }
      return {
        ...state,
        game: newGame(state.boardSize, SQUARE_SIDE),
      };
    }

    case "TICK":
      return { ...state, playTime: state.playTime + 1 };

    case "TOGGLE_RULES":
      return { ...state, showRules: !state.showRules };

    case "SQUARE_CLICK": {
      if (!state.game) return state;

      let nextGame = state.game;
      let nextStatus: GameStatus = state.status;

      // First click: populate mines and start game
      if (state.status === "waitingStart") {
        nextGame = populateMimes(
          Array.from(state.game.entries()),
          state.numMimes,
          state.boardSize,
          action.coordinate,
        );
        nextStatus = "inProgress";
      }

      const square = nextGame.get(action.coordinate);
      if (!square) return state;

      const result = processSquareClick(
        action.coordinate,
        nextGame,
        square,
      );

      if (result.lost) {
        nextStatus = "gameOverLost";
      }

      const newOpenSpaces = state.numOpenSpaces + result.openedCount;
      if (
        !result.lost &&
        isWin(state.numMimes, newOpenSpaces, state.boardSize)
      ) {
        nextStatus = "gameOverWon";
      }

      nextGame.set(action.coordinate, square);

      return {
        ...state,
        game: new Map(nextGame),
        status: nextStatus,
        numOpenSpaces: newOpenSpaces,
      };
    }

    case "SQUARE_RIGHT_CLICK": {
      if (!state.game) return state;

      const square = state.game.get(action.coordinate);
      if (!square) return state;

      const flagDelta = processRightClick(square);
      state.game.set(action.coordinate, square);

      return {
        ...state,
        game: new Map(state.game),
        numFlags: state.numFlags + flagDelta,
      };
    }

    case "SQUARE_DOUBLE_CLICK": {
      if (!state.game) return state;

      const square = state.game.get(action.coordinate);
      if (!square) return state;

      const result = processDoubleClick(
        action.coordinate,
        state.game,
        square,
      );

      let nextStatus = state.status;
      if (result.lost) {
        nextStatus = "gameOverLost";
      }

      const newOpenSpaces = state.numOpenSpaces + result.openedCount;
      if (
        !result.lost &&
        isWin(state.numMimes, newOpenSpaces, state.boardSize)
      ) {
        nextStatus = "gameOverWon";
      }

      state.game.set(action.coordinate, square);

      return {
        ...state,
        game: new Map(state.game),
        status: nextStatus,
        numOpenSpaces: newOpenSpaces,
      };
    }

    default:
      return state;
  }
}
```

**Step 4: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass (new + existing tests).

**Step 5: Commit**

```bash
git add src/gameReducer.ts src/gameReducer.spec.ts
git commit -m "Adhoc: Added: Pure gameReducer with tests for all game state transitions"
```

---

### Task 8: Refactor App.tsx to use `useReducer`

**Files:**

- Modify: `src/App.tsx`

**Step 1: Run existing App tests for baseline**

Run: `pnpm test -- src/App.spec.tsx`
Expected: All 29 tests pass.

**Step 2: Rewrite App.tsx to use `useReducer`**

Replace `src/App.tsx` entirely:

```typescript
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { Layer, Stage } from "react-konva";
import type { Coordinate, EventType } from "types.d";
import { GridSize, MimeSize } from "./enums.ts";
import { gameReducer, initialState } from "./gameReducer.ts";
import gameOverImage from "./images/mime_color.png";
import Square from "./Square";
import useInterval from "./useInterval";
import { SQUARE_SIDE } from "./utils/gameLogic.ts";
import "App.css";

// Interval delay of the timer. Defaults to 1s (1000ms)
const timeDelay = 1000; // 1 second

interface DifficultyButtonsProps {
  onRestart: (mimes: MimeSize, size: GridSize) => void;
}

function DifficultyButtons({ onRestart }: DifficultyButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.S, GridSize.S);
        }}
      >
        Small game
      </button>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.M, GridSize.M);
        }}
      >
        Medium game
      </button>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.L, GridSize.L);
        }}
      >
        Large game
      </button>
      <button
        type="button"
        onClick={() => {
          onRestart(MimeSize.XL, GridSize.XL);
        }}
      >
        XL game
      </button>
    </>
  );
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const {
    game,
    boardSize,
    status,
    numFlags,
    playTime,
    showRules,
  } = state;

  const handleSquareSelect = useCallback(
    (coOrd: Coordinate, type: EventType): void => {
      switch (type) {
        case "click":
          dispatch({ type: "SQUARE_CLICK", coordinate: coOrd });
          break;
        case "contextmenu":
          dispatch({ type: "SQUARE_RIGHT_CLICK", coordinate: coOrd });
          break;
        case "dblclick":
          dispatch({ type: "SQUARE_DOUBLE_CLICK", coordinate: coOrd });
          break;
      }
    },
    [],
  );

  const handleRestart = useCallback(
    (mimes: MimeSize = MimeSize.S, size: GridSize = GridSize.S): void => {
      dispatch({ type: "START_GAME", boardSize: size, numMimes: mimes });
    },
    [],
  );

  useInterval(
    () => {
      dispatch({ type: "TICK" });
    },
    status === "inProgress" ? timeDelay : null,
  );

  useEffect(() => {
    if (status === "waitingStart") {
      dispatch({ type: "INIT_BOARD" });
    }
  }, [status, boardSize]);

  const isGameOver = status === "gameOverLost" || status === "gameOverWon";

  const gameEntries = useMemo(
    () => Array.from(game ? game.entries() : []),
    [game],
  );

  return (
    <div
      className="container"
      style={{ minWidth: `${String(SQUARE_SIDE * boardSize)}px` }}
    >
      {showRules ? (
        <div className="overlay">
          <div className="content">
            <h4>How to Play</h4>
            <ol>
              <li>Left click to open a space</li>
              <li>Right click to flag a space</li>
              <li>Double click to open all adjacent un-flagged spaces</li>
            </ol>
            <div className="buttons">
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "TOGGLE_RULES" });
                }}
              >
                Let&apos;s play!
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isGameOver ? (
        <div className="overlay">
          <div className="content">
            <h4>
              GAME OVER! You {status === "gameOverLost" ? "Lost :(" : "Won! :)"}
            </h4>
            <img
              alt="Game Over!"
              src={gameOverImage}
              style={{ width: "8rem" }}
            />
            <p>New Game?</p>
            <div className="buttons">
              <DifficultyButtons onRestart={handleRestart} />
            </div>
          </div>
        </div>
      ) : null}
      <h4>
        Mimesweeper{" "}
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "TOGGLE_RULES" });
          }}
        >
          How to play
        </button>
      </h4>
      <h4>
        <small>
          Play time: {playTime}s | Flags Remaining:{" "}
          {numFlags < 0 ? "No more left!" : numFlags}
        </small>
      </h4>
      <div
        className="mimes"
        style={{ width: `${String(SQUARE_SIDE * boardSize)}px` }}
      />
      <Stage
        width={SQUARE_SIDE * boardSize}
        height={SQUARE_SIDE * boardSize}
        className="stage"
        data-test-id="stage"
      >
        <Layer>
          {gameEntries.map(([key, square]) => (
            <Square
              key={key}
              coOrd={key}
              x={square.x}
              y={square.y}
              size={SQUARE_SIDE}
              mime={square.mime}
              adjacentMimes={square.adjacentMimes}
              opened={square.opened}
              flagged={square.flagged}
              isGameOver={isGameOver}
              onSelect={handleSquareSelect}
              onRightClick={handleSquareSelect}
              onDoubleClick={handleSquareSelect}
            />
          ))}
        </Layer>
      </Stage>
      <p style={{ marginTop: "1rem" }}>Restart?</p>
      <div className="buttons">
        <DifficultyButtons onRestart={handleRestart} />
      </div>
    </div>
  );
}

export default App;
```

Key changes:

- 8 `useState` hooks replaced with single `useReducer`
- `handleSquareSelect` dispatches actions instead of calling logic directly
- `DifficultyButtons` component eliminates ~60 lines of duplication
- `useMemo` on `gameEntries` prevents re-creating array every render
- `useCallback` on handlers prevents re-renders of Square components
- `""` replaced with `null` in conditional renders
- No more nested state setters

**Step 3: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass. If App tests fail due to mock patterns, fix the mocks to match the new dispatch-based flow.

**Note:** The existing App tests spy on gameLogic functions. Since the reducer calls those same functions, the mocks should still intercept correctly. The test behavior should be identical.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "Adhoc: Refactored: Replace 8 useState with useReducer, extract DifficultyButtons, add memoization"
```

---

### Task 9: Remove `isGameOver` field from `GameSquare`

Now that App.tsx passes `isGameOver` as a derived value from status (not from the square data), the field on `GameSquare` is dead code.

**Files:**

- Modify: `src/types.d.ts:13-14`
- Modify: `src/utils/gameLogic.ts` (remove from `newGame`)
- Modify: `src/utils/testHelpers.ts` (remove from `createTestSquare`)
- Modify: `src/utils/gameLogic.spec.ts` (remove `isGameOver` assertion)

**Step 1: Remove the field from the interface**

In `src/types.d.ts`, remove lines 13-14:

```typescript
  // Is the game currently over?
  isGameOver: boolean;
```

**Step 2: Remove from `newGame` in `src/utils/gameLogic.ts`**

In the `newGame` function, remove `isGameOver: false,` from the object literal (around line 146).

**Step 3: Remove from `createTestSquare` in `src/utils/testHelpers.ts`**

Remove `isGameOver: false,` from the default object (around line 12).

**Step 4: Remove assertion from `gameLogic.spec.ts`**

In the "all squares default to unopened..." test (around line 57), remove:

```typescript
expect(square.isGameOver).toBe(false);
```

**Step 5: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/types.d.ts src/utils/gameLogic.ts src/utils/testHelpers.ts src/utils/gameLogic.spec.ts
git commit -m "Adhoc: Removed: Dead isGameOver field from GameSquare interface"
```

---

### Task 10: Clean up `newGame` — replace reduce+concat with nested loops

**Files:**

- Modify: `src/utils/gameLogic.ts:130-154`

**Step 1: Run existing tests for baseline**

Run: `pnpm test -- src/utils/gameLogic.spec.ts`
Expected: All pass.

**Step 2: Rewrite `newGame` with simple nested loops**

Replace the `newGame` function:

```typescript
export function newGame(
  size: number,
  squareSide: number,
): Map<Coordinate, GameSquare> {
  const game = new Map<Coordinate, GameSquare>();
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      game.set(coOrdKey(x, y), {
        mime: false,
        adjacentMimes: 0,
        opened: false,
        flagged: false,
        x: x * squareSide,
        y: y * squareSide,
      });
    }
  }
  return game;
}
```

**Step 3: Run verification**

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All pass.

**Step 4: Commit**

```bash
git add src/utils/gameLogic.ts
git commit -m "Adhoc: Refactored: Simplify newGame with nested loops instead of reduce+concat"
```

---

## Final Verification

After all tasks:

```bash
pnpm test && pnpm run lint && pnpm run type:check
```

Expected: All tests pass, lint clean, types clean.

## Summary of Changes

| Task | What Changed | Why |
|------|-------------|-----|
| 1 | Fix `adjacentMimes` type | Bug: missing `6` in union |
| 2 | Move `use-image` to deps | Correctness: production code needs runtime dep |
| 3 | Simplify `getCoOrd` | DRY: parse once with `split` instead of 4x `indexOf`/`parseInt` |
| 4 | Extract `getNeighborCoords` | DRY: deduplicate `Array.of(...).forEach(...)` pattern |
| 5 | Improve `populateMimes` | Safety: Set guarantees unique mines, no failsafe bypass |
| 6 | Clean up `Square.tsx` | Perf: hoist gradient, `useMemo` for color, `useCallback` for handlers |
| 7 | Create `gameReducer` | Testability: pure function, no React coupling |
| 8 | Refactor `App.tsx` | Modern React: `useReducer`, `useCallback`, `useMemo`, DRY buttons |
| 9 | Remove `isGameOver` from `GameSquare` | Dead code: field was never used per-square |
| 10 | Simplify `newGame` | Readability: nested loops instead of `reduce`+`concat` |
