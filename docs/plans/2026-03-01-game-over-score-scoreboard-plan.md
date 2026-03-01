# Game Over Reveal, Score, and Scoreboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add mine-reveal on game-over loss, a time-based scoring system, and a persistent top-10 scoreboard per difficulty.

**Architecture:** All game state changes flow through `gameReducer.ts`. New fields (`clickedMime`, `wrongFlag`, `score`) are added to existing types and the reducer handles their transitions. The scoreboard lives in a custom hook backed by localStorage. New UI components are DOM overlays matching the existing pattern in `App.tsx`.

**Tech Stack:** React 19, TypeScript 5.8, Vitest 4, Konva (for Square rendering), localStorage (for scoreboard persistence).

---

## Task 1: Add `clickedMime` and `wrongFlag` to GameSquare

**Files:**

- Modify: `src/types.d.ts:4-17`
- Modify: `src/utils/testHelpers.ts:5-16`

**Step 1: Update GameSquare interface**

In `src/types.d.ts`, add two optional boolean fields to `GameSquare`:

```typescript
export interface GameSquare {
  mime: boolean;
  adjacentMimes: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  opened: boolean;
  flagged: boolean;
  x: number;
  y: number;
  clickedMime?: boolean;
  wrongFlag?: boolean;
}
```

**Step 2: Update `createTestSquare` defaults**

In `src/utils/testHelpers.ts`, the spread pattern already handles optional fields (they default to `undefined` which is falsy). No change needed here — just verify existing tests still pass.

**Step 3: Run tests to verify nothing breaks**

Run: `pnpm test`
Expected: All 185 tests pass. The new optional fields don't affect existing code.

**Step 4: Commit**

```text
Adhoc: Added: clickedMime and wrongFlag optional fields to GameSquare
```

---

## Task 2: Add `score` to GameState and reducer

**Files:**

- Modify: `src/gameReducer.ts:13-22` (GameState interface)
- Modify: `src/gameReducer.ts:33-42` (initialState)
- Create: `src/utils/score.ts`
- Create: `src/utils/score.spec.ts`
- Modify: `src/gameReducer.ts:56-65` (START_GAME case)
- Modify: `src/gameReducer.ts:77-78` (TICK case)
- Modify: `src/gameReducer.spec.ts`

**Step 1: Create `src/utils/score.ts` with `getBaseScore`**

```typescript
import { GridSize } from "../enums.ts";

const BASE_SCORE = 1000;
const MULTIPLIER = 5;
const DECREMENT_PER_SECOND = 5;

const difficultyMultiplier: Record<GridSize, number> = {
  [GridSize.XS]: 0,
  [GridSize.S]: 0,
  [GridSize.M]: 1,
  [GridSize.L]: 2,
  [GridSize.XL]: 3,
};

export function getBaseScore(gridSize: GridSize): number {
  const mult = difficultyMultiplier[gridSize] ?? 0;
  return BASE_SCORE + BASE_SCORE * MULTIPLIER * mult;
}

export function decrementScore(currentScore: number): number {
  return Math.max(0, currentScore - DECREMENT_PER_SECOND);
}
```

**Step 2: Write tests for score utilities**

Create `src/utils/score.spec.ts`:

```typescript
import { GridSize } from "../enums.ts";
import { decrementScore, getBaseScore } from "./score.ts";

describe("getBaseScore", () => {
  test("returns 1000 for GridSize.XS", () => {
    expect(getBaseScore(GridSize.XS)).toBe(1000);
  });

  test("returns 1000 for GridSize.S (small)", () => {
    expect(getBaseScore(GridSize.S)).toBe(1000);
  });

  test("returns 6000 for GridSize.M (medium)", () => {
    expect(getBaseScore(GridSize.M)).toBe(6000);
  });

  test("returns 11000 for GridSize.L (large)", () => {
    expect(getBaseScore(GridSize.L)).toBe(11000);
  });

  test("returns 16000 for GridSize.XL", () => {
    expect(getBaseScore(GridSize.XL)).toBe(16000);
  });
});

describe("decrementScore", () => {
  test("decrements by 5", () => {
    expect(decrementScore(1000)).toBe(995);
  });

  test("floors at 0", () => {
    expect(decrementScore(3)).toBe(0);
  });

  test("returns 0 when already 0", () => {
    expect(decrementScore(0)).toBe(0);
  });
});
```

