# Candy Wars

A browser-based trading game. Buy candy cheap, sell it high, and don't let Mrs. Henderson catch you. You've got 180 school days to make as much cash as possible before summer.

## Play

Open `docs/index.html` directly in your browser — no server needed.

## Develop

```bash
node --version  # should be 22.x (fnm/nvm auto-switch via .nvmrc)
npm install
npm run dev     # http://localhost:5173, hot reload
```

## Build

```bash
npm run build   # produces docs/
git add docs/
git commit -m "chore: build"
git push
```

`docs/` is committed to git and served by GitHub Pages.

## Test

Open `tests/index.html` in a browser. No CLI runner — tests run directly in the page. All tests must show ✓.

## Project Structure

```
src/
  data/          — static game data (candies, locations, events, eras)
  engine/        — game logic (state, market, heat, event-engine, ui, game)
  main.js        — barrel: imports all source files in dependency order
index.html       — Vite entry point; all HTML + CSS; onclick= handlers call window.Game.*
tests/           — browser-only test harness
docs/            — Vite build output, committed for GitHub Pages
planning/        — design specs, implementation plans, architecture and workflow docs
```

See `planning/ARCHITECTURE.md` for codebase internals and `planning/WORKFLOW.md` for git conventions.

## License

MIT — see `LICENSE`.
