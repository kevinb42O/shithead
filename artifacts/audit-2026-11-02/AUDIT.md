# Diepe audit — Shithead

Datum: 2 november 2026. Uitgevoerd op de lokale, onvoltooide werkmap boven commit `a3cce1e`. Geen deployment uitgevoerd. De spelbroncode is door deze audit niet aangepast. Het fullscreen ontwerp blijft de uitgangspositie.

**Oordeel:** de spelmotor heeft een sterke basis; herstel, duurzame opslag, toetsenbordbediening en de online vertrouwensgrens zijn onvoldoende betrouwbaar. Er zijn **14 bevindingen: 7× P1, 5× P2 en 2× P3**. Geen P0 voor alle gebruikers: normaal spelen via slepen blijft mogelijk. Sommige P1’s blokkeren wel een specifieke gebruikersroute volledig.

Tijdens de audit veranderden bronbestanden vanuit een andere activiteit. Testlogs beschrijven daarom expliciet de uitgevoerde run; ze zijn geen garantie over latere wijzigingen. `source-fingerprints.json` bevat de hashes aan het einde van de bewijsverzameling. De auditproeven zijn apart bewaard en kunnen opnieuw worden uitgevoerd.

## Uitkomst en bewijs

| Controle | Uitkomst | Betekenis |
| --- | --- | --- |
| Bestaande unit-tests | Eerste run: 95/95 geslaagd; laatste run in `unit-tests.log` | Regels, kaartbehoud, munten, Fortune en projecties hebben relevante dekking. |
| Willekeurige stresstest | 3.000 spellen; 1.064.477 zetten; maximaal 4.595 zetten per spel; geslaagd | Geen geconstateerd kaartverlies, ongeldige actieve beurt of vastgelopen spel in deze steekproef. |
| Bestaande regelbrowsertests | Eerste volledige run: 8 scenario’s geslaagd, 4 scenario’s gefaald; ook de overkoepelende test faalde | Onder andere selectie, onmiddellijke save-controles en drag-start waren niet stabiel. Niet alle failures zijn productbugs. |
| Bestaande onlinebrowsertests | Eerste run: 6 scenario’s geslaagd, 9 gefaald; ook de overkoepelende test faalde | Acht failures stopten op de oude verwachting van een zichtbare Play/Start-knop; één op een hand die bij 844×390 tot y=398 liep. |
| Nieuwe auditproeven zonder browser | 6/6 geslaagd | Deze assertions bevestigen de huidige defecten; het zijn geen tests die bewijzen dat de defecten opgelost zijn. |
| Nieuwe auditproeven in Chromium | 5/5 scenario’s geslaagd | Bevestigt onthullen vóór opslag, onbereikbare lege stapel, falende save-herstelroute, gecachte opstartfout en verloren live-aankondiging. |
| Impeccable-detector | 314 signalen | Vooral tokenverschillen; niet als 314 bugs geteld. Zie beoordeling onderaan. |

Browserproeven gebruikten tijdelijke Chromium-profielen en de aparte `-qa`-savekey. Een zichtbare Chrome-inspectie controleerde het lokale menu en de tafelkeuze; exacte mobiele CSS-afmetingen zijn met DevTools-emulatie gecontroleerd. De bestaande tests synthetiseren ook touchgebaren. Dit is geen verificatie op een fysiek toestel of met Safari, Firefox of een echte schermlezer. Onlineprotocolproeven met vervalste berichten zijn uitsluitend lokaal met mocks uitgevoerd; er is geen publieke tafel aangevallen.

De bestaande browserharness injecteert een toegang tot `enterGame()` en test daardoor niet de normale hervatroute. De nieuwe browserproeven bouwen voort op die geïsoleerde harness, met enkele gerichte foutinjecties.

## Technische UI-score

Deze score betreft de UI en implementatiekwaliteit, niet de veiligheid van het netwerkprotocol of een WCAG-certificering.

