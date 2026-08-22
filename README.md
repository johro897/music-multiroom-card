# Music Multiroom Card

A full-page Home Assistant Lovelace card for controlling whole-home audio.
Built around the generic `media_player` join/unjoin/`play_media` services —
targets HEOS in this first version (also implemented by Sonos, Bluesound and
other grouping-capable platforms, so it may work unmodified there too, though
only HEOS has been tested).

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

## Changelog

### 0.1.0 (unreleased)

- Initial version: multi-group control, group + per-room volume, Spotify
  and Radio favorites shelf with a GUI editor including a HEOS
  browse-and-pick radio picker, English/Swedish UI.
- **Not yet verified against a live HEOS system** — see this repo's
  `CLAUDE.md` for exactly what's still unconfirmed. The first `beta-0.1.0`
  release is where that verification happens.

## License

MIT — see [LICENSE](LICENSE).
