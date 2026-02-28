# Knowledge Base

## Architecture

React 19 single-page game app rendered on HTML5 Canvas
via Konva. All game state managed with React hooks.
No routing.
-> docs/architecture.md

## Development

Setup, scripts, Docker, code quality tools (Biome,
Stylelint, Remark), and testing with Jest.
-> docs/development.md

## Styling

CSS custom properties, Sass, CSS nesting, color-mix().
Retro "Press Start 2P" font. Konva canvas for game
board, CSS for UI chrome.
-> docs/styling.md

## Deployment

AWS CodeBuild pipeline: pnpm build, S3 sync, CloudFront
invalidation. GitHub Actions CI for Node 22.x/24.x.
-> docs/deployment.md
