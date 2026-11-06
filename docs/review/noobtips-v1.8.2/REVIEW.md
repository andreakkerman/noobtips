# Noobtips 1.8.2 — cinematic interaction review

## Behavior

Streaks retain all 180/260 particles, the existing five illustrated bins, milestone words, lighting and sound. The cinematic burst runs for 3.2 seconds, then stops drawing. The illuminated composition persists until YAY. The 320×64 button receives focus, supports keyboard activation and stays inside an inert-background focus boundary. Dismissal fades over 280 ms; reduced motion skips the burst and fade. The requested spin or menu transition is held before it begins and consumed exactly once after dismissal. Rating finalization is not repeated.

Every Top 20 mount paints the complete, actual mountain first. After the artwork is loaded and the canvas has painted, a one-second hold precedes a 1.25-second drop. At 75+ contributions, two recent deposits replay in sequence for 1.7 seconds total. Original falling/tumbling/bounce rendering is retained, with small metal fragments and a short original synthesized impact. Cached layers preserve occlusion; the final canvas is repainted from the complete deterministic composition. No ratings or contributions are written by this replay. Empty and reduced-motion scenes remain still. Unmount cancels the establishing timer, animation frame and impact audio.

## Visual review and refinement

Recorded real browser sequences at 1024×768, 1280×800 and 1366×768: the fifth streak, the persistent final composition, YAY continuation, and mountain entries at 1, 25, 100 and 150. Final contact sheets and recordings are in `refined/`; the single frames include the streak still visible at the last 5-second checkpoint. Capture labels are nominal sampling delays, not exact frame timestamps.

The first review exposed an overly wide YAY button and distracting previous-tip text beneath the celebration. Refined the button width and typography and made the cinematic backdrop opaque, retaining its rays, halo and colors. Recaptured the full sequences. Repeated entry, rapid navigation, reduced motion, keyboard focus and cancellation were additionally exercised in browser tests.

At 150 contributions and 1024×768 with Chromium CPU throttled 4×, the measured establishing interval was 1028 ms, the two-drop sequence 1722 ms, and frame interval p95 16.8 ms. See `performance.json`. This is a workstation approximation, not a physical iPad/Chromebook measurement.

## Validation

- TypeScript and production build passed.
- 54 unit tests passed.
- Full Chromium/WebKit browser regression: 114 passed, 2 expected desktop touch skips.
- Final production smoke: 18 passed.
- Essential PWA checks passed, including a new installed-worker scenario: an update waits while a settled streak remains open, then activates after YAY without losing ratings. The existing Top 20/update boundary also passes.
- Tests compare initial and final mountain pixels, verify unchanged stored events across repeated visits, hold the requested spin at 5 until acknowledgement, execute spin 6 once, reject duplicate dismissal and confirm zero pending animation frames after cancellation.
- Original artwork, growth placement rules, tip data, shuffle selection, ranking and persistence schemas are unchanged. No Pages configuration changes.

Reproduce animation captures with `node scripts/capture-cinematic-v182.mjs` while the development server is running at port 5173.
