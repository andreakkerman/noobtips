# Noobtips 1.10 — De Vuilnisbelt

Renamed the secondary menu action and screen to DE VUILNISBELT, with a matching line-art trash can icon. Removed the duplicate mountain heading and explanatory copy. The existing mountain caption now shows `X tips weggegooid`; the independently scrollable ranking has the compact heading `De 20 slechtste tips`.

Reviewed the actual menu, empty scene and 150-contribution scene at 1024×768, 1280×800, 1366×768 and 768×1024 portrait. See [overview](overview.png), individual full-resolution captures and [report](report.json). The longer button label fits, the primary spin action remains dominant, and the mountain remains the screen's main attraction. No clipping or page overflow; ranking scroll and return navigation remain available. No redesign or new raster artwork.

Validation: TypeScript, 54 unit tests, 64 relevant Chromium/WebKit browser tests and production build passed. Browser tests cover ranking order, persistence, focus restoration, repeated mountain entrances, animation cleanup and streak continuation. Existing review/PWA script selectors were updated for the renamed button. Gameplay logic, mountain rendering, artwork, tips, rating storage, streak animation and PWA implementation are unchanged.
