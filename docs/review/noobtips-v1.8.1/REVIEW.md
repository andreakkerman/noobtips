# Noobtips 1.8.1 review

## Expansion

The original 16-object atlas is unchanged. A transparent second atlas adds 16 original salvage objects: scanner, drone, dish, cargo pod, sensor turret, sled chassis, power cells, mechanical leg, thruster, antenna, utility crate, exo-frame, cable spool, reactor cylinder, tool station and armored locker. No official game assets, symbols or giant robot centerpiece were used.

The existing support lattice, fixed camera, cached rendering and animated landing remain. Tighter vertical support spacing leaves room for visible growth through 150; 100+ deposits use larger items and a higher salvage weighting. Every placement and prop choice depends only on its deposit index. All original prop types remain in circulation. This release recomposes the artwork, without changing any saved contribution count or rating.

## Visual review

Captured actual browser scenes at 0, 1, 5, 10, 25, 50, 75, 100, 125 and 150 on 1024×768, 1280×800 and 1366×768. Inspect `refined/*-stages.png` for all checkpoints. One contribution stays tiny; 125 and 150 visibly add height and mass beyond 100, with the summit reaching beyond the fixed frame at 150. The original lamp remains the scale reference.

First-pass critique: an oversized cardboard carton dominated the 50-count skyline. Refined that signature deposit into a sensor dish and added a scanner accent at 100. Recaptured all 30 states. Reviewed arrival sequences at 100, 125 and 150, including accelerated fall, contact, dust and settled occlusion. Contact sheets and real browser recordings are retained in `refined`.

At 150, full scene drawing averaged 1.48–1.83 ms on this workstation. Recorded arrival frame interval p95 was 16.7–16.8 ms. Static scenes do not run a continuous animation loop. DPR remains capped at 1.5 and rendering remains bounded for extreme counts. Physical iPad/Chromebook hardware was not available; these are browser viewport and workstation measurements.

## Validation

- TypeScript and production build passed.
- 54 unit tests passed, including stable placement through 150, all 32 props and continued upper silhouette growth.
- Full browser regression: 86 passed, 2 expected desktop touch skips.
- After the final prop refinement, all 12 mountain browser tests passed.
- Final production smoke: 18 passed in Chromium and WebKit.
- Essential PWA checks passed: both atlases precached, offline mountain, root and project base, safe multi-window updates, preserved ratings/history, and incomplete update rejection.
- One concurrent Playwright run failed during trace teardown because two processes shared the artifact directory. Rerunning the production smoke suite alone passed; no gameplay assertion failed in that run.
- No tips, shuffle selection, rating storage, streak logic, sound, welcome flow or Top 20 layout were changed. Tips SHA256 remains `02C825BF201C348692601463B2682F0EED3251D5039E80B01217E423AE1E1673`.

The existing short Pages deployment workflow is preserved. The manual regression artifact destination now points to this version.
