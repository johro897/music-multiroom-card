# music-multiroom-card

Full-page Lovelace-kort för multi-room ljudstyrning, byggt mot HA:s generiska
`media_player`-tjänster (`join`/`unjoin`/`play_media`) + HEOS-specifika
`heos.group_volume_set`. Se [README.md](README.md) för options-tabell och
features.

**Uppströmsberoende:** Home Assistants inbyggda `heos`-integration
(bygger på `pyheos`) för allt utom Spotify. Kortet är byggt och TESTAT mot
HEOS specifikt — även om join/unjoin/play_media tekniskt är generiska
`media_player`-tjänster som även Sonos/Bluesound implementerar, görs INGEN
kompatibilitetsutfästelse för andra plattformar (borttaget 2026-08-23 på
ägarens begäran — "vi anger att vi testar med HEOS för att inte lova för
mycket"). Om kortet råkar fungera mot en annan plattform är det en bonus,
inte ett designmål eller något som testas.

**Sedan `0.7.0`:** ett andra, VALFRITT uppströmsberoende — **Music
Assistant** (separat server/add-on, egen HEOS player-provider som pratar
direkt med HEOS över LAN, inte via HA:s `heos`-integration) — men BARA för
rum som konfigurerat `mass_entity`, och BARA för Spotify-favoriter. Se
"Music Assistant-integrationen (Spotify)" nedan för hela bakgrunden och
`README.md` för options-tabellen.

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

   **BEKRÄFTAT LIVE (2026-08-23), riktigt användarfel hittat:** för
   `"playlist"`-typen slår `async_play_media()` upp
   `media_id` mot `(await coordinator.heos.get_playlists())`s
   `.name`-fält — alltså ett EXAKT namn-match mot HEOS egna sparade
   spellistor, INTE en Spotify-länk/URI. Ägaren fick
   `Unable to play media: Invalid playlist 'https://open.spotify.com/
   playlist/...'` efter att ha klistrat in en Spotify-delningslänk i
   editorns fält — förståeligt, eftersom fältets label FELAKTIGT sa
   "Media content ID (Spotify URI)" och antydde att en URI dög. Fixat i
   `0.6.2`: label ändrad till "HEOS playlist name" + en förklarande
   hint-text i editorn.

   **`0.6.2`s fix var INTE tillräcklig — bekräftat live samma dag:**
   ägaren provade sedan ett rimligt EXAKT namn ("God morgon", en riktig
   Spotify-spellista) och fick samma `Invalid playlist`-fel. Roten:
   `get_playlists()` läser HEOS EGEN separata "Playlists"-bibliotek
   (saker uttryckligen sparade DIT i HEOS-appen) — INTE samma lista som
   "Favorites" (där en stjärnmärkt Spotify-spellista faktiskt hamnar,
   blandat med radiokanaler). Ingen som helst handskriven sträng kunde
   någonsin matcha tillförlitligt, eftersom hela konceptet "ange
   spellistans namn för hand" byggde på fel HEOS-bibliotek redan från den
   allra första research-fasen (innan någon kod skrevs) — se
   `favorites_spotify`-avsnittet i den ursprungliga design-sammanfattningen.

   **RIKTIG FIX i `0.6.3`:** tog bort handskriven Spotify-inmatning helt.
   Både Spotify- och radiofavoriter går nu genom SAMMA bläddrings-picker
   — rot-nivå-`browse_media` (som redan användes för radio) listar redan
   ALLA HEOS-musikkällor platt, inklusive "Spotify" som en egen
   bläddringsbar källa (ägarens riktiga länkade Spotify-konto, bläddras
   in i precis som "TuneIn"/"Favorites"). Picker-UI:t fick bara en
   Spotify/Radio-växlare bredvid "Add selected" som styr vilken
   `favorites.*`-array det valda hamnar i — ingen ny bläddrings-mekanik
   behövdes, bara att sluta anta att Spotify var ett specialfall som
   krävde handskriven inmatning. Verifierat med ett skriptat test:
   rot-bläddring → borra in i en "Spotify"-källa → välj en riktig
   spellista → hamnar korrekt i `favorites.spotify` med det opaka
   HEOS-content-ID:t (inte ett handskrivet namn).
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
   **Bekräftat `0.7.2`→`0.7.3`:** `PAUSE`-stöd (bit `1`) varierar per
   källa — radiokällor rapporterar bara `STOP` (bit `4096`), inte
   `PAUSE`; Spotify-spår (via MA) rapporterar båda. Anta aldrig att
   `PAUSE` finns bara för att `STOP` gör det.
   HA:s separata Spotify-integration bekräftat ORELATERAD (kan inte
   starta uppspelning på enheter Spotifys API inte redan känner till) —
   det ursprungliga designvalet att bara luta sig mot HEOS egen Spotify
   Connect-hantering via sparade favoriter står fast.
7. **`heos.get_queue`s svar — vilken position är "next"?** (`0.6.0`,
   [#8](https://github.com/johro897/music-multiroom-card/issues/8))
   Bekräftat via källkod: `get_queue` har `supports_response=ONLY` och
   returnerar `{queue: [...]}` där varje objekt är en `pyheos.QueueItem`
   (`song`/`artist`/`album`/`image_url`/`media_id`/`album_id`/`queue_id`).
   **Obekräftat, gäller numera bara HEOS/radio-vägen** (se `0.7.4` nedan
   för Spotify-vägen, som inte har det här problemet alls):
   `_refreshNextTrack()` antar att `queue[0]` är den just nu spelande
   låten och `queue[1]` är "next" — `QueueItem` saknar ett explicit
   "is_current"-fält i källkoden för att bekräfta detta positionellt. Om
   antagandet är fel visas fel låt (eller ingen) i "Up next"-raden —
   provkör mot en riktig kö innan detta litas på fullt ut. Felaktigt/tomt
   svar hanteras redan tyst (ingen toast, bara ingen rad visas), så en
   felaktig gissning här är kosmetisk, inte trasig funktionalitet.
8. **Progress-baren (`0.6.1`, [#1](https://github.com/johro897/music-multiroom-card/issues/1)).**
   HEOS stödjer inte seek (se punkt 6) — baren är alltid ren visning.
   Obekräftat om HEOS faktiskt populerar `media_position`/
   `media_duration`/`media_position_updated_at` för alla källor (radio
   har typiskt ingen duration, vilket redan hanteras genom att baren
   bara döljs) — provkör mot en riktig Spotify-låt/HEOS-favorit live för
   att se att den faktiskt ritas och tickar rätt.
9. **Spotify-via-MA (`0.7.0`, [#9](https://github.com/johro897/music-multiroom-card/issues/9)).**
   - ~~Om `play_media` mot ett rums `mass_entity` faktiskt spelar ut över
     HELA en HEOS-grupp som formats via native `heos.join`~~ **BEKRÄFTAT
     LIVE (2026-08-23):** ägaren grupperade fyra rum via kortet (native
     HEOS) och spelade en Spotify-favorit — hero-badgen visade "Playing
     on: Hallen, Matplatsen, Lounge, Köket", alla fyra. Antagandet höll:
     gruppering är fysiskt HEOS-tillstånd, och att spela mot `mass_entity`
     för ledaren räcker för att hela den fysiska gruppen ska spela, oavsett
     att MA:s egen "Sync Group Player"-provider också finns.
   - ~~Music Assistants `browse_media`-svarsform för Spotify-innehåll~~
     **DELVIS BEKRÄFTAT LIVE (2026-08-23):** till skillnad från allt som
     observerats från HEOS, där ett objekt antingen är bläddringsbart
     (`can_expand`) ELLER spelbart, är en Spotify-spellista i MA:s träd
     BÅDA SAMTIDIGT — `can_expand: true` (dess låtar) OCH `can_play: true`
     (spellistan i sin helhet). Ägaren kunde inte lägga till en spellista
     alls med den ursprungliga bläddraren — den antog att `can_expand`
     alltid uteslöt att raden var direkt valbar, så en spellista visade
     bara pil-in-i-listan, aldrig en kryssruta. Fixat: varje rad visar nu
     OBEROENDE en kryssruta (om `can_play !== false`) OCH en
     bläddra-in-knapp (om `can_expand`), inte längre ett antingen/eller.
     Fortfarande obekräftat: exakt trädform djupare än
     Artists/Albums/Tracks/Playlists/Radio stations-roten.

**Ihågkom vid ändring av `_isDirty()`:** `media_position`/`media_duration`/
`media_position_updated_at` läggs MEDVETET INTE till i den bevakade
listan — de skulle trigga en full `_render()` varje gång HEOS tickar
position under uppspelning (ofta var 1–5:e sekund), precis det `0.5.4`s
optimering skulle undvika. Progress-baren tickas istället separat via
`_tickProgress()` (satt igång i `_build()`, en `setInterval` som
manipulerar `[data-progress-fill]`s `style.width` direkt i DOM:en, ingen
full re-render). Verifierat med ett skriptat test: samma DOM-element
före/efter en tick, `_render()`-räknaren ökar INTE.

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

## Music Assistant-integrationen (Spotify) — bakgrund och fynd

**Varför HEOS egen Spotify-hantering aldrig kunde lösa detta:** research
och live-testning (2026-08-22/23, innan `0.7.0` byggdes) bekräftade att
HEOS App:s "Spotify"-musikkälla bara exponerar vad som redan synkats in i
HEOS EGET bibliotek — aldrig riktig live-uppspelning från det faktiskt
länkade Spotify-kontot. HA:s separata `spotify`-integration är också
orelaterad (kan bara "ta över" en enhet som redan är synlig i Spotifys
moln-API, vilket kräver en lokal Zeroconf-handskakning HEOS-högtalare
aldrig gör med en server-baserad klient). Music Assistants Spotify-
provider (`librespot`) löser det genom att logga in med det riktiga
kontot och avkoda ljudet direkt, sedan skicka en vanlig ljudström till
HEOS via MA:s HEOS-provider — bekräftat via HEOS-appens egen visning av
"URL Stream" som aktiv källa (exakt det MA:s egna dokumentation beskriver:
metadata visas som "URL stream" pga API-begränsningar, inte HEOS egen
Spotify-session).

**Docker-driftsättning:** `docker-compose`-stack för `ghcr.io/music-
assistant/server`, `network_mode: host` (obligatoriskt enligt MA:s egen
dokumentation — mDNS/UPnP-upptäckt fungerar inte över bridge-nätverk),
data på `/srv/homeautomation/musicassistant:/data`, healthcheck via
`python3`-socket-check istället för curl/wget (finns inte i imagen,
bekräftat från `Dockerfile.base`).

**Felsökningssaga (2026-08-23), i ordning — värt att känna till om
liknande symptom dyker upp igen:**

1. **Kontroller-anslutningen failade periodvis** med `System error -519
   (12)`. Avkodat från `pyheos`s faktiska källkod: formatet är
   `"{text} ({error_id})"` där `error_id`(`eid`) är HEOS-protokollets
   EGNA generiska felkod (12 = "System Error", samma kod som det tidigare
   "-9 (12)"-felet i det ursprungliga kortprojektet) och `text` innehåller
   ett internt `syserrno` från HEOS-enhetens egen inbäddade mjukvara
   (`-519`, inte ett vanligt Linux-errno — odokumenterat internt
   Denon-kod). Grundorsak: den specifika enheten (Hallen) hade suttit i
   ett fastlåst tillstånd efter att MA gjort massvis av snabba
   tvångs-avgrupperingar (`set_members`) mot den. **Fix: strömcykla den
   berörda HEOS-enheten fysiskt.** Löste sig helt efter omstart av
   enheten — inget kvarvarande MA-konfigurationsproblem.
2. **Uppspelning startade ("URL Stream" i HEOS-appen) men gav inget
   ljud, helt utan fel i loggen — på FLERA olika HEOS-enheter OCH på en
   Cast/AirPlay-soundbar.** Uteslutet i tur och ordning: fel ljudformat
   (testat FLAC och MP3), VLAN-segmentering (bekräftat samma VLAN), Wi-Fi
   client isolation (den drabbade enheten satt på Ethernet), dubbel
   kontroll (samma resultat med native `heos`-integrationen avstängd),
   DNS-filter/adblock (inget sådant kört), MA:s egen ström-pipeline (MA:s
   inbyggda webbspelare fungerade perfekt — bevisade att grundläggande
   ljudgenerering/ffmpeg var friskt). **Verklig grundorsak, bevisad med
   `tcpdump`:** värdens brandvägg (`ufw`) hade bara `8095/tcp`
   (webb-UI:t) explicit öppnad — inte `8097/tcp` (MA:s streamserver) eller
   `8927/tcp` (Sendspin, används för Cast/AirPlay-bryggor). `nc`-testet
   som INITIALT verkade bekräfta att porten var nåbar var en falsk
   positiv — det kördes från samma fysiska maskin som Docker-värden, ett
   effektivt loopback-test som `ufw` inte filtrerar, medan riktig extern
   LAN-trafik (från högtalarna) tystades helt (SYN skickades upprepade
   gånger med TCP:s vanliga backoff-mönster, aldrig ett SYN-ACK tillbaka).
   **Fix:** `sudo ufw allow 8097/tcp` + `sudo ufw allow 8927/tcp`.
   **Läxa för framtida liknande felsökning:** ett lyckat `nc`/`telnet`-
   test FRÅN samma maskin som servern bevisar ingenting om extern
   nåbarhet — testa alltid från en riktig ANNAN enhet på nätverket, eller
   verifiera med `tcpdump` på servern att paket faktiskt kommer in
   utifrån.
3. Ett tredje, orelaterat AirPlay-fel (`60" Crystal UHD` TV) visade sig
   vara en helt mundan parkopplings-fråga (AirPlay 2 kräver PIN-inmatning
   i MA:s webbgränssnitt) — inte kopplat till ovanstående alls, värt att
   inte blanda ihop symptomen om det dyker upp igen.

**Två fynd från `beta-0.7.1`/`beta-0.7.2`-testningen (2026-08-23), båda
fixade samma dag:**

- **HEOS-entiteten rapporterar bokstavligen `media_title`/`media_artist:
  "Url Stream"`** för allt som MA skickar dit — bekräftat live (matchar
  MA:s egen dokumentation om metadata-begränsningen). Hero:t läste bara
  från den fokuserade ledarens HEOS-entitet, så en Spotify-låt visade
  "Url Stream" istället för riktig titel/artist, och progress-baren
  saknades helt (HEOS-entiteten saknar också giltig
  `media_position`/`media_duration` för MA-källor). Fixat med en ny
  `_metaAttributes()`-hjälpmetod: om rummets `mass_entity` själv är
  `playing`, används DESS attribut för titel/artist/bild/position/
  duration istället för HEOS-entitetens — men `state`/
  `supported_features` (vad som styr transportknapparnas synlighet)
  förblir alltid HEOS-entitetens, eftersom det är dit kommandona faktiskt
  skickas. `_watchedEntities()` bevakar nu även varje rums `mass_entity`
  (inte bara `entity`), annars skulle ett låtbyte i MA aldrig trigga en
  omritning eftersom det inte rör HEOS-entitetens egna attribut alls.
- **Bläddrings-picker för Spotify öppnade på MA:s rot-meny**
  (Artists/Albums/Tracks/Playlists/Radio stations/Podcasts) — ingen
  favorit på ett multiroom-kort är rimligen en enskild artist eller ett
  helt album. Fixat: `_startBrowse('spotify')` borrar nu automatiskt in i
  "Playlists" (matchat på titel, hittat bland rot-barnen) direkt efter
  rot-anropet, med rot-nivån kvar en nivå bakåt via "Back" om man ändå
  vill åt något annat. Radiobläddringen (HEOS) är oförändrad — dess
  rot-nivå (alla musikkällor platt) var redan direkt användbar.

**Tre fynd från riktig daglig användning av `beta-0.7.2` (2026-08-23,
inte skriptad testning den här gången), alla fixade samma dag:**

- **Radio-uppspelning kunde inte pausas** — `Entity media_player.hallen
  does not support action media_player.media_play_pause` i loggen. Nytt
  bekräftat API-faktum: till skillnad från Spotify-spår stödjer HEOS
  radiokällor inte `PAUSE` (bit `1`) alls, bara `STOP` (bit `4096`) —
  rimligt, en direktsänd ström går inte att "återuppta från samma
  ställe". HA:s tjänstevalidering blockerar `media_play_pause`-anrop mot
  entiteter som inte deklarerar stöd för det, INNAN anropet ens når
  HEOS. Fixat: huvudknappen faller tillbaka till att bete sig som Stop
  (`media_stop`) när `PAUSE` saknas men `STOP` finns — den separata
  Stop-knappen döljs då för att undvika dubblett.
- **Paus under Spotify-uppspelning återställde titeln till "Url
  Stream"** — `_metaAttributes()`s villkor kollade bara `massSt.state
  === 'playing'`; en pausning flyttar även `mass_entity` till `paused`,
  vilket gjorde att villkoret slog av och föll tillbaka till HEOS
  entitetens skräp-metadata. Fixat: villkoret tillåter nu både
  `playing` OCH `paused`.
- **Tryck på ett soloframträdande, redan fokuserat rums egen platta**
  kunde kasta `Entity media_player.hallen is not joined to a group` —
  `_computeGroups()` klassar ett soloSpelande/pausat rum som sin egen
  "grupp om 1" enbart för fokus-/UI-syften (se punkt 8 om samma
  öppna fråga i Active Groups-raden, [#7](https://github.com/johro897/music-multiroom-card/issues/7)),
  men HEOS har ALDRIG faktiskt grupperat entiteten — ett riktigt `join`
  har aldrig skett. `_onRoomTap()`s "owning"-gren anropade ändå `unjoin`
  blint. Fixat: om `owning.memberEntities.length < 2` (ingen riktig
  HEOS-grupp) rensas bara fokus lokalt, inget tjänsteanrop görs alls.

**Två fynd från `beta-0.7.3`-testningen (2026-08-23), `beta-0.7.4`:**

- **`Reached skip limit (17)` vid vad ägaren upplevde som ETT enda
  Next-tryck.** Utredning tillsammans med ägaren: Spotifys skip-gräns
  gäller historiskt bara framåt-skip (aldrig bakåt) — matchar att
  Previous fungerade — så en riktig Spotify-gräns var fortfarande
  troligt en del av förklaringen. MEN: en verklig kodlucka hittades
  också — `_onTransport()` (Next/Prev/Play/Pause/Stop) saknade det
  `_guardPending()`-dubbeltrycksskydd som `_onRoomTap()` redan hade.
  Om en pekskärm någon gång dubbelfyrar ett fysiskt tryck till två
  click-events (känt beteende på vissa kiosk-webbläsare) hade kortet
  skickat kommandot två gånger utan att ägaren märkt det — vilket över
  en dags testande kan ackumulera mot en gräns mycket snabbare än
  antalet upplevda tryck antyder. Fixat: samma `_guardPending()`-mönster
  applicerat på `_onTransport()`, nyckel `transport:${entity}:${cmd}`.
  **Inte bekräftat som DEN faktiska orsaken** till just "17" — bara en
  verklig, tidigare oskyddad kodväg som nu är åtgärdad oavsett.
- **"Up next" visade "Url Stream — Url Stream" för Spotify-innehåll**
  — samma grundorsak som titel/artist-buggen: `heos.get_queue` frågar
  HEOS EGEN kö, som för MA-drivet innehåll bara känner till en generisk
  URL-ström. Ägaren frågade uttryckligen "finns inte detta från MA?" —
  och det gjorde det: `music_assistant.get_queue` är en riktig, egen
  tjänst i HA cores `music_assistant`-integration, bekräftat från
  källkoden (`homeassistant/components/music_assistant/media_player.py`,
  `_async_handle_get_queue`) — returnerar ett explicit `next_item`-fält
  (`{name, duration, media_item: {name, artists: [{name}], album, ...}}`,
  bekräftat från `schemas.py`s `queue_item_dict_from_mass_item`/
  `media_item_dict_from_mass_item`), INGEN positionsgissning som HEOS
  egen `queue[1]`-variant. Fixat: en ny delad `_massDrivingEntity()`-
  metod (samma villkor som redan fanns i `_metaAttributes()`, nu
  refaktorerad till att använda den gemensamma metoden istället för att
  duplicera logiken) avgör vilken backend som styr rummet just nu;
  `_refreshNextTrack()` frågar rätt tjänst beroende på svaret. Löste
  också en följdbugg: `nextKey`-cachen nycklades på HEOS-entitetens EGNA
  `media_title` (konstant "Url Stream" för Spotify), så cachen skulle
  aldrig ogiltigförklaras mellan olika låtar — nycklas nu på
  `_metaAttributes()`s (riktiga) titel istället.

**`beta-0.7.5` (2026-08-23) — två fynd till, det andra en verklig
arkitekturändring gjord tillsammans med ägaren, inte bara en bugg:**

- **Efter Stop kunde Play inte startas om på radio** —
  `Entity ... does not support action media_player.media_play_pause`,
  två gånger i loggen, vid ett Play-tryck (inte Pause). `0.7.3`s fix var
  ofullständig: den löste bara fallet "spelar + ingen Pause-stöd → visa
  Stop", men när entiteten går till `idle` efter ett Stop faller
  huvudknappen tillbaka till `play_pause` igen (eftersom
  `mainUsesStop`-villkoret kräver `isPlaying`) — och `media_play_pause`
  failar tydligen OAVSETT riktning på en entitet utan `PAUSE`-stöd, inte
  bara när den skulle resultera i en paus. Fixat: undvik
  `media_play_pause` helt när `PAUSE` saknas — anropa `media_stop`
  respektive `media_play` explicit istället, aldrig den kombinerade
  tjänsten.
- **`Reached skip limit` vid Next via kortet, men fungerade problemfritt
  när ägaren körde `media_next_track` DIREKT mot MA-entiteten** (inte
  via kortet). Det här motbevisar att det bara var en riktig
  Spotify-kontogräns (som skulle gälla oavsett vilken entitet kommandot
  går via) — pekar istället mot att HEOS→MA-relät för transportkommandon
  beter sig annorlunda (sämre) än att prata med MA direkt, av okänd
  anledning (fler underliggande anrop? omsynk räknas som skip? inte
  utrett djupare). Ägarens beslut, efter diskussion: **när MA styr ett
  rum ska ALLA transportkommandon gå direkt till MA**, inte reläas via
  HEOS. Två uttryckliga avgränsningar bekräftade med ägaren (inte
  antagna): (1) gruppering/join-unjoin stannar på HEOS oavsett — inget
  MA-motsvarighet finns för att styra fysisk HEOS-gruppering; (2) all
  volym (grupp + per-rum) och mute stannar på HEOS oavsett — MA har
  ingen motsvarighet till att styra volymen för en hel fysiskt
  HEOS-grupperad klunga högtalare, bara sin egen enhet.

  Implementerat som en ny delad `_driveEntity(leaderEntity)` — returnerar
  `mass_entity` om MA styr (samma villkor som `_massDrivingEntity()`,
  som den nu bygger vidare på), annars HEOS-entiteten. Används nu
  konsekvent av: `_onTransport()` (mål-entitet för Next/Prev/Play/Pause/
  Stop), `_renderHero()`s `st`/`isPlaying`/`isPaused`/`features` (så att
  Play/Pause-knappens utseende och vilka kommandon som visas som
  tillgängliga också läses från rätt entitet — beslutat med ägaren,
  inte antaget), `_tickProgress()`, och `_metaAttributes()` (nu bara en
  tunn wrapper kring `_driveEntity()`). `_guardPending()`-nyckeln för
  transport bytte från `focusedLeader` till den faktiska mål-entiteten.

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
  `tplink-switch-card`s `_statesChanged()`. Sedan `0.7.0` bevakar
  `_watchedEntities()` även varje rums `mass_entity` (inte bara
  `entity`), av samma anledning — se `_metaAttributes()`.
- Säkerhetsgranskning (2026-08-23): alla ställen där användar-/HEOS-text
  hamnar i `innerHTML` går genom `escHtml()` — kontrollerat rad för rad,
  inga luckor hittade. Ingen `eval`, inga externa nätverksanrop, ingen
  localStorage/cookies. Håll detta mönster vid framtida ändringar.
- **Uppföljande säkerhets- och prestandagranskning inför `0.7.0`
  (2026-08-23),** hela filen läst rad för rad efter alla MA-ändringar:
  - Samma escHtml-mönster håller för allt nytt — `mass_entity`-fältets
    värde, `_metaAttributes()`s titel/artist/bild (oavsett om de kommer
    från HEOS- eller MA-entiteten, samma tillitsnivå som tidigare —
    backend-data från `hass.states`, aldrig rå extern input), MA:s
    bläddringstitlar. Inga nya `innerHTML`-vägar saknar escaping.
  - `_fetchBrowseNode()`/`play_media`-anropen skickar `item.media_
    content_type`/`media_content_id` direkt som fält i ett JS-objekt till
    HA:s websocket-API — aldrig strängkonkatinerat till HTML eller ett
    kommando, så ingen injektionsrisk även om en illvillig MA/HEOS-källa
    skulle returnera konstiga tecken i ett fält.
  - Prestanda: `_watchedEntities()`s utökning till `mass_entity` är en
    ren listbreddning, ingen ny algoritmisk komplexitet —
    `_isDirty()`/`_computeGroups()`/`_metaAttributes()` är alla O(antal
    rum), försumbart för realistiska rumsantal. `_metaAttributes()`
    anropas per render OCH en gång per sekund från `_tickProgress()`, men
    gör bara enkla objektuppslag, ingen ny loop eller nätverksanrop —
    ingen risk för samma "full re-render varje sekund"-problem som
    `0.5.4` löste ursprungligen.
  - En upptäckt men medvetet ej fixad kant: om `_startBrowse()`s
    auto-borrning in i "Playlists" (se ovan) failar EFTER att rot-nivån
    redan hämtats, sätts både `browse.error` och ett icke-tomt
    `browse.stack` — rendern visar felmeddelandet (kollas före
    `stack.length` i `_renderFavSource()`), så användaren ser fel trots
    att rot-bläddringen faktiskt lyckades. Kosmetiskt, inte en
    funktionell bugg (ett nytt bläddringsförsök löser det), bedömt inte
    värt att komplicera felhanteringen för.
