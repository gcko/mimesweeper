# AGENTS.md

## Project

Mimesweeper — a modern reimplementation of the classic
Windows Minesweeper game using HTML5 Canvas. Built with
React and Konva for canvas-based rendering. Deployed via
AWS CodeBuild to S3 + CloudFront.

## Tech Stack

- **Framework**: React 19 (functional components, hooks)
- **Language**: TypeScript 5.8 (strict mode)
- **Rendering**: Konva 10 + react-konva 19
- **Build Tool**: Vite 6
- **Styling**: Sass, CSS custom properties, nesting
- **Testing**: Vitest 4, @testing-library/react 16, happy-dom
- **Linter/Formatter**: Biome
- **Package Manager**: pnpm (via corepack)
- **Runtime**: Node.js ^22 || ^24

## Essential Commands

```bash
pnpm install           # Install dependencies
pnpm start             # Dev server at localhost:3000
pnpm run build         # TypeScript check + Vite build
pnpm run serve         # Preview production build
pnpm test              # Run Vitest test suite
pnpm run test:watch    # Vitest in watch mode
pnpm run lint          # Biome check on TS/TSX files
pnpm run lint:fix      # Biome auto-fix
pnpm run format        # Biome format
pnpm run lint:markdown # Remark markdown validation
docker compose up      # Dev via Docker
```

## Repository Layout

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main game component |
| `src/Square.tsx` | Game square (Konva canvas) |
| `src/types.d.ts` | TypeScript type definitions |
| `src/enums.ts` | Game constants and enums |
| `src/utils/coordinates.ts` | Coordinate utilities |
| `src/useInterval.ts` | Custom hook for game timer |
| `src/App.spec.tsx` | Component tests |
| `src/App.css` | Game styling |
| `src/images/` | Game assets |
| `public/` | Static assets |
| `vitest-setup.ts` | Vitest setup (canvas mock) |
| `vitest.config.ts` | Vitest configuration |
| `.husky/` | Git hooks |
| `buildspec.yml` | AWS CodeBuild config |

## Where to Add Code

| Task | Location |
|------|----------|
| New game component | `src/<Name>.tsx` |
| New utility function | `src/utils/<name>.ts` |
| New type definition | `src/types.d.ts` |
| New enum/constant | `src/enums.ts` |
| New game asset | `src/images/` |
| New test | `src/<Name>.spec.tsx` |
| CSS styles | `src/App.css` or `src/<Name>.css` |

## Critical Constraints

### Always

- Use TypeScript strict mode (via `tsconfig.json`)
- Use functional React components with hooks
- Use Konva/react-konva for canvas rendering
- Use `Map<Coordinate, GameSquare>` for game state
- Use single quotes, semicolons, no trailing commas
- Use 2-space indentation
- Use `src/` base path for imports (tsconfig baseUrl)
- Maintain 80% test coverage threshold

### Never

- Do NOT use `any` type (strict TypeScript)
- Do NOT use `console.log` (use `warn`/`error`)
- Do NOT reassign function parameters
- Do NOT bypass git hooks with `--no-verify`
- Do NOT use DOM elements for game board rendering

## Git Hooks (Husky)

**Pre-commit** (`.husky/pre-commit`):

- Runs `pnpm test` (full Vitest suite)
- Runs `pnpm run lint` (Biome)
- Runs `pnpm run lint:markdown` (remark validation)

**Commit-msg** (`.husky/commit-msg.cjs`):

- Validates custom commit message format
- Accepts merge branch/remote-tracking commits

## Commit Conventions

Custom format:
`[Issue ID|Adhoc]: [Change Type]: [Message]`

| Change Type | Purpose |
|-------------|---------|
| `Added` | New feature or file |
| `Removed` | Deleted feature or file |
| `BugFix` | Bug fix |
| `Modified` | Change to existing feature |
| `Feature` | New capability |
| `Merged` | Merge-related change |
| `Refactored` | Code restructuring |
| `Release` | Version bump or release prep |

Issue prefixes: `Close`, `Closes`, `Closed`, `Fix`,
`Fixes`, `Fixed`, `Resolve`, `Resolves`, `Resolved`
(followed by `#<number>`) or `Adhoc` for non-issue work.

```bash
git commit -m "Adhoc: Added: new difficulty level"
git commit -m "#42: BugFix: fix mine placement"
git commit -m "Closes #15: Feature: add touch support"
```

## Git Branching

The default branch is `main`. All PRs target `main`.
There is no `master` branch.

## CI/CD

**GitHub Actions** (`.github/workflows/node.js.yml`):

- Triggers: push to main, PRs to main
- Matrix: Node 22.x and 24.x
- Steps: `pnpm install --frozen-lockfile`, `pnpm test`,
  `pnpm run lint`, `pnpm run lint:markdown`

**AWS CodeBuild** (`buildspec.yml`):

- Build: `pnpm install` then `pnpm run build`
- Deploy: Sync `dist/` to S3 bucket
- Invalidate CloudFront distribution cache

## Common Pitfalls

- **Canvas mocking**: Vitest uses a manual canvas 2D
  context mock in `vitest-setup.ts` for Konva tests.
- **Image imports**: Vitest handles static assets
  natively via Vite's module resolution.
- **Coordinate type**: Template literal type
  `${string}|${string}`. Use `coOrdKey(x, y)` to
  generate, `getCoOrd(location)` to parse.
- **Biome**: Handles both linting and formatting
  via `biome.json`. Replaces ESLint + Prettier.
- **Stylelint**: Separate tool for CSS files. Allowed
  units: rem, px, fr, %, vh, vw, s, deg, ms.
- **Vite checker**: Runs TypeScript and Biome checks
  in dev overlay (disabled by default).

## Additional Resources

- **[CLAUDE.md](./CLAUDE.md)** — Claude-specific details
- **[docs/](./docs/)** — Documentation index
