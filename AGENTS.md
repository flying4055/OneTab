# AGENTS.md

## TL;DR
- This repo is a **Chrome/Edge MV3 new-tab extension** (no build step).
- Runtime entry: `manifest.json` -> `index.html` -> `static/js/app.js`.
- Keep changes **small, modular, and browser-safe**.
- Current codebase is plain HTML/CSS/ES modules; no package manager scripts.

## Directory Map
- `manifest.json`: MV3 config, new-tab override, CSP, permissions.
- `index.html`: page shell, context menu, modals, settings UI.
- `nav.json`: seed bookmarks/categories.
- `static/css/styles.css`: global styles and component styles.
- `static/js/app.js`: app bootstrap and feature wiring.
- `static/js/core/`: shared constants/state/utils/elements.
- `static/js/features/`: UI/domain modules (sites, tabs, search, modals, settings, wallpaper, etc.).
- `static/js/services/`: storage and icon-related services.
- `static/img/`: static assets.
- `ARCHITECTURE.md` / `ARCHITECTURE_PROPOSAL.md`: architecture notes.

## Key Code Entrypoints
- Bootstrap:
  - `static/js/app.js`
  - `static/js/features/sites.js`
  - `static/js/features/tabs.js`
- Data flow:
  - `static/js/services/navStorage.js` (`nav_data_v1` persistence)
  - `static/js/core/state.js` (runtime state container)
- Icon flow:
  - `static/js/services/favicon.js` (candidate resolution + runtime loading)
  - `static/js/services/iconFetcher.js` exists but is currently not wired to app bootstrap
- User edits:
  - `static/js/features/modals.js`
  - `static/js/features/contextMenuActions.js`

## Dev / Run / Test Commands
- Quick local static preview:
  - `python -m http.server 8123`
  - Open `http://127.0.0.1:8123/index.html`
- Extension run (recommended):
  1. Open `chrome://extensions` or `edge://extensions`
  2. Enable Developer Mode
  3. Load unpacked -> select repo root
- Syntax checks (no lint pipeline configured):
  - `node --check static/js/app.js`
  - `node --check static/js/services/favicon.js`
  - `node --check static/js/features/sites.js`
- Repo search:
  - `rg "pattern" static/js`

## Deployment Notes
- This project is deployed as an unpacked/packed browser extension.
- Before release:
  1. Bump `version` in `manifest.json`.
  2. Re-check permissions and CSP changes.
  3. Validate new-tab override behavior in Chrome and Edge.
  4. Verify localStorage data compatibility (`nav_data_v1`, `tab_state_v1`, `wallpaper_v1`).
- If packaging manually (optional):
  - Use browser “Pack extension” flow or zip project root (exclude `.git`, local temp files).

## Strict Coding Rules (Must Follow)
1. **Identifiers must be English only**  
   Includes variables, functions, classes, constants, CSS classes, HTML attributes, and file names.
2. **User-facing copy must be English only**  
   Includes UI text, alerts, placeholders, labels, modal titles, menu text, and empty states.
3. **Key logic comments must be Simplified Chinese**  
   Add concise Chinese comments only where logic is non-obvious.
4. **All source files must be UTF-8 encoded**  
   No garbled text, no mixed encodings.
5. Keep modules focused; avoid putting new cross-feature logic into `app.js` unless it is bootstrap wiring.
6. Prefer non-breaking changes to persisted data; if schema-like changes are needed, add compatibility handling.

## Agent Working Style
- Make minimal, reversible edits.
- Confirm behavior with direct checks (`node --check`, manual extension reload).
- Do not silently ignore persistence or icon-loading failures; surface actionable logs.
