# GitHub Pages publiceren en Noobtips op iPad installeren

De repository is gekoppeld aan `andreakkerman/noobtips`; pushes naar `main` publiceren via GitHub Actions. De site is volledig statisch; er is geen backend of externe runtime-API.

## Snelle publicatie en volledige regressie

De Pages-workflow draait unit-tests, bouwt `dist/` met het door Pages bepaalde basispad en test die productieversie met zes bestaande gameplay-scenario's in Chromium en WebKit (12 tests). Functionele checks gebruiken reduced motion; de echte animatie, exacte landing, reveal en bescherming tegen dubbele klikken blijven getest. De PWA-smoketest controleert offline spelen, manifest/assets/iconen, veilige updates, meerdere vensters, mislukte cache-installatie en ratingbehoud, zowel op een projectpad als op `/`. Alleen uitgebreide layout-screenshots en rotatie blijven buiten deze snelle selectie.

Lokaal dezelfde selectie uitvoeren:

```powershell
pnpm test
$env:PAGES_BASE_PATH='/'
pnpm build
pnpm test:smoke
pnpm test:pwa:smoke
Remove-Item Env:PAGES_BASE_PATH
```

Volledige regressie: **Actions → Full Noobtips regression → Run workflow**. Deze workflow publiceert niets en behoudt alle bestaande browser/viewporttests en volledige PWA-/layoutchecks. Lokaal: `pnpm test:e2e` en `pnpm test:pwa`.

