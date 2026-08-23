/**
 * Music Multiroom Card
 * Full-page multi-room audio control card for Home Assistant, built around the
 * generic media_player join/unjoin/play_media services (targets HEOS in v1;
 * also implemented by Sonos/Bluesound). No build chain, no external deps.
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
      favorites_ready_hint: 'Ready to play',
      no_favorites: 'No favorites configured yet — add some in the card editor.',
      locked_other_group: 'Playing in another group',
      volume_pct: 'Vol {value}%',
      previous: 'Previous',
      play: 'Play',
      pause: 'Pause',
      next: 'Next',
      rooms_required: '"rooms" must be a non-empty list of media_player entities',
      editor_rooms: 'Rooms',
      editor_add_room: 'Add room',
      editor_room_entity: 'Media player entity',
      editor_room_name: 'Display name',
      editor_room_icon: 'Icon',
      editor_remove: 'Remove',
      editor_spotify_favorites: 'Spotify favorites',
      editor_add_spotify_favorite: 'Add Spotify favorite',
      editor_favorite_name: 'Name',
      editor_favorite_icon: 'Icon',
      editor_favorite_content_id: 'Media content ID (Spotify URI)',
      editor_radio_favorites: 'Radio favorites',
      editor_browse_from_room: 'Browse from room',
      editor_browse_button: 'Browse HEOS favorites',
      editor_browse_loading: 'Loading favorites…',
      editor_browse_error: 'Could not load favorites from this room. Is it online?',
      editor_browse_empty: 'No browsable favorites found here.',
      editor_browse_back: 'Back',
      editor_add_selected: 'Add selected ({count})',
      editor_already_added: 'Already added',
      editor_no_rooms_configured: 'Add at least one room before browsing favorites.',
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
      favorites_ready_hint: 'Redo att spela',
      no_favorites: 'Inga favoriter konfigurerade än — lägg till i kortets editor.',
      locked_other_group: 'Spelar i en annan grupp',
      volume_pct: 'Vol {value}%',
      previous: 'Föregående',
      play: 'Spela',
      pause: 'Pausa',
      next: 'Nästa',
      rooms_required: '"rooms" måste vara en icke-tom lista med media_player-entiteter',
      editor_rooms: 'Rum',
      editor_add_room: 'Lägg till rum',
      editor_room_entity: 'Media player-entitet',
      editor_room_name: 'Visningsnamn',
      editor_room_icon: 'Ikon',
      editor_remove: 'Ta bort',
      editor_spotify_favorites: 'Spotify-favoriter',
      editor_add_spotify_favorite: 'Lägg till Spotify-favorit',
      editor_favorite_name: 'Namn',
      editor_favorite_icon: 'Ikon',
      editor_favorite_content_id: 'Media content ID (Spotify-URI)',
      editor_radio_favorites: 'Radiofavoriter',
      editor_browse_from_room: 'Bläddra från rum',
      editor_browse_button: 'Bläddra HEOS-favoriter',
      editor_browse_loading: 'Laddar favoriter…',
      editor_browse_error: 'Kunde inte hämta favoriter från det här rummet. Är det online?',
      editor_browse_empty: 'Inga bläddringsbara favoriter hittades här.',
      editor_browse_back: 'Tillbaka',
      editor_add_selected: 'Lägg till markerade ({count})',
      editor_already_added: 'Redan tillagd',
      editor_no_rooms_configured: 'Lägg till minst ett rum innan du bläddrar favoriter.',
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
    }

    setConfig(config) {
      if (!config || !Array.isArray(config.rooms) || config.rooms.length === 0) {
        throw new Error(`music-multiroom-card: ${t(this._hass, 'rooms_required')}`);
      }
      this._config = {
        ...config,
        rooms: config.rooms.map((r) => ({
          entity: r.entity,
          name: r.name || r.entity,
          icon: r.icon || 'mdi:speaker',
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
      return (this._config?.rooms || []).map((r) => r.entity).filter(Boolean);
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
    }

    // ---- group derivation ------------------------------------------------
    // [UNVERIFIED] Assumes HA's generic media_player "group_members"
    // attribute is populated by the heos platform the same way as other
    // grouping-capable platforms (Sonos/Bluesound). Confirm via Developer
    // Tools -> States on a real HEOS entity, solo and grouped, before
    // trusting this in production. See CLAUDE.md.
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
          this._onFavoriteTap(el.dataset.type, el.dataset.id);
          break;
        case 'transport':
          this._onTransport(el.dataset.cmd);
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
        if (this._guardPending(entity)) return;
        this._hass.callService('media_player', 'unjoin', {}, { entity_id: entity });
        if (owning.memberEntities.length <= 2) {
          this._focusedGroupId = null;
          this._render();
        }
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
        this._hass.callService(
          'media_player',
          'join',
          { group_members: Array.from(new Set(desiredMembers)) },
          { entity_id: focusedLeader }
        );
        return;
      }

      this._focusedGroupId = entity;
      this._render();
    }

    _onFavoriteTap(mediaContentType, mediaContentId) {
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      if (!focusedLeader || !this._hass) return;
      this._hass.callService(
        'media_player',
        'play_media',
        { media_content_type: mediaContentType, media_content_id: mediaContentId },
        { entity_id: focusedLeader }
      );
    }

    _onTransport(cmd) {
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      if (!focusedLeader || !this._hass) return;
      const svc = cmd === 'play_pause' ? 'media_play_pause' : cmd === 'next' ? 'media_next_track' : 'media_previous_track';
      this._hass.callService('media_player', svc, {}, { entity_id: focusedLeader });
    }

    _setRoomVolume(entity, sliderValue) {
      if (!entity || !this._hass) return;
      this._hass.callService('media_player', 'volume_set', { volume_level: sliderValue / 100 }, { entity_id: entity });
    }

    _setGroupVolume(sliderValue) {
      const groups = this._computeGroups();
      const focusedLeader = this._resolveFocusedLeader(groups);
      if (!focusedLeader || !this._hass) return;
      // [UNVERIFIED] heos.group_volume_set's exact schema, and whether it is
      // still the right service on the user's HA version, needs live
      // confirmation. See CLAUDE.md.
      this._hass.callService('heos', 'group_volume_set', { entity_id: focusedLeader, level: sliderValue / 100 });
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

      this.shadowRoot.innerHTML = `
        <style>${this._css()}</style>
        <div class="card">
          ${this._renderGroupsStrip(groups, focusedLeader)}
          ${this._renderHero(focusedGroup, focusedLeader)}
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

    _renderHero(focusedGroup, focusedLeader) {
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
      const title = st?.attributes?.media_title || t(hass, 'no_media');
      const artist = st?.attributes?.media_artist || '';
      const picture = st?.attributes?.entity_picture;
      const names = focusedGroup.memberEntities.map(
        (id) => this._config.rooms.find((r) => r.entity === id)?.name || id
      );
      return `
        <div class="hero" style="border-left-color:${focusedGroup.color};">
          <div class="hero-art">${picture ? `<img src="${escHtml(picture)}" alt="">` : iconNote()}</div>
          <div class="hero-info">
            <div class="hero-eyebrow">${escHtml(t(hass, 'now_playing'))}</div>
            <div class="hero-title">${escHtml(title)}</div>
            <div class="hero-subtitle">${escHtml(artist)}</div>
          </div>
          ${
            isPlaying
              ? `<div class="hero-badge">${iconEq()}${escHtml(t(hass, 'playing_on', { rooms: names.join(', ') }))}</div>`
              : ''
          }
          <div class="hero-spacer"></div>
          <div class="hero-transport">
            <button class="tbtn" data-action="transport" data-cmd="prev" title="${escHtml(t(hass, 'previous'))}">${iconPrev()}</button>
            <button class="tbtn tbtn-main" data-action="transport" data-cmd="play_pause" title="${escHtml(t(hass, isPlaying ? 'pause' : 'play'))}">${
        isPlaying ? iconPause() : iconPlay()
      }</button>
            <button class="tbtn" data-action="transport" data-cmd="next" title="${escHtml(t(hass, 'next'))}">${iconNext()}</button>
          </div>
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
                <button class="expand-btn" data-action="toggle-expand" data-entity="${escHtml(room.entity)}">
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
      return `
        <div class="volume-bar">
          <span class="volume-icon">${iconVolume()}</span>
          <div class="volume-label">${escHtml(t(hass, 'group_volume'))}</div>
          <input type="range" class="slider slider-flex" min="0" max="100" value="${pct}" data-action="group-volume" />
          <div class="volume-pct">${pct}%</div>
        </div>`;
    }

    _renderFavorites(focusedLeader) {
      const hass = this._hass;
      const cfg = this._config.favorites;
      const list = this._activeFavTab === 'spotify' ? cfg.spotify : cfg.radio;
      const disabled = !focusedLeader;
      const chips = (list || [])
        .map((fav) => {
          const icon = fav.icon || (this._activeFavTab === 'radio' ? 'mdi:radio' : 'mdi:spotify');
          return `
            <div class="fav-chip ${disabled ? 'fav-disabled' : ''}" data-action="play-favorite" data-type="${escHtml(
            fav.media_content_type
          )}" data-id="${escHtml(fav.media_content_id)}">
              <div class="fav-icon"><ha-icon icon="${escHtml(icon)}"></ha-icon></div>
              <div class="fav-name">${escHtml(fav.name)}</div>
            </div>`;
        })
        .join('');
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
              ${escHtml(disabled ? t(hass, 'favorites_disabled_hint') : t(hass, 'favorites_ready_hint'))}
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
          flex-shrink:0;
        }
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
      this._radioBrowse = { room: null, stack: [], loading: false, error: null };
      this._selectedBrowseIds = new Set();
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
        })),
        favorites: {
          spotify: (config?.favorites?.spotify || []).map((f) => ({
            name: f.name || '',
            icon: f.icon || 'mdi:spotify',
            media_content_type: 'playlist',
            media_content_id: f.media_content_id || '',
          })),
          radio: (config?.favorites?.radio || []).map((f) => ({
            name: f.name || '',
            icon: f.icon || 'mdi:radio',
            media_content_type: f.media_content_type || 'favorite',
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
            <div class="section-title">${escHtml(t(hass, 'editor_spotify_favorites'))}</div>
            ${this._renderSpotifyRows()}
            <button class="add-btn" data-action="add-spotify">+ ${escHtml(t(hass, 'editor_add_spotify_favorite'))}</button>
          </div>
          <div class="section">
            <div class="section-title">${escHtml(t(hass, 'editor_radio_favorites'))}</div>
            ${this._renderRadioSection()}
          </div>
        </div>`;
      this._bindPickers();
    }

    _renderRoomsRows() {
      const hass = this._hass;
      return this._config.rooms
        .map(
          (room, idx) => `
        <div class="row">
          <ha-entity-picker class="field-entity" data-idx="${idx}" data-field="entity"></ha-entity-picker>
          <input class="field-text" type="text" data-idx="${idx}" data-field="name" data-target="rooms" placeholder="${escHtml(
            t(hass, 'editor_room_name')
          )}" value="${escHtml(room.name)}" />
          <ha-icon-picker class="field-icon" data-idx="${idx}" data-field="icon" data-target="rooms"></ha-icon-picker>
          <button class="icon-btn" data-action="remove-room" data-idx="${idx}" title="${escHtml(t(hass, 'editor_remove'))}">${iconTrash()}</button>
        </div>`
        )
        .join('');
    }

    _renderSpotifyRows() {
      const hass = this._hass;
      return this._config.favorites.spotify
        .map(
          (fav, idx) => `
        <div class="row">
          <input class="field-text" type="text" data-idx="${idx}" data-field="name" data-target="spotify" placeholder="${escHtml(
            t(hass, 'editor_favorite_name')
          )}" value="${escHtml(fav.name)}" />
          <ha-icon-picker class="field-icon field-icon-narrow" data-idx="${idx}" data-field="icon" data-target="spotify"></ha-icon-picker>
          <input class="field-text" type="text" data-idx="${idx}" data-field="media_content_id" data-target="spotify" placeholder="${escHtml(
            t(hass, 'editor_favorite_content_id')
          )}" value="${escHtml(fav.media_content_id)}" />
          <button class="icon-btn" data-action="remove-spotify" data-idx="${idx}" title="${escHtml(t(hass, 'editor_remove'))}">${iconTrash()}</button>
        </div>`
        )
        .join('');
    }

    _renderRadioSection() {
      const hass = this._hass;
      const rooms = this._config.rooms.filter((r) => r.entity);
      if (!rooms.length) {
        return `<div class="hint">${escHtml(t(hass, 'editor_no_rooms_configured'))}</div>`;
      }
      const browse = this._radioBrowse;
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
            const isBrowsable = !!item.can_expand;
            const already = this._config.favorites.radio.some((f) => f.media_content_id === item.media_content_id);
            const checked = this._selectedBrowseIds.has(item.media_content_id);
            return `
              <div class="browse-row" data-action="${isBrowsable ? 'browse-drill' : 'toggle-select'}" data-idx="${i}">
                ${
                  isBrowsable
                    ? `<span class="browse-folder-icon">${iconChevron()}</span>`
                    : `<input type="checkbox" ${checked ? 'checked' : ''} ${already ? 'disabled' : ''} data-action="toggle-select" data-idx="${i}" />`
                }
                <span class="browse-title">${escHtml(item.title || item.media_content_id || '')}</span>
                ${already ? `<span class="browse-badge">${escHtml(t(hass, 'editor_already_added'))}</span>` : ''}
              </div>`;
          })
          .join('');
        browsePanel = `
          <div class="browse-panel">
            <div class="browse-toolbar">
              ${browse.stack.length > 1 ? `<button class="link-btn" data-action="browse-back">&larr; ${escHtml(t(hass, 'editor_browse_back'))}</button>` : '<span></span>'}
              <button class="add-btn" data-action="add-selected" ${this._selectedBrowseIds.size ? '' : 'disabled'}>${escHtml(
        t(hass, 'editor_add_selected', { count: this._selectedBrowseIds.size })
      )}</button>
            </div>
            <div class="browse-list">${rows || `<div class="hint">${escHtml(t(hass, 'editor_browse_empty'))}</div>`}</div>
          </div>`;
      }

      const radioRows = this._config.favorites.radio
        .map(
          (fav, idx) => `
        <div class="row row-readonly">
          <div class="row-icon"><ha-icon icon="${escHtml(fav.icon || 'mdi:radio')}"></ha-icon></div>
          <div class="row-name">${escHtml(fav.name)}</div>
          <button class="icon-btn" data-action="remove-radio" data-idx="${idx}" title="${escHtml(t(hass, 'editor_remove'))}">${iconTrash()}</button>
        </div>`
        )
        .join('');

      return `
        <div class="browse-controls">
          <label class="browse-room-label">${escHtml(t(hass, 'editor_browse_from_room'))}
            <select class="browse-room-select" data-action="browse-room-select">${roomOptions}</select>
          </label>
          <button class="add-btn" data-action="start-browse">${escHtml(t(hass, 'editor_browse_button'))}</button>
        </div>
        ${browsePanel}
        <div class="row-list">${radioRows}</div>`;
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
      this.shadowRoot.querySelectorAll('ha-icon-picker[data-field="icon"]').forEach((el) => {
        const idx = Number(el.dataset.idx);
        const arr = el.dataset.target === 'spotify' ? this._config.favorites.spotify : this._config.rooms;
        el.hass = hass;
        el.value = arr[idx]?.icon || '';
        el.label = t(hass, arr === this._config.rooms ? 'editor_room_icon' : 'editor_favorite_icon');
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
      } else if (el.matches && el.matches('ha-icon-picker[data-field="icon"]')) {
        e.stopPropagation();
        const idx = Number(el.dataset.idx);
        const arr = el.dataset.target === 'spotify' ? this._config.favorites.spotify : this._config.rooms;
        arr[idx].icon = e.detail.value || '';
        this._fireConfigChanged();
      }
    }

    _onFieldChange(e) {
      const el = e.target;
      if (el.matches('input.field-text')) {
        const idx = Number(el.dataset.idx);
        const target = el.dataset.target;
        if (target === 'rooms') this._config.rooms[idx][el.dataset.field] = el.value;
        else if (target === 'spotify') this._config.favorites.spotify[idx][el.dataset.field] = el.value;
        this._fireConfigChanged();
        return;
      }
      if (el.matches('select.browse-room-select')) {
        this._radioBrowse.room = el.value;
        this._radioBrowse.stack = [];
        this._selectedBrowseIds.clear();
        this._render();
      }
    }

    _onClick(e) {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      const idx = el.dataset.idx !== undefined ? Number(el.dataset.idx) : null;
      switch (action) {
        case 'add-room':
          this._config.rooms.push({ entity: '', name: '', icon: 'mdi:speaker' });
          this._render();
          this._fireConfigChanged();
          break;
        case 'remove-room':
          this._config.rooms.splice(idx, 1);
          this._render();
          this._fireConfigChanged();
          break;
        case 'add-spotify':
          this._config.favorites.spotify.push({ name: '', icon: 'mdi:spotify', media_content_type: 'playlist', media_content_id: '' });
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
          this._startBrowse();
          break;
        case 'browse-drill':
          this._drillBrowse(idx);
          break;
        case 'browse-back':
          this._radioBrowse.stack.pop();
          this._selectedBrowseIds.clear();
          this._render();
          break;
        case 'toggle-select': {
          const current = this._radioBrowse.stack[this._radioBrowse.stack.length - 1];
          const item = current?.items?.[idx];
          if (item) {
            if (this._selectedBrowseIds.has(item.media_content_id)) this._selectedBrowseIds.delete(item.media_content_id);
            else this._selectedBrowseIds.add(item.media_content_id);
          }
          this._render();
          break;
        }
        case 'add-selected':
          this._addSelectedFavorites();
          break;
        default:
          break;
      }
    }

    async _startBrowse() {
      const room = this._radioBrowse.room || this._config.rooms[0]?.entity;
      if (!room || !this._hass) return;
      this._radioBrowse.room = room;
      this._radioBrowse.loading = true;
      this._radioBrowse.error = null;
      this._render();
      try {
        // [UNVERIFIED] standard HA media browser websocket command; not
        // previously called from any card in this project. Confirm the
        // response shape (title/children/can_expand) against a real HEOS
        // media_player before relying on this in production.
        const result = await this._hass.connection.sendMessagePromise({
          type: 'media_player/browse_media',
          entity_id: room,
        });
        this._radioBrowse.loading = false;
        this._radioBrowse.stack = [{ title: result.title || '', items: result.children || [] }];
      } catch (err) {
        this._radioBrowse.loading = false;
        this._radioBrowse.error = err;
      }
      this._render();
    }

    async _drillBrowse(idx) {
      const current = this._radioBrowse.stack[this._radioBrowse.stack.length - 1];
      const item = current?.items?.[idx];
      if (!item || !this._hass) return;
      this._radioBrowse.loading = true;
      this._selectedBrowseIds.clear();
      this._render();
      try {
        const result = await this._hass.connection.sendMessagePromise({
          type: 'media_player/browse_media',
          entity_id: this._radioBrowse.room,
          media_content_type: item.media_content_type,
          media_content_id: item.media_content_id,
        });
        this._radioBrowse.loading = false;
        this._radioBrowse.stack.push({ title: result.title || item.title || '', items: result.children || [] });
      } catch (err) {
        this._radioBrowse.loading = false;
        this._radioBrowse.error = err;
      }
      this._render();
    }

    _addSelectedFavorites() {
      const current = this._radioBrowse.stack[this._radioBrowse.stack.length - 1];
      const items = current?.items || [];
      const toAdd = items.filter((it) => this._selectedBrowseIds.has(it.media_content_id) && !it.can_expand);
      for (const item of toAdd) {
        if (this._config.favorites.radio.some((f) => f.media_content_id === item.media_content_id)) continue;
        this._config.favorites.radio.push({
          name: item.title || item.media_content_id,
          icon: 'mdi:radio',
          media_content_type: item.media_content_type,
          media_content_id: item.media_content_id,
        });
      }
      this._selectedBrowseIds.clear();
      this._render();
      this._fireConfigChanged();
    }

    _css() {
      return `
        :host { display:block; }
        * { box-sizing:border-box; }
        .editor { display:flex; flex-direction:column; gap:20px; padding:8px 0; }
        .section-title { font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color: var(--secondary-text-color); margin-bottom:8px; }
        .row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
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
        .browse-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
        .browse-toolbar .add-btn { height:36px; }
        .browse-list { max-height:260px; overflow-y:auto; display:flex; flex-direction:column; gap:4px; }
        .browse-row { display:flex; align-items:center; gap:10px; padding:8px; border-radius:6px; cursor:pointer; min-height:40px; }
        .browse-row:hover { background: rgba(128,128,128,.12); }
        .browse-folder-icon { transform:rotate(-90deg); display:flex; }
        .browse-title { flex-grow:1; font-size:13.5px; }
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
    description: 'Full-page multi-room audio control for HEOS (and other join/unjoin capable media players).',
    preview: false,
  });
})();
