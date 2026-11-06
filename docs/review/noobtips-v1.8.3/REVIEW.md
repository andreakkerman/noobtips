# Noobtips 1.8.3 — additive mountain entrance

The establishing frame now excludes the replayed deposits immediately. Each drop's background and foreground layers contain only objects up to that arrival's ID. Previously landed objects remain in the next stage; future arrivals cannot appear early. This filters the final deterministic object set without changing positions, artwork or growth rules. Ground shadow and atmosphere use the currently visible stage count. Reduced motion still draws the complete mountain immediately.

After a landing, the reached stage is painted once with the normal renderer before the next drop. This also removes small alpha-compositing rounding differences between cached layers and the canonical static rendering. The final frame remains exactly `drawMountain(count)`.

## Validation

- TypeScript, 54 unit tests and production build passed.
- 44 targeted Chromium/WebKit browser tests passed: repeated visits, correct incomplete establishing composition, complete final pixels, unchanged ratings, reduced motion, cancellation and existing streak behavior.
- The establishing-delay test now uses a controlled clock, so PNG comparison overhead cannot consume its one-second observation window.
- Final capture validation passed for 1, 11, 75, 100 and 150 at 1024×768 landscape and 768×1024 iPad portrait. Initial and final images match their expected static compositions exactly. At two-drop counts, the captured first-settled canvas matches `drawMountain(count - 1)` with **zero channel differences**, proving the first object is retained and the second is absent.
- Reviewed actual establishing, first-drop, first-settled, second-drop and final frames. For single drops, final is also first-settled. `*-sequence.png` sheets show these in order; intermediate first-settled images are canvas snapshots taken at the transition boundary, while other images include the whole page.
- Final production smoke: 18 passed. Essential PWA/offline/update checks passed, including the existing interactive streak boundary.
- No artwork, object selection, growth placement, stored events, ranking calculations, streak logic, sound or deployment configuration changed.

Reproduce all exact-frame assertions and captures with `node scripts/capture-entrance-v183.mjs` against the development server at port 5173. Results are in `frames.json`. Portrait validation used a touch-enabled browser viewport, not a physical iPad.
