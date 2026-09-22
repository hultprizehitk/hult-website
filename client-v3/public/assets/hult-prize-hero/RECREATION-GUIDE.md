# Hult Prize visual recreation guide

## Source of truth

- `reference/desktop-reference.png` — 1672 × 941 desktop composition.
- `reference/mobile-reference.png` — 858 × 1834 mobile composition.

Use these files only as visual references. Do not bake their text, logos, navigation, controls, or page layout into generated images.

## Asset rules

1. Environmental layers are wide photographic backgrounds: sky, water, and water texture are full-frame; mountains and skyline may be transparent if parallax is required.
2. Botanical, particle, mist, and foreground layers require real transparent alpha, not a white or black backdrop.
3. Every generated image must contain no text, logos, UI, border, or watermark.
4. Generate at least 1920 px wide for desktop panoramas, 1600 px tall for mobile botanical layers, and 1000 px square for isolated assets.
5. Keep all light sources consistent: diffused ivory/blush sunrise, from low right/center; do not use saturated magenta or harsh shadows.
6. Keep image assets separate from live type, gradients, button geometry, lines, circles, and icons.

## Existing assets

| Asset | Status | Intended use |
| --- | --- | --- |
| `environment/hero-sky.png` | ready | Base sky layer |
| `environment/hero-mountains.png` | ready | Distant parallax layer |
| `environment/hero-cityscape.png` | ready | Low skyline parallax layer |
| `environment/hero-landmark-tower.png` | ready | Optional independent landmark |
| `landscape/reflective-water.png` | ready | Base water layer |
| `water/water-reflection.png` | ready | Water reflection overlay |
| `branches/cherry-branch-left.png` | ready | Desktop primary upper-left branch |
| `branches/cherry-branch-right.png` | ready | Desktop primary upper-right branch |
| `foreground/cherry-blossoms-left.png` | ready | Near-camera lower-left flowers |
| `foreground/atmosphere-bokeh.png` | ready | Broad foreground blur layer |
| `particles/cherry-petals-sprite.png` | ready | Eight reusable falling-petal sources |
| `textures/grain.svg` | ready | Optional global grain |

## Remaining image inventory and creation brief

The table identifies all named source assets. `Core` assets should be created first. `Derive` entries can be cropped, flipped, blurred, or recolored from a core source rather than requiring a distinct generation.

### Environment and water

| File | Priority | Background | Creation brief |
| --- | --- | --- | --- |
| `environment/shore-rock-left.png` | Core | transparent | Wet charcoal volcanic rock from lower-left, tapering toward center; sparse attached blossoms; preserve open right side. |
| `water/water-ripples.png` | Core | full frame | Ultra-wide, pale ivory/rose, subtle horizontal ripple field only; no horizon or objects. |
| `water/water-texture.png` | Derive | full frame | Soft low-contrast detail crop from base water, with a small scale/opacity variation. |
| `water/water-petal.png` | Core | transparent | One pale blossom petal flat on a tiny reflective water patch. |
| `environment/shore-rock-detail.png` | Derive | transparent | Detail crop from the completed shoreline rock; retain wet-stone texture. |

### Branches

| File | Priority | Background | Creation brief |
| --- | --- | --- | --- |
| `branches/branch-left-secondary.png` | Core | transparent | Sparse limb descending from left toward lower-center; lighter visual weight than the primary branch. |
| `branches/branch-bottom-left.png` | Core | transparent | Low flowering twig growing around the shoreline rock, occupying the lower-left only. |
| `branches/branch-mobile-left.png` | Core | transparent | 9:16 left-side vertical/cascading branch; keep the central title zone open. |
| `section02/section02-branch-left.png` | Core | transparent | Small low-weight floral branch rising from Section 02 lower-left edge. |

### Isolated blossom set