| Onderdeel | Score | Belangrijkste reden |
| --- | ---: | --- |
| Toegankelijkheid | 2/4 | Native knoppen, namen en focusstijlen bestaan; de lege stapel verwijdert echter de toetsenbordactie om te spelen. |
| Prestaties | 1/4 | Alle modi wachten op circa 60,6 MiB assets; veel grote afbeeldingen blijven vooraf gedecodeerd bewaard. |
| Thema en tokens | 2/4 | Visueel samenhangend, maar veel letterlijke kleuren en historische overrides. Eén vast thema is op zichzelf geen fout. |
| Responsief gedrag | 3/4 | Uitgebreide breakpoints en touchafhandeling; menu en tafelkeuze zijn bruikbaar. Korte schermen en volledige kaartgebaren blijven een aandachtspunt. |
| Implementatie-integriteit | 2/4 | De gedeelde tafel en engine zijn sterk; onbereikbare functies, opslagraces en een verouderd testcontract verzwakken de werkende gebruikersroute. |
| **Totaal** | **10/20** | **Aanzienlijk werk nodig aan de zwakke onderdelen.** |

**Visuele samenhang: geslaagd.** Het geschilderde hout, groene laken, kaartkunst en gedeelde tafelpresentatie vormen een herkenbaar systeem. Detectorwaarschuwingen over goudgloed of brede schaduwen zijn binnen deze expliciete beeldtaal geen zelfstandige reden voor een herontwerp. De functionaliteit moet binnen die bestaande wereld worden hersteld.

## P1 — eerst oplossen

### F01 — Opgeslagen spellen zijn via het hoofdmenu niet te hervatten

- **Locatie:** `dist/app.js`, `enterGame()`, `openMenu()` en de handlers van `menu-play`/`deal-selected`; `dist/index.html`, hoofdmenu. De browserharness benoemt dit zelf bij zijn testinjectie.
- **Categorie:** implementatie-integriteit / gebruikersroute.
- **Trigger:** laad een geldig opgeslagen spel, of ga vanuit een lopend spel terug naar het hoofdmenu.
- **Werkelijk gedrag:** het spel wordt wel ingelezen, maar Let’s play opent alleen de tafelkeuze. Buy in loopt naar een nieuw spel en een vervangingsdialoog. Keep playing sluit die dialoog; het brengt je niet naar de bestaande tafel. De overgebleven Resume game-knop staat alleen in het pauzemenu van de al geopende tafel. `enterGame()` heeft geen normale zichtbare aanroeper meer.
- **Impact:** voortgang en een onbetaalde pot zijn onbereikbaar via de gebruikersinterface. Bij weinig munten kan de app zelfs adviseren de bestaande tafel af te maken terwijl geen hervatroute bestaat.
- **Aanpak:** maak één expliciete, bereikbare hervatactie wanneer een geldige save of actieve sessie bestaat. Laat die zonder buy-in of nieuwe deal naar `enterGame(false)` gaan. Test refresh → hervatten en tafel → hoofdmenu → hervatten via echte knoppen, zonder geheime testfunctie.
- **Bewijs:** broncontrole; `scripts/test-rules-browser.mjs` injecteert `window.__duelEnterGame` omdat het menu geen Resume heeft.
- **Vervolg:** `$impeccable harden`.

### F02 — Bij een lege stapel ontbreekt de toetsenbordactie om kaarten te spelen

- **Locatie:** `dist/game-layout.css:2425`, `.pile-area.is-empty .pile { display: none }`; `dist/app.js`, berekening van `showPlayButton`, `pileEnabled` en de pile-keyhandler.
- **Categorie:** toegankelijkheid / bediening.
- **Trigger:** jouw beurt op een lege stapel, bijvoorbeeld de openingszet of direct na een burn; selecteer een handkaart met het toetsenbord.
- **Werkelijk gedrag:** de gewone Play-knop is verwijderd. De vervangende `role=button`-stapel krijgt wel `tabIndex=0`, maar zijn computed display is `none` en zijn afmetingen zijn nul. Daardoor kan hij niet worden bereikt of geactiveerd via normale tabnavigatie. Enter op een geselecteerde kaart wijzigt alleen de selectie.
- **Impact:** een speler die niet kan slepen kan niet verder. Klikbediening op de lege speelplek ontbreekt eveneens.
- **Norm:** WCAG 2.1.1, bediening met toetsenbord.
- **Aanpak:** behoud een zichtbare, focusbare speelbestemming wanneer de stapel leeg is. Gebruik één toegankelijke actie voor leeg en gevuld, met een naam die de selectie aangeeft. Behoud het fullscreen ontwerp en de kaartinteractie.
- **Bewijs:** auditbrowserproef `empty pile removes the keyboard play destination`; `empty-pile-no-keyboard-action.png`.
- **Vervolg:** `$impeccable harden`.