**Step 3: Run score tests to verify they pass**

Run: `pnpm test`
Expected: New score tests pass, all existing tests pass.

**Step 4: Add `score` to `GameState` and `initialState`**

In `src/gameReducer.ts`, add `score: number` to `GameState`:

```typescript
export interface GameState {
  game: Map<Coordinate, GameSquare> | null;
  boardSize: GridSize;
  status: GameStatus;
  numMimes: MimeSize;
  numFlags: number;
  numOpenSpaces: number;
  playTime: number;
  showRules: boolean;
  score: number;
}
```

Update `initialState`:

```typescript
export const initialState: GameState = {
  game: null,
  boardSize: GridSize.S,
  status: "waitingStart",
  numMimes: MimeSize.S,
  numFlags: MimeSize.S,
  numOpenSpaces: 0,
  playTime: 0,
  showRules: false,
  score: 0,
};
```

**Step 5: Update `START_GAME` to compute initial score**

Import `getBaseScore` at the top of `gameReducer.ts`:

```typescript
import { getBaseScore } from "./utils/score.ts";
```

Update the `START_GAME` case to set `score`:

```typescript
case "START_GAME":
  return {
    ...state,
    status: "waitingStart",
    boardSize: action.boardSize,
    numMimes: action.numMimes,
    numFlags: action.numMimes,
    numOpenSpaces: 0,
    playTime: 0,
    score: getBaseScore(action.boardSize),
  };
```

**Step 6: Update `TICK` to decrement score**

Import `decrementScore` at the top of `gameReducer.ts`:

```typescript
import { decrementScore, getBaseScore } from "./utils/score.ts";
```

Update the `TICK` case:

```typescript
case "TICK":
  return {
    ...state,
    playTime: state.playTime + 1,
    score: decrementScore(state.score),
  };
```

**Step 7: Add reducer tests for score**

In `src/gameReducer.spec.ts`, add these tests:

In the `initialState` describe block, add:

```typescript
test("has score initialized to 0", () => {
  expect(initialState.score).toBe(0);
});
```

In the `START_GAME` describe block, add:

```typescript
test("sets score based on board size for Small", () => {
  const result = gameReducer(initialState, {
    type: "START_GAME",
    boardSize: GridSize.S,
    numMimes: MimeSize.S,
  });
  expect(result.score).toBe(1000);
});

test("sets score based on board size for Medium", () => {
  const result = gameReducer(initialState, {
    type: "START_GAME",
    boardSize: GridSize.M,
    numMimes: MimeSize.M,
  });
  expect(result.score).toBe(6000);
});

test("sets score based on board size for Large", () => {
  const result = gameReducer(initialState, {
    type: "START_GAME",
    boardSize: GridSize.L,
    numMimes: MimeSize.L,
  });
  expect(result.score).toBe(11000);
});

test("sets score based on board size for XL", () => {
  const result = gameReducer(initialState, {
    type: "START_GAME",
    boardSize: GridSize.XL,
    numMimes: MimeSize.XL,
  });
  expect(result.score).toBe(16000);
});
```

In the `TICK` describe block, add:

```typescript
test("decrements score by 5", () => {
  const state: GameState = { ...initialState, score: 1000 };
  const result = gameReducer(state, { type: "TICK" });
  expect(result.score).toBe(995);
});

test("score does not go below 0", () => {
  const state: GameState = { ...initialState, score: 2 };
  const result = gameReducer(state, { type: "TICK" });
  expect(result.score).toBe(0);
});
```

**Step 8: Run all tests**

Run: `pnpm test`
Expected: All tests pass including new score-related tests.

**Step 9: Commit**

```text
Adhoc: Added: Score system with base score per difficulty and time decrement
```

---

## Task 3: Reveal mines on game-over loss in reducer

**Files:**

- Modify: `src/gameReducer.ts:116-135` (SQUARE_CLICK case, loss path)
- Modify: `src/gameReducer.ts:158-191` (SQUARE_DOUBLE_CLICK case, loss path)
- Modify: `src/gameReducer.spec.ts`

**Step 1: Write failing tests for mine reveal on loss**

Add these tests to `src/gameReducer.spec.ts` inside a new `describe("mine reveal on game over")` block within the `SQUARE_CLICK` describe:

```typescript
describe("mine reveal on game over", () => {
  test("reveals all unflagged mines when game is lost", () => {
    const board = createTestBoard(3);
    // Place mines at 1|0 and 2|0 (not at 0|0 which we click)
    const mine1 = board.get("1|0" as Coordinate)!;
    mine1.mime = true;
    const mine2 = board.get("2|0" as Coordinate)!;
    mine2.mime = true;

    const state: GameState = {
      ...initialState,
      game: board,
      status: "inProgress",
      numMimes: MimeSize.XS,
    };

    // Click the mine at 1|0 to trigger loss
    vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
      openedCount: 0,
      lost: true,
    });

    const result = gameReducer(state, {
      type: "SQUARE_CLICK",
      coordinate: "1|0" as Coordinate,
    });

    // The other mine should be revealed
    const otherMine = result.game?.get("2|0" as Coordinate);
    expect(otherMine?.opened).toBe(true);
  });

  test("marks clicked mine with clickedMime flag", () => {
    const board = createTestBoard(3);
    const mine = board.get("1|0" as Coordinate)!;
    mine.mime = true;

    const state: GameState = {
      ...initialState,
      game: board,
      status: "inProgress",
      numMimes: MimeSize.XS,
    };

    vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
      openedCount: 0,
      lost: true,
    });

    const result = gameReducer(state, {
      type: "SQUARE_CLICK",
      coordinate: "1|0" as Coordinate,
    });

    const clickedMine = result.game?.get("1|0" as Coordinate);
    expect(clickedMine?.clickedMime).toBe(true);
  });

  test("marks wrongly flagged non-mine squares", () => {
    const board = createTestBoard(3);
    const mine = board.get("1|0" as Coordinate)!;
    mine.mime = true;
    // Flag a non-mine square (wrong flag)
    const wrongSquare = board.get("0|1" as Coordinate)!;
    wrongSquare.flagged = true;

    const state: GameState = {
      ...initialState,
      game: board,
      status: "inProgress",
      numMimes: MimeSize.XS,
    };

    vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
      openedCount: 0,
      lost: true,
    });

    const result = gameReducer(state, {
      type: "SQUARE_CLICK",
      coordinate: "1|0" as Coordinate,
    });

    const wrong = result.game?.get("0|1" as Coordinate);
    expect(wrong?.wrongFlag).toBe(true);
  });

  test("does not mark correctly flagged mines as wrongFlag", () => {
    const board = createTestBoard(3);
    const mine1 = board.get("1|0" as Coordinate)!;
    mine1.mime = true;
    // Correctly flag another mine
    const mine2 = board.get("2|0" as Coordinate)!;
    mine2.mime = true;
    mine2.flagged = true;

    const state: GameState = {
      ...initialState,
      game: board,
      status: "inProgress",
      numMimes: MimeSize.XS,
    };

    vi.spyOn(gameLogic, "processSquareClick").mockReturnValue({
      openedCount: 0,
      lost: true,
    });

    const result = gameReducer(state, {
      type: "SQUARE_CLICK",
      coordinate: "1|0" as Coordinate,
    });

    const correctFlag = result.game?.get("2|0" as Coordinate);
    expect(correctFlag?.wrongFlag).toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: New mine-reveal tests fail (mines not yet revealed on loss).

**Step 3: Implement mine reveal logic in reducer**

Create a helper function `revealMinesOnLoss` in `src/gameReducer.ts`, placed above `gameReducer`:

```typescript
function revealMinesOnLoss(
  game: Map<Coordinate, GameSquare>,
  clickedCoord: Coordinate,
): void {
  for (const [coord, square] of game) {
    if (coord === clickedCoord) {
      square.clickedMime = true;
    } else if (square.mime && !square.flagged) {
      square.opened = true;
    } else if (!square.mime && square.flagged) {
      square.wrongFlag = true;
    }
  }
}
```

In the `SQUARE_CLICK` case, after `if (result.lost)`, add the mine reveal call:

```typescript
if (result.lost) {
  nextStatus = "gameOverLost";
  revealMinesOnLoss(nextGame, action.coordinate);
}
```

In the `SQUARE_DOUBLE_CLICK` case, add the same pattern. The double-click loss path does not have a single "clicked" mine coordinate — all unflagged adjacent mines were force-opened. Use the action coordinate as clickedCoord (the square the player double-clicked, even if it is not itself a mine):

```typescript
if (result.lost) {
  nextStatus = "gameOverLost";
  revealMinesOnLoss(nextGame, action.coordinate);
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests pass including mine-reveal tests.

**Step 5: Commit**

```text
Adhoc: Added: Reveal all mines and mark wrong flags on game-over loss
```

---

## Task 4: Update Square.tsx rendering for revealed mines and wrong flags

**Files:**

- Modify: `src/Square.tsx`
- Modify: `src/Square.spec.tsx`

**Step 1: Write failing tests for new Square visual states**

Add these tests to `src/Square.spec.tsx`. First, update the `renderSquare` defaultProps to include the new optional fields (they default to `undefined`/falsy, so no changes needed to the type since `GameSquare` already includes them as optional after Task 1).

In the `rendering states` describe block, add:

```typescript
test("renders revealed mine (not clicked) with white fill and mime image", () => {
  renderSquare({
    opened: true,
    mime: true,
    isGameOver: true,
    clickedMime: false,
  });
  const rect = screen.getByTestId("konva-rect");
  expect(rect.dataset.fill).toBe("#FFFFFF");
  const images = screen.getAllByTestId("konva-image");
  expect(images.length).toBeGreaterThanOrEqual(1);
});

test("renders clicked mine with red fill", () => {
  renderSquare({
    opened: true,
    mime: true,
    isGameOver: true,
    clickedMime: true,
  });
  const rect = screen.getByTestId("konva-rect");
  expect(rect.dataset.fill).toBe("#f80000");
});

test("renders wrong flag with X text", () => {
  renderSquare({
    flagged: true,
    wrongFlag: true,
    isGameOver: true,
  });
  expect(screen.getByText("X")).toBeInTheDocument();
});
```

In the `color states` describe block, update the existing "opened mine has red fill" test to also pass `clickedMime: true` so it still expects red:

```typescript
test("opened mine has red fill when clickedMime", () => {
  renderSquare({ opened: true, mime: true, clickedMime: true });
  const rect = screen.getByTestId("konva-rect");
  expect(rect.dataset.fill).toBe("#f80000");
});
```

**Step 2: Run tests to verify new tests fail**

Run: `pnpm test`
Expected: New rendering tests fail (Square doesn't yet distinguish clicked vs revealed mines).

**Step 3: Update Square.tsx rendering**

Update the `SquareProps` interface to include the new fields (they come through `GameSquare` but we need to destructure them). Add `clickedMime` and `wrongFlag` to the destructured props:

```typescript
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
  clickedMime,
  wrongFlag,
}: SquareProps & GameSquare) {
```

Update the `color` useMemo to distinguish clicked vs revealed mines:

```typescript
const color = useMemo(() => {
  if (opened && mime && clickedMime) {
    return mimeColor;
  }
  if (opened && mime) {
    return unopenedColor;
  }
  if (opened) {
    return gradientArray[adjacentMimes];
  }
  return unopenedColor;
}, [opened, mime, adjacentMimes, clickedMime]);
```

Update the rendering JSX. The mine image should show for any opened mine during game over. For wrong flags, show an "X" text overlay on top of the flag:

```tsx
{flagged && flagImg && (
  <Image image={flagImg} height={size} width={size} x={x} y={y} />
)}
{wrongFlag && isGameOver ? (
  <Text
    x={x}
    y={y}
    width={size}
    height={size}
    padding={textPadding}
    align="center"
    text="X"
    fontFamily="Press Start 2P"
    fill="#f80000"
    fontSize={14}
  />
) : opened && mime && isGameOver ? (
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
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests pass. The existing "opened mine has red fill" test in color states may need updating — it currently tests `opened: true, mime: true` without `clickedMime`. After the change, an opened mine without `clickedMime` renders white. Update that test to reflect the new behavior (revealed mine = white) or add `clickedMime: true` to preserve the red assertion.

**Step 5: Commit**

```text
Adhoc: Added: Square rendering for revealed mines, clicked mines, and wrong flags
```

---

## Task 5: Display score in game header and win overlay

**Files:**

- Modify: `src/App.tsx:60` (destructure score from state)
- Modify: `src/App.tsx:133-150` (game-over overlay)
- Modify: `src/App.tsx:162-166` (header display)

**Step 1: Add score to the header display**

In `src/App.tsx`, destructure `score` from state:

```typescript
const { game, boardSize, status, numFlags, playTime, showRules, score } = state;
```

Update the header `<h4>` to include the score:

```tsx
<h4>
  <small>
    Play time: {playTime}s | Score: {score} | Flags Remaining:{" "}
    {numFlags < 0 ? "No more left!" : numFlags}
  </small>
</h4>
```

**Step 2: Show final score prominently in win overlay**

Update the game-over overlay. When the player wins, show the score in large text:

```tsx
{isGameOver ? (
  <div className="overlay">
    <div className="content">
      <h4>
        GAME OVER! You {status === "gameOverLost" ? "Lost :(" : "Won! :)"}
      </h4>
      {status === "gameOverWon" && (
        <h2 className="final-score">Score: {score}</h2>
      )}
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
```

**Step 3: Add CSS for final-score**

In `src/App.css`, add after the `.container .overlay .content .buttons` rule:

```css
.container .overlay .content .final-score {
  color: #1bbb00;
  margin: 1rem 0;
}
```

**Step 4: Run tests**

Run: `pnpm test`
Expected: All tests pass.

**Step 5: Commit**

```text
Adhoc: Added: Score display in game header and win overlay
```

---

## Task 6: Create `useScoreboard` hook

**Files:**

- Create: `src/hooks/useScoreboard.ts`
- Create: `src/hooks/useScoreboard.spec.ts`

**Step 1: Define scoreboard types**

Add to `src/types.d.ts`:

```typescript
export interface ScoreEntry {
  name: string;
  score: number;
}

export type DifficultyKey = "S" | "M" | "L" | "XL";

export type ScoreboardData = Record<DifficultyKey, ScoreEntry[]>;
```

**Step 2: Create the hook**

Create `src/hooks/useScoreboard.ts`:

```typescript
import { useCallback, useState } from "react";
import type { DifficultyKey, ScoreEntry, ScoreboardData } from "types.d";

const STORAGE_KEY = "mimesweeper-scoreboard";
const MAX_ENTRIES = 10;

const DEFAULT_ENTRY: ScoreEntry = { name: "JMS", score: 100 };

function createDefaultScoreboard(): ScoreboardData {
  const entries = Array.from({ length: MAX_ENTRIES }, () => ({
    ...DEFAULT_ENTRY,
  }));
  return {
    S: entries.map((e) => ({ ...e })),
    M: entries.map((e) => ({ ...e })),
    L: entries.map((e) => ({ ...e })),
    XL: entries.map((e) => ({ ...e })),
  };
}

function loadScoreboard(): ScoreboardData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ScoreboardData;
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  const defaults = createDefaultScoreboard();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveScoreboard(data: ScoreboardData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useScoreboard() {
  const [scores, setScores] = useState<ScoreboardData>(loadScoreboard);

  const getScores = useCallback(
    (difficulty: DifficultyKey): ScoreEntry[] => {
      return scores[difficulty];
    },
    [scores],
  );

  const isHighScore = useCallback(
    (difficulty: DifficultyKey, score: number): boolean => {
      const entries = scores[difficulty];
      if (entries.length < MAX_ENTRIES) return true;
      return score > entries[entries.length - 1].score;
    },
    [scores],
  );

  const addScore = useCallback(
    (difficulty: DifficultyKey, name: string, score: number): void => {
      setScores((prev) => {
        const entries = [...prev[difficulty], { name, score }];
        entries.sort((a, b) => b.score - a.score);
        const trimmed = entries.slice(0, MAX_ENTRIES);
        const next = { ...prev, [difficulty]: trimmed };
        saveScoreboard(next);
        return next;
      });
    },
    [],
  );

  return { scores, getScores, isHighScore, addScore };
}
```

**Step 3: Write tests for useScoreboard**

Create `src/hooks/useScoreboard.spec.ts`:

```typescript
import { act, renderHook } from "@testing-library/react";
import { useScoreboard } from "./useScoreboard.ts";

describe("useScoreboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("initializes with default scoreboard entries", () => {
    const { result } = renderHook(() => useScoreboard());
    const smallScores = result.current.getScores("S");
    expect(smallScores).toHaveLength(10);
    expect(smallScores[0]).toEqual({ name: "JMS", score: 100 });
  });

  test("each difficulty has its own default entries", () => {
    const { result } = renderHook(() => useScoreboard());
    for (const key of ["S", "M", "L", "XL"] as const) {
      expect(result.current.getScores(key)).toHaveLength(10);
    }
  });

  test("persists defaults to localStorage on first load", () => {
    renderHook(() => useScoreboard());
    const stored = localStorage.getItem("mimesweeper-scoreboard");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.S).toHaveLength(10);
  });

  test("isHighScore returns true when score beats lowest entry", () => {
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.isHighScore("S", 200)).toBe(true);
  });

  test("isHighScore returns false when score is at or below lowest", () => {
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.isHighScore("S", 50)).toBe(false);
  });

  test("isHighScore returns false when score equals lowest", () => {
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.isHighScore("S", 100)).toBe(false);
  });

  test("addScore inserts entry in sorted order", () => {
    const { result } = renderHook(() => useScoreboard());
    act(() => {
      result.current.addScore("S", "ACE", 500);
    });
    const scores = result.current.getScores("S");
    expect(scores[0]).toEqual({ name: "ACE", score: 500 });
    expect(scores).toHaveLength(10);
  });

  test("addScore persists to localStorage", () => {
    const { result } = renderHook(() => useScoreboard());
    act(() => {
      result.current.addScore("M", "PRO", 9999);
    });
    const stored = JSON.parse(
      localStorage.getItem("mimesweeper-scoreboard")!,
    );
    expect(stored.M[0]).toEqual({ name: "PRO", score: 9999 });
  });

  test("addScore trims list to 10 entries", () => {
    const { result } = renderHook(() => useScoreboard());
    act(() => {
      result.current.addScore("S", "NEW", 500);
    });
    expect(result.current.getScores("S")).toHaveLength(10);
  });

  test("loads existing scores from localStorage", () => {
    const custom = {
      S: [{ name: "TOP", score: 9999 }],
      M: [],
      L: [],
      XL: [],
    };
    localStorage.setItem(
      "mimesweeper-scoreboard",
      JSON.stringify(custom),
    );
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.getScores("S")[0]).toEqual({
      name: "TOP",
      score: 9999,
    });
  });

  test("falls back to defaults on corrupted localStorage", () => {
    localStorage.setItem("mimesweeper-scoreboard", "not-json{{{");
    const { result } = renderHook(() => useScoreboard());
    expect(result.current.getScores("S")).toHaveLength(10);
  });
});
```

**Step 4: Run tests**

Run: `pnpm test`
Expected: All scoreboard tests pass.

**Step 5: Commit**

```text
Adhoc: Added: useScoreboard hook with localStorage persistence and defaults
```

---

## Task 7: Create Scoreboard component

**Files:**

- Create: `src/Scoreboard.tsx`
- Create: `src/Scoreboard.spec.tsx`
- Modify: `src/App.css`

**Step 1: Create `src/Scoreboard.tsx`**

```tsx
import { useCallback, useState } from "react";
import type { DifficultyKey, ScoreEntry } from "types.d";

