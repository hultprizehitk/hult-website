import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "&:is(.dark *)"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hult: {
          pink: "#f20089",
          rose: "#e60067",
          accent: "#ff007f",
          dark: "#211B1C",
          crimson: "#6F302B",
          blossom: "#fcecef",
          peach: "#fdf0f4",
        },
        background: "hsl(var(--background, 0 0% 0%))",
        foreground: "hsl(var(--foreground, 0 0% 100%))",
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 5%))",
          foreground: "hsl(var(--card-foreground, 0 0% 100%))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 5%))",
          foreground: "hsl(var(--popover-foreground, 0 0% 100%))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary, 326 100% 47%))",
          foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 0 0% 12%))",
          foreground: "hsl(var(--secondary-foreground, 0 0% 100%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 0 0% 15%))",
          foreground: "hsl(var(--muted-foreground, 0 0% 65%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 326 100% 47%))",
          foreground: "hsl(var(--accent-foreground, 0 0% 100%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84% 60%))",
          foreground: "hsl(var(--destructive-foreground, 0 0% 100%))",
        },
        border: "hsl(var(--border, 0 0% 20%))",
        input: "hsl(var(--input, 0 0% 20%))",
        ring: "hsl(var(--ring, 326 100% 47%))",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "var(--font-geist-sans)", "sans-serif"],
        "google-sans": ["var(--font-google-sans)", "Google Sans", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "sans-serif"],
        blubly: ["var(--font-blubly)", "var(--font-anton)", "Impact", "sans-serif"],
        anton: ["var(--font-anton)", "Impact", "sans-serif"],
        pirata: ["var(--font-pirata)", "serif"],
        cinzel: ["var(--font-cinzel)", "serif"],
        rye: ["var(--font-rye)", "serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        hultSkyEntrance: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(12px)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)", filter: "blur(0px)" },
        },
        hultSkyFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        petalFloat: {
          "0%": { transform: "translate3d(0, 0, 0) rotate(0deg)" },
          "50%": { transform: "translate3d(30px, 150px, 0) rotate(180deg)" },
          "100%": { transform: "translate3d(-30px, 300px, 0) rotate(360deg)" },
        },
        cloudDriftLayer1: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        cloudDriftLayer2: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        landingHeroFadeIn: {
          "0%": { opacity: "0", transform: "translateY(15px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        hultSkyEntrance: "hultSkyEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        hultSkyFloat: "hultSkyFloat 6s ease-in-out infinite",
        petalFloat: "petalFloat 12s linear infinite",
        cloudDriftLayer1: "cloudDriftLayer1 60s linear infinite",
        cloudDriftLayer2: "cloudDriftLayer2 90s linear infinite",
        landingHeroFadeIn: "landingHeroFadeIn 0.8s ease-out forwards",
        fadeIn: "fadeIn 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
