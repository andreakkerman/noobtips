# Noobtips 1.6 — Prullenbak Top 20

De persoonlijke ranglijst gebruikt uitsluitend `noobtips.ratings.v1`. Alleen actuele Algemeen- en Arc Raiders-tips met een gehele score van 1–5 tellen mee. Sortering: score aflopend, daarna tip-ID oplopend; maximaal 20 resultaten. Geen nieuwe opslag, netwerkverkeer, gemiddelden of stemmen. Beoordelingen blijven uitsluitend tijdens het spelen aanpasbaar.

De lokale `src/data/tips.ts` met 30 tips per actieve categorie is ongewijzigd overgenomen. SHA-256 vóór en na implementatie: `32CB801E22A7BDB02BE8F4F48CD5397F056FBF58CE8E8EE189982A87CC497C4B`. School blijft in de brondata en bestaande opslag behouden, maar telt niet mee.

## Visuele review

IMPLEMENT → RUN → CAPTURE → INSPECT → IMPROVE uitgevoerd op 1024×768, 1280×800 en 1366×768. Screenshots tonen hoofdmenu, leeg, 3/20/60 beoordeelde tips, onderkant van de lijst en de Arc Raiders-omgeving. De screenshots gebruiken geïsoleerde testbeoordelingen, geen echte gebruikersgegevens. Herhalen met `pnpm dev` en in een tweede terminal `pnpm review:leaderboard`.

Geïnspecteerd: compacte secundaire TOP 20-knop, leesbare volledige teksten, subtiele gouden/zilveren/bronzen rangnummers, bestaande prullenbakillustratie, vaste kop en navigatie, interne lijstscroll zonder paginascroll. De langste actuele tip (`arc-029`) staat bovenaan in de visuele fixtures. Beide categorieachtergronden blijven behouden. De plek van TOP 20 blijft gereserveerd tijdens draaien, zodat de hoofdknop niet verspringt; de secundaire knop is dan verborgen en uitgeschakeld.

## Automatische controles

- 43 unit-tests: selectie, scorevalidatie, inactieve/verwijderde tips, limiet, gelijke scores, onafhankelijkheid van opslagvolgorde en gewijzigde beoordelingen.
- Volledige browsertests: 74 geslaagd, 2 bestaande desktop-uitsluitingen voor uitsluitend touch-tests. Geen tests verwijderd. Inclusief echte wielanimatie, alle reveal-tiers, actuele 30-tip-pools, ratingbehoud en 20 nieuwe ranglijstchecks.
- Productiesmoketests: 16 geslaagd in Chromium en WebKit.
- TypeScript en productiebuild met basispad `/` geslaagd.
- PWA-productietest controleert offline ranglijst na herladen, beide categorieën, caching en assets op projectpad en `/`, ratingbehoud over updates en uitgestelde activering zolang de ranglijst open is.

Chromium test echte touch-invoer via CDP en muiswielinvoer op desktop/Chromebook. Mobiele Playwright WebKit ondersteunt geen muiswiel of native swipe; daar wordt de scrollcontainer direct bewogen en gecontroleerd op bereikbaarheid van positie 20 en vaste navigatie. WebKit bewijst geen fysieke iPad-bediening.

## Resterende apparaatcontrole

Op een echte iPad: Safari/Home Screen-installatie, vegen en inertiescrollen door de volledige lijst, terugnavigatie, rotatie, hardwaregeluid en koude start in vliegtuigmodus na volledig cachen. Bestaande PWA-installatie- en update-instructies staan in `docs/PUBLISHING.md`.