### F03 — Blinde kaarten worden onthuld voordat hun zet duurzaam is opgeslagen

- **Locatie:** `dist/app.js:79`, `save()`; `playTurn()` en `after()`; `dist/bank.js:23`.
- **Categorie:** opslagintegriteit / eerlijk spel.
- **Trigger:** een kaart wordt blind gespeeld terwijl dezelfde bank-lock nog bezet is. Een opslagfout veroorzaakt een vergelijkbaar probleem.
- **Werkelijk gedrag:** de engine verandert direct, `save()` retourneert een Promise, maar de aanroeper wacht niet. De spotlight toont de rang terwijl de opslag nog de oude kaarten bevat.
- **Impact:** refresh of afsluiten kan de oude ongeopende kaarten herstellen nadat de rang al bekend is. De comment en documentatie over opslaan vóór onthullen zijn dus sterker dan de implementatie.
- **Aanpak:** verwerk de nieuwe toestand als een duurzame transactie; wacht op een succesvolle commit voordat de rang, animatie en volgende beurt worden vrijgegeven. Houd input geblokkeerd tijdens de commit. Bij mislukken moet de gebruiker een duidelijke herstelactie krijgen, zonder kennis terug te kunnen draaien.
- **Bewijs:** browserproef hield de echte Web Lock vast. De vier was zichtbaar terwijl de opgeslagen toestand `moves=0` en drie down-kaarten behield. Zie `reveal-before-commit.png` en `browser-probes.log`.
- **Vervolg:** `$impeccable harden`.

### F04 — Een oude tab kan een nieuw betaald spel overschrijven

- **Locatie:** `dist/bank.js:29`, `saveGame()`; `dist/app.js`, storage-eventhandler en `settleCurrent()`.
- **Categorie:** opslagintegriteit / munten.
- **Trigger:** tab B houdt een oudere tafel vast; tab A koopt een nieuwe tafel; tab B slaat daarna zijn oude tafel op.
- **Werkelijk gedrag:** de lock serialiseert de writes, maar vergelijkt geen spelidentiteit of revisie. `saveGame()` overschrijft `saved.game` en `saved.stats` onvoorwaardelijk. De bescherming voor settled bets geldt alleen bij dezelfde bet-ID. Een storage-event ververst uitsluitend de wallet en vervangt of blokkeert het oude spel niet.
- **Impact:** de nieuwe inzet blijft afgetrokken, terwijl de bijbehorende tafel en pot verdwijnen. Ook oude beurten en scores kunnen nieuwere voortgang vervangen. Een latere settlement kan eveneens een oude tafel terugschrijven.
- **Aanpak:** geef iedere tafel een vaste ID en opgeslagen revisie. Vergelijk die onder dezelfde lock, wijs oude writes af en toon in de andere tab dat de tafel elders gewijzigd is. Bewaar geldige transacties onafhankelijk van een toevallig actuele view.
- **Bewijs:** pure auditproef: na een buy-in van 100 bleef de wallet 900, maar een save uit de andere bankinstantie verwijderde de nieuwe bet volledig.
- **Vervolg:** `$impeccable harden`.

### F05 — Kapotte JSON maakt de aangeboden herstelroute onbruikbaar

