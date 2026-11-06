# Noobtips 1.3 validation — 2026-11-06

## Visual refinement

Actual tip text is approximately 17–18% larger: 35px at 1024px width (was 30), 43px at 1280 (was 36.48), 45.9px at 1366 (was 38.93). Classification headings are approximately 35% smaller: 33px, 35.3px and 37px respectively. The long-tip rule reduces type modestly for future longer manually maintained text. Existing bins, their styles/animations, actions and artwork are unchanged.

The shared segment data now spells KANSLOOS correctly. The wheel, result heading and live accessible result all consume that same data.

Captured and inspected the shortest and longest retained tips at 1024×768, 1280×800 and 1366×768. Six production screenshots and precise bounding-box/type measurements are recorded in `pwa-report.json`. No text/control overlap or page scrolling was observed in final captures.

The first visual inspection exposed internal scrolling of the clipped main container, despite the document itself reporting no overflow. Decorative artwork/animation overflow was creating a hidden scroll range. The app now uses overflow:clip and confines the background image; assertions additionally check main.scrollTop and header position. Screenshots were regenerated and inspected after that fix. The wheel and rating geometry were not changed.

Icons are original vector artwork extending the existing Noobtips N/spark identity. The 512px and maskable exports were visually inspected; a square background edge in the first maskable draft was removed. The final 192/512px, maskable and 180px Apple icons are generated reproducibly by `pnpm icons`.

## Automated checks

- TypeScript and Vite production build passed, including project `/Noobtips/` and root `/` bases.
- Vitest: 38 passed.
- Existing Chromium/WebKit browser suite: 50 passed, 2 touch-only checks skipped on non-touch projects.
- Focused final layout regression: 12 passed, covering normal spins, reduced motion and the longest-tip/full-bin layout.
- Production PWA tests run actual service workers against isolated versioned builds on a local static server. All emitted cache URLs and manifest/icon dimensions are checked.
- Offline cold reload, all three categories, repeated spins, saved ratings and root/custom-domain startup checked.
- An update arriving during spin remains waiting through reveal and rating, applies at the menu, removes the old scope-specific cache, and preserves category, mute and local ratings.
- Sound-on preference re-unlocks audio on the first spin after an update reload.
- Another open game window prevents activation. Failed asset caching rejects an incomplete update and retains the last complete offline version. Relaunch picks up the next complete version without losing ratings.
- Portrait gameplay and a viewport rotation back to landscape work without an orientation lock.
- No browser page errors in the production PWA report.

All 60 retained tip ID/text lines were compared with pre-refinement copies and remain unchanged. TrashRating.tsx and rating.css remain byte-for-byte unchanged. No GitHub remote was created and nothing was pushed or deployed.

## Remaining manual checks

Physical iPad Home Screen installation, standalone status bar/safe areas, real sound output and audio resumption, Safari storage eviction, Split View and long-lived background behavior require a real device. Playwright WebKit is not a substitute for these checks. The publishing guide includes the exact manual sequence.

`docs/PUBLISHING.md` contains commands for initial publication, Actions/Pages configuration, custom domain/DNS, iPad installation and update behavior. The workflow itself has not run on GitHub because publication was not authorized.
