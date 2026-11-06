# Noobtips 1.7 — visual and functional review

Validated on 2026-11-06 with the authoritative local collection (100 Algemeen, 100 Arc Raiders, inactive School preserved).

## Implemented and inspected

- Rating events use a new localStorage v2 key. Every new spin starts empty; edits replace one event. v1 ratings are ignored, selection history is retained.
- Top 20 aggregates actual events, sorts average / five-count / vote-count / stable ID, and excludes inactive tips.
- Original procedural Canvas environment with nine junk silhouettes, seeded immutable placements, offcuts, material gradients/scuffs, mist, distant architecture, foreground reeds and fixed lamp/sign references. Each count from 0 through 100 adds a persistent object. Rendering is bounded at 180 objects above the primary range, without capping stored votes or the displayed count.
- Session streak finalizes only on replay/menu, including skipped spins. Ten requested milestones; nonblocking 2.8-second Canvas celebration with synthesized sound, original existing bin emblems, gold shafts and rings, folded paper and cardboard. Reduced motion uses a static presentation.

## Visual refinement passes

1. First actual render exposed flat materials, a low/wide heap and a cropped reference lamp. Increased the height and narrowed placement spacing; preserved the full scene at each landscape size.
2. Added attached offcuts, scratches, mist, foreground vegetation and light shafts. Replaced simple particle rectangles with folded-paper and cardboard silhouettes, added emblem halos and rings.
3. Actual screenshots exposed low-contrast gradient title shadows and emblem/eyebrow crowding. Removed the conflicting shadow and increased the spacing. Re-recorded the final celebration.

Captured and inspected all ten mountain stages (0, 1, 10, 17, 25, 38, 50, 63, 75, 100) at 1024×768, 1280×800 and 1366×768. The three `*-stages.png` sheets contain the complete matrix. Captured streaks 5, 15 and 50 at each viewport; `streaks.png` groups these. `streak-50.webm` and `animation-sequence.png` show the final entrance, flying debris and clean exit. The recorded clip was trimmed from the actual gameplay recording, not simulated.

`repeated-tip-unrated.png` shows a previously rated tip returning with all five cans empty. Menu and short/long gameplay captures accompany the PWA report. Ranking scroll containers retain fixed headers and navigation without page overflow.

## Validation

- TypeScript and production Vite build: passed.
- Vitest: 43 passed.
- Full Playwright regression: 82 passed; 2 expected desktop-only touch skips, approximately 1.2 minutes.
- Production smoke: 18 passed, approximately 33 seconds.
- PWA smoke and full PWA validation: passed, including cold offline reload, the mountain canvas, both categories, root/project bases, pending updates, multiple windows, incomplete deployment rejection and retained v2 ratings.
- Browser capture errors: none.
- Direct browser benchmark: 60 full 100-object draws averaged 1.87 ms per draw on this workstation. This measures Canvas submission/render calls, not physical-device frame rate.

No new runtime dependencies, remote artwork, backend, accounts or runtime API calls. Existing Pages workflow timeout limits and separate full regression workflow remain intact. No DNS/domain changes.

Physical iPad/Chromebook performance and audible quality on speakers/headphones were not tested. The graphics are original stylized Canvas illustration, not photorealistic 3D rendering.