- **Locatie:** `dist/bank.js:7`, `read()`; `dist/app.js:41`, saveherstel en `newGame()`.
- **Categorie:** herstel / opslag.
- **Trigger:** de save bevat ongeldige JSON, bijvoorbeeld `{broken`.
- **Werkelijk gedrag:** het initiële inlezen wordt opgevangen en het menu zegt een nieuw spel te starten. Maar iedere banktransactie leest dezelfde kapotte JSON opnieuw. Buy in faalt daardoor ook en keert terug naar de setup; Fortune kan evenmin een transactie doen.
- **Impact:** de gebruiker kan de voorgestelde herstelactie niet uitvoeren zonder handmatig browseropslag te wijzigen.
- **Aanpak:** scheid het bewaren van een onleesbare save van het starten van een schone, gevalideerde snapshot. Bied een concrete herstelactie; behandel een herstelbare gamefout los van een geldige wallet. Wis geen bruikbare wallet stilzwijgend.
- **Bewijs:** pure én browserproef; `malformed-json-recovery.png` toont de fout na de normale Buy in-actie. De oorspronkelijke kapotte string blijft staan.
- **Vervolg:** `$impeccable harden`.

### F06 — Een online gast kan verborgen kaarten via voorspelbare IDs kiezen

- **Locatie:** `dist/multiplayer/session.js:490`, verwerking van `play` en `blind`; `dist/engine.js:31`, `play()`.
- **Categorie:** online autorisatie / spelintegriteit.
- **Trigger:** een aangepaste gastclient stuurt in de down-fase een gewoon `play`-commando met een geraden canonieke kaart-ID.
- **Werkelijk gedrag:** de host accepteert `play` ook wanneer de actieve zone down is. De engine zoekt de opgegeven ID in die zone. Verkeerde IDs leveren een afgewezen zet zonder kaartverlies; een juiste ID speelt precies die verborgen kaart. Alle IDs zijn afleidbaar uit de vaste 54-kaartendeckindeling. Bovendien accepteert het eerste `blind`-commando een `aceValue`, waarmee de validatie vóór verwijdering extra informatie over een gekozen kaart kan geven.
- **Impact:** een gast kan naar veilige tienen, tweeën of jokers zoeken en daarmee de bedoelde blinde keuze omzeilen. De handprojectie kan correct zijn terwijl dit commando alsnog informatie oplevert.
- **Aanpak:** sta in de down-fase uitsluitend een geldige slotindex toe, zonder voorafgaande ace-declaratie. De host kiest de kaart. Alleen een al vastgelegde `pendingAce` mag daarna een waardekeuze voor exact dezelfde kaart accepteren. Controleer dit op de autoritatieve commandogrens.
- **Bewijs:** lokale protocolproef stuurde `play` met een bekende ID van een verborgen schoppentien; de host brandde de stapel en verwijderde die kaart zonder het blind-pad te gebruiken. Geen publieke sessie gebruikt.
- **Vervolg:** `$impeccable harden`.

### F07 — Een gast bindt de sessie niet aan één geverifieerde host

- **Locatie:** `dist/multiplayer/session.js:185`, offerverwerking; `bind()` en de verwerking van snapshots rond regel 294.
- **Categorie:** online vertrouwensgrens.
- **Trigger:** een gast ontvangt aanbiedingen van meerdere afzender-IDs die zijn eigen ID als bestemming gebruiken.
- **Werkelijk gedrag:** de gast accepteert offers van iedere afzender en maakt meerdere links. Er is geen opgeslagen verwachte hostidentiteit. Berichten van elk gebonden kanaal kunnen vervolgens `members`, `view`, `paused` en `revision` vervangen. Een willekeurig hoge revision kan legitieme latere snapshots verdringen.
- **Impact:** een partij die de publieke signalering kan volgen kan proberen zich als host voor te doen, een extra kanaal te openen of de gast een vervalste/kapotte tafel te tonen. Dit is een vastgestelde ontbrekende binding; een volledige aanval via publieke brokers is niet uitgevoerd.
- **Aanpak:** bind het joinproces aan een gekozen host en diens sessiesleutel; verifieer de identiteit bij de handshake en accepteer snapshots alleen van dat kanaal. Valideer het snapshotschema vóór mutatie van de sessie. Een willekeurig zelfgekozen sender-ID is geen identiteitsbewijs.
- **Bewijs:** gemockte protocolproef: één gast accepteerde achtereenvolgens een offer van `real-host` en `unrelated-peer`, en behield beide links.
- **Vervolg:** `$impeccable harden`.

