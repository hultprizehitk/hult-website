"use client";

import React, { useState } from "react";
import { useThemeTuner, ThemeTunerConfig } from "@/context/ThemeTunerContext";
import { Sliders, Copy, Check, RotateCcw, X, Eye, Layers } from "lucide-react";

export default function CardThemeDevTool() {
  const { config, updateConfig, resetConfig, copyJson } = useThemeTuner();
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyJson();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-[99999] select-none font-mono">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/90 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 hover:bg-neutral-900 cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-rose-400 group-hover:rotate-45 transition-transform" />
            <span>Card Tuner</span>
          </button>
        )}
      </div>

      {/* Tuner Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[99999] w-[340px] sm:w-[380px] max-h-[85vh] overflow-y-auto rounded-3xl border border-white/80 bg-neutral-950/95 text-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl font-mono text-xs select-none scrollbar-thin">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-rose-400" />
              <span className="font-bold text-sm tracking-wide text-neutral-100">Live Card Tuner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={resetConfig}
                title="Reset to defaults"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Copy JSON Action Bar */}
          <div className="py-3 border-b border-neutral-800">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white hover:shadow-rose-900/30"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied JSON to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Configuration JSON</span>
                </>
              )}
            </button>
          </div>

          {/* Controls Sections */}
          <div className="space-y-4 pt-4">
            {/* Section 1: Card Glass */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-rose-400" />
                  <span>Card Glass Surface</span>
                </span>
              </div>

              {/* Card BG Opacity */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Background Opacity</span>
                  <span className="font-bold text-rose-400">
                    {Math.round(config.cardBgOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={config.cardBgOpacity}
                  onChange={(e) => updateConfig("cardBgOpacity", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Card Backdrop Blur */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Backdrop Blur</span>
                  <span className="font-bold text-rose-400">{config.cardBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={config.cardBlur}
                  onChange={(e) => updateConfig("cardBlur", parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Card Border Opacity */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Border Opacity</span>
                  <span className="font-bold text-rose-400">
                    {Math.round(config.cardBorderOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.cardBorderOpacity}
                  onChange={(e) => updateConfig("cardBorderOpacity", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Card Shadow */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Shadow Depth</span>
                  <span className="font-bold text-rose-400">
                    {Math.round(config.cardShadowOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.02"
                  value={config.cardShadowOpacity}
                  onChange={(e) => updateConfig("cardShadowOpacity", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>
            </div>

            {/* Section 2: Big Text in Cards */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-rose-400" />
                  <span>Big Text (Titles & Numbers)</span>
                </span>
              </div>

              {/* Text Mode Selector */}
              <div className="grid grid-cols-2 gap-1.5 bg-neutral-900/60 p-1.5 rounded-xl border border-neutral-800/80">
                {(["transparent", "semi", "cutout", "solid"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateConfig("bigTextMode", m)}
                    className={`py-1.5 px-2 rounded-lg text-[10.5px] uppercase font-bold transition-all cursor-pointer ${
                      config.bigTextMode === m
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Big Text Fill Opacity */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Text Fill Opacity</span>
                  <span className="font-bold text-rose-400">
                    {Math.round(config.bigTextOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.bigTextOpacity}
                  onChange={(e) => updateConfig("bigTextOpacity", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Stroke Width */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Stroke Rim Width</span>
                  <span className="font-bold text-rose-400">{config.bigTextStrokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.2"
                  value={config.bigTextStrokeWidth}
                  onChange={(e) => updateConfig("bigTextStrokeWidth", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Stroke Opacity */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Stroke Rim Opacity</span>
                  <span className="font-bold text-rose-400">
                    {Math.round(config.bigTextStrokeOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.bigTextStrokeOpacity}
                  onChange={(e) => updateConfig("bigTextStrokeOpacity", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>
            </div>

            {/* Section 3: Atmosphere & Shadows */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-neutral-400">
                <span>Atmosphere & Headings</span>
              </div>

              {/* Dimmer Max */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Background Dimmer</span>
                  <span className="font-bold text-rose-400">
                    {Math.round(config.dimmerMax * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.dimmerMax}
                  onChange={(e) => updateConfig("dimmerMax", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Heading White Halo */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Heading White Halo</span>
                  <span className="font-bold text-rose-400">{config.whiteShadowBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={config.whiteShadowBlur}
                  onChange={(e) => updateConfig("whiteShadowBlur", parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Parallax Multiplier */}
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">Parallax Multiplier</span>
                  <span className="font-bold text-rose-400">{config.parallaxMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.02"
                  value={config.parallaxMultiplier}
                  onChange={(e) => updateConfig("parallaxMultiplier", parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Bottom Copy Button */}
          <div className="pt-4 mt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2 px-3 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? "Copied!" : "Copy JSON"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
