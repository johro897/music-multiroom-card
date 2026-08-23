# Music Multiroom Card

A full-page Home Assistant Lovelace card for controlling whole-home audio.
Built and tested against Home Assistant's **HEOS** integration. It uses
HA's generic `media_player` join/unjoin/`play_media` services, but is not
tested against — and makes no compatibility claim for — Sonos, Bluesound,
or any other platform.

![Music Multiroom Card overview](screenshots/overview.svg)

> The image above is a schematic preview drawn from the card's approved
> design, not a live screenshot yet — see the note in this repo's
> `CLAUDE.md` about swapping it for a real one once the card has been
> verified against a live HEOS system.

---

## Features

- **Multiple simultaneous groups.** Group any set of rooms and play
  something on them while a completely different group plays something
  else — an "Active Groups" strip lets you switch which group's controls
  (now playing, volume, favorites) you're looking at.
- **Tap rooms to group them.** Tap an idle room to start a new group or add
  it to the currently focused one; tap a room already in the focused group
  to remove it.
- **Group volume + per-room fine adjustment.** One slider for the whole
  group, with an expandable per-room slider that preserves relative balance
  rather than forcing every speaker to the same level.
- **Spotify + Radio favorites shelf.** Spotify playlists are configured by
  hand (name + Spotify URI, saved as a HEOS favorite); radio stations are
  picked visually in the card editor by browsing what's already in your
  HEOS Favorites/TuneIn — no station IDs to hunt down.
- **Built-in GUI editor**, including the radio browse-and-pick flow — no
  YAML required to configure the card.
- English/Swedish UI, theme-aware colors (dark and light Home Assistant
  themes both work — only the group-identity color coding is a fixed
  palette, since it needs to visually distinguish arbitrary simultaneous
  groups from each other).

## Installation

### Via HACS (recommended, once added to the default store)

Search for "Music Multiroom Card" in HACS → Frontend, install, then add the
card via the Lovelace UI ("+ Add Card" → "Music Multiroom Card") or as
`type: custom:music-multiroom-card` in YAML.

### Manual install

1. Copy `music-multiroom-card.js` to `/config/www/`.
2. Add it as a Lovelace resource: **Settings → Dashboards → Resources → Add
   Resource**, URL `/local/music-multiroom-card.js`, type **JavaScript
   Module**.

For a dedicated tablet dashboard, put this card alone on a view set to
**Panel** mode so it fills the whole screen.

## Configuration

The card has no visible options other than what you configure through its
GUI editor: your rooms (which `media_player` entities are groupable) and
your Spotify/Radio favorites. The equivalent YAML shape:

```yaml
type: custom:music-multiroom-card
rooms:
  - entity: media_player.heos_living_room
    name: Living Room
    icon: mdi:sofa
  - entity: media_player.heos_kitchen
    name: Kitchen
    icon: mdi:fridge
favorites:
  spotify:
    - name: Chill Mix
      icon: mdi:spotify
      media_content_type: playlist
      media_content_id: "Chill Mix"
  radio:
    - name: Sveriges Radio P3
      icon: mdi:radio
      media_content_type: favorite
      media_content_id: 3
```

### Options