## P2 — daarna verbeteren

### F08 — Ongevalideerde cosmetische savedata kan de hele startup blokkeren; Retry herstelt dit niet

- **Locatie:** `dist/engine.js:63`, `assertGame()`; `dist/living-board.js:35`, iteratie over `boardScars`; `dist/loading.js:36`, dynamische import.
- **Categorie:** herstel / implementatie-integriteit.
- **Trigger:** een verder geldig spel bevat `boardScars: {}`.
- **Werkelijk gedrag:** de savevalidator accepteert dit. Tijdens de eerste render gooit de renderer een TypeError bij de iteratie. De module-evaluatie van `app.js` faalt en het laadscherm toont Retry. Zelfs nadat de ongeldige cosmetische data gecorrigeerd is, blijft een retry dezelfde mislukte module-import gebruiken; een volledige paginareload is nodig.
- **Impact:** een fout in decoratieve metadata houdt ook het hoofdmenu tegen. De foutmelding zegt dat gamebestanden niet konden laden, terwijl het probleem in lokale savedata zit.
- **Aanpak:** normaliseer optionele presentatievelden vóór rendering; ongeldige brandplekken mogen het spel niet blokkeren. Maak opstarten expliciet herhaalbaar en onderscheid assetfouten, savedatafouten en modulefouten in de herstelroute.
- **Bewijs:** browserproef `unchecked boardScars crashes startup and Retry cannot recover`.
- **Vervolg:** `$impeccable harden`.

### F09 — Alle functies blokkeren op een te brede opstartbundel

- **Locatie:** `scripts/build-loading-manifest.mjs`; `dist/loading.js:21`; `dist/loading-preload.js:2`, de blijvend gevulde `prepared`-Map.
- **Categorie:** prestaties / beschikbaarheid.
- **Meting:** manifest 139 assets, 63.589.597 bytes oftewel circa 60,6 MiB. Alleen de 90 PNG’s vertegenwoordigen ongeveer 141,2 MiB aan ongecomprimeerde 4-byte RGBA-pixels. Dit laatste is een berekening uit de afbeeldingsafmetingen, geen gemeten browser-RAM; JPG’s, audiobuffers en browseroverhead zijn niet meegerekend.
- **Werkelijk gedrag:** Fortune, lobbykunst, geluid en kaartassets worden vóór het openen van het menu voorbereid. De loader bewaart succesvolle image-objecten en ArrayBuffers. Eén ontbrekende optionele asset laat de hele voorbereiding falen.
- **Impact:** meer eerste-laadwerk en geheugendruk dan het kaartspel of menu nodig heeft. Een defect in een ongebruikte modus kan de gebruiker ook van singleplayer afhouden.
- **Aanpak:** laad een kleine set voor menu en kaarten eerst. Bereid Fortune en multiplayer pas bij openen of als laag geprioriteerd achtergrondwerk voor. Verklein grote sprites naar hun benodigde gebruiksresolutie en maak vrij wat niet in geheugen hoeft te blijven. Houd foutafhandeling per functie.
- **Vervolg:** `$impeccable optimize`.

### F10 — De live-aankondiging van gewone zetten wordt weer leeggemaakt

