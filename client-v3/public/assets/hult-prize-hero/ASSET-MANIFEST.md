# Hult Prize hero asset kit

This folder contains original, modular production assets inferred from the supplied references. It intentionally excludes the Heritage Institute of Technology and Hult Prize logos.

Reference screenshots and the complete production specification are in `reference/` and `RECREATION-GUIDE.md`.

All 14 locally persisted generation outputs, including superseded iterations, are preserved in `source-generations/`.

## Added environment source layers

- `environment/hero-sky.png` — quiet ivory/blush sky background.
- `environment/hero-mountains.png` — transparent distant mountain layer.
- `environment/hero-cityscape.png` — transparent low-contrast city layer.
- `environment/hero-landmark-tower.png` — transparent independent tower layer.
- `water/water-reflection.png` — transparent water reflection overlay.

## Classified generation batch (2026-09-20)

Source files were ChatGPT generations with timestamp names in `generations/` (folder removed after classification). All isolated layers were verified to carry true alpha except where noted.

| File | Guide slot | Notes |
| --- | --- | --- |
| `environment/shore-rock-left.png` | Core | Wet charcoal rock, lower-left, sparse blossoms, open right side |
| `water/water-ripples.png` | Core | Full-frame RGB (no alpha, correct for full-frame); ivory/rose ripple field |
| `branches/branch-left-secondary.png` | Core | Sparse light sprig, lighter than primary |
| `branches/branch-left-secondary-v2.png` | Variant | Denser alternate secondary |
| `branches/branch-mobile-left.png` | Core | Portrait 9:16 cascading branch, center-left, central zone open |
| `branches/cherry-branch-left-alt.png` | Variant | Dense alternate primary |
| `foreground/foreground-blossom-bottom.png` | Core | Defocused floral mass along bottom/left, center clear |
| `atmosphere/pink-atmosphere.png` | Core | Blush-pink haze at lower horizon and bottom corners |

## Contact sheets (sprite sources)

Rendered via the `SpriteCell` / `BlossomSprite` / `PetalSprite` components in `client/components/hero/sprites/`. Baked-in text labels on v2/v3 sheets are cropped out by the component (`labelCrop`).

### Blossom sheets — 1536 × 1024, 4 cols × 2 rows, cell aspect 3:4

Cell order left-to-right, top-to-bottom: `blossom-cluster-small-01`, `blossom-cluster-small-02`, `blossom-cluster-medium-01`, `blossom-cluster-medium-02`, `blossom-cluster-large-01`, `blossom-cluster-large-02`, `single-blossom-open`, `single-blossom-bud`.

| File | Labels | Use |
| --- | --- | --- |
| `blossoms/contact-sheet-v1.png` | none | Cleanest source; prefer for extraction |
| `blossoms/contact-sheet-v2.png` | baked | Alternate arrangements |
| `blossoms/contact-sheet-v3.png` | baked | Alternate arrangements |

Caveat: sheet backgrounds are semi-transparent dark gradients, not clean alpha. Cells composite safely over dark/blush fills; isolate further before use over bright ivory.

### Petal sheets — 1536 × 1024, 2 cols × 2 rows, cell aspect 3:2

Cell order: `petal-pair` (top-left), `petal-cluster` (top-right), `petal-water` (bottom-left), `petal-blurred` (bottom-right).

| File | Labels | Use |
| --- | --- | --- |
| `particles/petal-sheet-v1.png` | none | Cleanest source |
| `particles/petal-sheet-v2.png` | baked | Same layout, alternate render |

The image-generation service reached its usage limit before the remaining unique photographic layers could be created. This manifest will be expanded when generation is available again; no unavailable assets have been substituted with misleading duplicates.

## Layer order

1. `landscape/distant-horizon.png` — distant mountains and low city skyline; full-frame background.
2. `landscape/reflective-water.png` — reflective water plane; full-frame background.
3. `branches/cherry-branch-left.png` — transparent upper-left framing branch.
4. `branches/cherry-branch-right.png` — transparent upper-right framing branch.
5. `foreground/cherry-blossoms-left.png` — transparent, near-camera bottom-left blossom cluster.
6. `foreground/atmosphere-bokeh.png` — transparent soft-focus blossom/petal depth layer.
7. `particles/cherry-petals-sprite.png` — transparent 4×4 petal sprite sheet for animated particles.
8. `textures/grain.svg` — tileable procedural grain overlay.

## Interface SVGs

- `icons/arrow-right.svg` — primary CTA arrow.
- `icons/play.svg` — watch-film/play control.
- `icons/menu.svg` — compact mobile menu control.
- `icons/scroll-mouse.svg` — scroll cue.

## Not image assets

The pale ivory/pink wash, CTA pink glow, hairline dividers, progress dots, circular decoration, typography, labels, and button/pill geometry should be built in CSS/SVG rather than baked into a hero image. That preserves responsive layout and animation control.

## Licensing / provenance

Photographic assets in this kit were generated specifically from the supplied screenshots as visual-style references. No brand marks or reference UI were generated or included.