const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "XL",
};

const DIFFICULTY_KEYS: DifficultyKey[] = ["S", "M", "L", "XL"];

interface ScoreboardProps {
  getScores: (difficulty: DifficultyKey) => ScoreEntry[];
  onClose: () => void;
}

function Scoreboard({ getScores, onClose }: ScoreboardProps) {
  const [activeDifficulty, setActiveDifficulty] =
    useState<DifficultyKey>("S");

  const entries = getScores(activeDifficulty);

  const handleTabClick = useCallback((key: DifficultyKey) => {
    setActiveDifficulty(key);
  }, []);

  return (
    <div className="overlay">
      <div className="content scoreboard">
        <h4>Top 10 Scores</h4>
        <div className="scoreboard-tabs">
          {DIFFICULTY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={activeDifficulty === key ? "active" : ""}
              onClick={() => handleTabClick(key)}
            >
              {DIFFICULTY_LABELS[key]}
            </button>
          ))}
        </div>
        <ol className="scoreboard-list">
          {entries.map((entry, index) => (
            <li key={`${String(index)}-${entry.name}`}>
              <span className="scoreboard-name">{entry.name}</span>
              <span className="scoreboard-score">{entry.score}</span>
            </li>
          ))}
        </ol>
        <div className="buttons">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;