- **Locatie:** `dist/app.js`, twee toekenningen aan `announcement.textContent` binnen `render()`; `dist/effects.js:22`, effecten standaard `aria-hidden`.
- **Categorie:** toegankelijkheid / spelinformatie.
- **Trigger:** een gewone AI-zet of pickup zonder extra notice.
- **Werkelijk gedrag:** eerst wordt een zin uit het log toegewezen; dezelfde render schrijft daarna `notice`, meestal de lege string. De visuele effectteksten vervangen deze toegankelijkheidsinformatie niet: zij zijn standaard verborgen voor ondersteunende technologie. De beurtmelding blijft wel bestaan.
- **Impact:** de speler krijgt een beurtwissel, maar mist de bijbehorende spelactie als live-status. De informatie is nog via History te zoeken.
- **Norm:** relevante statusinformatie moet ook via ondersteunende technologie beschikbaar zijn; er is hier geen volledige schermlezertest uitgevoerd.
- **Aanpak:** behoud één blijvende live-regio met één consistente update per actie. Laat het eventueel visueel verbergen van routinetekst de toegankelijke aankondiging intact houden.
- **Bewijs:** browserproef zag de AI-pickup in het opgeslagen log terwijl `#announcement` leeg was.
- **Vervolg:** `$impeccable harden`.

### F11 — Sommige afgewezen onlinecommando’s krijgen geen antwoord

- **Locatie:** `dist/multiplayer/session.js:466`, ongeldige swap; rond regel 499, ongeldige blind-index; `act()` en de command-timeout.
- **Categorie:** netwerkrobuustheid / foutfeedback.
- **Trigger:** een commando met een geldige sequence maar ongeldige kaart-IDs of index bereikt deze paden.
- **Werkelijk gedrag:** de host onthoudt eerst de sequence en keert daarna stil terug. Geen error met ack en geen snapshot. De gast blijft busy totdat na acht seconden een resync wordt aangevraagd en een antwoord terugkomt.
- **Impact:** een afwijsbare actie lijkt een verbindingsprobleem en kan de bediening onnodig blokkeren. Bij uitblijvende resync blijft de gast wachten.
- **Aanpak:** geef ieder geldig ontvangen sequence-nummer precies één eindantwoord: een bevestigde snapshot of een expliciete afwijzing met ack. Laat mutatie en afwijzing één uniforme commandoroute volgen.
- **Bewijs:** pure auditproef: sequence 1 werd geregistreerd voor een ongeldige swap, maar de verzonden berichtenlijst bleef leeg.
- **Vervolg:** `$impeccable harden`.

### F12 — De browserchecks bewaken niet consequent het huidige gebruikerscontract

- **Locatie:** `scripts/test-rules-browser.mjs`, testinjectie, hit testing en directe savechecks; `scripts/test-online-browser.mjs`, zichtbare primaire actie; `package.json`.
- **Categorie:** verificatie / implementatie-integriteit.
- **Bewijs uit de bewaarde runs:** de volledige regeltestrun faalde op mobiele hit testing, twee onmiddellijke savechecks en drag-start. Een gerichte herhaling liet mobiel slagen maar desktop falen op een ontbrekende drag-ghost. Dat wijst op timinggevoeligheid en is geen bewijs dat beide platformen structureel onbespeelbaar zijn. De online-suite zoekt uitsluitend naar Play/Start terwijl de huidige interactie de stapel als actie gebruikt. Daardoor stoppen veel viewportscenario’s vóór hun latere controles.
- **Impact:** een groene unit-suite kan een onbereikbare hervatroute verbergen; een rode browsersuite kan tegelijk een oud UI-contract en een echte bug bevatten. Daardoor is de waarde als regressiepoort beperkt.
- **Aanpak:** test de normale ingang eerst; voeg alle acties op lege én gevulde stapel met echt toetsenbord toe. Wacht op expliciete commit- en animatievoorwaarden in plaats van een onmiddellijk gelezen snapshot of een willekeurige korte vertraging. Assert dat juiste kaarten bereikbaar zijn en dat een geannuleerde gesture geen zet uitvoert. Laat viewporttests ook de pile-actie erkennen, zodat ze de rest van het scenario uitvoeren. Bewaar unieke screenshots per run, zodat audits geen bestaande reviewcaptures overschrijven.
- **Afbakening:** de meting van acht pixels handoverschrijding bij 844×390 verdient een verse, losstaande controle; deze audit telt die niet als een apart bewezen blokkerend layoutdefect.
- **Vervolg:** `$impeccable harden`, daarna `$impeccable audit`.

## P3 — onderhoud