Beide workflows gebruiken `mcr.microsoft.com/playwright:v1.64.1-noble`, inclusief browsers en systeembibliotheken, zodat geen trage apt-installatie nodig is. Houd de containertag in beide workflows gelijk aan de exacte `@playwright/test`-versie in package.json en pnpm-lock.yaml. Zie de [officiële containerdocumentatie](https://playwright.dev/docs/docker).

CI gebruikt twee workers zonder retries. Tests hebben 30 seconden (90 voor twee lange scenario's), acties 10 seconden, navigatie 15 seconden en browserstart 30 seconden. De globale smoke-limiet is 3 minuten, regressie 10 minuten; extra proceslimieten begrenzen ook vastgelopen teardown. PWA heeft een harde limiet van 3/5 minuten. Joblimieten: publicatievalidatie 10 minuten, deploy 3 minuten, volledige regressie 20 minuten. Normale publicatie mikt op 5–10 minuten inclusief setup en Pages; wachtrijen en infrastructuur kunnen afwijken.

Rapporten, traces en screenshots bij fouten worden zeven dagen bewaard als workflow-artifacts. PWA-smoke schrijft naar `.runtime/pwa-smoke/`. Nieuwe pushes vervangen verouderde runs. Alleen geslaagde gates uploaden `dist/` via upload-pages-artifact en laten deploy-pages publiceren.

## 1. Lokaal controleren

Node.js 24 en pnpm 10.11.0 (vastgelegd in package.json):

```powershell
cd D:\DevProjects\Noobtips
corepack enable
corepack prepare pnpm@10.11.0 --activate
pnpm install --frozen-lockfile
pnpm test
pnpm exec playwright install chromium webkit
pnpm test:e2e
pnpm test:pwa
pnpm build
pnpm preview
```

`pnpm dev` blijft de gewone ontwikkelomgeving. De service worker wordt alleen in productiebouw geregistreerd. `pnpm test:pwa` bouwt geïsoleerde versies onder `.runtime/`, start tijdelijk een lokale statische testserver op 4174 en sluit die na afloop. De test bewaart screenshots en rapport in `docs/review/noobtips-v1.4/`.

Een GitHub-projectpad lokaal controleren (hoofdletters moeten overeenkomen met de repositorynaam):

```powershell
$env:PAGES_BASE_PATH='/Noobtips/'
pnpm build
pnpm preview --port 4173
# Open http://127.0.0.1:4173/Noobtips/
```

Voor een root-URL of toekomstig noobtips.nl:

```powershell
$env:PAGES_BASE_PATH='/'
pnpm build
pnpm preview --port 4173
# Open http://127.0.0.1:4173/
Remove-Item Env:PAGES_BASE_PATH
```

Stop een eerdere preview met Ctrl+C voordat je een andere start. HTTPS is nodig voor installatie/service workers op echte apparaten; localhost is een uitzondering voor ontwikkeling.

## 2. Repository verbinden, wanneer je daarvoor kiest

Maak op GitHub een **lege** repository `Noobtips` onder je eigen account. Voeg daar nog geen README of .gitignore toe. Kies de gewenste zichtbaarheid; Pages-beschikbaarheid voor private repositories hangt van je GitHub-plan af. Controleer vóór publicatie de bestanden die je wilt delen.

Deze workspace heeft al een Git-directory. Controleer de status en bestaande remotes voordat je de volgende handelingen uitvoert:

```powershell
git status
git remote -v
git add .
git diff --cached --stat
git commit -m "Prepare Noobtips 1.3 for Pages and iPad"
git branch -M main
git remote add origin https://github.com/OWNER/Noobtips.git
git push -u origin main
```

Vervang `OWNER` door je accountnaam. Als `origin` al bestaat, controleer eerst of die naar de bedoelde repository wijst; voeg geen tweede remote toe. De workflow volgt `main`; pas `.github/workflows/pages.yml` aan als je bewust een andere publicatiebranch kiest.

## 3. Pages activeren

1. Open repository **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Open **Actions → Validate and deploy Noobtips to Pages → Run workflow → main**. Dit kan nodig zijn wanneer de eerste push al plaatsvond voordat Pages werd aangezet.
3. De workflow installeert pnpm en de vastgelegde dependencies, voert de hierboven beschreven publicatiechecks uit, bouwt de site en uploadt uitsluitend `dist/` naar Pages.
4. Wacht tot de deployment in de omgeving `github-pages` groen is. Open de URL in die deployment, normaal `https://OWNER.github.io/Noobtips/`.
5. Controleer in Settings → Pages dat HTTPS wordt afgedwongen.

Elke volgende push naar `main` start hetzelfde proces. Alleen een geslaagde validatie/build mag publiceren. De workflow gebruikt de standaard `GITHUB_TOKEN`-rechten; geen persoonlijke toegangstoken of repositorysecret nodig. Er is geen branch met gegenereerde distributiebestanden nodig.

De workflow neemt het pad over van `actions/configure-pages`. Vite, manifest, iconen, CSS-afbeeldingen, fonts en service worker gebruiken hetzelfde pad. Een optionele repositoryvariabele `PAGES_BASE_PATH` onder **Settings → Secrets and variables → Actions → Variables** kan het pad expliciet overschrijven: `/Noobtips/` voor de project-URL of `/` voor een root/custom domain. Laat deze variabele normaal weg zodat Pages de juiste waarde levert. [GitHub custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite Pages-configuratie](https://vite.dev/guide/static-deploy).

## 4. Later noobtips.nl koppelen

1. Verifieer domeineigendom in je GitHub-accountinstellingen en voeg **noobtips.nl** toe onder repository **Settings → Pages → Custom domain**.
2. Configureer bij je DNS-provider de apex `@` met de GitHub Pages A-records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, of een ondersteunde ALIAS/ANAME naar `OWNER.github.io`. Volg de actuele GitHub-instructies voor eventuele IPv6-records. Voor `www` gebruik je een CNAME naar `OWNER.github.io`.
3. Wacht op de DNS-controle/certificaatuitgifte en zet **Enforce HTTPS** aan.
4. Verwijder een eventuele `/Noobtips/`-override of zet `PAGES_BASE_PATH` op `/`. Start de workflow opnieuw; een bestaand projectpad-build verandert niet vanzelf door alleen DNS aan te passen.
5. Open `https://noobtips.nl/` en controleer installatie, artwork, geluid en offline start opnieuw.

Bij een Actions-deployment configureer je het domein via Pages-instellingen; een CNAME-bestand wordt niet door deze workflow gebruikt. [GitHub domein- en DNS-instructies](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

Ratings zijn browser-/origin-gebonden. Een overgang van `OWNER.github.io` naar `noobtips.nl` is een andere origin en neemt bestaande localStorage-beoordelingen niet automatisch mee. Gewone app-updates op dezelfde origin behouden ze. Bewaar de oorspronkelijke installatie als die beoordelingen belangrijk zijn; deze versie voegt geen export- of accountfunctie toe.

## 5. iPad-installatie

1. Open de uiteindelijke HTTPS-URL in Safari, met internetverbinding.
2. Laat de eerste volledige caching afronden. Speel een ronde en controleer vervolgens in vliegtuigmodus of heropenen en een nieuwe ronde werken. Alleen succesvol afgeronde caching garandeert offline beschikbaarheid.
3. Kies **Deel → Zet op beginscherm / Add to Home Screen**. Kies **Open als webapp / Open as Web App** als die optie wordt getoond; bevestig de naam **Noobtips**.
4. Start via het nieuwe icoon. SPELEN! activeert audio via een echte gebruikershandeling; de mute-knop blijft beschikbaar.

De manifest gebruikt standalone-modus, eigen 192/512px-iconen, een maskable icoon en een Apple touch icon van 180px. Er is bewust geen vereiste oriëntatievergrendeling. Landscape is de hoofdcompositie; portrait blijft bedienbaar en mag verticaal scrollen. [Apple iPad-installatiestappen](https://support.apple.com/en-ke/guide/ipad/ipad8f1f7a29/ipados).

## 6. Offline en updates

`scripts/pwa/build.ts` maakt na elke productiebouw een manifest en service worker met een inhoudshash van de complete distributie. De cache bevat HTML, JavaScript/tips, CSS, alle lokale fonts, beide omgevingen en iconen. Geluiden worden lokaal met Web Audio gesynthetiseerd. Als één bestand niet geladen kan worden, faalt de nieuwe installatie en blijft de vorige complete versie bruikbaar.

De app controleert op een nieuwe worker bij starten, terugkeer naar de voorgrond, opnieuw online komen en iedere vijf minuten zolang de app zichtbaar is. Een nieuwe worker blijft wachten tijdens draaien, onthullen en beoordelen. Welkom en hoofdmenu zijn veilige momenten. Bij meerdere open vensters wordt activering uitgesteld; sluit andere Noobtips-tabbladen/vensters om die blokkade op te heffen. Ook bij een race tussen een update en een klik wordt nooit tijdens gameplay herladen: de controllerchange-handler controleert opnieuw de actuele speltoestand.

Op een veilig moment wordt de nieuwe cache actief en worden oudere Noobtips-caches binnen dezelfde scope verwijderd. De app herlaadt stil. Een eenmalige sessionStorage-overdracht bewaart het hoofdmenu, het gekozen onderwerp en de mutevoorkeur; localStorage-ratings en tipgeschiedenis blijven onaangeroerd. Na zo'n documentreload kan audio opnieuw een gebruikershandeling vereisen: de volgende draai ontgrendelt audio als het niet gedempt was. De indicator blijft UIT tot Web Audio werkelijk draait. Bij geblokkeerde sessionStorage stelt de app een menu-reload uit tot een volgende appstart.

Er is geen updater-melding tijdens het spelen. Offline kan geen nieuwe versie worden opgehaald. Safari kan lokaal opgeslagen caches wissen bij opslagdruk of verwijdering van websitegegevens; daarna is opnieuw online openen nodig.

## 7. Nog op een echte iPad controleren

- Safari-installatie, juiste icoon/naam en standalone statusbalk/safe-area op het gebruikte iPadOS.
- Landscape, portrait, rotatie, Split View en terugkeer uit de achtergrond.
- SPELEN!, fysieke audio-uitvoer, mute, schermvergrendeling en audio hervatten.
- Eerste volledige cache, daarna app afsluiten en opnieuw openen in vliegtuigmodus; alle categorieën, ratings en herhaald draaien testen.
- Nieuwe deployment terwijl de oude app draait: geen herladen bij spin/reveal/rating; update bij hoofdmenu of opnieuw starten; opgeslagen beoordelingen blijven bestaan.
- Twee open vensters en hervatten na langere tijd; installatie/cachegedrag na opslagdruk.

De lokale Chromium-productietests verifiëren echte service workers en offline/cache-updates. Playwright WebKit is geen fysieke iPad en bewijst Home Screen-installatie of hardware-audio niet.
