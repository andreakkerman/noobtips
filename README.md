# Noobtips.nl 1.4

Een volledig lokale mini-arcade: een groots mechanisch rad, veertig actieve Nederlandse tips in Algemeen en Arc Raiders en vijf prullenbakken om ze te beoordelen. Gebouwd met React, TypeScript en Vite; zonder backend, accounts of externe runtime-API's.

Algemeen is standaard geselecteerd. De twintig School-tips blijven ongewijzigd opgeslagen voor later, maar zijn niet speelbaar. Bestaande School-beoordelingen en geschiedenis blijven bewaard.

## Starten op Windows

Vereist: Node.js 22.12 of nieuwer en pnpm. Dit project gebruikt pnpm 10.11.0 via het `packageManager`-veld; Node.js 24 is gebruikt voor validatie.

```powershell
cd D:\DevProjects\Noobtips
pnpm install
pnpm dev
```

Open het adres dat Vite afdrukt, normaal `http://127.0.0.1:5173`. Laat de terminal open zolang je speelt. Stop met Ctrl+C. Alles wordt lokaal geserveerd, inclusief lettertypen en artwork. Een internetverbinding is na installatie niet nodig. Het spel opent op het welkomstscherm. SPELEN! activeert het geluid via Web Audio wanneer de browser dit ondersteunt. De knop rechtsboven dempt het geluid gedurende de speelsessie. Terug naar het hoofdmenu behoudt het onderwerp en keert niet terug naar het welkomstscherm.

Productiebestanden maken en lokaal bekijken:

```powershell
pnpm build
pnpm preview
```

De statische uitvoer staat in `dist/`. Er is geen hosting of Git-remote ingesteld.

## Testen

Installeer de testbrowsers eenmaal:

```powershell
pnpm exec playwright install chromium webkit
pnpm test
pnpm test:e2e
```

Vitest controleert inhoud, categoriegeschiedenis, opslag, de speltoestanden en de landingsberekening. Playwright controleert de echte spelbediening op 1366×768, 1280×800 en 1024×768, inclusief touch en WebKit. De testconfiguratie start zelf Vite wanneer die nog niet draait.

`pnpm review` maakt tien screenshots per doelresolutie, één WebM-opname en een animatiemeting in `docs/review/noobtips-v1.3/`. Start daarvoor eerst `pnpm dev` op poort 5173. De capture gebruikt vaste willekeurige waarden uitsluitend binnen de testbrowser, zodat de drie onthullingsniveaus reproduceerbaar zijn. Het spel zelf bevat geen testmodus of geforceerde uitkomsten.

## Inhoud en vormgeving aanpassen

- **Tips:** bewerk `src/data/tips.ts`. Iedere tip heeft een expliciet ID. Voeg een nieuw, uniek ID toe en behoud bestaande IDs bij tekstwijzigingen; beoordelingen hangen aan dat ID. Houd minimaal twintig tips per categorie aan.
- **Categorieën:** voeg een item toe aan `allCategories` en een bijbehorende verzameling in `content` in hetzelfde bestand. Voeg zo nodig een origineel symbool toe aan `src/components/Icon.tsx`. De actieve lijst `categories` filtert School uit. `allCategories` en `allTips` behouden ook inactieve gegevens voor opslagvalidatie.
- **Rad:** geometrie en materiaal in `src/components/Wheel.tsx`; kansen, vakken en hoeken in `src/game/model.ts`. Tien even grote vakken geven 60% normaal, 30% Mega Noob en 10% legendarisch. Bij het veranderen van het aantal vakken moet ook de SVG-geometrie worden aangepast.
- **Artwork:** `public/art/observatory.webp` is de lokaal opgeslagen, originele gegenereerde omgeving. Houd het rad zelf als bewegende SVG; vervang het niet door een afbeelding. De gebruikte prompt en herkomst staan in `docs/artwork.md`.
- **Stijl:** `src/styles.css`, `src/styles/reveal.css` en `src/styles/rating.css`.
- **Geluid:** originele Web Audio-synthese in `src/game/audio.ts`; geen audio-downloads of muzieklussen.

## Lokale gegevens

Per browser en origine worden deze localStorage-sleutels gebruikt:

- `noobtips.ratings.v1`: object met tip-ID → beoordeling 1–5.
- `noobtips.history.v1`: per categorie de al getoonde IDs, zodat er geen herhaling is voordat de verzameling op is. Ook de eerste tip van een nieuwe ronde verschilt van de vorige.

Je kunt beoordelingen veranderen door een andere prullenbak te kiezen. Verwijder de sleutels via browserontwikkeltools om helemaal opnieuw te beginnen. Gegevens worden nergens verzonden. Bij geblokkeerde opslag blijft de huidige speelsessie werken; de interface meldt dan dat de beoordeling alleen voor die sessie bewaard is. Een andere poort of hostname geldt voor de browser als een andere opslaglocatie.

## Validatie en grenzen

Zie `docs/review/noobtips-v1.3/REVIEW.md` voor de werkelijk uitgevoerde visuele verbeteringen, testresultaten en captures. Fysieke iPads en school-Chromebooks zijn niet getest. Windows Playwright-WebKit heeft hier geen `AudioContext`: daar is de stille fallback getest; audio-initialisatie en bediening zijn in Chromium getest. De gegenereerde geluiden zijn niet met echte luidsprekers of hoofdtelefoon beoordeeld.

Outfit en Barlow Condensed worden lokaal gebundeld onder de SIL Open Font License; licenties staan in `public/licenses/`.

Als Corepack pnpm offline niet kan starten, gebruik de reeds geïnstalleerde tools: `node node_modules/vite/bin/vite.js --host 127.0.0.1`, `node node_modules/typescript/bin/tsc -b`, `node node_modules/vite/bin/vite.js build`, `node node_modules/vitest/vitest.mjs run` en `node node_modules/@playwright/test/cli.js test`.

## GitHub Pages en iPad

Zie [publiceren en installeren](docs/PUBLISHING.md) voor exacte commando’s, Pages/custom-domain-configuratie, offline caching, veilige updates en de resterende iPad-controles. Er is niets gepusht en geen remote toegevoegd. `pnpm test:pwa` valideert echte productiebouws op project- en rootpaden. `pnpm icons` regenereert de originele iconen uit de vectorbron.
