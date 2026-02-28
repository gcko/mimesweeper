# AGENTS.md

## Project

Mimesweeper — a modern reimplementation of the classic
Windows Minesweeper game using HTML5 Canvas. Built with
React and Konva for canvas-based rendering. Deployed via
AWS CodeBuild to S3 + CloudFront.

## Tech Stack

- **Framework**: React 18.3.1 (functional components, hooks)
- **Language**: TypeScript 5.5.4 (strict mode)
- **Rendering**: Konva 9.3.14 + react-konva 18.2.10
- **Build Tool**: Vite 5.3.5
- **Styling**: Sass 1.77.8, CSS custom properties, nesting
- **Testing**: Jest 29.7.0, @testing-library/react 16.0.0
- **Package Manager**: npm
- **Runtime**: Node.js >= 20

## Essential Commands

```bash
npm install           # Install dependencies
npm start             # Dev server at localhost:3000
npm run build         # TypeScript check + Vite build
npm run serve         # Preview production build
npm test              # Run Jest test suite
npm run test:watch    # Jest in watch mode
npm run lint          # ESLint on TS/TSX/HTML files
npm run lint:fix      # ESLint auto-fix
npm run lint:markdown # Remark markdown validation
docker compose up     # Dev via Docker
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
| `mocks/` | Jest file mocks |
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

- Runs `npm test` (full Jest suite)
- Runs `npm run lint` (ESLint)
- Runs `npm run lint:markdown` (remark validation)

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
- Matrix: Node 20.x and 22.x
- Steps: `npm ci`, `npm test`, `npm run lint`,
  `npm run lint:markdown`

**AWS CodeBuild** (`buildspec.yml`):

- Build: `npm install` then `npm run build`
- Deploy: Sync `dist/` to S3 bucket
- Invalidate CloudFront distribution cache

## Common Pitfalls

- **Canvas mocking**: Jest requires `jest-canvas-mock`
  for Konva tests. Mapped in `jest.config.js`.
- **Image imports**: Static assets are mocked in tests
  via `mocks/fileMock.js`.
- **Coordinate type**: Template literal type
  `${string}|${string}`. Use `coOrdKey(x, y)` to
  generate, `getCoOrd(location)` to parse.
- **ESLint + Prettier**: ESLint handles both linting
  and formatting via `eslint-plugin-prettier`.
- **Stylelint**: Separate tool for CSS files. Allowed
  units: rem, px, fr, %, vh, vw, s, deg, ms.
- **Vite checker**: Runs TypeScript and ESLint checks
  in dev overlay (disabled by default).

## Additional Resources

- **[CLAUDE.md](./CLAUDE.md)** — Claude-specific details
- **[docs/](./docs/)** — Documentation index
