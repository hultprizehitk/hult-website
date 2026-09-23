/**
 * Hero Layers Configuration
 * 5-layer parallax system using custom hero assets from /public/hero-layers/
 *
 * Layer stack (back → front):
 *   1. main-base-layer  — full Kolkata sunset cityscape (locked background)
 *   2. human-layer-2    — colorful SDG student collage (bottom center)
 *   3. trees-front      — banyan canopy frame + ground foliage (full bleed)
 *   4. falling-leaves   — CSS-animated leaf particles (handled by FallingLeaves.tsx)
 */

export interface HeroLayer {
  id: string;
  src: string;
  zIndex: number;
  /** Scroll parallax speed multiplier. 0 = locked, higher = moves faster */
  parallax: number;
  /** Entrance animation type */
  entrance: "fade" | "slide-up" | "slide-right" | "zoom-in";
  /** Entrance animation delay in ms */
  entranceDelay: number;
  /** Entrance animation duration in ms */
  entranceDuration: number;
  /** CSS positioning */
  position: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
  /** Object-fit behavior */
  objectFit: "cover" | "contain";
  /** Object-position */
  objectPosition: string;
}

export const HERO_CANVAS_WIDTH = 1672;
export const HERO_CANVAS_HEIGHT = 941;
export const HERO_CANVAS_ASPECT = HERO_CANVAS_WIDTH / HERO_CANVAS_HEIGHT;

export const HERO_LAYERS: HeroLayer[] = [
  {
    id: "main-base-layer",
    src: "/hero-layers/main-base-layer.png",
    zIndex: 1,
    parallax: 0,
    entrance: "fade",
    entranceDelay: 0,
    entranceDuration: 1200,
    position: { left: "0", top: "0", width: "100%", height: "100%" },
    objectFit: "cover",
    objectPosition: "center center",
  },
  {
    id: "human-layer",
    src: "/hero-layers/human-layer-2.png",
    zIndex: 2,
    parallax: 0.35,
    entrance: "fade",
    entranceDelay: 300,
    entranceDuration: 2100,
    position: { left: "5%", top: "5%", width: "100%", height: "100%" },
    objectFit: "contain",
    objectPosition: "center bottom",
  },
  {
    id: "trees-front",
    src: "/hero-layers/trees-front.png",
    zIndex: 4,
    parallax: 0.85,
    entrance: "zoom-in",
    entranceDelay: 1200,
    entranceDuration: 1200,
    position: { left: "0", top: "0", width: "130%", height: "110%" },
    objectFit: "cover",
    objectPosition: "center center",
  },
];

/**
 * Spritesheet info for falling leaves animation
 * The spritesheet is 2172×724, arranged as 4 rows × 12 columns
 * Each cell is ~181×181px
 */
export const LEAVES_SPRITESHEET = {
  src: "/hero-layers/falling-leaves-spritesheet.png",
  cols: 12,
  rows: 4,
  cellWidth: 181,
  cellHeight: 181,
  totalWidth: 2172,
  totalHeight: 724,
};
