"use client";

import React, { createContext, useContext, useState } from "react";

export interface ThemeTunerConfig {
  // Card Glass
  cardBgOpacity: number;        // 0.0 - 1.0
  cardBlur: number;             // 0 - 40 px
  cardBorderOpacity: number;    // 0.0 - 1.0
  cardShadowOpacity: number;    // 0.0 - 0.5

  // Atmosphere
  dimmerMax: number;            // 0.0 - 1.0
  whiteShadowBlur: number;      // 0 - 30 px

  // Big Text in Cards
  bigTextMode: "transparent" | "semi" | "cutout" | "solid";
  bigTextOpacity: number;       // 0.0 - 1.0
  bigTextStrokeWidth: number;   // 0.0 - 4.0 px
  bigTextStrokeOpacity: number; // 0.0 - 1.0

  // Scroll & Parallax
  scrollDuration: number;       // 0.5 - 3.0 s
  parallaxMultiplier: number;   // 0.0 - 0.8
}

const DEFAULT_CONFIG: ThemeTunerConfig = {
  cardBgOpacity: 0.24,
  cardBlur: 0,
  cardBorderOpacity: 0.45,
  cardShadowOpacity: 0,
  dimmerMax: 0.6,
  whiteShadowBlur: 1,
  bigTextMode: "solid",
  bigTextOpacity: 1,
  bigTextStrokeWidth: 1.0,
  bigTextStrokeOpacity: 0.95,
  scrollDuration: 1.5,
  parallaxMultiplier: 0.2,
};

interface ThemeTunerContextType {
  config: ThemeTunerConfig;
  updateConfig: <K extends keyof ThemeTunerConfig>(key: K, value: ThemeTunerConfig[K]) => void;
  resetConfig: () => void;
  copyJson: () => Promise<boolean>;
  getCardStyle: (customBgAlpha?: number) => React.CSSProperties;
  getBigTextStyle: () => React.CSSProperties;
  getHeaderShadow: () => string;
}

const ThemeTunerContext = createContext<ThemeTunerContextType | null>(null);

export function ThemeTunerProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeTunerConfig>(DEFAULT_CONFIG);

  const updateConfig = <K extends keyof ThemeTunerConfig>(key: K, value: ThemeTunerConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const copyJson = async (): Promise<boolean> => {
    try {
      const text = JSON.stringify(config, null, 2);
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error("Failed to copy tuner JSON:", e);
      return false;
    }
  };

  const getCardStyle = (customBgAlpha?: number): React.CSSProperties => {
    const bgAlpha = customBgAlpha !== undefined ? customBgAlpha : config.cardBgOpacity;
    return {
      backgroundColor: bgAlpha > 0 ? `rgba(255, 255, 255, ${bgAlpha})` : "transparent",
      backdropFilter: config.cardBlur > 0 ? `blur(${config.cardBlur}px)` : "none",
      WebkitBackdropFilter: config.cardBlur > 0 ? `blur(${config.cardBlur}px)` : "none",
      borderColor:
        config.cardBorderOpacity > 0
          ? `rgba(255, 255, 255, ${config.cardBorderOpacity})`
          : "transparent",
      boxShadow:
        config.cardShadowOpacity > 0
          ? `0 12px 40px rgba(0, 0, 0, ${config.cardShadowOpacity})`
          : "none",
    };
  };

  const getBigTextStyle = (): React.CSSProperties => {
    // 1px white border around solid font with paintOrder so stroke renders behind fill
    return {
      color: `rgba(17, 24, 39, ${config.bigTextOpacity > 0 ? config.bigTextOpacity : 1})`,
      WebkitTextStroke: "1px rgba(255, 255, 255, 0.95)",
      paintOrder: "stroke fill",
    };
  };

  const getHeaderShadow = (): string => {
    if (config.whiteShadowBlur <= 0) return "none";
    return "0 0 1px rgba(255,255,255,0.9)";
  };

  return (
    <ThemeTunerContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        copyJson,
        getCardStyle,
        getBigTextStyle,
        getHeaderShadow,
      }}
    >
      {children}
    </ThemeTunerContext.Provider>
  );
}

export function useThemeTuner() {
  const ctx = useContext(ThemeTunerContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      config: DEFAULT_CONFIG,
      updateConfig: () => {},
      resetConfig: () => {},
      copyJson: async () => false,
      getCardStyle: () => ({}),
      getBigTextStyle: () => ({}),
      getHeaderShadow: () => "0 0 8px rgba(255,255,255,0.9)",
    };
  }
  return ctx;
}
