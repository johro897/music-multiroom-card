# Tests

A single self-contained HTML file, zero dependencies (matches the card
itself — no build chain, no npm). Loads the real `music-multiroom-card.js`
into a real browser and drives it with fake `hass` objects, the same way
every fix in this repo has actually been verified during development —
this file just makes that reusable instead of writing it from scratch in a
scratch folder each time.

## Running it

Open `music-multiroom-card.test.html` directly in a browser (double-click
it, or drag it into a browser window) — relative `<script src>` loading
works fine for local `file://` pages in every real browser. If your
environment blocks that for some reason, serve the repo root with any
static file server instead and open `/test/music-multiroom-card.test.html`,
e.g.:

```bash
python -m http.server 8000
```

Results show inline on the page (pass/fail per case + a summary), and
also log to the browser console.

## What it covers

Everything that's actually been verified live or via scripted checks
throughout this project's development — favorite routing (Spotify vs.
Radio, HEOS vs. Music Assistant), which backend "drives" a room and how
that's determined, transport command routing and the double-tap guard,
the Play/Pause button's fallback behavior when a source doesn't support
`PAUSE`, solo-room grouping (`isSolo`) and the Active Groups strip, group
volume staying on HEOS regardless of what's playing, "Up Next" against
both backends, HTML-escaping, and the config editor's room/favorites
rendering and browse flow.

## Adding a case

Each test is `test('description', async () => { ... })` with
`assertEqual`/`assertTrue`/`assertDeepEqual` — see the existing cases for
the pattern for building a fresh card/editor instance and a fake `hass`.
Add a new case whenever a real bug is fixed, mirroring the pattern already
used throughout this file (most cases exist because something broke live
first) — that's what keeps this suite worth trusting.