### F13 — De stylesheetcascade heeft veel historische lagen

- **Locatie:** `dist/index.html`, stylesheetvolgorde; `dist/game-layout.css`, `mobile.css`, `table-composition.css`, `setup-swap.css`, `opponent-stations.css`.
- **Categorie:** theming / onderhoudbaarheid.
- **Observatie:** meer dan twintig stylesheetlinks, duizenden regels in `game-layout.css`, herhaalde hand/pile-regels en veel letterlijke kleuren en `!important`-overrides. De detector rapporteerde 220 kleur-, 64 typegrootte- en 21 radiusafwijkingen.
- **Impact:** een wijziging aan kaartformaat of stapelzichtbaarheid kan elders via een latere override weer verdwijnen. F02 is een concreet voorbeeld van een oud stijlbesluit dat niet meer bij de nieuwe bediening past.
- **Aanpak:** consolideer per component en fase na het herstellen van gedrag. Leg actieve tokens en de bedoelde overridevolgorde vast. Bewaar de bestaande visuele identiteit; een algemene minimalistische hertekening is niet nodig.
- **Vervolg:** `$impeccable document` en `$impeccable polish`.

### F14 — Documentatie beschrijft verwijderde bediening en oude testaantallen

- **Locatie:** `README.md`, kaartbediening; `FORTUNE.md`, Verification; `PRODUCT.md`, hervatten.
- **Categorie:** duidelijkheid / onderhoud.
- **Observatie:** README noemt nog quantity-knoppen en een Play-knop. Fortune noemt een oudere 82-test-suite. Producttekst belooft hervatten terwijl de zichtbare hoofdmenuroute ontbreekt.
- **Impact:** spelers en ontwikkelaars zoeken bediening die niet bestaat; claims over verificatie zijn lastig te beoordelen.
- **Aanpak:** werk handleidingen bij vanuit de definitieve, herstelde route en actuele testcommando’s. Vermijd snel verouderende vaste aantallen als ze niet automatisch worden bijgewerkt.
- **Vervolg:** `$impeccable clarify`.

## Detector: wat is wel en niet overgenomen?

`detector.json` bevat alle 314 oorspronkelijke signalen. Het grootste deel bestaat uit verschillen met de vastgelegde tokens. De waarschuwingen zijn geen onafhankelijke functionele bevindingen.

- De berekende hovercontrastwaarschuwing van 1,7:1 is **niet** als bevestigde WCAG-overtreding geteld. De betreffende royal-button gebruikt geschilderde PNG-kunst en latere overrides; een vergelijking met alleen een onderliggende effen CSS-kleur bewijst het werkelijke pixelcontrast niet.
- Goudgloed, radiale verlichting en brede schaduwen horen deels bewust bij de vastgelegde tavernestijl. Deze zijn niet als generieke ontwerpbugs overgenomen.
- 8px ondersteunende tekst komt werkelijk voor, onder andere in compacte Fortune-modi en menulabels. Dat is een leesbaarheidsverbetering, maar zonder gemeten gebruikersblokkade geen extra P1. Prioriteit ligt bij de ontbrekende acties en herstelroutes.
- Tokenafwijkingen zijn opgenomen als onderhoudsbevinding F13, niet als honderden losse bugs.

## Wat werkt goed en moet behouden blijven?

- De zuivere engine is los van de UI te testen. Seeded simulaties controleren kaartbehoud en actieve seats na iedere zet.
- Dezelfde tafel, renderer en engine dienen singleplayer en multiplayer; een tweede spelimplementatie is vermeden.
- Recipient-projecties laten de verborgen handen, stockvolgorde en down-identiteiten weg. Het probleem F06 zit aan de commandokant, niet in die basisprojectie.
- Fortune heeft exacte uitbetalingsregels, crypto-rejection sampling en transacties die vóór de presentatie worden vastgelegd. De bestaande tests rekenen alle 2.251 dagelijkse beloningen en 216 betaalde reeluitkomsten bij alle inzetten na.
- De bank heeft één gedeelde Web Lock en leest de wallet opnieuw binnen de transactie. Dat voorkomt relevante dubbele uitgaven; F04 vraagt aanvullend een spelrevisie, geen verwijdering van dit mechanisme.
- Native dialogs, radio-inputs, labels, focusstijlen, `aria-pressed` en reduced-motion-afhandeling zijn al ruim aanwezig.
- De kaartgestures hebben paden voor pointercancel, verloren capture, blur, visibilitychange en modals. Dat is een goede basis om de timinggevoelige browserchecks op aan te scherpen.

