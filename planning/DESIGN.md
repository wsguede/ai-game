# Frontend Design

## Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Background | `#0d0d0d` | Page background |
| Primary accent | `#ffdd00` | Section headers, borders, buttons, highlights |
| Positive / green | `#4cff72` | Cash, gains, passing tests |
| Negative / red | `#ff4444` | Heat (high), teacher events, failures |
| Neutral / cyan | `#4ecdc4` | Intel events, neutral info |
| Warning / orange | `#ffa500` | Market events, mid-heat warning |
| Muted text | `#aaa` | Secondary labels, inactive states |
| Subtle borders | `#333` / `#222` | Dividers, container edges |
| Card backgrounds | `#1a1a1a` / `#141414` | Modals, tooltips, event boxes |

## Typography

- Font: `'Courier New', Courier, monospace` — everywhere, no exceptions
- Base: 13px body
- Labels and section headers: 10–11px, `letter-spacing: 2–4px`, ALL CAPS
- No font-weight variation except bold for notification strong tags

## Event Box Types

Each event type uses a distinct color scheme via the `cssClass` property:

| cssClass | Border | Background | Text | Use case |
|----------|--------|------------|------|----------|
| *(default/threat)* | `#ff4444` | `#1a0a0a` | `#ff8888` | Teacher caught, bully alert, suspicious close-call |
| `intel` | `#4ecdc4` | `#0a1a1a` | `#7ed9d4` | Tips and advance intel |
| `flavor` | `#444` | `#141414` | `#aaa` | Flavor text, neutral outcomes |
| `market` | `#ffa500` | `#1a1400` | `#ffcc88` | Calendar market events |

## Tooltip Pattern

CSS-only hover tooltips — no JavaScript. Parent has `position: relative`. Tooltip child has `display: none; position: absolute`. Parent `:hover` sibling rule sets `display: block`. Pointer events disabled on tooltip so hovering the tooltip itself doesn't cause flicker.

## Heat Display

10 pips (`div.heat-pip`). Each pip activates when `state.heat >= (i+1) * 10`. Color:
- `heat >= 70`: `.active` → `#ff4444` (red)
- `heat < 70`: `.warn` → `#ffa500` (orange)
- No heat: `#222` (dark)

## Button Conventions

- Standard: `.action-btn` — `#ffdd00` text, `#1a1a00` background, `#444` border
- Danger: `.action-btn.danger` — `#ff4444` text, `#1a0000` background
- Disabled: `opacity: 0.3; cursor: not-allowed`
- Active/selected: `.modal-btn-active` — `#2a2a00` background, `#ffdd00` border
