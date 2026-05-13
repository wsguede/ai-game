# GitHub Actions CI/CD — Design Spec

## Goal

Add a full CI/CD pipeline: tests, linting, build verification, and automated deployment to the `pages` branch on push to `main`. Remove `docs/` from `main` — the build output is produced exclusively by CI.

## Architecture

Four jobs in a single workflow (`.github/workflows/ci.yml`). `test` and `lint` run in parallel; `build` depends on both; `deploy` depends on `build` and only fires on `main`.

```
test  ──┐
         ├── build ── deploy (main only)
lint  ──┘
```

CI runs on every push and every PR. Deploy is gated to `main`.

## Tech Stack

- **Vitest** — unit test runner; shares Vite config, no separate config file needed
- **ESLint** — bug-catching linter; flat config (`eslint.config.js`); browser + ES2022 globals
- **peaceiris/actions-gh-pages** — deploys `docs/` to `pages` branch; pinned to SHA
- **Node 22** — matches `.nvmrc`

---

## Section 1: Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI/CD

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: docs/

  deploy:
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@84c30a85c19949d7eee79c4ff27748b70285e453  # v4.1.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
          publish_branch: pages
```

Notes:
- `peaceiris/actions-gh-pages` is pinned to the SHA for `v4.0.0` for security
- `build` uploads `docs/` as an artifact so the output is inspectable in the Actions UI
- `deploy` re-runs the build rather than downloading the artifact — simpler, avoids artifact permissions complexity
- `cache: 'npm'` caches `node_modules` between runs keyed to `package-lock.json`

## Section 2: Vitest

**New dev dependency:** `vitest`

**New script in `package.json`:** `"test": "vitest run"`

No separate config file — Vitest picks up `vite.config.js` automatically.

**Test file locations:** `src/tests/heat.test.js`, `src/tests/market.test.js`, `src/tests/state.test.js`, `src/tests/event-engine.test.js`

The existing browser-based tests in `tests/index.html` (which use custom `test()`/`assertEqual()` helpers) are ported to Vitest's `describe`/`it`/`expect` API. `tests/index.html` is kept as a manual reference but is no longer the primary test vehicle.

**Vitest environment:** `jsdom` — needed because the engine files reference `window.*` globals. Add `"test": { "environment": "jsdom" }` to `vite.config.js`.

**What gets ported:**
- `heat.test.js` — decay, generation, teacher/bully probability, outcome resolution
- `market.test.js` — price calculation, volatility bounds, location modifiers
- `state.test.js` — init, stash mutations, cash mutations, turn state
- `event-engine.test.js` — event selection, eligibility filters, effect execution

UI and Game have no automated tests — DOM-heavy, verified manually in browser.

## Section 3: ESLint

**New dev dependency:** `eslint`

**New script in `package.json`:** `"lint": "eslint src/"`

**New file:** `eslint.config.js` (flat config format, ESLint 9+)

```js
import globals from 'globals';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
];
```

**New dev dependency:** `globals` (peer dep of ESLint flat config for browser globals)

Scope: `src/` only. `tests/` excluded from lint (Vitest globals need a separate override that's not worth the complexity). `index.html` inline `onclick=` handlers are not linted.

## Section 4: docs/ Cleanup

**Remove from git tracking:**
```bash
git rm -r --cached docs/
```

**Add to `.gitignore`:**
```
docs/
```

**GitHub Pages settings (manual step in GitHub UI):**
Change Pages source from "Deploy from branch: main / docs" to "Deploy from branch: pages / root".

**README.md update:** Remove the `git add docs/ && git commit` step from the Build section. Replace with: "Push to `main` — GitHub Actions builds and deploys automatically."

**CLAUDE.md update:** Update the Build and Deploy section to reflect that `docs/` is no longer committed manually.

## Out of Scope

- Prettier / code formatting
- Dependabot / automated dependency updates
- Notifications (Slack, email)
- Test coverage reporting
- Branch protection rules (GitHub UI setting, not a file)
