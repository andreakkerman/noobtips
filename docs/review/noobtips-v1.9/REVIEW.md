# Noobtips 1.9 — streak presentation review

The milestone counter is now the primary gold/copper `X× OP RIJ` element. The five existing overflowing cans enter next, followed by the unchanged milestone headline and YAY. The secondary slogan is removed. Every milestone uses the same directed sequence and spectacle.

The existing 180/260-particle opening burst is preserved. Between 2.4 and 3.2 seconds it hands over to 24 quiet paper, copper and dust fragments around the composition. Ambient drawing is capped at 30 fps; opening particles are released after the burst. Reduced motion paints one static composition. YAY still dismisses through the existing transition, with animation cleanup and pending gameplay actions unchanged.

## Visual review and refinement

Captured actual component sequences for streaks 5, 10, 15 and the long headline at 75 in 1024×768, 1280×800, 1366×768 and 768×1024 portrait. See [capture report](final/report.json), the `final/*-sequence.png` contact sheets, final PNGs and four recorded WebM sequences. Screenshot capture overhead means frame labels are nominal timing checkpoints.

The first pass placed the counter too close to the middle can's raised lid. Increased separation to 46px and checked the long headline and portrait composition again. Replaced flat ambient shapes with folded paper shading, creases and outlined copper scraps, keeping movement at the edges for readability. Final captures have no layout violations. Counter, cans, headline and YAY remain distinct throughout the directed reveal.

## Validation

- TypeScript and production build passed.
- 54 unit tests passed.
- 16 targeted cinematic/streak browser tests passed, covering held transitions, persistent celebration and cleanup.
- Presentation suite passed again in all four browser projects after adding actual touch taps: 8 tests.
- Production smoke: 18 tests passed, including Chromium and WebKit touch.
- PWA smoke passed, including a streak earned entirely offline and update activation deferred until YAY. See [PWA report](pwa-report.json).
- Ambient measurement with Chromium at 1024×768 and 4× CPU throttling: mean draw 0.30ms, p95 0.50ms across 56 paints. This is a workstation approximation, not a physical iPad or Chromebook benchmark. See [measurement](performance.json).

No changes to tip content, ratings/streak calculations, App transition logic, mountain rendering/artwork, Top 20 calculations, service worker behavior or deployment workflow.
