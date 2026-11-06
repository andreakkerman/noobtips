# Noobtips 1.8 — final review

Date: 2026-11-06. The starting working tree contained uncommitted 1.7 work; it was retained and incorporated. No tip text was edited. SHA-256 of the authoritative tips file before and after this task: `02C825BF201C348692601463B2682F0EED3251D5039E80B01217E423AE1E1673`.

## Mountain and visual refinements

The small vector pile was replaced with a fixed-camera 2.5D world using original locally bundled artwork. Sixteen cohesive object types include refrigerators, bicycles, robot parts, a piano, armchair, bathtub, television, computer, appliances, pipes, tools and smaller junk. Objects are drawn independently from a transparent atlas; the mountain is never a scaled illustration.

A deterministic support lattice grows vertically and outward. Positions, rotations and object choices depend only on deposit index. A lonely 32-unit box begins the scene; large signature objects punctuate later silhouettes. At 100 the pile occupies almost the entire scene height; at 125 the summit deliberately leaves the frame. The background lamppost remains fixed. Beyond the main range, bounded shoulder deposits keep visible additions possible without unbounded rendering or discarding ratings.

Refinement passes from actual renders:

1. Replaced the nine small vector shapes and flat environment with generated original atlas/environment artwork. Corrected an initially opaque atlas matte through imagegen background extraction, then verified real alpha transparency.
2. Added darker backing objects, larger silhouette signatures, contact shadows and atmospheric overlays. Rebalanced the Top 20 toward the environment and moved the caption away from the summit.
3. The five-object render exposed a support gap. Compressed the first support rows while preserving tall later growth. A trajectory test caught an inverted rebound sign; corrected the bounce. Split cached static art into layers behind and in front of the arriving object, preventing an occlusion pop on landing.

The final folder contains 48 actual stage captures: 0, 1, 5, 10, 17, 24, 25, 38, 49, 50, 63, 74, 75, 99, 100 and 125 at 1024×768, 1280×800 and 1366×768. Stage sheets and intermediate sheets were visually inspected. Actual gameplay additions at 25, 50 and 100 were recorded and inspected as sequences; three WebM recordings and nine arrival contact sheets are retained. No runtime debug interface or fabricated ratings were added to the application; synthetic history exists only in isolated review browsers.

Animations cache the static background and foreground, cap DPR at 1.5, and run rAF only for the 1.1-second arrival. Reduced motion renders the final scene directly. Interruption tests confirm that closing the view cleans up the animation.

## Selection

Independent persisted Fisher–Yates bags use browser crypto by default and injectable randomness in tests. Each category completes its entire current pool before reshuffling. An eight-tip recent window protects cycle boundaries. An explicit lightweight vocabulary scores subject and sentence-pattern overlap, using the shuffled order to break equal scores. Constraints relax for tiny pools rather than deadlocking. Wheel probabilities and presentation timing remain unchanged.

The v2 selection key migrates legacy arrays without deleting v1 data or changing v2 ratings. Normalization inserts new tips into the remaining bag, removes orphaned/moved IDs, retains inactive School history, and recovers malformed state. Tests exercise thousands of choices, deterministic seeds, tiny pools, content changes, persistence and category independence.

## Final validation

- TypeScript: passed.
- Production build: passed.
- Vitest: 53 passed.
- Full Playwright regression: 86 passed, 2 expected desktop touch skips, approximately 1.2 minutes.
- Production Chromium/WebKit smoke: 18 passed, approximately 31 seconds.
- Essential PWA suite: passed, including new artwork precache, offline mountain rendering, root/project URLs, atomic update failure recovery, multi-window boundaries, and preservation of ratings plus shuffle state during update.
- Capture browser errors: none.
- Workstation full-scene draw-call benchmark: approximately 0.89–1.45 ms at 100 contributions. Captured arrival rAF p95 intervals were about 16.7–16.8 ms. These are workstation observations, not certification of physical iPad/Chromebook performance.

An earlier development regression was interrupted by an index.html hot reload; the final complete run above passed on stable sources. One Windows screenshot-overwrite error was resolved by writing final captures to a fresh folder. Draft captures remain outside tracked review output.

The fast deployment workflow and separate full regression workflow remain separate. Only the full regression diagnostic artifact path was updated to 1.8. No DNS, domain, visibility, backend, external gameplay API or runtime dependency changes.

Original artwork prompts and provenance: `../../artwork-mountain.md`.