| File | Priority | Background | Creation brief |
| --- | --- | --- | --- |
| `blossoms/blossom-cluster-small-01.png` | Core | transparent | Three open flowers in a compact triangular group. |
| `blossoms/blossom-cluster-small-02.png` | Core | transparent | Two flowers and two buds in a diagonal side-facing composition. |
| `blossoms/blossom-cluster-medium-01.png` | Core | transparent | Six to eight flowers on a short arcing twig. |
| `blossoms/blossom-cluster-medium-02.png` | Core | transparent | Five flowers and buds in a vertical diagonal composition. |
| `blossoms/blossom-cluster-large-01.png` | Core | transparent | Twelve to sixteen flowers, dense but airy, rounded silhouette. |
| `blossoms/blossom-cluster-large-02.png` | Derive | transparent | Alternate crop/flip from a large cluster, preserving a distinct silhouette. |
| `blossoms/single-blossom-open.png` | Core | transparent | One front three-quarter open sakura flower; visible stamens and petal veins. |
| `blossoms/single-blossom-bud.png` | Core | transparent | One partially closed deep-blush bud on a short tapered stem. |

### Foreground depth layers

| File | Priority | Background | Creation brief |
| --- | --- | --- | --- |
| `foreground/foreground-blossom-right.png` | Core | transparent | Large heavily defocused pink flower mass entering from lower-right; center remains clear. |
| `foreground/foreground-blossom-bottom.png` | Core | transparent | Defocused floral mass rising only from the bottom edge. |
| `foreground/foreground-blossom-top.png` | Derive | transparent | Sparse, subtle soft-focus flowers along the top edge. |
| `foreground/foreground-bokeh-pink-01.png` | Derive | transparent | Crop from existing atmosphere bokeh; place one irregular warm-pink blur at a corner. |
| `foreground/foreground-bokeh-pink-02.png` | Core | transparent | Two distinctly shaped low-opacity pink floral bokeh forms; no sharp features. |
| `foreground/foreground-bokeh-white.png` | Core | transparent | Faint ivory-white blossom/light haze for depth, nearly transparent. |

### Petal set

Use the eight cells in `particles/cherry-petals-sprite.png` for `petal-small-01`, `petal-small-02`, `petal-medium-01`, `petal-medium-02`, `petal-large-01`, `petal-large-02`, `petal-curved`, and `petal-side-view`. Extract each to an isolated transparent PNG. Create the following additional assets:

| File | Priority | Background | Creation brief |
| --- | --- | --- | --- |
| `particles/petal-pair.png` | Core | transparent | Two naturally drifting petals; one face-on and one edge-on. |
| `particles/petal-cluster.png` | Core | transparent | Loose group of four to six tiny petals with clear separation. |
| `particles/petal-water.png` | Core | transparent | One petal flat on a small reflective water patch. |
| `particles/petal-blurred.png` | Core | transparent | One large, close-camera, heavily defocused petal. |
| `section02/section02-floating-petals.png` | Derive | transparent | Sparse arrangement of extracted petal assets with varied scale and rotation. |

### Atmospheric and Section 02 layers

| File | Priority | Background | Creation brief |
| --- | --- | --- | --- |
| `atmosphere/pink-atmosphere.png` | Core | transparent | Very soft organic blush-pink haze, concentrated at lower horizon and edges. |
| `atmosphere/horizon-mist.png` | Core | transparent | Low ivory/pink dawn mist, visual material in lower 20% only. |
| `atmosphere/foreground-mist.png` | Core | transparent | Slightly denser close mist at bottom corners, clear through center. |
| `atmosphere/horizon-glow.png` | Derive | transparent | Subtle pale pink-white localized glow behind skyline; may be rendered with a raster radial gradient. |
| `atmosphere/pink-light-bloom.png` | Derive | transparent | Small warm pink/orange bloom; lower opacity than horizon glow. |
| `atmosphere/atmospheric-particles.png` | Core | transparent | Very sparse warm-white/pale-pink floating specks; no snow-like density. |
| `section02/section02-blossom-cluster.png` | Core | transparent | Soft-focus pale-pink group behind the Section 02 content area. |
| `section02/section02-foreground-blossom.png` | Core | transparent | Large blurred floral element overlapping the Section 02 lower-left edge. |