```

**Step 2: Add scoreboard CSS**

In `src/App.css`, add at the end:

```css
.container .overlay .content.scoreboard {
  width: 35rem;
}

.container .scoreboard-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.container .scoreboard-tabs button.active {
  background-color: color-mix(
    in srgb,
    var(--button-bg-color) 60%,
    var(--white)
  );
}

.container .scoreboard-list {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 1rem auto;
  max-width: 25rem;
}

.container .scoreboard-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--black);
  font-size: 0.8rem;
}

.container .scoreboard-name {
  flex: 1;
}

.container .scoreboard-score {
  text-align: right;
  min-width: 5rem;
}
```

**Step 3: Write tests for Scoreboard component**

Create `src/Scoreboard.spec.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import Scoreboard from "./Scoreboard";
import type { DifficultyKey, ScoreEntry } from "types.d";

function createMockScores(): Record<DifficultyKey, ScoreEntry[]> {
  return {
    S: [
      { name: "AAA", score: 900 },
      { name: "BBB", score: 800 },
    ],
    M: [{ name: "CCC", score: 5000 }],
    L: [],
    XL: [{ name: "DDD", score: 15000 }],
  };
}

describe("Scoreboard", () => {
  test("renders heading", () => {
    const scores = createMockScores();
    render(
      <Scoreboard
        getScores={(d) => scores[d]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Top 10 Scores")).toBeInTheDocument();
  });

  test("shows Small scores by default", () => {
    const scores = createMockScores();
    render(
      <Scoreboard
        getScores={(d) => scores[d]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
  });

  test("switches to Medium scores on tab click", () => {
    const scores = createMockScores();
    render(
      <Scoreboard
        getScores={(d) => scores[d]}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Medium"));
    expect(screen.getByText("CCC")).toBeInTheDocument();
    expect(screen.getByText("5000")).toBeInTheDocument();
  });

  test("calls onClose when Close button is clicked", () => {
    const scores = createMockScores();
    const onClose = vi.fn();
    render(
      <Scoreboard getScores={(d) => scores[d]} onClose={onClose} />,
    );
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("renders all four difficulty tabs", () => {
    const scores = createMockScores();
    render(
      <Scoreboard
        getScores={(d) => scores[d]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Small")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("XL")).toBeInTheDocument();
  });
});
```

**Step 4: Run tests**

Run: `pnpm test`
Expected: All tests pass.

**Step 5: Commit**

```text
Adhoc: Added: Scoreboard component with difficulty tabs and score list
```

---

## Task 8: Wire scoreboard and high-score entry into App.tsx

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Add a difficulty key mapping utility**

Add a helper at the top of `src/App.tsx` (or in a utility file) to map `GridSize` to `DifficultyKey`:

```typescript
import type { DifficultyKey } from "types.d";

function getDifficultyKey(boardSize: GridSize): DifficultyKey {
  switch (boardSize) {
    case GridSize.M:
      return "M";
    case GridSize.L:
      return "L";
    case GridSize.XL:
      return "XL";
    default:
      return "S";
  }
}
```

**Step 2: Wire useScoreboard into App**

In the `App` function, add:

```typescript
const { getScores, isHighScore, addScore } = useScoreboard();
const [showScoreboard, setShowScoreboard] = useState(false);
const [playerName, setPlayerName] = useState("");
const [scoreSubmitted, setScoreSubmitted] = useState(false);

const difficultyKey = getDifficultyKey(boardSize);
const qualifiesForHighScore =
  status === "gameOverWon" && !scoreSubmitted && isHighScore(difficultyKey, score);
```

Import `useScoreboard` and `useState`:

```typescript
import { useScoreboard } from "./hooks/useScoreboard.ts";
```

**Step 3: Add Scoreboard button to game header**

After the "How to play" button, add a Scoreboard button:

```tsx
<h4>
  Mimesweeper{" "}
  <button
    type="button"
    onClick={() => {
      dispatch({ type: "TOGGLE_RULES" });
    }}
  >
    How to play
  </button>{" "}
  <button
    type="button"
    onClick={() => {
      setShowScoreboard(true);
    }}
  >
    Scoreboard
  </button>
</h4>
```

**Step 4: Render Scoreboard overlay when showScoreboard is true**

Add before the game-over overlay conditional:

```tsx
{showScoreboard ? (
  <Scoreboard
    getScores={getScores}
    onClose={() => setShowScoreboard(false)}
  />
) : null}
```

Import Scoreboard:

```typescript
import Scoreboard from "./Scoreboard";
```

**Step 5: Add high-score entry to win overlay**

Update the game-over overlay to include score submission:

```tsx
{isGameOver ? (
  <div className="overlay">
    <div className="content">
      <h4>
        GAME OVER! You {status === "gameOverLost" ? "Lost :(" : "Won! :)"}
      </h4>
      {status === "gameOverWon" && (
        <>
          <h2 className="final-score">Score: {score}</h2>
          {qualifiesForHighScore ? (
            <div className="high-score-entry">
              <p>New High Score!</p>
              <input
                type="text"
                maxLength={10}
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <button
                type="button"
                disabled={playerName.trim().length === 0}
                onClick={() => {
                  addScore(difficultyKey, playerName.trim(), score);
                  setScoreSubmitted(true);
                }}
              >
                Submit Score
              </button>
            </div>
          ) : scoreSubmitted ? (
            <p>Score saved!</p>
          ) : null}
        </>
      )}
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
```

**Step 6: Reset score submission state on restart**

Update `handleRestart` to clear the submission state:

```typescript
const handleRestart = useCallback(
  (mimes: MimeSize = MimeSize.S, size: GridSize = GridSize.S): void => {
    dispatch({ type: "START_GAME", boardSize: size, numMimes: mimes });
    setPlayerName("");
    setScoreSubmitted(false);
  },
  [],
);
```

**Step 7: Add CSS for high-score entry**

In `src/App.css`:

```css
.container .overlay .content .high-score-entry {
  margin: 1rem 0;
}

.container .overlay .content .high-score-entry input {
  font-family: "Press Start 2P", cursive;
  font-size: 0.8rem;
  padding: 0.5rem;
  border: 2px solid var(--black);
  margin-right: 0.5rem;
  max-width: 10rem;
}
```

**Step 8: Run all tests**

Run: `pnpm test`
Expected: All tests pass.

**Step 9: Run lint**

Run: `pnpm run lint`
Expected: No lint errors.

**Step 10: Commit**

```text
Adhoc: Added: Scoreboard button, high-score entry on win, and full wiring in App
```

---

## Task 9: Final integration test and cleanup

**Files:**

- Modify: `src/App.spec.tsx` (add integration tests)

**Step 1: Add integration tests**

Add tests to `src/App.spec.tsx` to verify:

1. Score displays in header during game
2. Score displays in win overlay
3. Scoreboard button opens scoreboard overlay
4. High-score entry form appears on win when qualifying

These tests depend on the existing App test patterns (rendering App, clicking squares). Follow the established mock patterns in `App.spec.tsx`.

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: All tests pass with coverage above 80%.

**Step 3: Run lint and type check**

Run: `pnpm run lint && pnpm run build`
Expected: Clean lint, successful build.

**Step 4: Commit**

```text
Adhoc: Added: Integration tests for score display and scoreboard
```

---

## Summary of all files touched

| File | Action |
|------|--------|
| `src/types.d.ts` | Modify — add `clickedMime?`, `wrongFlag?`, `ScoreEntry`, `DifficultyKey`, `ScoreboardData` |
| `src/utils/score.ts` | Create — `getBaseScore`, `decrementScore` |
| `src/utils/score.spec.ts` | Create — score utility tests |
| `src/gameReducer.ts` | Modify — add `score` to state, `revealMinesOnLoss`, update `START_GAME`/`TICK`/click actions |
| `src/gameReducer.spec.ts` | Modify — add mine-reveal and score tests |
| `src/Square.tsx` | Modify — render revealed mines (white), clicked mines (red), wrong flags (X) |
| `src/Square.spec.tsx` | Modify — add rendering tests for new states |
| `src/hooks/useScoreboard.ts` | Create — localStorage-backed scoreboard hook |
| `src/hooks/useScoreboard.spec.ts` | Create — scoreboard hook tests |
| `src/Scoreboard.tsx` | Create — scoreboard overlay component |
| `src/Scoreboard.spec.tsx` | Create — scoreboard component tests |
| `src/App.tsx` | Modify — wire score, scoreboard button, high-score entry |
| `src/App.css` | Modify — add scoreboard and high-score-entry styles |
| `src/App.spec.tsx` | Modify — add integration tests |
