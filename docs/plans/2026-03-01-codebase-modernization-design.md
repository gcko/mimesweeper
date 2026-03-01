# Codebase Modernization Design

Date: 2026-03-01
Status: Approved

## Goal

Clean up, modernize, test, and increase robustness of the
Mimesweeper codebase using TDD refactoring patterns and
modern React/JavaScript best practices.

## Approach

Bottom-up extract and test. Start with pure logic
extractions (no React changes), add tests for each, then
refactor React components to use the new composable pieces.

Every step runs `pnpm test && pnpm run lint && npx tsc --noEmit`
before committing.

## Sections

### 1. Bug Fixes & Dependency Cleanup

- Fix `adjacentMimes` type: add missing `6` to union
  `0|1|2|3|4|5|6|7|8`
- Move `use-image` from devDependencies to dependencies
- Remove dead `isGameOver` field from `GameSquare` or
  verify its usage

### 2. Immutable Game Logic Extraction

Extract mutating game logic in `gameLogic.ts` into pure,
composable functions returning new objects:

- `updateAdjacent` returns new Map + count, no mutation
- `processRightClick` returns new GameSquare + flag delta
- `processSquareClick` returns new Map + open count
- `processDoubleClick` returns new Map + open count
- `populateMimes` uses a Set for deduplication instead of
  countdown failsafe

Each extraction: tests first (red), implementation (green),
cleanup (refactor).

### 3. Game State Reducer

Replace 8 `useState` hooks with `useReducer`:

```typescript
type GameAction =
  | { type: "START_GAME"; boardSize: GridSize; numMimes: MimeSize }
  | { type: "SQUARE_CLICK"; coordinate: Coordinate }
  | { type: "SQUARE_DOUBLE_CLICK"; coordinate: Coordinate }
  | { type: "SQUARE_RIGHT_CLICK"; coordinate: Coordinate }
  | { type: "TICK" }
  | { type: "TOGGLE_RULES" };

interface GameState {
  game: Map<Coordinate, GameSquare> | null;
  boardSize: GridSize;
  status: GameStatus;
  numMimes: MimeSize;
  numFlags: number;
  numOpenSpaces: number;
  playTime: number;
  showRules: boolean;
}
```

Eliminates nested state setter anti-pattern. Makes game
flow testable independently of React.

### 4. UI Component Extraction

Extract from App.tsx:

- `DifficultyButtons` — duplicated restart/difficulty group
- `GameOverlay` — win/loss overlay
- `RulesOverlay` — rules modal
- `GameHeader` — title, timer, flag counter

Each is a small, focused functional component. Event
handlers wrapped with `useCallback`.

### 5. Square.tsx Performance & Cleanup

- Hoist `gradientArray` to module scope (constant inputs)
- Remove useless `useEffect` cleanup function
- Replace `useState + useEffect` for color with `useMemo`
- Wrap event handlers with `useCallback`

### 6. Verification

After each step:

```bash
pnpm test && pnpm run lint && npx tsc --noEmit
```

Coverage target: maintain or improve 80%+ threshold.

## Baseline

- 133 tests passing across 6 test files
- Lint clean (Biome)
- Types clean (tsc --noEmit)

## Risks

- Konva mock setup in tests may need adjustment when
  extracting components
- useReducer migration touches all state, requiring
  careful test updates
- Immutable game logic may surface subtle bugs in
  flood-fill recursion
