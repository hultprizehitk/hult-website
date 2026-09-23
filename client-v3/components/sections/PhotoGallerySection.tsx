"use client";

import React from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { ArrowRight } from "lucide-react";

interface PhotoGallerySectionProps {
  scrollProgress?: number;
}

const GALLERY_IMAGES = [
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.00%20AM.jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.01%20AM%20(1).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.01%20AM.jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.02%20AM%20(1).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.02%20AM%20(2).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.02%20AM.jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.03%20AM%20(1).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.03%20AM%20(2).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.03%20AM%20(3).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.03%20AM.jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.04%20AM%20(1).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.04%20AM%20(2).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.04%20AM.jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.05%20AM%20(1).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.05%20AM%20(2).jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.05%20AM.jpeg",
  "/assets/photo%20gallery/WhatsApp%20Image%202026-09-24%20at%2012.04.06%20AM.jpeg",
];

// Row distributions
const ROW1_IMAGES = GALLERY_IMAGES.slice(0, 6);
const ROW2_IMAGES = GALLERY_IMAGES.slice(6, 12);
const ROW3_IMAGES = GALLERY_IMAGES.slice(12, 17).concat(GALLERY_IMAGES.slice(0, 2));

export default function PhotoGallerySection({ scrollProgress }: PhotoGallerySectionProps) {
  // Scroll-driven pure opacity fade-in
  const isScrollDriven = typeof scrollProgress === "number";
  const fadeStart = 0.58;
  const fadeEnd = 0.78;
  const rawProgress = isScrollDriven
    ? Math.min(1, Math.max(0, (scrollProgress - fadeStart) / (fadeEnd - fadeStart)))
    : 1;
  const easeProgress = Math.sin((rawProgress * Math.PI) / 2);
  const galleryOpacity = isScrollDriven ? easeProgress : 1;

  // Duplicate rows 3 times for seamless infinite looping
  const row1Triple = [...ROW1_IMAGES, ...ROW1_IMAGES, ...ROW1_IMAGES];
  const row2Triple = [...ROW2_IMAGES, ...ROW2_IMAGES, ...ROW2_IMAGES];
  const row3Triple = [...ROW3_IMAGES, ...ROW3_IMAGES, ...ROW3_IMAGES];

  return (
    <>
      <style>{`
        @keyframes galleryMarqueeLeft {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }

        @keyframes galleryMarqueeRight {
          0% { transform: translate3d(-33.333%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }

        .animate-gallery-left {
          display: flex;
          width: max-content;
          animation: galleryMarqueeLeft 42s linear infinite;
          will-change: transform;
        }

        .animate-gallery-right {
          display: flex;
          width: max-content;
          animation: galleryMarqueeRight 42s linear infinite;
          will-change: transform;
        }

        .animate-gallery-left:hover,
        .animate-gallery-right:hover {
          animation-play-state: paused;
        }
      `}</style>

      <section
        id="gallery"
        className="relative w-full py-16 sm:py-24 font-[family-name:var(--font-google-sans)] bg-transparent text-white transition-opacity duration-300 overflow-hidden"
        style={{
          opacity: galleryOpacity,
          pointerEvents: galleryOpacity > 0.3 ? "auto" : "none",
          willChange: "opacity",
        }}
      >
        <div className="relative z-10 w-full space-y-8 sm:space-y-10">
          {/* Editorial Section Header */}
          <ScrollReveal direction="none">
            <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-white/15">
              <div className="space-y-2">
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-wide uppercase"
                  style={{
                    fontFamily: "'IM Fell Double Pica', Georgia, serif",
                    background: "linear-gradient(180deg, #2D052A 0%, #931289 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  PHOTO GALLERY
                </h2>
              </div>

              <Link
                href="/events"
                className="rounded-full border border-black/20 bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-2.5 text-xs font-mono font-bold text-black transition-all hover:scale-105 flex items-center gap-2 shadow-sm shrink-0"
              >
                <span>Explore Events</span>
                <ArrowRight className="h-3.5 w-3.5 text-black" />
              </Link>
            </div>
          </ScrollReveal>

          {/* ── Full-Bleed 3-Row Exhibition Photo Marquee (Clean photos, zero border strokes) ── */}
          <div
            className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden space-y-4 sm:space-y-6 py-2"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 4%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0.35) 96%, transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 4%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0.35) 96%, transparent 100%)",
            }}
          >
            {/* Extreme Edge Vignette Overlay */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-black/80 via-black/40 to-transparent z-20" />

            {/* ── Row 1: Left to Right Marquee ── */}
            <div className="overflow-hidden w-full flex">
              <div className="animate-gallery-right flex gap-4 sm:gap-6 pr-4 sm:pr-6">
                {row1Triple.map((src, idx) => (
                  <div
                    key={`gal-row1-${idx}`}
                    className="relative shrink-0 w-64 sm:w-80 md:w-96 h-40 sm:h-48 md:h-52 rounded-2xl sm:rounded-3xl overflow-hidden bg-black/30 shadow-2xl transition-all duration-300 hover:scale-[1.04] group cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Hult Prize Campus Exhibition Photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 2: Right to Left Marquee (Alternate direction) ── */}
            <div className="overflow-hidden w-full flex">
              <div className="animate-gallery-left flex gap-4 sm:gap-6 pr-4 sm:pr-6">
                {row2Triple.map((src, idx) => (
                  <div
                    key={`gal-row2-${idx}`}
                    className="relative shrink-0 w-64 sm:w-80 md:w-96 h-40 sm:h-48 md:h-52 rounded-2xl sm:rounded-3xl overflow-hidden bg-black/30 shadow-2xl transition-all duration-300 hover:scale-[1.04] group cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Hult Prize Campus Exhibition Photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 3: Left to Right Marquee (Alternate direction) ── */}
            <div className="overflow-hidden w-full flex">
              <div className="animate-gallery-right flex gap-4 sm:gap-6 pr-4 sm:pr-6">
                {row3Triple.map((src, idx) => (
                  <div
                    key={`gal-row3-${idx}`}
                    className="relative shrink-0 w-64 sm:w-80 md:w-96 h-40 sm:h-48 md:h-52 rounded-2xl sm:rounded-3xl overflow-hidden bg-black/30 shadow-2xl transition-all duration-300 hover:scale-[1.04] group cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Hult Prize Campus Exhibition Photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
