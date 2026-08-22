# music-multiroom-card

Full-page Lovelace-kort för multi-room ljudstyrning, byggt mot HA:s generiska
`media_player`-tjänster (`join`/`unjoin`/`play_media`) + HEOS-specifika
`heos.group_volume_set`. Se [README.md](README.md) för options-tabell och
features.

**Uppströmsberoende:** Home Assistants inbyggda `heos`-integration
(bygger på `pyheos`). Inget annat tredjepartsberoende. Grundfunktionerna
(join/unjoin/play_media) är dock generiska `media_player`-tjänster som även
Sonos och Bluesound implementerar — kortet är inte hårdkodat mot HEOS
specifikt, men bara HEOS är testat i v1.

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

Detta är INTE gjort än — kortet är byggt på rimliga men obekräftade
antaganden om hur HEOS-integrationen exponerar grupptillstånd och tjänster.
Följande måste bekräftas mot en riktig HEOS-installation (se
Utvecklarverktyg → Tillstånd/Åtgärder) så snart som möjligt, eftersom
`0.5.0` redan är i användarens hand utan att detta är gjort:

1. **`group_members`-attributet.** `_computeGroups()` i
   `music-multiroom-card.js` läser `hass.states[entity].attributes.group_members`
   för att avgöra vilka rum som faktiskt är grupperade. Kontrollera att
   HEOS-plattformen verkligen sätter detta attribut (både på en solo-spelare
   och på gruppmedlemmar), och att alla medlemmar listar samma grupp
   symmetriskt (kortet antar det, utan någon explicit "is_leader"-flagga —
   "leader" väljs deterministiskt som det först konfigurerade rummet bland
   medlemmarna).
2. **`media_player.join`s semantik.** Kortet skickar
   `{group_members: [nytt_rum]}` mot den fokuserade gruppens ledare och
   antar att detta LÄGGER TILL rummet i den befintliga gruppen (additivt).
   Om det istället ERSÄTTER hela medlemslistan måste anropet byggas om till
   att skicka hela den önskade medlemslistan varje gång.
3. **`media_player.play_media`s payload för HEOS-favoriter.** Kortet
   skickar `media_content_type`/`media_content_id` rakt av från vad som är
   sparat i configen (för Spotify manuellt inskrivet, för radio hämtat via
   `browse_media`-bläddraren i editorn). Bekräfta att formatet stämmer mot
   vad HEOS faktiskt förväntar sig för en sparad favorit.
4. **`heos.group_volume_set`.** Exakt schema (`entity_id`/`level`) är en
   kvalificerad gissning baserad på tjänstens namn i HA:s dokumentation —
   aldrig testad live i det här projektet. Kontrollera även att tjänsten
   fortfarande finns kvar i användarens HA-version (den kan ha ersatts av
   generell grupp-volymhantering i senare HA-kärnor).
5. **`media_player/browse_media`-svarets form.** Editorns radio-bläddrare
   (`_startBrowse()`/`_drillBrowse()` i `MusicMultiroomCardEditor`) antar
   att svaret har `title`/`children`-fält och att varje barn har
   `can_expand`/`title`/`media_content_type`/`media_content_id`. Även om
   detta är HA:s standardformat för media-browsern generellt, är det
   obekräftat huruvida HEOS Favorites/TuneIn ligger direkt i browse-roten
   eller nästlat ett steg in — bläddraren är byggd som en generisk
   breadcrumb-navigator just för att hantera båda fallen, men den bör
   provköras mot en riktig HEOS-installation innan den litas på.

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
