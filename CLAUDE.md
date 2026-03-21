# GeoCat — CLAUDE.md

## Project Overview

GeoCat is an interactive geography practice app for Catalan firefighter (Bombers) exam preparation. Users practice identifying comarques, capitals, and municipalities on a map. Also includes USA states/capitals.

**Stack**: Vanilla JS + HTML5 + CSS3 · Leaflet.js v1.9.4 (CDN) · localStorage (no backend) · Playwright (E2E tests)

**Language**: All UI text is in Catalan.

---

## File Structure

```
index.html          — All 5 screens + fire background
app.js              — Game logic, global state, Leaflet map
utils.js            — Auth, storage, leaderboard, UI helpers
style.css           — Fire-themed design system
data/
  catalunya/
    comarques.geojson       — 42 comarques GeoJSON features
    capitals.json           — Comarca → Capital mappings
    municipis_barcelona.json
    municipis_girona.json
    municipis_lleida.json
    municipis_tarragona.json
  usa/
    states.json             — USA states with region info
    capitals.json           — State → Capital mappings
tests/
  app.spec.ts       — Playwright E2E tests
playwright.config.ts
```

---

## Architecture

### No modules — shared globals
Both `app.js` and `utils.js` run in the same global scope. They share variables via `window` (no ES6 imports/exports). When editing either file, be aware that all top-level `let`/`const`/`function` declarations are globally accessible.

### Key global state (app.js)
| Variable | Type | Purpose |
|---|---|---|
| `currentUser` | string\|null | Logged-in username |
| `activeDataset` | string | `'catalunya'` or `'usa'` |
| `gameMode` | string | `'COMARCA'`, `'CAPITAL'`, or `'MUNICIPI'` |
| `map` | L.Map | Leaflet instance |
| `geojsonLayer` | L.GeoJSON | Active GeoJSON layer |
| `capitals` | object | Comarca/State → Capital name |
| `municipis` | object | Municipality → Comarca name |
| `currentAnswer` | string | Correct comarca/state name for current question |
| `pendingAnswers` | array | Regions yet to answer |
| `completedAnswers` | Set | Answered regions (used for map coloring) |
| `scoreCorrect` / `scoreWrong` | number | Current game score |
| `scoreSaved` | boolean | Prevents double-saving score |

### Game modes
- **COMARCA**: Click the named comarca on the map
- **CAPITAL**: Given the capital city, click its comarca
- **MUNICIPI**: Given a municipality, click its comarca

In MUNICIPI mode, `currentAnswer` is the **comarca name** (not the municipality).

### Screens
- `#screen-login` — auth (login/register)
- `#screen-home` — dataset selector, leaderboard, stats
- `#screen-game` — Leaflet map + question UI
- `#screen-leaderboard` — rankings
- `#modal-gameover` — end-of-game results

Use `showScreen(id)` from `utils.js` to navigate.

---

## Important Patterns

### Async auth
`handleAuth()` is async. Passwords are hashed with SHA-256 via Web Crypto API (`hashPassword()` / `verifyPassword()` in `utils.js`). Old plain-text passwords are migrated transparently on login.

### Lazy loading municipalities
`loadMunicipis()` caches its Promise to avoid duplicate fetches. Called only when entering MUNICIPI mode.

### Double-score prevention
`scoreSaved` flag is set `true` in `showGameOver()`. `goHome()` checks `!scoreSaved` before saving. `loadDataset()` resets it.

### transitionend instead of setTimeout
`startGame()` listens for `transitionend` (filtered to `opacity`) with a 500ms fallback.

### XSS prevention
Always use `escapeHtml()` (utils.js) when inserting user-controlled strings into innerHTML.

### Dynamic selects
`initSelects()` (app.js) generates `<option>` elements from `vegueries`/provincias objects. Don't hardcode options in HTML.

---

## CSS Design System

Variables defined in `:root`:
- `--red: #E52222`, `--red-hover: #b02020`
- `--orange: #FF6B1A`, `--amber: #FFB020`
- `--green: #2ecc71`

Fonts: Bebas Neue (headings), Barlow Condensed (UI), Barlow (body) — all via Google Fonts CDN.

State classes: `.hidden`, `.show`, `.selected`, `.active`, `.me`

---

## Data Conventions

- **Vegueria**: administrative grouping of comarques (7 vegueries for 42 comarques)
- `vegueries` object maps vegueria name → array of comarca names
- `vegueriaColors` maps vegueria name → hex color for map
- GeoJSON comarca features use property `nom_comar` as the canonical name
- Municipality keys in `municipis_*.json` map to comarca names

---

## Running Locally

```bash
npm run serve     # serves on port 3000 (uses `serve` package)
npm test          # Playwright E2E tests
```

Note: The test in `tests/app.spec.ts` uses `http://127.0.0.1:5500/index.html` (Live Server URL), not the `playwright.config.ts` base URL (`http://localhost:3000`).

---

## What to Avoid

- Do not add a framework or bundler — this is intentionally vanilla JS
- Do not use ES6 modules (`import`/`export`) — breaks the shared-globals pattern
- Do not inline user data into HTML without `escapeHtml()`
- Do not add `Promise.all` for municipis at top-level — lazy loading is intentional
- Do not add backend/server code — localStorage is the only persistence layer
