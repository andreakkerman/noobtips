# Noobtips 1.0 — visuele en functionele review

Uitgevoerd op 4 november 2026. Dit is een lokale applicatie; er is niets gepubliceerd.

## Art direction

Een overwoekerd retrofuturistisch observatorium, met petrolblauwe constructies, warm koper, amber licht en mintkleurige mechanische verlichting. De originele gegenereerde omgeving geeft diepte; het rad, de pointer, logo's, pictogrammen en prullenbakken zijn daadwerkelijk gerenderde SVG/CSS-objecten. Geen bestaand game-artwork of personages gebruikt.

De grote, gecondenseerde letters en de fysieke oranje knop sturen de eerste actie. Na de landing schuift het rad naar de achtergrond en neemt de tip de hoofdrol over. Normale onthullingen zijn mintgroen, Mega Noob warm oranje, legendarisch goud met extra lichtstralen, een kroon en meer deeltjes.

## Werkelijk uitgevoerde verbeteringsrondes

**Eerste inspectie:** ready- en resultaatschermen op 1366×768, inclusief vijf overvolle bakken. De drie grootste tekortkomingen waren te weinig ruimte onder het rad, vlakke materiaallagen ten opzichte van de omgeving en bakken waarvan de deksels te dicht bij de vraag kwamen.

**Verbeteringsronde 1:** rad kleiner in de beschikbare hoogte, voet en ondertekst opnieuw geplaatst; glasreflectie, metalen randlicht, facetdetails en een glans op de centrale naaf toegevoegd. De vraag en bakken verder uit elkaar gezet; tip iets groter en de grote resultaatkop iets kleiner gemaakt. De harde grens in de onthullingsgloed is vervaagd. Opnieuw vastgelegd en bekeken op 1366×768 en 1024×768.

**Verbeteringsronde 2:** de drie onthullingen kregen herkenbaarder eigen lichtkleuren; legendarische kroon kreeg zijornamenten; het geselecteerde vak licht bij de landing op. Categorieknoppen op de iPad-doelmaat vergroot tot 44 px hoog en beter leesbaar gemaakt. Smalle schermen kregen passende bakken. Daarna alle acht toestanden op alle drie doelmaten vastgelegd en visueel bekeken.

**Laatste functionele afwerking:** reduced motion springt direct naar de berekende eindhoek; het rad draait daarbij niet versneld alsnog. De pictogramknop voor overslaan houdt op smalle schermen een toegankelijke naam. Replay blijft zonder verplichte beoordeling beschikbaar.

## Bewijsbestanden

- `pass-0-ready-1366.png` en `pass-0-trash-1366.png`: uitgangssituatie vóór de verbeteringen.
- `pass-1-ready-1024.png` en `pass-1-trash-1024.png`: tussenstap na de eerste ronde.
- `final-{breedte}x{hoogte}-01-ready.png` t/m `08-replay.png`: 24 eindbeelden, acht per doelmaat.
- `full-loop-1366.webm`: echte Chromium-opname van draaien, landen, legendarische onthulling, beoordeling en replay. De opname begint bij navigatie; de eerste frames bevatten de lege browser vóór laden.
- `capture-report.json`: browserversie, vastgelegde toestanden, foutmeldingen en animatiemeting.

Per doelmaat vastgelegd: klaar om te draaien, draaiend rad, exacte landing, onthulling onderweg, leesbare tip, beoordeling 3/5, beoordeling 5/5 en volgende spin. De 1024-reeks toont Mega Noob, 1280 normaal en 1366 legendarisch. Screenshots zijn visueel bekeken, evenals 24 opeenvolgende frames uit de eerste zes seconden van de opname. De video is geen opname van hoorbaar geluid.

## Tests

- **40 Vitest-tests geslaagd:** unieke IDs, twintig tips per categorie, uitputting zonder herhaling, categorie-isolatie, kansverdeling, duizend opeenvolgende landingen zonder drift, toestanden en foutbestendige opslag.
- **46 toepasselijke Playwright-scenario's geslaagd** over drie Chromium-configuraties en WebKit touch. Twee echte-touch-scenario's zijn bewust niet van toepassing op de twee desktopconfiguraties.
- Getest: categorieën, volledige pooluitputting, dubbele klikken, echte rotatie en eindhoek, alle onthullingsniveaus, optionele ratings, wijzigen/opslaan/teruglezen, toetsenbord, echte geëmuleerde taps, herladen tijdens draaien, ongeldige en geblokkeerde opslag, geluid aan/uit of beschikbare fallback, reduced motion en viewportgrenzen.
- **Productiebouw geslaagd.** TypeScript controleert de applicatie en tests.
- Geen externe HTTP-verzoeken tijdens de normale applicatielading in de browsercontrole.

De aparte animatiemeting met viermaal CPU-vertraging registreerde 158 draaiende frames: mediaan 16,7 ms, p95 16,7 ms, één frame langer dan 50 ms. Dit is een lokale Chromium-meting en geen benchmark op fysieke schoolhardware. Het rad draait circa 2,7 seconden, blijft 320 ms staan en onthult daarna de tip. De onthullingsfase duurt 800/1150/1550 ms en is overslaanbaar.

## Beoordeling van de zeven visuele gates

| Gate | Geobserveerd resultaat |
| --- | --- |
| Art direction | Cohesieve koper/petrolwereld, originele omgeving en consistente vormen. |
| Rad | Zelfstandige draaiende SVG, meerdere materiaallagen, reactieve pointer; eindhoek klopt. |
| Onthulling | Drie licht-/deeltjestiers en gecontroleerde typografische opbouw; tip blijft leesbaar. |
| Prullenbakken | Eigen getekende volumetrische bakken, geanimeerde deksels/vulling en extra afval bij 5/5. |
| Begrijpelijkheid | Eén hoofdactie per toestand, herkenbare categorieën, beoordeling niet verplicht. |
| Performance | Goede lokale frameverdeling onder CPU-vertraging; fysieke hardware blijft onbeproefd. |
| Samenhang | Alle gevraagde toestanden daadwerkelijk vastgelegd en beoordeeld; replay sluit visueel aan. |

Dit is een onderbouwde beoordeling van de lokale versie, geen claim dat een browsergame dezelfde productieschaal heeft als een commerciële AAA-game.

## Grenzen

Geen fysieke iPad, school-Chromebook of gebruikerssessie met Sven getest. Windows Playwright-WebKit biedt in deze omgeving geen Web Audio; de app toont daarvoor een korte melding en speelt stil verder. Chromium-audiobediening is functioneel getest, maar klank, volume en timing zijn niet met fysieke speakers of een hoofdtelefoon beluisterd. Kleine schermen gebruiken bewust een verticale opstelling met scrollen; de drie landschapdoelmaten passen zonder scrollen.

Beoordelingen blijven lokaal en kunnen verdwijnen wanneer de gebruiker browsergegevens wist. Artwork, fonts en geluid hebben geen externe runtime-afhankelijkheid. Hosting, domeinkoppeling en echte deployment maken geen deel uit van deze versie.
