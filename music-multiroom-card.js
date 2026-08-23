/**
 * Music Multiroom Card
 * Full-page multi-room audio control card for Home Assistant, built and
 * tested against the HEOS integration's media_player entities. Uses HA's
 * generic media_player join/unjoin/play_media services, but only HEOS is
 * targeted/tested — no claim of Sonos/Bluesound compatibility. No build
 * chain, no external deps.
 */
(function () {
  'use strict';

  const CARD_NAME = 'music-multiroom-card';
  const EDITOR_NAME = 'music-multiroom-card-editor';

  if (customElements.get(CARD_NAME)) return;

  // ---------------------------------------------------------------------
  // Translations (module-level: file has two classes, card + editor)
  // ---------------------------------------------------------------------
  const DEFAULT_LANG = 'en';
  const TRANSLATIONS = {
    en: {
      now_playing: 'Now Playing',
      rooms: 'Rooms',
      group_volume: 'Group Volume',
      spotify: 'Spotify',
      radio: 'Radio',
      new_group: 'New Group',
      playing_on: 'Playing on: {rooms}',
      playing: 'Playing',
      grouped: 'Grouped',
      idle: 'Idle',
      no_group_hint: 'Tap a room to start a group',
      no_group_focused: 'No Group Focused',
      no_media: 'Nothing playing',
      favorites_disabled_hint: 'Focus a group to play favorites',
      favorites_no_mass_hint: 'This room has no Music Assistant entity configured',
      favorites_ready_hint: 'Ready to play',
      no_favorites: 'No favorites configured yet — add some in the card editor.',
      locked_other_group: 'Playing in another group',
      volume_pct: 'Vol {value}%',
      previous: 'Previous',
      play: 'Play',
      pause: 'Pause',
      next: 'Next',
      stop: 'Stop',
      mute: 'Mute',
      unmute: 'Unmute',
      up_next: 'Up next: {track}',
      rooms_required: '"rooms" must be a non-empty list of media_player entities',
      rooms_duplicate: '"rooms" has the same media_player entity configured twice ({entity})',
      error_join: "Couldn't add the room to the group",
      error_unjoin: "Couldn't remove the room from the group",
      error_play: "Couldn't start playback",
      error_volume: "Couldn't change the volume",
      error_transport: "Couldn't control playback",
      error_no_mass_entity: "This room isn't connected to Music Assistant — add a Music Assistant entity for it in the card editor to play Spotify here.",
      editor_rooms: 'Rooms',
      editor_add_room: 'Add room',
      editor_room_entity: 'Media player entity',
      editor_room_name: 'Display name',
      editor_room_icon: 'Icon',
      editor_room_mass_entity: 'Music Assistant entity (optional)',
      editor_room_mass_entity_hint: 'Enables real Spotify playback for this room. Leave empty if this room has no Music Assistant counterpart.',
      editor_remove: 'Remove',
      editor_favorites: 'Favorites',
      editor_favorites_spotify_title: 'Spotify',
      editor_favorites_spotify_via: 'via Music Assistant — your real Spotify library, not HEOS’s',
      editor_favorites_radio_title: 'Radio',
      editor_favorites_radio_via: 'via HEOS — unchanged',
      editor_browse_from_room: 'Browse from room',
      editor_browse_button_spotify: 'Browse Spotify',
      editor_browse_button_radio: 'Browse HEOS',
      editor_browse_loading: 'Loading…',
      editor_browse_error: 'Could not load from this room. Is it online?',
      editor_browse_empty: 'Nothing found here.',
      editor_browse_back: 'Back',
      editor_browse_open: 'Open',
      editor_add_selected: 'Add selected ({count})',
      editor_already_added: 'Already added',
      editor_no_rooms_configured: 'Add at least one room before browsing.',
      editor_no_mass_rooms: 'No rooms have a Music Assistant entity configured yet — add one above to browse Spotify.',
    },
    sv: {
      now_playing: 'Nu spelas',
      rooms: 'Rum',
      group_volume: 'Gruppvolym',
      spotify: 'Spotify',
      radio: 'Radio',
      new_group: 'Ny grupp',
      playing_on: 'Spelar på: {rooms}',
      playing: 'Spelar',
      grouped: 'Grupperad',
      idle: 'Overksam',
      no_group_hint: 'Tryck på ett rum för att starta en grupp',
      no_group_focused: 'Ingen grupp fokuserad',
      no_media: 'Inget spelas',
      favorites_disabled_hint: 'Fokusera en grupp för att spela favoriter',
      favorites_no_mass_hint: 'Det här rummet har ingen Music Assistant-entitet konfigurerad',
      favorites_ready_hint: 'Redo att spela',
      no_favorites: 'Inga favoriter konfigurerade än — lägg till i kortets editor.',
      locked_other_group: 'Spelar i en annan grupp',
      volume_pct: 'Vol {value}%',
      previous: 'Föregående',
      play: 'Spela',
      pause: 'Pausa',
      next: 'Nästa',
      stop: 'Stoppa',
      mute: 'Tysta',
      unmute: 'Sätt på ljud',
      up_next: 'Näst på tur: {track}',
      rooms_required: '"rooms" måste vara en icke-tom lista med media_player-entiteter',
      rooms_duplicate: '"rooms" har samma media_player-entitet konfigurerad två gånger ({entity})',
      error_join: 'Kunde inte lägga till rummet i gruppen',
      error_unjoin: 'Kunde inte ta bort rummet från gruppen',
      error_play: 'Kunde inte starta uppspelning',
      error_volume: 'Kunde inte ändra volymen',
      error_transport: 'Kunde inte styra uppspelningen',
      error_no_mass_entity: 'Det här rummet är inte kopplat till Music Assistant — lägg till en Music Assistant-entitet för det i kortets editor för att spela Spotify här.',
      editor_rooms: 'Rum',
      editor_add_room: 'Lägg till rum',
      editor_room_entity: 'Media player-entitet',
      editor_room_name: 'Visningsnamn',
      editor_room_icon: 'Ikon',
      editor_room_mass_entity: 'Music Assistant-entitet (valfri)',
      editor_room_mass_entity_hint: 'Möjliggör riktig Spotify-uppspelning för rummet. Lämna tomt om rummet saknar en Music Assistant-motsvarighet.',
      editor_remove: 'Ta bort',
      editor_favorites: 'Favoriter',
      editor_favorites_spotify_title: 'Spotify',
      editor_favorites_spotify_via: 'via Music Assistant — ditt riktiga Spotify-bibliotek, inte HEOS eget',
      editor_favorites_radio_title: 'Radio',
      editor_favorites_radio_via: 'via HEOS — oförändrat',
      editor_browse_from_room: 'Bläddra från rum',
      editor_browse_button_spotify: 'Bläddra Spotify',
      editor_browse_button_radio: 'Bläddra HEOS',
      editor_browse_loading: 'Laddar…',
      editor_browse_error: 'Kunde inte hämta från det här rummet. Är det online?',
      editor_browse_empty: 'Inget hittades här.',
      editor_browse_back: 'Tillbaka',
      editor_browse_open: 'Öppna',
      editor_add_selected: 'Lägg till markerade ({count})',
      editor_already_added: 'Redan tillagd',
      editor_no_rooms_configured: 'Lägg till minst ett rum innan du bläddrar.',
      editor_no_mass_rooms: 'Inga rum har en Music Assistant-entitet konfigurerad än — lägg till en ovan för att bläddra Spotify.',
    },
  };

  function lang(hass) {
    const raw = (hass?.locale?.language || hass?.language || DEFAULT_LANG).toLowerCase();
    const primary = raw.split('-')[0];
    return TRANSLATIONS[primary] ? primary : DEFAULT_LANG;
  }

  function t(hass, key, replacements) {
    const dict = TRANSLATIONS[lang(hass)] || TRANSLATIONS[DEFAULT_LANG];
    const raw = dict[key] ?? TRANSLATIONS[DEFAULT_LANG][key] ?? key;
    if (!replacements) return raw;
    return raw.replace(/\{([^}]+)\}/g, (m, k) =>
      Object.prototype.hasOwnProperty.call(replacements, k) ? replacements[k] : m
    );
  }

  // ---------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------
  function escHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Fixed categorical palette for distinguishing simultaneous groups from
  // each other. Deliberate exception to "never hardcode colors": this is
  // informational color-coding between arbitrary categories (like a chart
  // legend), not themeable UI chrome, so no single theme variable could
  // supply it. Everything else in this file uses HA CSS variables.
  const GROUP_COLORS = ['#03a9f4', '#ab47bc', '#66bb6a', '#ef5350', '#ffa726', '#26a69a'];

  // media_player.MediaPlayerEntityFeature bit values, confirmed from HA
  // core's homeassistant/components/media_player/const.py (2026-08-23) —
  // used to only show Stop/Mute when the entity actually reports support
  // for them, rather than assuming every HEOS player has both.
  const FEATURE_PAUSE = 1;
  const FEATURE_VOLUME_MUTE = 8;
  const FEATURE_STOP = 4096;

  function colorForLeader(entityId, rooms) {
    const idx = rooms.findIndex((r) => r.entity === entityId);
    return GROUP_COLORS[(idx < 0 ? 0 : idx) % GROUP_COLORS.length];
  }

  function sameStringSet(a, b) {
    const aa = Array.isArray(a) ? [...a].sort() : [];
    const bb = Array.isArray(b) ? [...b].sort() : [];
    if (aa.length !== bb.length) return false;
    return aa.every((v, i) => v === bb[i]);
  }

  function hexA(hex, alpha) {
    const h = String(hex).replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ---------------------------------------------------------------------
  // Inline SVG icons (currentColor, so they follow theme text color)
  // ---------------------------------------------------------------------
  function iconChevron() {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  }
  function iconPlus() {
    return '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  }
  function iconEq() {
    return '<svg class="eq" viewBox="0 0 12 12" width="11" height="11"><rect class="eq-bar" x="0.5" y="4" width="2.4" height="8"/><rect class="eq-bar" x="4.8" y="1" width="2.4" height="11"/><rect class="eq-bar" x="9.1" y="5.5" width="2.4" height="6.5"/></svg>';
  }
  function iconPrev() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 6h2v12H6zM20 6L9 12l11 6z"/></svg>';
  }
  function iconNext() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 6h2v12h-2zM4 6l11 6-11 6z"/></svg>';
  }
  function iconPlay() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 5l13 7-13 7z"/></svg>';
  }
  function iconPause() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  }
  function iconVolume() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M18.5 6a9 9 0 010 12"/></svg>';
  }
  function iconNote() {
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
  }
  function iconUpNext() {
    return '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6v12M9 6l8 6-8 6z"/></svg>';
  }
  function iconStop() {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>';
  }
  function iconVolumeMute() {
    return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9l5 6M21 9l-5 6"/></svg>';
  }
  function iconTrash() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
  }

  // ---------------------------------------------------------------------
  // Main card
  // ---------------------------------------------------------------------
  class MusicMultiroomCard extends HTMLElement {
    constructor() {
      super();
      this._config = null;
      this._hass = null;
      this._built = false;
      this._focusedGroupId = null;
      this._expandedRoomId = null;
      this._activeFavTab = 'spotify';
      this._pendingEntities = new Set();
      this._nextTrackCache = { key: null, next: null };
    }

    setConfig(config) {
      if (!config || !Array.isArray(config.rooms) || config.rooms.length === 0) {
        throw new Error(`music-multiroom-card: ${t(this._hass, 'rooms_required')}`);
      }
      const seenEntities = new Set();
      for (const r of config.rooms) {
        if (r.entity && seenEntities.has(r.entity)) {
          throw new Error(`music-multiroom-card: ${t(this._hass, 'rooms_duplicate', { entity: r.entity })}`);
        }
        seenEntities.add(r.entity);
      }
      this._config = {
        ...config,
        rooms: config.rooms.map((r) => ({
          entity: r.entity,
          name: r.name || r.entity,
          icon: r.icon || 'mdi:speaker',
          // Optional: this room's Music Assistant counterpart for the same
          // physical speaker. Only Spotify favorites ever target it —
          // grouping/volume/radio stay on `entity` (native HEOS) always.
          mass_entity: r.mass_entity || '',
        })),
        favorites: {
          spotify: (config.favorites && config.favorites.spotify) || [],
          radio: (config.favorites && config.favorites.radio) || [],
        },
      };
      if (this._focusedGroupId && !this._config.rooms.some((r) => r.entity === this._focusedGroupId)) {
        this._focusedGroupId = null;
      }
      if (this._built) this._render();
    }

    static getConfigElement() {
      return document.createElement(EDITOR_NAME);
    }

    static getStubConfig() {
      return { rooms: [], favorites: { spotify: [], radio: [] } };
    }

    getCardSize() {
      return 6;
    }

    set hass(hass) {
      const prevHass = this._hass;
      this._hass = hass;
      if (!this._built) {
        this._build();
        this._built = true;
        this._render();
        return;
      }
      if (this._isDirty(prevHass, hass)) this._render();
    }

    _watchedEntities() {
      const rooms = this._config?.rooms || [];
      const ids = [];
      for (const r of rooms) {
        if (r.entity) ids.push(r.entity);
        // Also watch each room's mass_entity — the hero pulls display
        // metadata from it (see _metaAttributes) whenever it's playing,
        // so a track change there needs to trigger a re-render even
        // though it never touches the HEOS entity's own attributes.
        if (r.mass_entity) ids.push(r.mass_entity);
      }
      return ids;
    }

    // Compares only the fields this card actually renders, not full state
    // object identity — HEOS (like many media_player integrations) bumps
    // the state object on attribute changes we don't display at all (e.g.
    // media_position ticking during playback), which would otherwise force
    // a full DOM rebuild every few seconds on a screen meant to stay on
    // permanently.
    _isDirty(prevHass, hass) {
      if (!prevHass) return true;
      for (const id of this._watchedEntities()) {
        const prevSt = prevHass.states?.[id];
        const newSt = hass.states?.[id];
        if (prevSt === newSt) continue;
        if (!prevSt || !newSt) return true;
        if (prevSt.state !== newSt.state) return true;
        const pa = prevSt.attributes || {};
        const na = newSt.attributes || {};
        if (
          pa.media_title !== na.media_title ||
          pa.media_artist !== na.media_artist ||
          pa.entity_picture !== na.entity_picture ||
          pa.volume_level !== na.volume_level ||
          pa.is_volume_muted !== na.is_volume_muted ||
          pa.supported_features !== na.supported_features ||
          !sameStringSet(pa.group_members, na.group_members)
        ) {
          return true;
        }
      }
      return false;
    }

    _build() {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.addEventListener('click', (e) => this._onClick(e));
      this.shadowRoot.addEventListener('change', (e) => this._onChange(e));
      // Ticks the progress bar's width directly via DOM mutation, not a
      // full _render() — media_position updates on a real playing track
      // every few seconds, and _isDirty() deliberately does NOT watch it
      // (see its own comment) to avoid rebuilding the whole card that
      // often on a screen meant to stay on permanently.
      this._progressInterval = setInterval(() => this._tickProgress(), 1000);
    }

    disconnectedCallback() {
      clearInterval(this._progressInterval);
    }

    _tickProgress() {
      const fill = this.shadowRoot?.querySelector('[data-progress-fill]');
      if (!fill || !this._hass) return;
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      const st = focusedLeader ? this._hass.states[focusedLeader] : null;
      if (st?.state !== 'playing') return;
      const meta = this._metaAttributes(focusedLeader);
      const duration = meta?.media_duration;
      const position = meta?.media_position;
      const updatedAt = meta?.media_position_updated_at;
      if (typeof duration !== 'number' || duration <= 0 || typeof position !== 'number' || !updatedAt) return;
      const elapsed = (Date.now() - new Date(updatedAt).getTime()) / 1000;
      const current = Math.min(duration, Math.max(0, position + elapsed));
      fill.style.width = `${(current / duration) * 100}%`;
    }

    // Single source of truth for "which backend actually owns this room's
    // current playback" — HEOS and Music Assistant behave differently
    // enough (metadata, queue contents, pause support) that display logic
    // needs one consistent answer instead of each place re-deriving its
    // own heuristic. A room's mass_entity is considered "driving"
    // whenever it's itself actively playing or paused; grouping, volume,
    // and transport commands never consult this — they always target the
    // HEOS entity regardless of who's driving. Returns the mass_entity id
    // when MA is driving, otherwise null.
    _massDrivingEntity(leaderEntity) {
      const room = this._config?.rooms.find((r) => r.entity === leaderEntity);
      if (!room?.mass_entity) return null;
      const massSt = this._hass.states[room.mass_entity];
      return massSt && (massSt.state === 'playing' || massSt.state === 'paused') ? room.mass_entity : null;
    }

    // HEOS reports generic, useless metadata ("Url Stream"/"Url Stream")
    // for anything Music Assistant hands it to play — confirmed live
    // (2026-08-23), matches Music Assistant's own documented limitation
    // ("metadata shows as URL stream due to HEOS API constraints"). Prefer
    // the driving mass_entity's attributes for display when there is one
    // — but never for `state`/`supported_features`, since transport
    // commands and availability still target the HEOS entity.
    _metaAttributes(leaderEntity) {
      const massEntity = this._massDrivingEntity(leaderEntity);
      if (massEntity) return this._hass.states[massEntity].attributes;
      return this._hass.states[leaderEntity]?.attributes;
    }

    // ---- group derivation ------------------------------------------------
    // Confirmed from HEOS's actual _get_group_members() source (2026-08-23):
    // the "group_members" attribute lists the leader + all members,
    // symmetric across every grouped entity. See CLAUDE.md.
    _computeGroups() {
      const rooms = this._config?.rooms || [];
      if (!this._hass) return [];
      const roomIds = new Set(rooms.map((r) => r.entity));
      const seen = new Set();
      const groups = [];
      for (const room of rooms) {
        if (seen.has(room.entity)) continue;
        const st = this._hass.states[room.entity];
        if (!st) {
          seen.add(room.entity);
          continue;
        }
        const raw = Array.isArray(st.attributes?.group_members) ? st.attributes.group_members : null;
        const members = raw && raw.length ? raw.filter((id) => roomIds.has(id)) : [room.entity];
        members.forEach((id) => seen.add(id));
        const isActive = members.length > 1 || st.state === 'playing' || st.state === 'paused';
        if (!isActive) continue;
        const leaderEntity = rooms.find((r) => members.includes(r.entity))?.entity || room.entity;
        groups.push({
          id: leaderEntity,
          leaderEntity,
          memberEntities: members,
          color: colorForLeader(leaderEntity, rooms),
        });
      }
      return groups;
    }

    _resolveFocusedLeader(groups) {
      if (!this._focusedGroupId) return null;
      const real = groups.find((g) => g.id === this._focusedGroupId);
      if (real) return real.leaderEntity;
      const stillConfigured = (this._config?.rooms || []).some((r) => r.entity === this._focusedGroupId);
      return stillConfigured ? this._focusedGroupId : null;
    }

    _classifyRoom(room, groups, focusedLeader) {
      const owning = groups.find((g) => g.memberEntities.includes(room.entity));
      if (owning) {
        return owning.leaderEntity === focusedLeader
          ? { state: 'focused', group: owning }
          : { state: 'locked', group: owning };
      }
      if (room.entity === focusedLeader) {
        return {
          state: 'focused',
          group: {
            leaderEntity: focusedLeader,
            memberEntities: [focusedLeader],
            color: colorForLeader(focusedLeader, this._config.rooms),
          },
        };
      }
      return { state: 'idle', group: null };
    }

    // ---- interaction handlers ---------------------------------------------
    _onClick(e) {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      switch (action) {
        case 'focus-group':
          this._focusedGroupId = el.dataset.groupId;
          this._render();
          break;
        case 'new-group':
          this._focusedGroupId = null;
          this._render();
          break;
        case 'toggle-room':
          this._onRoomTap(el.dataset.entity);
          break;
        case 'toggle-expand': {
          const id = el.dataset.entity;
          this._expandedRoomId = this._expandedRoomId === id ? null : id;
          this._render();
          break;
        }
        case 'switch-tab':
          this._activeFavTab = el.dataset.tab;
          this._render();
          break;
        case 'play-favorite':
          this._onFavoriteTap(el.dataset.type, el.dataset.id, el.dataset.source);
          break;
        case 'transport':
          this._onTransport(el.dataset.cmd);
          break;
        case 'toggle-mute':
          this._toggleMute(el.dataset.entity, el.dataset.muted === 'true');
          break;
        default:
          break;
      }
    }

    _onChange(e) {
      const el = e.target.closest('[data-action="room-volume"], [data-action="group-volume"]');
      if (!el) return;
      if (el.dataset.action === 'room-volume') {
        this._setRoomVolume(el.dataset.entity, Number(el.value));
      } else {
        this._setGroupVolume(Number(el.value));
      }
    }

    // Surfaces a failed service call via HA's own toast/notification system
    // rather than failing silently — a fire-and-forget callService() that
    // rejects otherwise becomes an unhandled promise rejection, visible
    // only in devtools, which is useless on a wall-mounted tablet nobody's
    // debugging (this is exactly how the "System error -9" HEOS error was
    // originally missed — only found by checking the HA log directly).
    _notifyError(message, err) {
      console.error('music-multiroom-card:', message, err);
      this.dispatchEvent(
        new CustomEvent('hass-notification', {
          detail: { message },
          bubbles: true,
          composed: true,
        })
      );
    }

    _guardPending(entity) {
      if (this._pendingEntities.has(entity)) return true;
      this._pendingEntities.add(entity);
      setTimeout(() => this._pendingEntities.delete(entity), 1500);
      return false;
    }

    _onRoomTap(entity) {
      if (!entity || !this._hass) return;
      const groups = this._computeGroups();
      const owning = groups.find((g) => g.memberEntities.includes(entity));
      const focusedLeader = this._resolveFocusedLeader(groups);

      if (owning && owning.leaderEntity !== focusedLeader) return; // locked

      if (owning) {
        // A room playing/paused solo counts as its own "group of 1" in
        // _computeGroups() purely for focus/UI purposes — HEOS itself
        // never considered it grouped (no real join ever happened), so
        // there's nothing to unjoin. Calling `unjoin` on it anyway fails
        // live with "Entity ... is not joined to a group" (found
        // 2026-08-23) — tapping it again should just clear focus.
        if (owning.memberEntities.length < 2) {
          this._focusedGroupId = null;
          this._render();
          return;
        }
        if (this._guardPending(entity)) return;
        const remaining = owning.memberEntities.filter((id) => id !== entity);
        if (remaining.length >= 2) {
          // A plain `unjoin` on the departing room is leader-dependent in
          // HEOS: unjoining the group's real internal leader DISSOLVES the
          // whole group instead of just detaching that one room (confirmed
          // via home-assistant/core's heos/media_player.py source,
          // 2026-08-23) — and there's no way to tell from here whether the
          // departing room happens to be that real leader. Rebuilding the
          // group explicitly under one of the remaining rooms via `join`
          // is deterministic and safe regardless of who HEOS considers the
          // leader.
          const newLeader = this._config.rooms.find((r) => remaining.includes(r.entity))?.entity || remaining[0];
          const others = remaining.filter((id) => id !== newLeader);
          this._hass
            .callService('media_player', 'join', { group_members: others }, { entity_id: newLeader })
            .catch((err) => {
              this._pendingEntities.delete(entity);
              this._notifyError(t(this._hass, 'error_unjoin'), err);
            });
          this._focusedGroupId = newLeader;
        } else {
          this._hass
            .callService('media_player', 'unjoin', {}, { entity_id: entity })
            .catch((err) => {
              this._pendingEntities.delete(entity);
              this._notifyError(t(this._hass, 'error_unjoin'), err);
            });
          this._focusedGroupId = null;
        }
        this._render();
        return;
      }

      if (focusedLeader) {
        if (this._guardPending(focusedLeader)) return;
        // HEOS's media_player.join REPLACES group membership on every call
        // instead of expanding it (confirmed live 2026-08-23, matches
        // home-assistant/core#79298, closed upstream as "not planned") — so
        // the full desired membership must be sent every time, never just
        // the newly added room, or every join drops whoever was already
        // grouped.
        const focusedGroup = groups.find((g) => g.leaderEntity === focusedLeader);
        const desiredMembers = focusedGroup ? [...focusedGroup.memberEntities, entity] : [focusedLeader, entity];
        this._hass
          .callService(
            'media_player',
            'join',
            { group_members: Array.from(new Set(desiredMembers)) },
            { entity_id: focusedLeader }
          )
          .catch((err) => {
            this._pendingEntities.delete(focusedLeader);
            this._notifyError(t(this._hass, 'error_join'), err);
          });
        return;
      }

      this._focusedGroupId = entity;
      this._render();
    }

    // Radio favorites always target the focused group's HEOS leader, same
    // as every other command in this card. Spotify favorites target that
    // room's `mass_entity` instead — the group itself is still 100% native
    // HEOS; only the playback source differs. [UNVERIFIED] whether
    // play_media against the MA entity actually fans out across a group
    // formed via the native integration's `media_player.join` — needs
    // confirming live (see CLAUDE.md).
    _onFavoriteTap(mediaContentType, mediaContentId, source) {
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      if (!focusedLeader || !this._hass) return;

      let targetEntity = focusedLeader;
      if (source === 'spotify') {
        const room = this._config.rooms.find((r) => r.entity === focusedLeader);
        if (!room?.mass_entity) {
          this._notifyError(t(this._hass, 'error_no_mass_entity'));
          return;
        }
        targetEntity = room.mass_entity;
      }

      this._hass
        .callService(
          'media_player',
          'play_media',
          { media_content_type: mediaContentType, media_content_id: mediaContentId },
          { entity_id: targetEntity }
        )
        .catch((err) => this._notifyError(t(this._hass, 'error_play'), err));
    }

    // Debounced the same way _onRoomTap already is (via _guardPending) —
    // found live (2026-08-23) that a touchscreen double-firing a single
    // physical tap into two click events would send a command twice with
    // no protection here, unlike every other interactive control in this
    // card. A duplicated `next` is easy to blame on an upstream Spotify
    // skip-limit and never notice it was actually us.
    _onTransport(cmd) {
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      if (!focusedLeader || !this._hass) return;
      if (this._guardPending(`transport:${focusedLeader}:${cmd}`)) return;
      const svc =
        cmd === 'play_pause'
          ? 'media_play_pause'
          : cmd === 'next'
          ? 'media_next_track'
          : cmd === 'stop'
          ? 'media_stop'
          : 'media_previous_track';
      this._hass
        .callService('media_player', svc, {}, { entity_id: focusedLeader })
        .catch((err) => this._notifyError(t(this._hass, 'error_transport'), err));
    }

    _toggleMute(entity, currentlyMuted) {
      if (!entity || !this._hass) return;
      this._hass
        .callService('media_player', 'volume_mute', { is_volume_muted: !currentlyMuted }, { entity_id: entity })
        .catch((err) => this._notifyError(t(this._hass, 'error_volume'), err));
    }

    // Fetches what plays after the current track — from whichever backend
    // is actually driving (see _massDrivingEntity). HEOS's own get_queue
    // only knows its own queue, meaningless for anything Music Assistant
    // is playing (same "Url Stream" problem as its title/artist — found
    // live, 2026-08-23). Music Assistant has a real equivalent,
    // `music_assistant.get_queue`, confirmed from home-assistant/core's
    // music_assistant/media_player.py source (2026-08-23): it returns an
    // explicit `next_item` field, no positional guessing required — the
    // queue_item shape is `{name, duration, media_item: {name, artists:
    // [{name}], album, ...}}` (also confirmed from source, schemas.py).
    // HEOS's own [UNVERIFIED] queue[1]-is-next assumption is unchanged
    // and still needs live confirmation for the radio/HEOS path — see
    // CLAUDE.md. Failures are swallowed quietly (no toast) since this is
    // a display-only nicety, not a user-initiated action.
    async _refreshNextTrack(focusedLeader, key) {
      const massEntity = this._massDrivingEntity(focusedLeader);
      try {
        let next = null;
        if (massEntity) {
          const result = await this._hass.connection.sendMessagePromise({
            type: 'call_service',
            domain: 'music_assistant',
            service: 'get_queue',
            service_data: {},
            target: { entity_id: massEntity },
            return_response: true,
          });
          const nextItem = result?.response?.[massEntity]?.next_item;
          if (nextItem) {
            next = { song: nextItem.name, artist: nextItem.media_item?.artists?.[0]?.name || '' };
          }
        } else {
          const result = await this._hass.connection.sendMessagePromise({
            type: 'call_service',
            domain: 'heos',
            service: 'get_queue',
            service_data: {},
            target: { entity_id: focusedLeader },
            return_response: true,
          });
          const queue = result?.response?.[focusedLeader]?.queue || [];
          next = queue[1] || null;
        }
        if (this._nextTrackCache.key === key) {
          this._nextTrackCache.next = next;
          this._render();
        }
      } catch (err) {
        if (this._nextTrackCache.key === key) {
          this._nextTrackCache.next = null;
        }
      }
    }

    _setRoomVolume(entity, sliderValue) {
      if (!entity || !this._hass) return;
      this._hass
        .callService('media_player', 'volume_set', { volume_level: sliderValue / 100 }, { entity_id: entity })
        .catch((err) => this._notifyError(t(this._hass, 'error_volume'), err));
    }

    _setGroupVolume(sliderValue) {
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      if (!focusedLeader || !this._hass) return;
      // Schema confirmed from home-assistant/core's heos/services.yaml
      // (2026-08-23): `volume_level` (0-1) as data, entity as target — not
      // `level` in the data payload as originally guessed.
      this._hass
        .callService('heos', 'group_volume_set', { volume_level: sliderValue / 100 }, { entity_id: focusedLeader })
        .catch((err) => this._notifyError(t(this._hass, 'error_volume'), err));
    }

    // ---- render -------------------------------------------------------
    _render() {
      if (!this._hass || !this._config) return;
      const hass = this._hass;
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      const focusedGroup =
        groups.find((g) => g.leaderEntity === focusedLeader) ||
        (focusedLeader
          ? {
              leaderEntity: focusedLeader,
              memberEntities: [focusedLeader],
              color: colorForLeader(focusedLeader, this._config.rooms),
            }
          : null);

      const leaderState = focusedLeader ? hass.states[focusedLeader] : null;
      const isPlaying = leaderState?.state === 'playing';
      // Keyed off _metaAttributes' title, not the HEOS entity's own
      // media_title directly — for Music Assistant content the HEOS
      // entity's title is permanently "Url Stream" (see _metaAttributes),
      // so keying on it would never change between tracks and the "Up
      // next" cache would go stale after the very first track of a
      // session (found live, 2026-08-23).
      const nextKey = isPlaying ? `${focusedLeader}|${this._metaAttributes(focusedLeader)?.media_title || ''}` : null;
      if (nextKey && nextKey !== this._nextTrackCache.key) {
        this._nextTrackCache = { key: nextKey, next: null };
        this._refreshNextTrack(focusedLeader, nextKey);
      }
      const nextTrack = nextKey && this._nextTrackCache.key === nextKey ? this._nextTrackCache.next : null;

      this.shadowRoot.innerHTML = `
        <style>${this._css()}</style>
        <div class="card">
          ${this._renderGroupsStrip(groups, focusedLeader)}
          ${this._renderHero(focusedGroup, focusedLeader, nextTrack)}
          <div class="section-label">${escHtml(t(hass, 'rooms'))}</div>
          ${this._renderRoomsGrid(groups, focusedLeader)}
          ${focusedLeader ? this._renderVolumeSection(focusedLeader) : ''}
          ${this._renderFavorites(focusedLeader)}
        </div>`;
    }

    _renderGroupsStrip(groups, focusedLeader) {
      const hass = this._hass;
      const chips = groups
        .map((g) => {
          const names = g.memberEntities
            .map((id) => this._config.rooms.find((r) => r.entity === id)?.name || id)
            .filter(Boolean);
          const label = names.length <= 2 ? names.join(' + ') : `${names[0]} +${names.length - 1}`;
          const focused = g.leaderEntity === focusedLeader;
          const st = hass.states[g.leaderEntity];
          const playing = st?.state === 'playing';
          const style = focused ? `background:${hexA(g.color, 0.14)};border-color:${g.color};` : '';
          return `
            <div class="chip ${focused ? 'chip-focused' : ''}" style="${style}" data-action="focus-group" data-group-id="${escHtml(g.leaderEntity)}">
              <span class="chip-dot" style="background:${g.color};"></span>
              <span class="chip-label">${escHtml(label)}</span>
              ${playing ? iconEq() : ''}
            </div>`;
        })
        .join('');
      const newGroupActive = !focusedLeader;
      return `
        <div class="groups-strip">
          ${chips}
          <div class="chip chip-new ${newGroupActive ? 'chip-new-active' : ''}" data-action="new-group">
            ${iconPlus()}
            <span class="chip-label">${escHtml(t(hass, 'new_group'))}</span>
          </div>
        </div>`;
    }

    _renderHero(focusedGroup, focusedLeader, nextTrack) {
      const hass = this._hass;
      if (!focusedGroup) {
        return `
          <div class="hero" style="border-left-color:var(--mmc-disabled);">
            <div class="hero-art">${iconNote()}</div>
            <div class="hero-info">
              <div class="hero-eyebrow">${escHtml(t(hass, 'no_group_focused'))}</div>
              <div class="hero-title">${escHtml(t(hass, 'no_media'))}</div>
              <div class="hero-subtitle">${escHtml(t(hass, 'no_group_hint'))}</div>
            </div>
          </div>`;
      }
      const st = hass.states[focusedLeader];
      const isPlaying = st?.state === 'playing';
      const isPaused = st?.state === 'paused';
      // See _metaAttributes: HEOS reports generic "Url Stream" metadata
      // for anything Music Assistant hands it, so display fields come
      // from the room's mass_entity when it's the one actually playing.
      const meta = this._metaAttributes(focusedLeader);
      const title = meta?.media_title || t(hass, 'no_media');
      const artist = meta?.media_artist || '';
      const picture = meta?.entity_picture;
      const features = st?.attributes?.supported_features || 0;
      const canStop = !!(features & FEATURE_STOP);
      // Some sources — confirmed live (2026-08-23): HEOS radio streams —
      // don't support pause at all, only stop (pausing a live stream
      // isn't meaningful the way pausing a track is). Calling
      // media_play_pause there fails outright ("does not support
      // action"). Fall the main transport button back to Stop in that
      // case instead, and skip the separate Stop button so it isn't
      // shown twice.
      const canPause = !!(features & FEATURE_PAUSE);
      const mainUsesStop = isPlaying && !canPause && canStop;
      const mainCmd = mainUsesStop ? 'stop' : 'play_pause';
      const mainIcon = isPlaying ? (mainUsesStop ? iconStop() : iconPause()) : iconPlay();
      const mainLabelKey = isPlaying ? (mainUsesStop ? 'stop' : 'pause') : 'play';
      const showExtraStop = canStop && !mainUsesStop;
      const names = focusedGroup.memberEntities.map(
        (id) => this._config.rooms.find((r) => r.entity === id)?.name || id
      );
      const nextLabel = nextTrack ? [nextTrack.song, nextTrack.artist].filter(Boolean).join(' — ') : '';

      // HEOS doesn't support seek at all (confirmed from source) — this is
      // a display-only bar, never a scrubber. [UNVERIFIED] whether HEOS
      // actually populates media_position/media_duration for every source
      // (radio streams typically have no duration at all, in which case
      // the bar is correctly just hidden below).
      const duration = meta?.media_duration;
      const position = meta?.media_position;
      const updatedAt = meta?.media_position_updated_at;
      const hasProgress =
        (isPlaying || isPaused) && typeof duration === 'number' && duration > 0 && typeof position === 'number' && !!updatedAt;
      let progressPct = 0;
      if (hasProgress) {
        const elapsed = isPlaying ? (Date.now() - new Date(updatedAt).getTime()) / 1000 : 0;
        progressPct = (Math.min(duration, Math.max(0, position + elapsed)) / duration) * 100;
      }

      return `
        <div class="hero" style="border-left-color:${focusedGroup.color};">
          <div class="hero-art">${picture ? `<img src="${escHtml(picture)}" alt="">` : iconNote()}</div>
          <div class="hero-info">
            <div class="hero-eyebrow">${escHtml(t(hass, 'now_playing'))}</div>
            <div class="hero-title">${escHtml(title)}</div>
            <div class="hero-subtitle">${escHtml(artist)}</div>
            ${
              isPlaying && nextLabel
                ? `<div class="hero-nextup">${iconUpNext()}<span>${escHtml(t(hass, 'up_next', { track: nextLabel }))}</span></div>`
                : ''
            }
          </div>
          ${
            isPlaying
              ? `<div class="hero-badge">${iconEq()}${escHtml(t(hass, 'playing_on', { rooms: names.join(', ') }))}</div>`
              : ''
          }
          <div class="hero-spacer"></div>
          <div class="hero-transport">
            <button class="tbtn" data-action="transport" data-cmd="prev" title="${escHtml(t(hass, 'previous'))}" aria-label="${escHtml(t(hass, 'previous'))}">${iconPrev()}</button>
            <button class="tbtn tbtn-main" data-action="transport" data-cmd="${mainCmd}" title="${escHtml(t(hass, mainLabelKey))}" aria-label="${escHtml(t(hass, mainLabelKey))}">${mainIcon}</button>
            <button class="tbtn" data-action="transport" data-cmd="next" title="${escHtml(t(hass, 'next'))}" aria-label="${escHtml(t(hass, 'next'))}">${iconNext()}</button>
            ${
              showExtraStop
                ? `<button class="tbtn" data-action="transport" data-cmd="stop" title="${escHtml(t(hass, 'stop'))}" aria-label="${escHtml(t(hass, 'stop'))}">${iconStop()}</button>`
                : ''
            }
          </div>
          ${
            hasProgress
              ? `<div class="hero-progress-track"><div class="hero-progress-fill" data-progress-fill style="width:${progressPct}%;"></div></div>`
              : ''
          }
        </div>`;
    }

    _renderRoomsGrid(groups, focusedLeader) {
      const hass = this._hass;
      const rows = this._config.rooms
        .map((room) => {
          const cls = this._classifyRoom(room, groups, focusedLeader);
          const st = hass.states[room.entity];
          const playing = st?.state === 'playing';
          const unavailable = !st || st.state === 'unavailable' || st.state === 'unknown';

          let statusLabel;
          let statusColor;
          if (unavailable) {
            statusLabel = '—';
            statusColor = 'var(--mmc-disabled)';
          } else if (playing) {
            statusLabel = t(hass, 'playing');
            statusColor = 'var(--mmc-warn)';
          } else if (cls.state !== 'idle') {
            statusLabel = t(hass, 'grouped');
            statusColor = cls.group.color;
          } else {
            statusLabel = t(hass, 'idle');
            statusColor = 'var(--mmc-disabled)';
          }

          let tileClass = 'tile';
          let tileStyle;
          let tileTitle = '';
          if (cls.state === 'focused') {
            tileStyle = `background:${hexA(cls.group.color, 0.14)};border-color:${cls.group.color};`;
          } else if (cls.state === 'locked') {
            tileClass += ' tile-locked';
            tileStyle = `border-color:${cls.group.color};`;
            tileTitle = escHtml(t(hass, 'locked_other_group'));
          } else {
            tileStyle = '';
          }

          const expanded = this._expandedRoomId === room.entity;
          const vol = st?.attributes?.volume_level;
          const volPct = typeof vol === 'number' ? Math.round(vol * 100) : 50;

          return `
            <div class="${tileClass}" style="${tileStyle}" title="${tileTitle}" data-action="toggle-room" data-entity="${escHtml(room.entity)}">
              <div class="tile-row">
                <div class="tile-icon"><ha-icon icon="${escHtml(room.icon)}"></ha-icon></div>
                <div class="tile-name">${escHtml(room.name)}</div>
                <div class="tile-spacer"></div>
                <div class="tile-status" style="color:${statusColor};">${playing ? iconEq() : ''}${escHtml(statusLabel)}</div>
              </div>
              ${
                cls.state === 'focused'
                  ? `
              <div class="tile-row tile-subrow">
                <div class="tile-vol-label">${escHtml(t(hass, 'volume_pct', { value: volPct }))}</div>
                <div class="tile-spacer"></div>
                <button class="expand-btn" data-action="toggle-expand" data-entity="${escHtml(room.entity)}" aria-label="${escHtml(t(hass, 'volume_pct', { value: volPct }))}" aria-expanded="${expanded}">
                  <span style="display:flex;transform:rotate(${expanded ? 180 : 0}deg);transition:transform .15s;">${iconChevron()}</span>
                </button>
              </div>
              ${
                expanded
                  ? `<div class="tile-row"><input type="range" class="slider" min="0" max="100" value="${volPct}" data-action="room-volume" data-entity="${escHtml(room.entity)}" /></div>`
                  : ''
              }`
                  : ''
              }
            </div>`;
        })
        .join('');
      return `<div class="rooms-grid">${rows}</div>`;
    }

    _renderVolumeSection(focusedLeader) {
      const hass = this._hass;
      const st = hass.states[focusedLeader];
      const vol = st?.attributes?.volume_level;
      const pct = typeof vol === 'number' ? Math.round(vol * 100) : 50;
      const features = st?.attributes?.supported_features || 0;
      const canMute = !!(features & FEATURE_VOLUME_MUTE);
      const muted = !!st?.attributes?.is_volume_muted;
      return `
        <div class="volume-bar">
          <span class="volume-icon">${iconVolume()}</span>
          <div class="volume-label">${escHtml(t(hass, 'group_volume'))}</div>
          <input type="range" class="slider slider-flex" min="0" max="100" value="${pct}" data-action="group-volume" />
          <div class="volume-pct">${pct}%</div>
          ${
            canMute
              ? `<button class="mute-btn ${muted ? 'mute-btn-active' : ''}" data-action="toggle-mute" data-entity="${escHtml(focusedLeader)}" data-muted="${muted}" title="${escHtml(t(hass, muted ? 'unmute' : 'mute'))}" aria-label="${escHtml(t(hass, muted ? 'unmute' : 'mute'))}" aria-pressed="${muted}">${iconVolumeMute()}</button>`
              : ''
          }
        </div>`;
    }

    _renderFavorites(focusedLeader) {
      const hass = this._hass;
      const cfg = this._config.favorites;
      const list = this._activeFavTab === 'spotify' ? cfg.spotify : cfg.radio;
      const focusedRoom = focusedLeader ? this._config.rooms.find((r) => r.entity === focusedLeader) : null;
      const noMassEntity = this._activeFavTab === 'spotify' && !!focusedLeader && !focusedRoom?.mass_entity;
      const disabled = !focusedLeader || noMassEntity;
      const chips = (list || [])
        .map((fav) => {
          const icon = fav.icon || (this._activeFavTab === 'radio' ? 'mdi:radio' : 'mdi:spotify');
          return `
            <div class="fav-chip ${disabled ? 'fav-disabled' : ''}" data-action="play-favorite" data-source="${this._activeFavTab}" data-type="${escHtml(
            fav.media_content_type
          )}" data-id="${escHtml(fav.media_content_id)}">
              <div class="fav-icon"><ha-icon icon="${escHtml(icon)}"></ha-icon></div>
              <div class="fav-name">${escHtml(fav.name)}</div>
            </div>`;
        })
        .join('');
      const hintKey = !focusedLeader ? 'favorites_disabled_hint' : noMassEntity ? 'favorites_no_mass_hint' : 'favorites_ready_hint';
      return `
        <div class="favorites">
          <div class="fav-header">
            <div class="fav-tabs">
              <button class="fav-tab ${this._activeFavTab === 'spotify' ? 'fav-tab-active' : ''}" data-action="switch-tab" data-tab="spotify">${escHtml(
        t(hass, 'spotify')
      )}</button>
              <button class="fav-tab ${this._activeFavTab === 'radio' ? 'fav-tab-active' : ''}" data-action="switch-tab" data-tab="radio">${escHtml(
        t(hass, 'radio')
      )}</button>
            </div>
            <div class="fav-hint" style="color:${disabled ? 'var(--mmc-text-secondary)' : 'var(--mmc-accent)'};">
              ${escHtml(t(hass, hintKey))}
            </div>
          </div>
          <div class="fav-grid">${chips || `<div class="fav-empty">${escHtml(t(hass, 'no_favorites'))}</div>`}</div>
        </div>`;
    }

    _css() {
      return `
        :host { display:block; }
        * { box-sizing:border-box; }
        .card {
          --mmc-tile-bg: var(--secondary-background-color, rgba(255,255,255,0.04));
          --mmc-text-secondary: var(--secondary-text-color, #9b9b9b);
          --mmc-divider: var(--divider-color, rgba(255,255,255,0.12));
          --mmc-accent: var(--primary-color, #03a9f4);
          --mmc-warn: var(--warning-color, #ffa600);
          --mmc-disabled: var(--disabled-text-color, #6f6f6f);
          background: var(--card-background-color, #1c1c1c);
          color: var(--primary-text-color, inherit);
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, none);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        ha-icon { --mdc-icon-size: 20px; color: inherit; }

        .groups-strip { display:flex; align-items:center; gap:10px; overflow-x:auto; flex-shrink:0; }
        .chip {
          display:flex; align-items:center; gap:8px; padding:9px 16px; min-height:44px;
          border-radius:999px; white-space:nowrap; flex-shrink:0; cursor:pointer;
          background: var(--mmc-tile-bg); border:1.5px solid var(--mmc-divider);
          color: var(--primary-text-color); transition: filter .15s;
        }
        .chip:hover { filter: brightness(1.12); }
        .chip-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
        .chip-new { color: var(--mmc-text-secondary); border-style:dashed; }
        .chip-new-active { color: var(--mmc-accent); border-color: var(--mmc-accent); border-style:solid; background: color-mix(in srgb, var(--mmc-accent) 14%, transparent); }
        .chip .eq { color: var(--mmc-warn); }

        .hero {
          display:flex; align-items:center; gap:18px; background: var(--mmc-tile-bg);
          border-radius:14px; border-left:4px solid var(--mmc-accent); padding:16px 22px;
          flex-shrink:0; position:relative; overflow:hidden;
        }
        .hero-progress-track { position:absolute; left:0; right:0; bottom:0; height:3px; background: rgba(128,128,128,0.2); }
        .hero-progress-fill { height:100%; background: var(--mmc-accent); }
        .hero-art {
          width:64px; height:64px; border-radius:10px; background: rgba(128,128,128,0.15);
          display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden;
          color: var(--mmc-text-secondary);
        }
        .hero-art img { width:100%; height:100%; object-fit:cover; }
        .hero-info { display:flex; flex-direction:column; gap:3px; min-width:0; }
        .hero-eyebrow { font-size:11px; letter-spacing:.07em; text-transform:uppercase; color: var(--mmc-text-secondary); font-weight:600; }
        .hero-title { font-size:19px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:340px; }
        .hero-subtitle { font-size:13px; color: var(--mmc-text-secondary); }
        .hero-nextup { display:flex; align-items:center; gap:5px; margin-top:2px; font-size:12px; color: var(--mmc-text-secondary); opacity:0.85; }
        .hero-nextup svg { flex-shrink:0; opacity:0.8; }
        .hero-badge {
          display:flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px;
          background: color-mix(in srgb, var(--mmc-warn) 16%, transparent);
          border:1px solid color-mix(in srgb, var(--mmc-warn) 45%, transparent);
          color: var(--mmc-warn); font-size:12px; font-weight:600; white-space:nowrap;
        }
        .hero-spacer { flex-grow:1; }
        .hero-transport { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .tbtn {
          width:44px; height:44px; border-radius:50%; border:none; cursor:pointer;
          background: rgba(128,128,128,0.18); color: var(--primary-text-color);
          display:flex; align-items:center; justify-content:center; transition: filter .15s;
        }
        .tbtn:hover { filter: brightness(1.15); }
        .tbtn-main { width:52px; height:52px; background: var(--mmc-accent); color: var(--text-primary-color, #fff); }

        .section-label { font-size:12px; letter-spacing:.07em; text-transform:uppercase; color: var(--mmc-text-secondary); font-weight:600; flex-shrink:0; }

        .rooms-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:14px; flex-shrink:0; }
        .tile { border-radius:14px; padding:13px 16px; background: var(--mmc-tile-bg); border:1.5px solid var(--mmc-divider); display:flex; flex-direction:column; gap:8px; cursor:pointer; transition: background .15s, border-color .15s, filter .15s; }
        .tile:hover { filter: brightness(1.08); }
        .tile-locked { cursor:not-allowed; opacity:0.55; }
        .tile-locked:hover { filter:none; }
        .tile-row { display:flex; align-items:center; gap:10px; }
        .tile-subrow { padding-top:6px; border-top:1px solid var(--mmc-divider); }
        .tile-icon { width:32px; height:32px; border-radius:9px; background: rgba(128,128,128,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .tile-name { font-size:14.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tile-spacer { flex-grow:1; }
        .tile-status { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600; flex-shrink:0; }
        .tile-vol-label { font-size:11px; color: var(--mmc-text-secondary); }
        .expand-btn { width:44px; height:44px; margin:-10px -8px -10px 0; border-radius:10px; border:none; background: rgba(128,128,128,0.15); color: var(--primary-text-color); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .volume-bar { display:flex; align-items:center; gap:14px; background: var(--mmc-tile-bg); border-radius:14px; padding:12px 20px; flex-shrink:0; color: var(--mmc-accent); }
        .volume-label { font-size:13px; font-weight:600; color: var(--primary-text-color); white-space:nowrap; }
        .volume-pct { font-size:13px; color: var(--mmc-text-secondary); width:40px; text-align:right; flex-shrink:0; }
        .slider { accent-color: var(--mmc-accent); }
        .slider-flex { flex-grow:1; }
        .mute-btn { width:40px; height:40px; min-width:40px; border-radius:10px; border:none; background: rgba(128,128,128,0.15); color: var(--primary-text-color); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mute-btn-active { background: color-mix(in srgb, var(--mmc-warn) 20%, transparent); color: var(--mmc-warn); }

        .favorites { display:flex; flex-direction:column; gap:10px; margin-top:auto; flex-shrink:0; }
        .fav-header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .fav-tabs { display:flex; background: var(--mmc-tile-bg); border-radius:10px; padding:4px; gap:4px; }
        .fav-tab { padding:8px 18px; min-height:36px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:600; background:transparent; color: var(--mmc-text-secondary); }
        .fav-tab-active { background: var(--mmc-accent); color: var(--text-primary-color, #fff); }
        .fav-hint { font-size:12.5px; font-weight:500; }
        .fav-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(110px,1fr)); gap:12px; }
        .fav-chip { cursor:pointer; background: var(--mmc-tile-bg); border-radius:12px; padding:14px 10px; min-height:44px; display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; transition: filter .15s; }
        .fav-chip:hover { filter: brightness(1.1); }
        .fav-disabled { opacity:0.42; cursor:not-allowed; }
        .fav-disabled:hover { filter:none; }
        .fav-icon { width:32px; height:32px; border-radius:9px; background: rgba(128,128,128,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fav-name { font-size:11.5px; line-height:1.25; }
        .fav-empty { grid-column:1/-1; font-size:13px; color: var(--mmc-text-secondary); padding:12px 0; }

        @keyframes mmc-eq { 0%,100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
        .eq-bar { transform-origin:bottom; animation: mmc-eq 0.9s ease-in-out infinite; fill: currentColor; }
        .eq-bar:nth-child(1) { animation-delay:0s; }
        .eq-bar:nth-child(2) { animation-delay:0.2s; }
        .eq-bar:nth-child(3) { animation-delay:0.4s; }
      `;
    }
  }

  // ---------------------------------------------------------------------
  // Config editor
  // ---------------------------------------------------------------------
  class MusicMultiroomCardEditor extends HTMLElement {
    constructor() {
      super();
      this._hass = null;
      this._config = { rooms: [], favorites: { spotify: [], radio: [] } };
      // Two fully independent browse sessions now — Spotify browses a
      // room's `mass_entity` (Music Assistant), Radio browses its `entity`
      // (HEOS) — they used to share one state object with a category
      // toggle, which no longer fits now that they hit different backends.
      this._spotifyBrowse = { room: null, stack: [], loading: false, error: null };
      this._radioBrowse = { room: null, stack: [], loading: false, error: null };
      this._selectedSpotifyIds = new Set();
      this._selectedRadioIds = new Set();
    }

    setConfig(config) {
      this._config = {
        // Preserve `type` (and any other top-level keys HA attaches, e.g.
        // view_layout/grid_options) — config-changed below sends this whole
        // object back to HA as the new authoritative config. Dropping `type`
        // here made HA's edit-dialog preview fail with "No type provided"
        // as soon as the user changed anything (issue found live, 2026-08-22).
        ...config,
        rooms: (config?.rooms || []).map((r) => ({
          entity: r.entity || '',
          name: r.name || '',
          icon: r.icon || 'mdi:speaker',
          mass_entity: r.mass_entity || '',
        })),
        favorites: {
          // Both arrays use `??` (not `||`) for media_content_type — see
          // the radio comment below for why an empty string must survive.
          // Spotify and radio come from two separate browse backends
          // since 0.7.0 (Music Assistant vs HEOS respectively), but the
          // same empty-string gotcha applies to both.
          spotify: (config?.favorites?.spotify || []).map((f) => ({
            name: f.name || '',
            icon: f.icon || 'mdi:spotify',
            media_content_type: f.media_content_type ?? '',
            media_content_id: f.media_content_id || '',
          })),
          radio: (config?.favorites?.radio || []).map((f) => ({
            name: f.name || '',
            icon: f.icon || 'mdi:radio',
            // `??` not `||`: HEOS's browse_media returns "" (empty string,
            // falsy) as media_content_type for every browsable item
            // (confirmed from home-assistant/core source, 2026-08-23) —
            // `||` would silently corrupt that into 'favorite' on every
            // reload, breaking playback for picked radio stations.
            media_content_type: f.media_content_type ?? 'favorite',
            media_content_id: f.media_content_id || '',
          })),
        },
      };
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._bindPickers();
    }

    _fireConfigChanged() {
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
    }

    _render() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.addEventListener('click', (e) => this._onClick(e));
        this.shadowRoot.addEventListener('change', (e) => this._onFieldChange(e));
        this.shadowRoot.addEventListener('value-changed', (e) => this._onPickerChange(e));
      }
      const hass = this._hass;
      this.shadowRoot.innerHTML = `
        <style>${this._css()}</style>
        <div class="editor">
          <div class="section">
            <div class="section-title">${escHtml(t(hass, 'editor_rooms'))}</div>
            ${this._renderRoomsRows()}
            <button class="add-btn" data-action="add-room">+ ${escHtml(t(hass, 'editor_add_room'))}</button>
          </div>
          <div class="section">
            <div class="section-title">${escHtml(t(hass, 'editor_favorites'))}</div>
            ${this._renderFavoritesSection()}
          </div>
        </div>`;
      this._bindPickers();
    }

    _renderRoomsRows() {
      const hass = this._hass;
      return this._config.rooms
        .map(
          (room, idx) => `
        <div class="room-block">
          <div class="row">
            <ha-entity-picker class="field-entity" data-idx="${idx}" data-field="entity"></ha-entity-picker>
            <input class="field-text" type="text" data-idx="${idx}" data-field="name" data-target="rooms" placeholder="${escHtml(
            t(hass, 'editor_room_name')
          )}" value="${escHtml(room.name)}" />
            <ha-icon-picker class="field-icon" data-idx="${idx}" data-field="icon" data-target="rooms"></ha-icon-picker>
            <button class="icon-btn" data-action="remove-room" data-idx="${idx}" title="${escHtml(t(hass, 'editor_remove'))}" aria-label="${escHtml(t(hass, 'editor_remove'))}">${iconTrash()}</button>
          </div>
          <div class="row row-mass" title="${escHtml(t(hass, 'editor_room_mass_entity_hint'))}">
            <span class="mass-tag">MA</span>
            <ha-entity-picker class="field-entity" data-idx="${idx}" data-field="mass_entity"></ha-entity-picker>
          </div>
        </div>`
        )
        .join('');
    }

    _renderFavoritesSection() {
      return `${this._renderFavSource('spotify')}${this._renderFavSource('radio')}`;
    }

    // Spotify and Radio favorites now come from two entirely separate
    // browse sessions, each against a different backend for the same
    // physical room — Spotify via that room's `mass_entity` (Music
    // Assistant, the user's real Spotify library), Radio via its `entity`
    // (HEOS, unchanged). `category` is 'spotify' or 'radio' throughout.
    _renderFavSource(category) {
      const hass = this._hass;
      const isSpotify = category === 'spotify';
      const rooms = isSpotify
        ? this._config.rooms.filter((r) => r.entity && r.mass_entity)
        : this._config.rooms.filter((r) => r.entity);
      const browse = isSpotify ? this._spotifyBrowse : this._radioBrowse;
      const selectedIds = isSpotify ? this._selectedSpotifyIds : this._selectedRadioIds;
      const list = this._config.favorites[category];

      const favRow = (fav, idx) => `
        <div class="row row-readonly">
          <div class="row-icon"><ha-icon icon="${escHtml(fav.icon || (isSpotify ? 'mdi:spotify' : 'mdi:radio'))}"></ha-icon></div>
          <div class="row-name">${escHtml(fav.name)}</div>
          <button class="icon-btn" data-action="remove-${category}" data-idx="${idx}" title="${escHtml(t(hass, 'editor_remove'))}" aria-label="${escHtml(t(hass, 'editor_remove'))}">${iconTrash()}</button>
        </div>`;
      const addedRows = list.map((f, i) => favRow(f, i)).join('');

      const head = `
        <div class="fav-source-title">${escHtml(t(hass, isSpotify ? 'editor_favorites_spotify_title' : 'editor_favorites_radio_title'))}</div>
        <div class="fav-source-via">${escHtml(t(hass, isSpotify ? 'editor_favorites_spotify_via' : 'editor_favorites_radio_via'))}</div>`;

      if (!rooms.length) {
        return `
          <div class="fav-source">
            ${head}
            <div class="hint">${escHtml(t(hass, isSpotify ? 'editor_no_mass_rooms' : 'editor_no_rooms_configured'))}</div>
            <div class="row-list">${addedRows}</div>
          </div>`;
      }

      const roomOptions = rooms
        .map(
          (r) =>
            `<option value="${escHtml(r.entity)}" ${(browse.room || rooms[0].entity) === r.entity ? 'selected' : ''}>${escHtml(
              r.name || r.entity
            )}</option>`
        )
        .join('');

      let browsePanel = '';
      if (browse.loading) {
        browsePanel = `<div class="hint">${escHtml(t(hass, 'editor_browse_loading'))}</div>`;
      } else if (browse.error) {
        browsePanel = `<div class="hint hint-error">${escHtml(t(hass, 'editor_browse_error'))}</div>`;
      } else if (browse.stack.length) {
        const current = browse.stack[browse.stack.length - 1];
        const items = current.items || [];
        const rows = items
          .map((item, i) => {
            // A row can be browsable, playable-as-a-whole, or both at once
            // — confirmed live against Music Assistant's browse_media tree
            // (2026-08-23): a Spotify playlist is `can_expand: true` (its
            // tracks) AND `can_play: true` (the playlist itself), unlike
            // every HEOS item seen so far where the two were mutually
            // exclusive. `can_play` defaults to true when the field is
            // absent (HEOS's shape) so existing behavior is unchanged.
            const canExpand = !!item.can_expand;
            const canPlay = item.can_play !== false;
            const already = list.some((f) => f.media_content_id === item.media_content_id);
            const checked = selectedIds.has(item.media_content_id);
            return `
              <div class="browse-row">
                ${
                  canPlay
                    ? `<input type="checkbox" ${checked ? 'checked' : ''} ${already ? 'disabled' : ''} data-action="toggle-select" data-idx="${i}" data-category="${category}" />`
                    : `<span class="browse-checkbox-spacer"></span>`
                }
                <span class="browse-title" ${canExpand ? `data-action="browse-drill" data-idx="${i}" data-category="${category}"` : ''}>${escHtml(
              item.title || item.media_content_id || ''
            )}</span>
                ${
                  canExpand
                    ? `<button class="browse-drill-btn" data-action="browse-drill" data-idx="${i}" data-category="${category}" aria-label="${escHtml(t(hass, 'editor_browse_open'))}"><span class="browse-folder-icon">${iconChevron()}</span></button>`
                    : ''
                }
                ${already ? `<span class="browse-badge">${escHtml(t(hass, 'editor_already_added'))}</span>` : ''}
              </div>`;
          })
          .join('');
        browsePanel = `
          <div class="browse-panel">
            <div class="browse-toolbar">
              ${browse.stack.length > 1 ? `<button class="link-btn" data-action="browse-back" data-category="${category}">&larr; ${escHtml(t(hass, 'editor_browse_back'))}</button>` : ''}
              <div class="toolbar-spacer"></div>
              <button class="add-btn" data-action="add-selected" data-category="${category}" ${selectedIds.size ? '' : 'disabled'}>${escHtml(
          t(hass, 'editor_add_selected', { count: selectedIds.size })
        )}</button>
            </div>
            <div class="browse-list">${rows || `<div class="hint">${escHtml(t(hass, 'editor_browse_empty'))}</div>`}</div>
          </div>`;
      }

      return `
        <div class="fav-source">
          ${head}
          <div class="browse-controls">
            <label class="browse-room-label">${escHtml(t(hass, 'editor_browse_from_room'))}
              <select class="browse-room-select" data-action="browse-room-select" data-category="${category}">${roomOptions}</select>
            </label>
            <button class="add-btn" data-action="start-browse" data-category="${category}">${escHtml(
        t(hass, isSpotify ? 'editor_browse_button_spotify' : 'editor_browse_button_radio')
      )}</button>
          </div>
          ${browsePanel}
          <div class="row-list">${addedRows}</div>
        </div>`;
    }

    _bindPickers() {
      if (!this.shadowRoot || !this._hass) return;
      const hass = this._hass;
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-field="entity"]').forEach((el) => {
        const idx = Number(el.dataset.idx);
        el.hass = hass;
        el.value = this._config.rooms[idx]?.entity || '';
        el.includeDomains = ['media_player'];
        el.label = t(hass, 'editor_room_entity');
      });
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-field="mass_entity"]').forEach((el) => {
        const idx = Number(el.dataset.idx);
        el.hass = hass;
        el.value = this._config.rooms[idx]?.mass_entity || '';
        el.includeDomains = ['media_player'];
        el.label = t(hass, 'editor_room_mass_entity');
      });
      this.shadowRoot.querySelectorAll('ha-icon-picker[data-field="icon"]').forEach((el) => {
        const idx = Number(el.dataset.idx);
        el.hass = hass;
        el.value = this._config.rooms[idx]?.icon || '';
        el.label = t(hass, 'editor_room_icon');
      });
    }

    _onPickerChange(e) {
      const el = e.target;
      if (el.matches && el.matches('ha-entity-picker[data-field="entity"]')) {
        e.stopPropagation();
        const idx = Number(el.dataset.idx);
        this._config.rooms[idx].entity = e.detail.value || '';
        this._fireConfigChanged();
        this._render();
      } else if (el.matches && el.matches('ha-entity-picker[data-field="mass_entity"]')) {
        e.stopPropagation();
        const idx = Number(el.dataset.idx);
        this._config.rooms[idx].mass_entity = e.detail.value || '';
        this._fireConfigChanged();
        this._render();
      } else if (el.matches && el.matches('ha-icon-picker[data-field="icon"]')) {
        e.stopPropagation();
        const idx = Number(el.dataset.idx);
        this._config.rooms[idx].icon = e.detail.value || '';
        this._fireConfigChanged();
      }
    }

    _onFieldChange(e) {
      const el = e.target;
      if (el.matches('input.field-text')) {
        const idx = Number(el.dataset.idx);
        const target = el.dataset.target;
        if (target === 'rooms') this._config.rooms[idx][el.dataset.field] = el.value;
        this._fireConfigChanged();
        return;
      }
      if (el.matches('select.browse-room-select')) {
        const category = el.dataset.category;
        const isSpotify = category === 'spotify';
        const browse = isSpotify ? this._spotifyBrowse : this._radioBrowse;
        const selected = isSpotify ? this._selectedSpotifyIds : this._selectedRadioIds;
        browse.room = el.value;
        browse.stack = [];
        selected.clear();
        this._render();
      }
    }

    _onClick(e) {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      const idx = el.dataset.idx !== undefined ? Number(el.dataset.idx) : null;
      const category = el.dataset.category;
      switch (action) {
        case 'add-room':
          this._config.rooms.push({ entity: '', name: '', icon: 'mdi:speaker', mass_entity: '' });
          this._render();
          this._fireConfigChanged();
          break;
        case 'remove-room':
          this._config.rooms.splice(idx, 1);
          this._render();
          this._fireConfigChanged();
          break;
        case 'remove-spotify':
          this._config.favorites.spotify.splice(idx, 1);
          this._render();
          this._fireConfigChanged();
          break;
        case 'remove-radio':
          this._config.favorites.radio.splice(idx, 1);
          this._render();
          this._fireConfigChanged();
          break;
        case 'start-browse':
          this._startBrowse(category);
          break;
        case 'browse-drill':
          this._drillBrowse(category, idx);
          break;
        case 'browse-back': {
          const browse = category === 'spotify' ? this._spotifyBrowse : this._radioBrowse;
          (category === 'spotify' ? this._selectedSpotifyIds : this._selectedRadioIds).clear();
          browse.stack.pop();
          this._render();
          break;
        }
        case 'toggle-select': {
          const browse = category === 'spotify' ? this._spotifyBrowse : this._radioBrowse;
          const selected = category === 'spotify' ? this._selectedSpotifyIds : this._selectedRadioIds;
          const current = browse.stack[browse.stack.length - 1];
          const item = current?.items?.[idx];
          if (item) {
            if (selected.has(item.media_content_id)) selected.delete(item.media_content_id);
            else selected.add(item.media_content_id);
          }
          this._render();
          break;
        }
        case 'add-selected':
          this._addSelectedFavorites(category);
          break;
        default:
          break;
      }
    }

    // Resolves the entity a browse session for `category` should actually
    // hit — the room's own HEOS entity for radio (unchanged), or that
    // room's `mass_entity` for Spotify (Music Assistant's own browse tree,
    // the user's real Spotify library — never HEOS's).
    _browseTargetEntity(category, roomEntity) {
      if (category !== 'spotify') return roomEntity;
      return this._config.rooms.find((r) => r.entity === roomEntity)?.mass_entity || null;
    }

    // Shared browse_media call — `item` omitted fetches the root, passed
    // fetches that item's children. Returns a stack entry or throws.
    async _fetchBrowseNode(targetEntity, item) {
      const result = await this._hass.connection.sendMessagePromise(
        item
          ? { type: 'media_player/browse_media', entity_id: targetEntity, media_content_type: item.media_content_type, media_content_id: item.media_content_id }
          : { type: 'media_player/browse_media', entity_id: targetEntity }
      );
      return { title: result.title || item?.title || '', items: result.children || [] };
    }

    async _startBrowse(category) {
      const isSpotify = category === 'spotify';
      const browse = isSpotify ? this._spotifyBrowse : this._radioBrowse;
      const rooms = isSpotify
        ? this._config.rooms.filter((r) => r.entity && r.mass_entity)
        : this._config.rooms.filter((r) => r.entity);
      const room = browse.room || rooms[0]?.entity;
      const targetEntity = room ? this._browseTargetEntity(category, room) : null;
      if (!targetEntity || !this._hass) return;
      browse.room = room;
      browse.loading = true;
      browse.error = null;
      this._render();
      try {
        // [UNVERIFIED] standard HA media browser websocket command. The
        // HEOS-entity shape (title/children/can_expand) was confirmed
        // live; the Music Assistant entity's shape for Spotify content has
        // only partially been (see CLAUDE.md).
        const root = await this._fetchBrowseNode(targetEntity);
        browse.stack = [root];
        // Nobody wants to add favorites from Artists/Albums/Tracks/Radio
        // stations/Podcasts on a multiroom dashboard — jump straight into
        // "Playlists" for Spotify (confirmed live: it's always present at
        // the root) while leaving the root reachable via Back, in case
        // that's not actually what someone wants this time.
        if (isSpotify) {
          const playlists = root.items.find((it) => it.can_expand && /playlist/i.test(it.title || ''));
          if (playlists) browse.stack.push(await this._fetchBrowseNode(targetEntity, playlists));
        }
        browse.loading = false;
      } catch (err) {
        browse.loading = false;
        browse.error = err;
      }
      this._render();
    }

    async _drillBrowse(category, idx) {
      const isSpotify = category === 'spotify';
      const browse = isSpotify ? this._spotifyBrowse : this._radioBrowse;
      const selected = isSpotify ? this._selectedSpotifyIds : this._selectedRadioIds;
      const current = browse.stack[browse.stack.length - 1];
      const item = current?.items?.[idx];
      const targetEntity = this._browseTargetEntity(category, browse.room);
      if (!item || !targetEntity || !this._hass) return;
      browse.loading = true;
      selected.clear();
      this._render();
      try {
        browse.stack.push(await this._fetchBrowseNode(targetEntity, item));
        browse.loading = false;
      } catch (err) {
        browse.loading = false;
        browse.error = err;
      }
      this._render();
    }

    _addSelectedFavorites(category) {
      const isSpotify = category === 'spotify';
      const browse = isSpotify ? this._spotifyBrowse : this._radioBrowse;
      const selected = isSpotify ? this._selectedSpotifyIds : this._selectedRadioIds;
      const current = browse.stack[browse.stack.length - 1];
      const items = current?.items || [];
      // A selected item may also be browsable (e.g. a Spotify playlist,
      // can_expand AND can_play both true) — only exclude items that were
      // never selectable in the first place (can_play === false).
      const toAdd = items.filter((it) => selected.has(it.media_content_id) && it.can_play !== false);
      const target = this._config.favorites[category];
      for (const item of toAdd) {
        if (target.some((f) => f.media_content_id === item.media_content_id)) continue;
        target.push({
          name: item.title || item.media_content_id,
          icon: isSpotify ? 'mdi:spotify' : 'mdi:radio',
          media_content_type: item.media_content_type,
          media_content_id: item.media_content_id,
        });
      }
      selected.clear();
      this._render();
      this._fireConfigChanged();
    }

    _css() {
      return `
        :host { display:block; }
        * { box-sizing:border-box; }
        .editor { display:flex; flex-direction:column; gap:20px; padding:8px 0; }
        .section-title { font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color: var(--secondary-text-color); margin-bottom:8px; }
        .room-block { border:1px solid var(--divider-color,#444); border-radius:10px; padding:10px 12px 2px; margin-bottom:10px; }
        .row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        .row-mass { border-top:1px dashed var(--divider-color,#444); padding-top:8px; }
        .mass-tag {
          font-size:9.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase;
          color: var(--primary-color, #03a9f4); background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent);
          border:1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 45%, transparent);
          border-radius:4px; padding:2px 6px; flex-shrink:0;
        }
        .row-readonly { background: var(--secondary-background-color, rgba(0,0,0,.04)); border-radius:8px; padding:6px 10px; }
        .row-icon { display:flex; align-items:center; justify-content:center; width:28px; }
        .row-name { flex-grow:1; font-size:14px; }
        .field-entity, .field-icon { flex:1 1 0; min-width:0; }
        .field-icon-narrow { flex:0 0 90px; }
        .field-text { flex:1 1 0; min-width:0; height:44px; padding:0 10px; border-radius:6px; border:1px solid var(--divider-color, #444); background: var(--card-background-color, transparent); color: var(--primary-text-color); font-size:14px; }
        .icon-btn { width:40px; height:40px; min-width:40px; border-radius:8px; border:none; background: rgba(128,128,128,.15); color: var(--primary-text-color); cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .add-btn { height:44px; padding:0 16px; border-radius:8px; border:1px dashed var(--divider-color,#666); background:transparent; color: var(--primary-color); cursor:pointer; font-size:13px; font-weight:600; align-self:flex-start; }
        .add-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .hint { font-size:13px; color: var(--secondary-text-color); padding:8px 0; }
        .hint-error { color: var(--error-color, #db4437); }
        .browse-controls { display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
        .browse-room-label { font-size:13px; color: var(--secondary-text-color); display:flex; align-items:center; gap:8px; }
        .browse-room-select { height:40px; border-radius:6px; border:1px solid var(--divider-color,#444); background: var(--card-background-color, transparent); color: var(--primary-text-color); }
        .browse-panel { border:1px solid var(--divider-color,#444); border-radius:8px; padding:10px; margin-bottom:12px; }
        .browse-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap; }
        .browse-toolbar .add-btn { height:36px; }
        .toolbar-spacer { flex-grow:1; }
        .fav-source { border:1px solid var(--divider-color,#444); border-radius:10px; padding:14px 16px; margin-top:14px; }
        .fav-source-title { font-size:14px; font-weight:600; }
        .fav-source-via { font-size:11.5px; color: var(--secondary-text-color); margin-bottom:10px; }
        .browse-list { max-height:260px; overflow-y:auto; display:flex; flex-direction:column; gap:4px; }
        .browse-row { display:flex; align-items:center; gap:10px; padding:8px; border-radius:6px; min-height:40px; }
        .browse-row:hover { background: rgba(128,128,128,.08); }
        .browse-checkbox-spacer { width:18px; flex-shrink:0; }
        .browse-title { flex-grow:1; font-size:13.5px; }
        .browse-title[data-action] { cursor:pointer; }
        .browse-title[data-action]:hover { text-decoration:underline; }
        .browse-drill-btn { width:32px; height:32px; min-width:32px; border-radius:8px; border:none; background:transparent; color: var(--secondary-text-color); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .browse-drill-btn:hover { background: rgba(128,128,128,.15); color: var(--primary-text-color); }
        .browse-folder-icon { transform:rotate(-90deg); display:flex; }
        .browse-badge { font-size:11px; color: var(--secondary-text-color); }
        .link-btn { background:none; border:none; color: var(--primary-color); cursor:pointer; font-size:13px; padding:6px 0; margin-bottom:6px; }
      `;
    }
  }

  customElements.define(EDITOR_NAME, MusicMultiroomCardEditor);
  customElements.define(CARD_NAME, MusicMultiroomCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_NAME,
    name: 'Music Multiroom Card',
    description: 'Full-page multi-room audio control for Home Assistant HEOS.',
    preview: false,
  });
})();
