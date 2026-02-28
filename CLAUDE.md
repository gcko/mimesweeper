@AGENTS.md

<!-- Above imports universal agent instructions. -->

## Architecture Details

The game is a single-page React application rendered
entirely on an HTML5 Canvas via Konva. There is no
routing — the entire game lives in `src/App.tsx`. State
is managed with React hooks (`useState`, `useEffect`,
custom `useInterval`).

The game board is a `Map<Coordinate, GameSquare>` where
`Coordinate` is a template literal type. Squares are
rendered as Konva `Group` elements containing `Rect`,
`Text`, and `Image` shapes. The `Square` component
handles all visual states: unopened, opened (with
adjacent count), flagged, and mine-revealed.

Game flow: `waitingStart` then `inProgress` then
`gameOverWon` or `gameOverLost`. Mines are placed after
the first click to guarantee a safe start.

## Key Types

```typescript
type Coordinate = `${string}|${string}`;
type GameStatus =
  | 'waitingStart'
  | 'inProgress'
  | 'gameOverWon'
  | 'gameOverLost';

interface GameSquare {
  mime: boolean;
  adjacentMimes: number;
  opened: boolean;
  flagged: boolean;
}
```

## Rendering Architecture

All game board rendering uses Konva (HTML5 Canvas),
not DOM elements:

- `Stage`, `Layer`, `Group` (per square), `Rect` +
  `Text`/`Image`
- Color gradients for adjacent mine counts (0-8) via
  `javascript-color-gradient`
- Images loaded with `use-image` hook
- Click, double-click, right-click, and touch events
  handled at the `Square` level

## Styling Architecture

CSS uses modern features:

- Custom properties: `--white`, `--black`,
  `--button-bg-color`
- CSS nesting (`&` selector)
- `color-mix()` for hover/active states
- Retro font: "Press Start 2P" from Google Fonts
- Fixed positioning for game overlays (win/lose)
- Flexbox for button layouts and controls

No Tailwind — styling is plain CSS/Sass in
`src/App.css` and `src/index.css`.

## Code Quality Rules

Biome (`biome.json`) handles linting and formatting:

- `recommended: true` with strict TypeScript rules
- `noConsole: warn` (allow `warn` and `error`)
- `noParameterAssign: error`
- Formatter: double quotes, semis, no trailing commas,
  2-space indentation

Stylelint (`.stylelintrc`) for CSS files:

- Standard config with unit allowlist:
  rem, px, fr, %, vh, vw, s, deg, ms
- Block-no-empty, color-no-invalid-hex enforced
- Max 1 ID selector per rule

## Testing Architecture

Vitest 4 with happy-dom:

- Canvas 2D context mock in `vitest-setup.ts` for
  Konva tests
- Vitest globals enabled (`describe`, `test`, `expect`)
- Coverage via `@vitest/coverage-v8`
- Coverage threshold: 80% across all metrics
- Test environment: happy-dom
- Config: `vitest.config.ts` with react-konva ESM alias

## Game Enums

```typescript
enum GridSize {
  XS = 5, S = 10, M = 20, L = 30, XL = 40
}
enum MimeSize {
  XS = 5, S = 10, M = 25, L = 50, XL = 100
}
enum AdjacentUpdate { mimes, open, forceOpen }
```

Difficulty levels pair GridSize with MimeSize.

## Git Hooks

Husky v9 manages git hooks via `.husky/` directory:

**Pre-commit**: Runs the full test suite (`pnpm test`),
Biome (`pnpm run lint`), and markdown linting
(`pnpm run lint:markdown`). All three must pass.

**Commit-msg**: Custom validator in
`.husky/commit-msg.cjs`.
Format: `[Issue|Adhoc]: [Type]: [Message]`.
Accepts merge branch commits automatically. Message
must be at least 15 characters.

## Commit Message Format

Messages follow the custom format:
`[Issue ID|Adhoc]: [Change Type]: [Description]`

Multi-word descriptions should clearly state the change:

```bash
# Examples:
# Adhoc: Refactored: extract coordinate utilities
# #42: BugFix: prevent mine placement on first click
# Closes #15: Feature: add timer display
```

Merge commits (`Merge branch...` and
`Merge remote-tracking...`) are accepted automatically.

## Git Branching

The default branch is `main`. All PRs target `main`.
There is no `master` branch — do not reference or
create one.

## Deployment

AWS CodeBuild (`buildspec.yml`) handles deployment:

1. `pnpm install` then `pnpm run build` (tsc + vite)
2. Sync `dist/` to S3 bucket
   `mimesweeper.variable.team`
3. Upload `index.html` with no-cache headers
4. Invalidate CloudFront distribution `E18SWP6XMGAWB0`

## Deeper Documentation

See `docs/` for full documentation index.