| Option | Type | Required | Description |
|---|---|---|---|
| `rooms` | list | yes | Media player entities that can be grouped. Each entry: `entity`, optional `name` (defaults to the entity id), optional `icon` (defaults to `mdi:speaker`). |
| `favorites.spotify` | list | no | Spotify playlists saved as HEOS favorites. Each entry: `name`, optional `icon`, `media_content_id` (the HEOS favorite's name/URI). Add these by hand in the editor — there's no reliable way to browse "just Spotify" out of HEOS's mixed favorites list. |
| `favorites.radio` | list | no | Radio stations. **Populated by the card editor's browse picker**, not typed in by hand — open the editor, pick a room to browse from, click "Browse HEOS favorites", tick the stations you want. |

> **Note on favorites:** runtime playback always replays the saved
> `media_content_type`/`media_content_id` for a favorite — the card never
> re-browses HEOS live while you're using the dashboard, so it stays fast
> and doesn't break if HEOS is briefly unreachable.

## How it works

- Grouping/ungrouping calls Home Assistant's generic `media_player.join`
  and `media_player.unjoin` services.
- Playing a favorite calls `media_player.play_media` with the favorite's
  saved `media_content_type`/`media_content_id`.
- The group volume slider calls `heos.group_volume_set`; the per-room
  slider calls the standard `media_player.volume_set`.
- Which rooms are currently grouped together is read directly from each
  room's `group_members` attribute — the card doesn't track grouping
  itself, so it stays in sync with grouping done from the HEOS app or
  anywhere else.

## Troubleshooting

- **A room won't join a group.** Confirm the entity is actually a HEOS
  `media_player` and is online (state isn't `unavailable`/`unknown` —
  those rooms show `—` instead of a status in the grid).
- **Radio favorites list is empty when browsing.** Make sure the room
  you're browsing from is online, and that you actually have items
  starred as HEOS Favorites in the HEOS app first — the browser only shows
  what HEOS itself already knows about.
- **Card looks broken after an update.** Check **Settings → Dashboards →
  Resources** for a duplicate registration of the card (an old manually
  added resource alongside a HACS-managed one) — see this project's
  paraplymapp-level `CLAUDE.md` for the full pattern; it isn't specific to
  this card.

## Known limitations

- **A single room playing solo doesn't yet appear as a "group of 1"** in
  the Active Groups strip — under investigation
  ([#7](https://github.com/johro897/music-multiroom-card/issues/7)).
- No seek/progress bar or shuffle/repeat controls yet — HEOS doesn't
  support seeking at all; shuffle/repeat tracked as
  [#1](https://github.com/johro897/music-multiroom-card/issues/1).
- The "Up next" line's assumption about which queue position is "next"
  isn't confirmed against a live queue yet — see CLAUDE.md.
- `browse_media`'s exact tree depth for HEOS Favorites/TuneIn (how many
  levels down a playable station sits) isn't confirmed against a live
  system yet — the picker handles arbitrary depth generically, but hasn't
  been exercised against real data at every level.

## Changelog

### 0.6.1

- Add a thin, display-only progress bar along the bottom edge of the
  Now Playing hero (HEOS doesn't support seeking, confirmed from source,
  so it's never a scrubber). Reads `media_position`/`media_duration`/
  `media_position_updated_at` and ticks forward once a second via a
  direct DOM update — not a full re-render, matching the same
  performance approach as the rest of the card. Hidden automatically for
  sources with no duration (radio streams). This was accidentally marked
  done in 0.6.0's release notes without actually being built — it's the
  real implementation.

### 0.6.0

- Add an "Up next" line to the Now Playing hero, shown while something's
  playing — reads HEOS's `get_queue` service (confirmed to support
  `return_response` from source). **Unverified**: assumes the queue's
  second item is "next" (no explicit current-position flag in the data
  to confirm this positionally) — needs live confirmation.
- Add Mute and Stop controls, shown only when the focused room's
  `supported_features` actually reports support for them (confirmed
  bit values from HA core source) rather than assuming every HEOS player
  has both.
- Add `aria-label`s to every icon-only button (transport controls, the
  per-room volume expand chevron, mute, editor row-remove buttons) —
  previously only had a `title` tooltip, not reliably picked up by every
  screen reader.
- Add a `setConfig()` guard against the same `media_player` entity being
  configured as two different rooms — throws a clear error instead of
  silently producing two tiles that fight over one entity's state.
- Fix: the dirty-check refinement from 0.5.4 didn't watch
  `supported_features`/`is_volume_muted`, so an external mute toggle (or
  the new Stop button's visibility) could go stale without another
  watched attribute also changing. Added both to the watched list.

### 0.5.6

- Fix: a failed service call (join, unjoin, play, transport, volume) was
  silent — it only surfaced as an unhandled promise rejection in the
  browser console, invisible on a wall-mounted tablet nobody's actively
  debugging. Now shown via Home Assistant's own notification toast.
- Docs: dropped the "should also work with Sonos/Bluesound" claim — this
  card is built and tested against HEOS only, and makes no compatibility
  promise beyond that.

### 0.5.5

- Fix: `heos.group_volume_set` was called with the wrong shape
  (`level`/`entity_id` both in the service data) — confirmed from HA
  core's actual source that it takes `volume_level` as data with the
  entity as the service target.
- Fix: removing a room from a group used a plain `unjoin`, which HEOS
  dissolves the *entire* group for if the departing room happens to be
  HEOS's own internal group leader (confirmed from source) — the card
  has no way to know that from the outside. Now rebuilds the group
  explicitly under one of the remaining rooms instead, which is safe
  regardless of who HEOS considers the leader.
- Fix: HEOS's `browse_media` returns `media_content_type: ""` (empty
  string) for every browsable item, confirmed from source — the editor's
  config normalization used `||`, which treated that as missing and
  silently corrupted it to `'favorite'` on every reload, breaking
  playback for radio favorites added via the picker. Changed to `??`.
- All three verified with source-derived test cases, not just guessed —
  see CLAUDE.md for the full source-reading log.

### 0.5.4

- Perf: the check that decides whether to re-render compared whole state
  object identity, which meant any attribute change on a watched room —
  including ones the card never displays, like `media_position` ticking
  during playback — forced a full DOM rebuild. Now compares only the
  fields the card actually renders, so a tablet left showing this
  dashboard continuously doesn't redraw needlessly every few seconds.
- Security review: audited every place user- or HEOS-provided text
  reaches `innerHTML` (room/favorite names, icons, media title/artist,
  HEOS browse titles, `entity_picture` URLs) — all confirmed escaped, no
  gaps found.
- Confirmed by the owner: the group-splitting and 2-device grouping cap
  from 0.5.2 are resolved by 0.5.3's join fix.

### 0.5.3

- Fix: grouping was capped at 2 rooms and could throw a HEOS `System
  error -9` — HEOS's `media_player.join` replaces group membership on
  every call rather than expanding it (a known, closed-as-"not planned"
  Home Assistant core issue,
  [#79298](https://github.com/home-assistant/core/issues/79298)). The
  card now always sends the full desired room list on every join, not
  just the newly added room.
- Fix: the "New Group" chip never showed as active/selected while in
  new-group mode.

### 0.5.2

- Fix: the radio picker's "Add selected" button only appeared after the
  (possibly long) browse list, making it easy to miss below the fold —
  not a functional bug, but reported as "doesn't seem to save" since it
  looked like nothing happened. Moved to a toolbar always visible at the
  top of the browse panel.

### 0.5.1

- Fix: the config editor dropped the card's `type` field from its internal
  config on every edit, so the first change made in the GUI editor (e.g.
  "+ Add room") broke the live preview with a "No type provided" error.
  Found immediately in real use after 0.5.0 shipped unverified — see
  `CLAUDE.md`.

### 0.5.0

- Initial version: multi-group control, group + per-room volume, Spotify
  and Radio favorites shelf with a GUI editor including a HEOS
  browse-and-pick radio picker, English/Swedish UI.
- **Released early, deliberately unverified against a live HEOS system** —
  shipped as `0.5.x` rather than `1.0.0` specifically to signal that. See
  this repo's `CLAUDE.md` for exactly what's still unconfirmed; the
  `beta-0.1.0` pre-release tag remains published as history but was
  bypassed for this release at the owner's request.

## License

MIT — see [LICENSE](LICENSE).
