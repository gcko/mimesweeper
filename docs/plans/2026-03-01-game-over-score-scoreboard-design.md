# Game Over Reveal, Score, and Scoreboard Design

## Summary

Three features that bring Mimesweeper closer to classic
Minesweeper behavior and add replayability:

1. Reveal all mines when the player loses
2. Calculate a score based on board size and elapsed time
3. Persist a top-10 scoreboard per difficulty in localStorage

## Feature 1: Reveal Mines on Game Over

### Problem

When a player clicks a mine and loses, only the clicked
mine appears. The player cannot see where the other mines
were, which removes the "aha" moment that classic
Minesweeper provides.

### Design

**GameSquare additions** (`types.d.ts`):

- `clickedMime?: boolean` — marks the mine the player
  clicked (the one that caused the loss)
- `wrongFlag?: boolean` — marks non-mine squares that
  the player flagged incorrectly

**Reducer changes** (`gameReducer.ts`):

When `processSquareClick` returns `lost: true`:

1. Set `clickedMime: true` on the detonated square.
2. Iterate all squares in the cloned game map:
   - Mine, unopened, unflagged: set `opened: true`
     (reveals the mine).
   - Non-mine, flagged: set `wrongFlag: true`
     (marks the mistake).
   - Flagged mines stay flagged (correct placement).

**Square.tsx rendering** — three visual states on
game-over:

| State | Background | Icon |
|-------|-----------|------|
| Clicked mine (`clickedMime`) | Red (#f80000) | Mime image |
| Revealed mine (not clicked) | White (#FFFFFF) | Mime image |
| Wrong flag (`wrongFlag`) | White | Flag + X overlay |

Correctly flagged mines keep their flag appearance.

On win: no reveal needed. The player already deduced
every mine location.

## Feature 2: Score Mechanism

### Motivation

No incentive to replay or improve. The timer runs but
produces no score.

### Score Design

**Formula**:

```text
baseScore = 1000 + (1000 x 5 x difficultyMultiplier)

  S  → multiplier 0 → base 1000
  M  → multiplier 1 → base 6000
  L  → multiplier 2 → base 11000
  XL → multiplier 3 → base 16000

score = max(0, baseScore - (elapsedSeconds x 5))
```

The score decrements by 5 each second and bottoms at 0.

**State changes** (`GameState` in `types.d.ts`):

- Add `score: number`.

**Reducer changes** (`gameReducer.ts`):

- `START_GAME`: compute and store `score` from the
  selected difficulty.
- `TICK`: `score = Math.max(0, state.score - 5)`.

**Utility** (`src/utils/score.ts`):

- `getBaseScore(gridSize: GridSize): number` — maps
  grid size to base score.

**Display**: Show the final score as large text in the
win overlay.

## Feature 3: Top 10 Scoreboard

### Persistence Gap

No persistent record of achievement. Scores vanish on
page refresh.

### Scoreboard Design

**Data model** (`types.d.ts`):

```typescript
interface ScoreEntry {
  name: string;
  score: number;
}
type DifficultyKey = "S" | "M" | "L" | "XL";
type ScoreboardData = Record<DifficultyKey, ScoreEntry[]>;
```

**Storage**: localStorage key `"mimesweeper-scoreboard"`.

**Default data**: each difficulty pre-populated with 10
entries of `{ name: "JMS", score: 100 }`.

**Hook** (`src/hooks/useScoreboard.ts`):

- `scores` — current `ScoreboardData`
- `addScore(difficulty, name, score)` — insert into
  sorted list, trim to 10, persist
- `isHighScore(difficulty, score)` — true if the score
  qualifies for the top 10
- `getScores(difficulty)` — sorted entries for one
  difficulty

**Scoreboard component** (`src/Scoreboard.tsx`):

- DOM overlay matching existing overlay patterns
- Difficulty tabs or selector to switch between lists
- Numbered list: rank, name, score
- Accessible via a "Scoreboard" button in the game
  header

**Win overlay changes** (`src/App.tsx`):

- Show final score prominently.
- If `isHighScore()` returns true, render a text input
  for the player's name and an "Add Score" button.
- After submission, display the updated scoreboard for
  that difficulty.

**Styling**: existing CSS overlay patterns, retro
"Press Start 2P" font. No new frameworks.

## Files Changed

| File | Change |
|------|--------|
| `src/types.d.ts` | Add `clickedMime`, `wrongFlag`, `score`, scoreboard types |
| `src/gameReducer.ts` | Mine reveal on loss, score init/decrement |
| `src/Square.tsx` | Render revealed mines, wrong flags |
| `src/utils/score.ts` | New — `getBaseScore` utility |
| `src/hooks/useScoreboard.ts` | New — localStorage scoreboard hook |
| `src/Scoreboard.tsx` | New — scoreboard overlay component |
| `src/App.tsx` | Wire score display, scoreboard button, win overlay changes |
| `src/App.css` | Scoreboard styles, wrong-flag styles |
| `src/images/` | Possible X overlay image for wrong flags |

## Testing

- Reducer tests: mine reveal on loss, wrong flag marking,
  score computation, tick decrement
- Score utility: base score per difficulty, floor at 0
- Scoreboard hook: add/read/sort/trim, localStorage
  read/write, default population
- Component tests: overlay rendering, score display,
  name input behavior