### Optional photographic textures

| File | Background | Creation brief |
| --- | --- | --- |
| `textures/film-grain.png` | transparent | Fine monochrome photographic grain at very low density; tileable 512 × 512. |
| `textures/paper-texture.png` | full frame | Faint warm ivory paper/fiber texture; near-invisible contrast. |

## Prompt framework

Use this at the beginning of every external-generation prompt:

```text
Create a premium photorealistic spring-dawn asset for a luxury editorial website.
The visual reference has an ivory, pale-blush-pink, muted-mauve palette; all lighting is soft diffused rose-gold dawn.
Use the supplied desktop and mobile reference images only for mood, lighting, and composition context; do not reproduce any UI, text, typography, layout, or logos.
```

For isolated layers, append:

```text
Deliver a true transparent background with clean alpha. Preserve soft natural feathering where appropriate, but no white, black, pink, or coloured halo. No text, logos, UI, border, watermark, scenery, or unrelated objects.
```

For full-frame layers, append:

```text
Deliver a clean full-frame photographic image with no text, logos, UI, border, watermark, or distinct foreground object.
```

## Desktop assembly order

1. `hero-sky` fills the hero; add a faint CSS blush wash above it.
2. Place `hero-mountains` at the horizon, then `hero-cityscape`, then `hero-landmark-tower` at a low center-right coordinate.
3. Place `reflective-water` under the horizon; overlay `water-reflection` and `water-ripples` at low opacity.
4. Put `shore-rock-left` and `branch-bottom-left` in front of the water.
5. Frame with primary upper-left and upper-right branches. Secondary branch stays behind hero type.
6. Place live hero text and controls above all sharp scenery.
7. Add floating petals above type sparingly; keep their motion path outside readable copy.
8. Add foreground blossom/bokeh and mist layers at the highest visual depth; they may overlap hero edges but not obscure actions.

## Mobile assembly order

1. Use the same sky, mountains, city, tower, water, and atmosphere sources; scale by height rather than width.
2. Replace desktop left branch with `branch-mobile-left`; hide the desktop right branch at narrow widths.
3. Increase lower foreground flower scale and use the right bokeh/blur asset close to the camera.
4. Keep the title centered and reserve an uninterrupted central vertical zone from roughly 18% to 56% of hero height.
5. Start Section 02 with a large pale curved CSS panel, then add `section02-branch-left`, `section02-blossom-cluster`, and its foreground layer.

## Motion specification

| Layer | Motion |
| --- | --- |
| Mountains | 1–2% slow vertical parallax |
| City / tower | 2–4% parallax, slower than foreground |
| Water | Tiny horizontal texture drift, 10–20 s loop |
| Branches | 1–2 degree slow sway only |
| Petals | Mixed rotations, scales, blur, and velocities; never a synchronized loop |
| Bokeh / mist | 1–3% drift; opacity range 0.45–0.8 |

Use transforms and opacity only for the environmental animation; avoid layout shifts. Respect `prefers-reduced-motion` by disabling petal and sway animation.

## Live build elements, not image assets

- All logo artwork supplied separately.
- Hero, navigation, sidebar, footer, and Section 02 copy.
- Display serif, clean sans-serif, and script accent typefaces.
- Buttons, pink glow, play-circle border, menu control, arrows, social icons, scroll cue.
- Progress dots, thin rules, arcs, circular outlines, and curved Section 02 boundary.

## Completion check

Before implementation, verify that every standalone photographic subject has its own asset, every overlay has alpha, the hero remains readable with all layers enabled, and the desktop/mobile references can be matched without moving live text into a raster image.
