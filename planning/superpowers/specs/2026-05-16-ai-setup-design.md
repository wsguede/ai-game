# AI Agent Setup — Design Spec

**Date:** 2026-05-16
**Branch:** `chore/ai-setup`

## Goal

Make the Candy Wars project fully navigable by any AI agent — Claude Code, Gemini CLI, GitHub Copilot, OpenAI Codex, Ollama/Hermes — with consistent context, enforced quality gates, and minimal permission friction.

## Principles

- **Open standards first.** Enforcement lives in git hooks (works for all agents and humans). Agent-specific config files handle only what requires them.
- **Single source of truth.** `AGENTS.md` holds all universal project context. Agent-specific files (`CLAUDE.md`, `GEMINI.md`) are thin wrappers that reference it.
- **No new dependencies.** Git hooks are plain shell scripts; no Husky, no external tools.

---

## File Structure

```
AGENTS.md                        new — primary agent truth (all agents)
CLAUDE.md                        rewrite — @AGENTS.md + Claude-specific only
GEMINI.md                        new — @AGENTS.md + Gemini tool map

.claude/
  settings.json                  new, committed — plugin + permission allowlist
  settings.local.json            keep local, gitignored

.gemini/
  settings.json                  new, committed — Gemini project config

scripts/
  hooks/
    commit-msg                   new — conventional commit format guard
    pre-push                     new — tests + lint gate before any push
  setup-hooks.sh                 new — symlinks hooks into .git/hooks/

package.json                     add "setup-hooks" script
.gitignore                       add .claude/settings.local.json
```

---

## AGENTS.md — Single Source of Truth

Universal content that every agent needs to work correctly in this repo:

- **Project overview** — browser-based trading game, 180 school days, maximize cash
- **Tech stack** — vanilla JS, IIFE + window globals, HTML/CSS inline in index.html, Vite build only
- **Source layout** — `src/data/`, `src/engine/`, `main.js`, `tests/`, `docs/`, `planning/`
- **Window global pattern** — dual assignment: `var X = window.X = (function() { ... })()`. Cross-file deps captured at IIFE top via `var X = window.X`.
- **Load order** — `candies → locations → events → eras → state → market → heat → event-engine → ui → game`
- **Build & test commands** — `npm run dev`, `npm run build`, `npm test`, `npm run lint`, `npm run setup-hooks`
- **Git workflow** — GitHub Flow; all changes on feature branches; no direct commits to `main`; conventional commits; PR template
- **Safe operations** — pre-approved commands that don't need confirmation: `git status/log/diff`, `npm test`, `npm run lint`, `npm run dev`, `gh pr view/list`, `ls`, `find`, `cat`
- **Do not** — commit `docs/` (CI deploys it), commit to `main` directly, use frameworks or npm runtime deps, skip `npm run setup-hooks` on a fresh clone

---

## CLAUDE.md — Rewrite

Reduced to Claude Code-specific matters only. Claude Code supports `@path` file includes in CLAUDE.md — `@AGENTS.md` at the top pulls in all universal project context.

```
@AGENTS.md

# Claude Code Specific

## Superpowers Plugin
The superpowers plugin (v5.1.0) is installed project-scope. Skills auto-trigger
at session start via the SessionStart hook. Available skills: brainstorming,
writing-plans, executing-plans, test-driven-development, systematic-debugging,
requesting-code-review, verification-before-completion, and others. Use the
Skill tool to invoke them.

## Planning Docs
- Design specs: planning/superpowers/specs/YYYY-MM-DD-<name>-design.md
- Implementation plans: planning/superpowers/plans/YYYY-MM-DD-<name>.md
- Architecture: planning/ARCHITECTURE.md
- Design system: planning/DESIGN.md
- Workflow: planning/WORKFLOW.md
- Roadmap: planning/ROADMAP.md
```

---

## GEMINI.md

Two-liner that pulls in all project context and provides the Claude→Gemini tool name mapping:

```
@AGENTS.md

# Gemini CLI Tool Mapping
[table: Read→read_file, Write→write_file, Edit→replace, Bash→run_shell_command,
 Grep→grep_search, Glob→glob, TodoWrite→write_todos, Skill→activate_skill,
 WebSearch→google_web_search, WebFetch→web_fetch, Task→@generalist]
```

---

## .claude/settings.json (committed)

Enables the superpowers plugin and pre-approves routine commands so Claude Code doesn't prompt for them:

```json
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true
  },
  "permissions": {
    "allow": [
      "Skill(superpowers:*)",
      "Bash(ls *)",
      "Bash(find *)",
      "Bash(git status*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git add *)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(git checkout *)",
      "Bash(git pull*)",
      "Bash(npm run *)",
      "Bash(npm test*)",
      "Bash(gh pr *)",
      "Bash(gh issue *)",
      "Read(**)"
    ]
  }
}
```

No `PreToolUse` hooks — enforcement is handled by git hooks instead.

## .claude/settings.local.json

Stays local (gitignored). The `enabledPlugins` entry moves to `settings.json` so it's shared. `settings.local.json` retains only personal overrides that shouldn't be committed (e.g., `Read(//home/wsguede/.claude/plugins/**)`).

---

## .gemini/settings.json (committed)

Minimal project-level Gemini config. No hooks needed at project level (git hooks cover enforcement). Project-level policy engine is currently non-functional (Gemini [issue #18186](https://github.com/google-gemini/gemini-cli/issues/18186)); until fixed, users set allowlists in `~/.gemini/policies/` at user scope.

The file exists to establish the `.gemini/` project directory and serve as the placeholder for future project-level Gemini config (hooks, policyPaths) when the policy engine bug is resolved.

```json
{
  "general": {
    "defaultApprovalMode": "auto_edit"
  }
}
```

`auto_edit` mode auto-approves file read/write operations without prompting, matching the intent of the Claude Code `Read(**)` permission. Shell command approvals remain interactive by default.

---

## Git Hooks (Enforcement Layer)

### scripts/hooks/commit-msg

Validates every commit's first line against the conventional commit format before the commit is recorded. Works for all tools and humans.

**Pattern:** `^(feat|fix|docs|chore|refactor|test)(\(.+\))?: .{1,72}$`

On failure: exits 1 with an error message showing the required format and an example. Multi-line commit bodies and trailers are allowed freely.

### scripts/hooks/pre-push

Runs before any push to any remote. Executes `npm test && npm run lint` in sequence. If either fails, the push is blocked and the output is visible.

### scripts/setup-hooks.sh

Symlinks both hook scripts into `.git/hooks/` and sets them executable. Idempotent — safe to run multiple times.

### package.json

New script: `"setup-hooks": "bash scripts/setup-hooks.sh"`

One command per fresh clone: `npm run setup-hooks`.

---

## .gitignore Updates

Add:
```
.claude/settings.local.json
```

---

## What Each Agent Gets

| Agent | Context file | Config file | Enforcement |
|---|---|---|---|
| Claude Code | CLAUDE.md → @AGENTS.md | .claude/settings.json | git hooks + superpowers skills |
| Gemini CLI | GEMINI.md → @AGENTS.md | .gemini/settings.json | git hooks |
| GitHub Copilot | AGENTS.md | — | git hooks |
| OpenAI Codex | AGENTS.md | — | git hooks |
| Ollama/Hermes | AGENTS.md | — | git hooks |

---

## Out of Scope

- Project-specific custom skills (existing superpowers skills cover the workflow)
- Gemini extension install automation (per-user, not project config)
- CI changes (GitHub Actions already handles tests, lint, build, deploy)
