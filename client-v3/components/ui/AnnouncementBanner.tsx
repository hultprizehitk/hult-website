"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnnouncementItem {
  _id: string;
  title: string;
  subtitle?: string;
  category?: string;
  description?: string;
  badge?: string;
  links?: {
    website?: string;
  };
  createdAt: string;
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("hult_dismissed_announcements");
      if (stored) {
        setDismissedIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // sessionStorage restricted
    }
    setLoaded(true);
  }, []);

  const activeAnnouncements = announcements.filter((a) => !dismissedIds.has(a._id));

  // Sync banner height to CSS variable so fixed headers don't overlap
  useEffect(() => {
    if (bannerRef.current && activeAnnouncements.length > 0) {
      const h = bannerRef.current.offsetHeight;
      document.documentElement.style.setProperty("--banner-height", `${h}px`);
    } else {
      document.documentElement.style.setProperty("--banner-height", "0px");
    }

    return () => {
      document.documentElement.style.setProperty("--banner-height", "0px");
    };
  }, [activeAnnouncements.length, currentIndex]);

  const handleDismiss = (id: string) => {
    const updated = new Set(dismissedIds);
    updated.add(id);
    setDismissedIds(updated);

    try {
      sessionStorage.setItem(
        "hult_dismissed_announcements",
        JSON.stringify(Array.from(updated))
      );
    } catch {
      // sessionStorage fallback
    }

    if (currentIndex >= activeAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  if (!loaded || activeAnnouncements.length === 0) {
    return null;
  }

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0];
  if (!current) return null;

  return (
    <aside
      ref={bannerRef}
      aria-label="Flash Announcement"
      className="sticky top-0 z-[60] w-full bg-gradient-to-r from-[#f20089]/25 via-purple-950/70 to-black/95 border-b border-[#f20089]/30 backdrop-blur-2xl px-3 py-2 sm:px-6 sm:py-2.5 text-white font-[family-name:var(--font-google-sans)] text-xs transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Indicator, Category Badge, Title & Body */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden min-w-0 flex-1">
          {/* Pulsing Radar Beacon */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f20089] opacity-80" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f20089]" />
          </span>

          {/* Micro Category Badge */}
          <span className="shrink-0 rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-2 py-0.5 text-[9px] font-bold text-pink-300 uppercase tracking-widest font-mono">
            {current.badge || current.category || "FLASH"}
          </span>

          {/* Title & Body Snippet */}
          <div className="flex items-center gap-1.5 min-w-0 truncate text-[11px] sm:text-xs">
            <strong className="font-bold text-white shrink-0">
              {current.title}
            </strong>
            {current.description && (
              <span className="text-white/70 truncate hidden md:inline">
                — {current.description}
              </span>
            )}
          </div>
        </div>

        {/* Right: Action Link, Pagination & Dismiss */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[11px]">
          {current.links?.website && (
            <a
              href={current.links.website}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white/10 hover:bg-[#f20089]/30 border border-white/20 hover:border-[#f20089]/50 px-2.5 py-1 text-white font-semibold transition-all text-[10px] sm:text-[11px] whitespace-nowrap active:scale-95"
            >
              Learn More →
            </a>
          )}

          {activeAnnouncements.length > 1 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length)}
              className="text-white/60 hover:text-white transition-colors cursor-pointer text-[10px] px-1 font-mono shrink-0"
              title="Next Announcement"
            >
              [{currentIndex + 1}/{activeAnnouncements.length}]
            </button>
          )}

          {/* Pure SVG/CSS Dismiss button */}
          <button
            type="button"
            onClick={() => handleDismiss(current._id)}
            className="rounded p-1 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
            aria-label="Dismiss Announcement"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
