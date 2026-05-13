# Git Workflow

## Branching — GitHub Flow

`main` is always deployable. All new work goes on a short-lived feature branch.

```
main
 └── feat/teacher-reform      ← branch off main
      └── [commits]
      └── merge → main        ← PR or direct merge
```

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

[optional body]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

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
fix: trend indicator shows change vs last seen price
docs: add v1.6 design spec — project structure overhaul
chore: add Vite build pipeline
refactor: move engine and data files into src/
test: add teacherCaught boundary tests
```

## PR Description Template

```markdown
## Summary
- [bullet describing what changed]
- [bullet describing why]

## Test Plan
- [ ] Open tests/index.html — all tests pass
- [ ] Open game in browser — plays correctly, zero console errors
- [ ] npm run build — docs/ produced, opens via file://

🤖 Generated with Claude Code
```

## Build Before Pushing

Always run `npm run build` and commit `docs/` before pushing a release to `main`. GitHub Pages serves from `docs/`.
