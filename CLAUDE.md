# music-multiroom-card

Full-page Lovelace-kort för multi-room ljudstyrning, byggt mot HA:s generiska
`media_player`-tjänster (`join`/`unjoin`/`play_media`) + HEOS-specifika
`heos.group_volume_set`. Se [README.md](README.md) för options-tabell och
features.

**Uppströmsberoende:** Home Assistants inbyggda `heos`-integration
(bygger på `pyheos`). Inget annat tredjepartsberoende. Kortet är byggt och
TESTAT mot HEOS specifikt — även om join/unjoin/play_media tekniskt är
generiska `media_player`-tjänster som även Sonos/Bluesound implementerar,
görs INGEN kompatibilitetsutfästelse för andra plattformar (borttaget
2026-08-23 på ägarens begäran — "vi anger att vi testar med HEOS för att
inte lova för mycket"). Om kortet råkar fungera mot en annan plattform är
det en bonus, inte ett designmål eller något som testas.

## Bakgrund / design

Kortet designades genom två rundor klickbara mockups (publicerade som Claude
Design-canvasar) under en research- och designdiskussion 2026-08-22, innan
någon kod skrevs. Se den sessionens konversation för det fulla
resonemanget kring layoutval (hero + rumsgrid + favorithylla, "Active
Groups"-raden för multi-grupp-stöd, favoriter uppdelade Spotify/Radio).

## Avsteg från normal release-rutin — 0.5.0 (2026-08-22)

`0.5.0` släpptes MEDVETET utan den normala beta-verifieringen (skapa
`beta-X.Y.Z`, testa live, vänta på bekräftelse INNAN merge/skarp release)
som annars är obligatorisk enligt paraply-CLAUDE.mds release-rutin. Ägaren
bad uttryckligen om detta ("main är tomt, skapa en 0.5 istället, tidig
release och kör det ooverifierat, enklast så") efter att ha blivit
tillfrågad om avvägningen. `beta-0.1.0`-taggen finns kvar publicerad som
historik men mergen till `main` och `0.5.0`-taggen skedde INNAN någon live
verifiering. Versionsnumret valdes medvetet under `1.0.0` (inte `0.9.0`
som ursprungligen föreslogs) för att tydligt signalera "tidig/overifierad
release", inte en färdig 1.0-kandidat.

Konsekvens: samtliga punkter nedan är fortfarande OBEKRÄFTADE i praktiken,
inte bara "innan release" som tidigare — uppdatera denna sektion så fort
någon av dem faktiskt testas, oavsett vilken version som då är aktuell.

**Första konkreta exemplet på konsekvensen:** `0.5.1` fixade en bugg
("No type provided" i edit-dialogen) som troligen hade fångats av en
beta-verifiering innan release — istället hittades den av ägaren direkt i
skarp drift. Buggen var dock i EDITORN (en generisk HA-lovelace-detalj,
`config-changed` som tappade `type`), inte i något av de HEOS-specifika
antagandena ovan — de är fortfarande helt otestade.

## Kräver manuell verifiering i riktig HA-instans

`0.5.5` (2026-08-23) läste igenom HA cores faktiska
`homeassistant/components/heos/media_player.py` och `services.yaml`
källkod (inte bara dokumentation) — flera punkter nedan är därför nu
BEKRÄFTADE mot källkod snarare än gissade, se detaljerad logg i den
sessionens konversation. Kvarvarande punkter kräver fortfarande en riktig
HEOS-installation eftersom källkoden inte visar allt (t.ex. exakta
`browse_media`-svar från en riktig TuneIn/Favorites-källa).

1. ~~**`group_members`-attributet.**~~ **BEKRÄFTAT via källkod
   (2026-08-23):** `_get_group_members()` i HA core returnerar leader +
   alla medlemmar, symmetriskt för samtliga gruppmedlemmar (samma lista på
   alla). Ingen explicit "is_leader"-flagga exponeras på entitetsnivå —
   kortets egen deterministiska "leader" (första konfigurerade rummet
   bland medlemmarna) är en egen konstruktion, inte HEOS egen
   `group.lead_player_id`. Se punkt 2 för varför detta spelar roll vid
   avgruppering.
2. ~~**`media_player.join`/`unjoin`s semantik.**~~ **BEKRÄFTAT via källkod
   (2026-08-23), bygger vidare på den tidigare live-bekräftelsen:**
   `async_join_players(group_members)` bygger `player_ids = [self, ...
   group_members]` och anropar `heos.set_group(player_ids)` — ERSÄTTER
   alltså alltid hela gruppen (matchar
   [home-assistant/core#79298](https://github.com/home-assistant/core/issues/79298),
   redan fixat i `_onRoomTap()` sedan `0.5.3`). **Nytt fynd:**
   `async_unjoin_player()` är leader-beroende — om den entitet som
   unjoinas råkar vara HEOS EGEN interna `group.lead_player_id` LÖSER DEN
   UPP HELA GRUPPEN istället för att bara koppla loss just den entiteten;
   för en vanlig medlem själv-tar den bara bort sig själv. Eftersom kortet
   inte känner till HEOS riktiga interna leader (bara sin egen
   konfigurationsordning-baserade variant) gick det inte att lita på ren
   `unjoin` för borttagning av en enskild medlem. Fixat i `0.5.5`: när
   ≥2 medlemmar ska finnas kvar efter borttagningen, bygg om gruppen
   explicit via `join` under en av de kvarvarande medlemmarna istället för
   att lita på `unjoin` — deterministiskt korrekt oavsett vem HEOS
   internt anser vara leader.
3. ~~**`media_player.play_media`s payload.**~~ **BEKRÄFTAT via källkod
   (2026-08-23):** `media_content_type` `"playlist"` (Spotify-favoriter)
   och `"favorite"` (quick-select-stil) är exakt de strängar
   `async_play_media()` faktiskt matchar mot. **Viktigt fynd:** HEOS
   `browse_media`-barn har ALLTID `media_content_type: ""` (tom sträng)
   — inte `"favorite"` — och ett specialkodat `media_content_id`
   ("heos media URI") som `async_play_media()` känner igen FÖRE någon
   typ-koll. Kortets radio-bläddrare sparar detta rakt av, vilket är
   korrekt — MEN editorns `setConfig()`-normalisering hade en bugg:
   `f.media_content_type || 'favorite'` korrumperade tomma strängen
   (falsy i JS) till `'favorite'` vid varje omladdning, vilket skulle
   trasat uppspelning för bläddrade radiofavoriter. Fixat i `0.5.5` med
   `??` istället för `||`.
4. ~~**`heos.group_volume_set`.**~~ **BEKRÄFTAT via källkod
   (2026-08-23):** exakt schema är `volume_level` (0–1) som data-fält,
   entitet som TARGET — inte `level`+`entity_id` båda i data-payloaden
   som tidigare gissat. Fixat i `0.5.5`. Tjänsten finns kvar i aktuell
   HA core, inte ersatt.
5. **`media_player/browse_media`-svarets exakta trädstruktur för HEOS
   Favorites/TuneIn.** Källkoden bekräftar att root-noden listar alla
   `music_sources` (inklusive TuneIn) platt, ingen separat
   "Favorites"-container på rot-nivå — men den exakta strukturen NÄR man
   bläddrar IN i en musik-källa (t.ex. hur många nivåer till en spelbar
   station) är fortfarande inte verifierad mot en riktig HEOS-installation.
   Bläddraren är byggd som en generisk breadcrumb-navigator just för att
   hantera okänt djup, men bör provköras live innan den litas på fullt ut.
6. **Övriga bekräftade API-fakta värda att känna till** (från samma
   källkodsgenomgång, inget som kräver kodändring): HEOS stödjer INTE
   seek (ingen progress-bar med scrub är möjlig, bara visning — se
   [#1](https://github.com/johro897/music-multiroom-card/issues/1));
   stödjer mute (`media_player.volume_mute`, se
   [#2](https://github.com/johro897/music-multiroom-card/issues/2));
   `state` är bara `playing`/`paused`/`idle` (aldrig `off`) — bekräftar
   att `_computeGroups()`s `isActive`-koll redan täcker allt relevant.
   HA:s separata Spotify-integration bekräftat ORELATERAD (kan inte
   starta uppspelning på enheter Spotifys API inte redan känner till) —
   det ursprungliga designvalet att bara luta sig mot HEOS egen Spotify
   Connect-hantering via sparade favoriter står fast.
7. **`heos.get_queue`s svar — vilken position är "next"?** (`0.6.0`,
   [#8](https://github.com/johro897/music-multiroom-card/issues/8))
   Bekräftat via källkod: `get_queue` har `supports_response=ONLY` och
   returnerar `{queue: [...]}` där varje objekt är en `pyheos.QueueItem`
   (`song`/`artist`/`album`/`image_url`/`media_id`/`album_id`/`queue_id`).
   **Obekräftat:** `_refreshNextTrack()` antar att `queue[0]` är den just
   nu spelande låten och `queue[1]` är "next" — `QueueItem` saknar ett
   explicit "is_current"-fält i källkoden för att bekräfta detta
   positionellt. Om antagandet är fel visas fel låt (eller ingen) i
   "Up next"-raden — provkör mot en riktig kö innan detta litas på fullt
   ut. Felaktigt/tomt svar hanteras redan tyst (ingen toast, bara ingen
   rad visas), så en felaktig gissning här är kosmetisk, inte trasig
   funktionalitet.

**Status efter 0.5.3 (bekräftat av ägaren 2026-08-23):** avgruppering av
högtalare som ursprungligen grupperades via HEOS-appen fungerar nu, och
2-enheters-taket/`System error -9` är borta — båda var alltså sekundära
symptom av join-buggen, inte egna buggar. **Fortfarande öppet:** en enda
(icke-grupperad) högtalare som spelar solo visas inte som en "grupp om 1"
i Active Groups-raden. Felsökning påbörjad men inte klar — nästa steg är
att bekräfta om rums-plattan i "Rooms"-griden själv visar "Playing" för
en sådan högtalare (skiljer på om `state === 'playing'`-detekteringen
eller bara chip-renderingen är trasig); väntar på svar från ägaren.

Enligt paraply-CLAUDE.mds release-rutin är det första `beta-0.1.0`-taggen
som är den faktiska verifieringsvägen för allt ovan — inte något som görs
separat innan kodning. Uppdatera denna sektion med vad som faktiskt
observerades så fort testet är kört, oavsett om antagandena stämde eller
inte (mönster: se t.ex. `tplink-switch-card/CLAUDE.md`s
"Kräver manuell verifiering"-sektion).

## Screenshot

`screenshots/overview.svg` är en schematisk illustration ritad från det
godkända designunderlaget, INTE en riktig skärmdump. Byt ut den mot en
riktig skärmdump (helst PNG) från en verklig HA-instans innan skarp
release — HACS plugin-validering kräver bara att READMEn innehåller EN
bild (vilket redan är uppfyllt), men en påhittad illustration är inte
representativt nog för en riktig release.

## Kända gotchas

- Editor och kort ligger i SAMMA fil (`music-multiroom-card.js`) — HACS
  "plugin"-kategorin distribuerar bara den fil som anges i `hacs.json`s
  `filename`, se paraply-CLAUDE.md.
- Gruppfärger (`GROUP_COLORS`) är en avsiktlig hårdkodad palett, inte
  temavariabler — motiverat eftersom de behöver skilja godtyckligt många
  SAMTIDIGA grupper åt, vilket ingen enskild temafärg kan lösa. Allt annat
  i kortet använder HA:s CSS-variabler.
- 44px minsta touch-target är medvetet applicerat överallt (chips, tiles,
  expand-knappar, favoritchips) — fångades upprepade gånger som en bugg
  under mockup-granskningen innan koden skrevs, se till att nya
  interaktiva element följer samma regel.
- `_isDirty()` jämför INTE hela state-objekt-identitet längre (sedan
  `0.5.4`) — bara de attribut kortet faktiskt renderar (`state`,
  `media_title`/`media_artist`/`entity_picture`/`volume_level`,
  `group_members` som orderoberoende mängd). Lägg till nya bevakade
  attribut här OM `_render()` börjar läsa fler `hass.states[...]`-fält,
  annars missas uppdateringar tyst — samma gotcha-mönster som
  `tplink-switch-card`s `_statesChanged()`.
- Säkerhetsgranskning (2026-08-23): alla ställen där användar-/HEOS-text
  hamnar i `innerHTML` går genom `escHtml()` — kontrollerat rad för rad,
  inga luckor hittade. Ingen `eval`, inga externa nätverksanrop, ingen
  localStorage/cookies. Håll detta mönster vid framtida ändringar.
