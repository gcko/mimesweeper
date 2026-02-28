# Comprehensive Test Suite Design

## Goal

Raise test coverage from ~35% to 80%+ across all metrics
(statements, branches, functions, lines) by adding tests
for every source file and extracting game logic for direct
unit testing.

## Approach

Bottom-up by module: pure utilities first, then hooks,
then extracted game logic, then components, then
integration.

## Sections

### Section 0: Setup

Add `test:coverage` script to package.json. Verify
baseline.

### Section 1: utils/coordinates.ts

New file: `src/utils/coordinates.spec.ts`

- `coOrdKey` — correct format for positive, zero,
  negative inputs
- `generateRandomCoOrd` — valid coordinate within board
  bounds
- `getCoOrd` — parses valid coordinates, throws on
  invalid input

### Section 2: enums.ts

New file: `src/enums.spec.ts`

- Verify enum values and member counts for `GridSize`,
  `MimeSize`, `AdjacentUpdate`

### Section 3: useInterval.ts

New file: `src/useInterval.spec.ts`

- Runs callback on interval when delay is set
- No-op when delay is null
- Runs when delay is 0
- Cleans up on unmount
- Updates callback without stale closure

### Section 4: Extract Game Logic + Tests

Extract to `src/utils/gameLogic.ts`:

- `newGame(size, squareSide)` — board creation
- `updateAdjacent({location, upcomingGame, type})`
- `allAdjacentMimesAreFlagged({location, upcomingGame})`
- `populateMimes(entries, numMimes, boardSize, coord)`
- `handleRightClick(square)` — returns square + delta
- `handleSquareClick(coOrd, game, square, numMimes,
  boardSize)` — returns game + count + lost flag
- `handleDoubleClick(coOrd, game, square, numMimes,
  boardSize)` — returns game + count + lost flag

New file: `src/utils/gameLogic.spec.ts`

Tests for every function covering:

- Happy paths and edge cases
- Board edges and corners
- Recursive opening behavior
- Win and loss detection
- Mine placement safety (first-click protection)

### Section 5: Square.tsx

New file: `src/Square.spec.tsx`

- Rendering states: unopened, opened, mine, flagged,
  game-over
- Color changes based on state
- Event handlers fire correctly
- Adjacent mines text display

### Section 6: App.tsx

Update: `src/App.spec.tsx`

- Game board rendering with correct dimensions
- Rules overlay show/dismiss
- Game-over overlay on win/loss
- Timer display and updates
- Flag counter behavior
- Restart and difficulty buttons
- Full game flow integration tests

## Key Decision

Game logic functions are extracted from App.tsx into
`src/utils/gameLogic.ts` to enable direct unit testing.
App.tsx imports and uses these functions, keeping its
tests focused on rendering and integration.

## Success Criteria

- All metrics at or above 80% coverage threshold
- Tests pass with `pnpm test`
- No `any` types, no `console.log`
- Biome lint passes
