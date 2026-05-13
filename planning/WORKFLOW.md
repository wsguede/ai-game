# Git Workflow

## Branching — GitHub Flow

`main` is always deployable. **All changes go on a feature branch — no direct commits to `main`.**

```
main
 └── feat/teacher-reform      ← branch off main
      └── [commits]
      └── PR → review → merge → main
```

**Workflow for every change:**
1. `git checkout -b <type>/<name>` — branch off latest `main`
2. Make changes, commit as you go
3. `git push -u origin <branch>`
4. Open a PR — CI runs tests, lint, and build automatically
5. Merge the PR — CI deploys to GitHub Pages
6. Delete the branch

**Branch naming:**
- `feat/<name>` — new feature
- `fix/<name>` — bug fix
- `chore/<name>` — tooling, deps, build
- `docs/<name>` — documentation only

Delete the branch after merge.

## Commit Standard — Conventional Commits

Format:
```
<type>: <short description>

- Bullet explaining one concrete thing that changed
- Bullet explaining another change or why it was needed
- Reference any constraints, tradeoffs, or non-obvious decisions

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

The **subject line** (first line) is the high-level summary — what changed, in plain English.
The **body** is the lower-level detail — what specifically was done, why, and anything a future reader needs to understand the decision. Omit the body only for genuinely trivial changes (a typo fix, a single constant rename).

**Allowed types:**

| Type | Use |
|------|-----|
| `feat:` | New feature or gameplay change |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Tooling, dependencies, build, config |
| `refactor:` | Code change with no behavior change |
| `test:` | Adding or updating tests |

**Subject line rules:**
- ≤72 characters
- Imperative mood: "add", "fix", "update" — not "added", "fixed", "updated"
- No trailing period
- Lowercase after the type prefix

**Examples:**
```
feat: two-stage teacher resolution — caught vs suspicious

- Low-value stash ($0–$20): confiscation only, no principal visit
- Medium-value stash ($20–$60): confiscation + principal visit
- High-value stash ($60+): confiscation + principal + heat spike
- Fixes flat-rate catch that didn't scale with how much candy you held
```

```
fix: load market and heat before state in main.js

- state.js captures window.Market and window.Heat at IIFE execution time
- Previous import order loaded state.js first, leaving both undefined
- Swapped order: market → heat → state
```

```
chore: install Vitest and configure jsdom test environment

- Vitest shares vite.config.js — no separate config file needed
- jsdom required because engine files reference window.* globals
- passWithNoTests: true so CI exits 0 before any test files exist
```

## PR Description Template

```markdown
## Summary
- [bullet describing what changed]
- [bullet describing why / what problem it solves]

## Test Plan
- [ ] `npm test` — all tests pass
- [ ] `npm run lint` — no errors
- [ ] Open game in browser (`npm run dev`) — plays correctly, zero console errors
- [ ] UI changes verified manually in browser

🤖 Generated with Claude Code
```

## CI/CD — What Runs on Push

GitHub Actions runs automatically on every push and PR:

| Job | Trigger | What it does |
|-----|---------|--------------|
| `test` | every push/PR | `npm test` — 63 Vitest unit tests |
| `lint` | every push/PR | `npm run lint` — ESLint on `src/` |
| `build` | after test+lint pass | `npm run build` — Vite build |
| `deploy` | push to `main` only | Deploys `docs/` to `pages` branch → GitHub Pages |

`docs/` is **gitignored** — never commit it manually. CI produces and deploys it automatically.