## Verdere kansen, nog geen bewezen defecten

1. Cache de statische canvas-brandplekken op de combinatie spel/brandplekken/viewport. Nu roept een gewone selectie via `render()` ook `livingBoard.sync()` en een volledige canvastekening aan. Profileer eerst op een tragere telefoon voordat dit als prestatiebug wordt behandeld.
2. Maak foutmeldingen herstelgericht: een parsefout in lokale opslag is iets anders dan een onbereikbaar asset of een verbroken hostverbinding. Toon de relevante vervolgstap op de plek waar de gebruiker vastzit.
3. Voeg een handmatige acceptatieronde toe met een fysiek touchtoestel, 200% zoom, toetsenbord en een schermlezer. Emulatie alleen beantwoordt de vragen over systeemgebaren, veilige schermranden en uitgesproken spelstatus niet volledig.
4. Test online transport op twee echte apparaten/netwerken. De huidige offline browserfixture bewijst layout en commandogedrag, geen bereikbaarheid door verschillende firewalls. Hostvertrouwen en netwerkbereikbaarheid moeten apart worden beoordeeld.

## Aanbevolen volgorde

1. **[P1] `$impeccable harden`:** herstel hervatten en de lege toetsenbordbestemming (F01–F02).
2. **[P1] `$impeccable harden`:** maak kaartzetten duurzaam vóór onthullen, bescherm revisies en herstel onleesbare saves (F03–F05).
3. **[P1] `$impeccable harden`:** sluit het verborgen-ID-pad en bind gasten aan de juiste host (F06–F07).
4. **[P2] `$impeccable harden`:** normaliseer optionele savedata, herstel startup-retry, live-status en commandobevestigingen; vernieuw browserchecks (F08, F10–F12).
5. **[P2] `$impeccable optimize`:** splits assetvoorbereiding per modus en meet de werkelijke mobiele geheugendruk (F09).
6. **[P3] `$impeccable document` / `$impeccable clarify`:** leg de actieve cascade, bediening en controles correct vast (F13–F14).
7. **`$impeccable audit`:** herhaal de auditproeven en de volledige gebruikersroutes na de fixes.
8. **`$impeccable polish`:** sluit af met visuele en interactionele afwerking binnen het bestaande fullscreen ontwerp.

Deze onderdelen kunnen afzonderlijk, in één herstelronde of in een andere gewenste volgorde worden uitgevoerd. Een herhaalde audit na de fixes moet aantonen dat het gedrag hersteld is; een hogere score alleen is onvoldoende.

## Bewijs opnieuw uitvoeren

Laat de lokale server draaien op http://localhost:5173.

```sh
npm test
npm run test:stress
node artifacts/audit-2026-11-02/probes.mjs
BROWSER_CASE='audit:' node --test artifacts/audit-2026-11-02/browser-probes.mjs
```

De twee auditbestanden bevestigen bewust de beschreven foute toestand. Na reparatie moeten hun assertions worden omgezet naar regressietests voor het gewenste gedrag. De gekopieerde browserharness bevat ook oude scenario’s die bij `BROWSER_CASE='audit:'` worden overgeslagen.

Het project draaide bij aanvang al op poort 5173. De poging via `npm run dev` bevestigde dat die poort bezet was; de bestaande Node-server is gebruikt en blijft draaien. De in de repository aanwezige browserchecks schrijven ook naar `.impeccable/review/`; bestaande reviewcaptures kunnen daardoor een nieuwe afbeelding bevatten. De gebruiker-savekey is door de auditproeven niet gebruikt.
