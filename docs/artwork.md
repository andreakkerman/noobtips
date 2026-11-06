# Origineel artwork

De omgeving is met de ingebouwde imagegen-tool gegenereerd op 4 november 2026, daarna lokaal geconverteerd naar WebP (kwaliteit 88). Geen CLI/API-fallback gebruikt.

- Bestandslocatie: `public/art/observatory.webp`
- Afmetingen: 1536 × 1024
- Bestandsgrootte: 263.492 bytes
- Gebruik: statische achtergrond; alle interactieve mechaniek blijft echte SVG/CSS.
- De uiteindelijke generatie is visueel geïnspecteerd en geïntegreerd met een eigen koper/petrolpalet.

## Gebruikte prompt

Use case: stylized-concept. Asset type: original cinematic environment background for a premium children's browser arcade game called Noobtips. Wide landscape 1536x1024 composition. A breathtaking abandoned retro-futuristic arcade observatory inside a lush alien canyon at dusk, rendered like an expensive stylized 3D adventure game. Rich petroleum teal and midnight blue architecture, aged warm copper mechanical structures, tiny amber practical lights, turquoise illuminated seams, soft distant peach sky, atmospheric volumetric light. An enormous circular mechanical portal mounting frame occupies the RIGHT two thirds, positioned center at 68% width 48% height. The mounting frame is EMPTY with a dark quiet circular recess for a real interactive wheel to be overlaid later; absolutely no wheel or spokes inside. Wide smooth copper and dark metal pedestal under this round recess at bottom right. The LEFT third is mostly calm dark negative space, a dark teal wall with subtle vents for overlaid typography. Foreground edges have a few small stylized plants and chunky mechanical pipes. Deep dimensional perspective, physically convincing bevels, exquisite materials, art-directed light, cohesive filmic grading, charming and adventurous. Wide room seen mostly front-on, circular recess faces the viewer exactly straight-on. No people, no recognizable intellectual property, no logos, no words, no letters, no interface, no watermark. Keep contrast controlled and center recess dark. This is beautiful game environment concept art, not a website screenshot.

## Overige assets

Het rad, de naaf, de pointer, de merkletter N, categorie- en vaksymbolen, kroon, prullenbakken, papierproppen en bananenschillen zijn origineel in SVG getekend in `src/components/`. De animaties en lichtlagen staan in de CSS-bronnen. De geluiden zijn originele Web Audio-synthese in `src/game/audio.ts`. Outfit en Barlow Condensed worden lokaal meegeleverd met OFL-licenties in `public/licenses/`.

## Welcome environment, version 1.2

Built-in image_gen edit of the original observatory, saved non-destructively as `public/art/welcome-observatory.webp` (WebP quality 90). The original gameplay artwork is unchanged. Inspected the generated image and its integration at all three target sizes.

Final prompt:

> Use case: precise-object-edit. Edit target: supplied observatory environment. Create a sibling welcome-screen background for this same game. Preserve the exact AAA stylized 3D art direction, teal/copper materials, warm amber lamps, lush foliage, dusk lighting and beautiful alien canyon. Remove the enormous foreground circular portal and its dark filled void and raised pedestal entirely. In their place on the right reveal an intentional breathtaking open observatory terrace looking onto the existing lush canyon, waterfalls and peach dusk sky, framed by the existing architectural beams and warm copper railings. Retain the left third quiet dark teal wall as space for HTML headline overlay. Maintain rich dimensional foreground pipes and plants, beautiful reflective floor, cinematic inviting atmosphere. No new UI, no text, no logo, no characters, no wheel, no large dark empty circle. Wide landscape composition.

## Arc Raiders winter theme

The selected Arc Raiders category uses `public/art/arc-raiders-winter.webp` (1536×1024, WebP quality 90), generated with the built-in image_gen tool from the user's sole reference `D:/DevProjects/SvenAdventure/Levels/LVL-0039/fallenemperor.png`. The source reference and the existing observatory files were preserved. Welcome remains category-neutral; Algemeen uses its existing environment. The category artwork is aligned independently to the unchanged wheel using its measured mount center (1086,490) and 560px scale reference.

Final generation prompt:

> Use case: precise-object-edit. Edit target: supplied snowy fallen-emperor landscape. Recompose this exact world as a 1536x1024 (3:2) AAA game background for the Noobtips wheel screen. Preserve the recognizable colossal fallen pale-gray industrial robot structure and its huge articulated arching arm, snowy alpine mountain peaks, fir trees, small distant village church, icy rock ledges, bright cold blue daylight, tiny orange beacon lights. Match the supplied high-quality stylized 3D rendering and materials. Composition for HTML overlay: left 38 percent is a shaded dark slate-blue foreground salvage shelter panel with subtle frosted metal and a few snow-covered pipes, quiet enough for readable cream typography. The giant wreck must remain clearly recognizable across the UPPER background and center-left distant mountain landscape. On the RIGHT put a believable salvaged circular steel wheel mounting recess, front-facing and centered at pixel (1080,420) in the 1536x1024 canvas, dark inner opening approximately 650px diameter, outer weathered steel rim approximately 770px diameter; this is an empty mounting structure for a real interactive wheel to be overlaid. Rim has restrained amber utility lights, frost, snow and industrial bolts, a heavy low base below it. Keep the right circle exact and not tilted. Surround with snow ledges and pines and visible mountains, retaining the epic giant robot scale. No actual wheel or spokes in the opening. No text, no letters, no logos, no people, no UI. This is a winter industrial variant, not the warm copper jungle observatory. Maintain beautiful depth and cinematic coherent lighting.
