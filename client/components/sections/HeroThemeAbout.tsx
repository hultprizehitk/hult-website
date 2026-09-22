"use client";

import React, { useEffect, useState, useRef } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Trophy, Globe2, Rocket, Sparkles, ArrowRight, Target, Compass, Award } from "lucide-react";
import { useThemeTuner } from "@/context/ThemeTunerContext";

// ─── Shared cutout position tracker ─────────────────────────────────────────
function useCutout() {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const [cardSize, setCardSize] = useState({ width: 300, height: 200 });
  const [titlePos, setTitlePos] = useState({ x: 24, y: 80, fontSize: "30px" });
  useEffect(() => {
    const update = () => {
      if (!cardRef.current || !titleRef.current) return;
      const cr = cardRef.current.getBoundingClientRect();
      const tr = titleRef.current.getBoundingClientRect();
      const st = window.getComputedStyle(titleRef.current);
      setCardSize({ width: Math.round(cr.width), height: Math.round(cr.height) });
      setTitlePos({ x: Math.round(tr.left - cr.left), y: Math.round(tr.top - cr.top), fontSize: st.fontSize });
    };
    update();
    const t1 = setTimeout(update, 50);
    const t2 = setTimeout(update, 200);
    window.addEventListener("resize", update);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize", update); };
  }, []);
  return { cardRef, titleRef, cardSize, titlePos };
}

// ─── Word wrap helper for SVG text ───────────────────────────────────────────
function wrapText(text: string, cardWidth: number, approxCharWidth: number): string[] {
  const availableWidth = Math.max(160, cardWidth - 64);
  const maxChars = Math.max(8, Math.floor(availableWidth / approxCharWidth));
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxChars) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

interface MetricItem { index: string; value: string; label: string; sublabel: string; icon: React.ElementType; }
interface PillarItem { step: string; tag: string; title: string; desc: string; icon: React.ElementType; }

function MetricCard({ m, uid, getCardStyle, bgOpacity }: {
  m: MetricItem; uid: string; getCardStyle: (n?: number) => React.CSSProperties; bgOpacity: number;
}) {
  const { cardRef, titleRef, cardSize, titlePos } = useCutout();
  const Icon = m.icon;
  const alpha = bgOpacity > 0 ? bgOpacity : 0.24;
  const borderAlpha = 0.45;
  return (
    <div
      ref={cardRef}
      style={{ background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}
      className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox={`0 0 ${cardSize.width} ${cardSize.height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ borderRadius: "1rem" }}
      >
        <defs>
          <mask id={uid} maskUnits="userSpaceOnUse" x="0" y="0" width={cardSize.width} height={cardSize.height}>
            <rect x="0" y="0" width={cardSize.width} height={cardSize.height} fill="white" rx="16" ry="16" />
            <text x={titlePos.x} y={titlePos.y} fill="black" fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">{m.value}</text>
          </mask>
        </defs>
        {/* White fill with cutout */}
        <rect x="0" y="0" width={cardSize.width} height={cardSize.height} rx="16" ry="16" fill={`rgba(255,255,255,${alpha})`} mask={`url(#${uid})`} />
        {/* SVG border — perfectly aligned with fill */}
        <rect x="0.5" y="0.5" width={cardSize.width - 1} height={cardSize.height - 1} rx="15.5" ry="15.5" fill="none" stroke={`rgba(255,255,255,${borderAlpha})`} strokeWidth="1" />
        {/* Cutout border rim — pure white */}
        <text x={titlePos.x} y={titlePos.y} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinejoin="round" mask={`url(#${uid})`} fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">{m.value}</text>
      </svg>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm backdrop-blur-sm"><Icon className="h-5 w-5" /></div>
          <span className="font-mono text-xs font-semibold text-white/60 tracking-widest">{m.index}</span>
        </div>
        <div className="space-y-1">
          <div ref={titleRef as React.RefObject<HTMLDivElement>} className="font-jomolhari text-2xl sm:text-4xl font-bold tracking-tight opacity-0 pointer-events-none select-none">{m.value}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{m.label}</div>
          <div className="text-[11px] font-medium text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">{m.sublabel}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Pillar Card with SVG stencil cutout ─────────────────────────────────────
function PillarCard({ pillar, idx, uid, getCardStyle, bgOpacity }: {
  pillar: PillarItem; idx: number; uid: string; getCardStyle: (n?: number) => React.CSSProperties; bgOpacity: number;
}) {
  const { cardRef, titleRef, cardSize, titlePos } = useCutout();
  const Icon = pillar.icon;
  const alpha = bgOpacity > 0 ? bgOpacity : 0.24;
  const borderAlpha = 0.45;
  const parsedSize = parseFloat(titlePos.fontSize) || 28;
  const lines = wrapText(pillar.title, cardSize.width, parsedSize * 0.55);

  return (
    <div
      ref={cardRef}
      style={{ background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}
      className="group relative min-h-[300px] sm:min-h-[380px] md:min-h-[420px] overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox={`0 0 ${cardSize.width} ${cardSize.height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ borderRadius: "1.5rem" }}
      >
        <defs>
          <mask id={uid} maskUnits="userSpaceOnUse" x="0" y="0" width={cardSize.width} height={cardSize.height}>
            <rect x="0" y="0" width={cardSize.width} height={cardSize.height} fill="white" rx="24" ry="24" />
            <text x={titlePos.x} y={titlePos.y} fill="black" fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">
              {lines.map((line, i) => (
                <tspan key={i} x={titlePos.x} dy={i === 0 ? 0 : "1.18em"}>
                  {line}
                </tspan>
              ))}
            </text>
          </mask>
        </defs>
        {/* White fill with cutout */}
        <rect x="0" y="0" width={cardSize.width} height={cardSize.height} rx="24" ry="24" fill={`rgba(255,255,255,${alpha})`} mask={`url(#${uid})`} />
        {/* SVG border — perfectly aligned with fill */}
        <rect x="0.5" y="0.5" width={cardSize.width - 1} height={cardSize.height - 1} rx="23.5" ry="23.5" fill="none" stroke={`rgba(255,255,255,${borderAlpha})`} strokeWidth="1" />
        {/* Cutout border rim — pure white */}
        <text x={titlePos.x} y={titlePos.y} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinejoin="round" mask={`url(#${uid})`} fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">
          {lines.map((line, i) => (
            <tspan key={i} x={titlePos.x} dy={i === 0 ? 0 : "1.18em"}>
              {line}
            </tspan>
          ))}
        </text>
      </svg>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <span className="font-mono text-[11px] font-bold text-white tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">PHASE {pillar.step}</span>
          <span className="rounded-full border border-white/30 bg-white/5 px-3 py-0.5 text-[9px] font-mono uppercase tracking-widest text-white/90 font-semibold backdrop-blur-sm">{pillar.tag}</span>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform backdrop-blur-sm"><Icon className="h-6 w-6" /></div>
      </div>
      <div className="relative z-10 space-y-3 pt-6 pb-2">
        <h3 ref={titleRef as React.RefObject<HTMLHeadingElement>} className="font-jomolhari text-2xl sm:text-3xl font-bold tracking-tight leading-snug opacity-0 pointer-events-none select-none">{pillar.title}</h3>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">{pillar.desc}</p>
        <div className="pt-4 flex items-center gap-2 text-[10.5px] font-mono font-semibold text-white/90">
          <span>Track Stage 0{idx + 1}</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

export default function HeroThemeAbout() {
  const { config, getCardStyle, getHeaderShadow } = useThemeTuner();

  const metrics = [
    {
      index: "01",
      value: "$1,000,000",
      label: "Global Seed Capital",
      sublabel: "Annual Grand Prize award",
      icon: Trophy,
    },
    {
      index: "02",
      value: "120+",
      label: "Partner Nations",
      sublabel: "Worldwide university network",
      icon: Globe2,
    },
    {
      index: "03",
      value: "HITK",
      label: "OnCampus Hub",
      sublabel: "Direct pathway to regionals",
      icon: Rocket,
    },
    {
      index: "04",
      value: "UN SDGs",
      label: "Impact Framework",
      sublabel: "Social venture benchmark",
      icon: Sparkles,
    },
  ];

  const pillars = [
    {
      step: "01",
      tag: "IDEATE",
      title: "Problem Discovery & Validation",
      desc: "Architect market-viable ventures tackling acute global sustainability challenges.",
      icon: Target,
    },
    {
      step: "02",
      tag: "ACCELERATE",
      title: "Founder Mentorship Sprints",
      desc: "Rigorous pitch deck reviews, financial modeling, and guidance from industry operators.",
      icon: Compass,
    },
    {
      step: "03",
      tag: "COMPETE",
      title: "Global Summit Pipeline",
      desc: "Winning campus teams fast-track directly to international Hult Prize Regional Summits.",
      icon: Award,
    },
  ];

  return (
    <section
      id="about"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-transparent text-white"
    >
      {/* ========================================================= */}
      {/* ATMOSPHERIC BACKGROUND ACCENTS                            */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Editorial Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-white/15">
            <div className="max-w-2xl space-y-3">
              <h2
                className="font-jomolhari text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-[1.05] drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]"
                style={{
                  textShadow: getHeaderShadow(),
                }}
              >
                Catalyzing Student Founders For A Brighter World
              </h2>
            </div>

            <div className="max-w-md space-y-2">
              <p
                className="text-xs sm:text-sm font-medium text-white/80 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              >
                The world's premier student social entrepreneurship incubator at Heritage Institute of Technology, turning bold ideas into scalable, investment-ready enterprises.
              </p>
              <div className="font-hult-script text-2xl text-white/90 rotate-[-2deg] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                Ideas for a brighter tomorrow
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 4 Metric Cards — each has its own SVG stencil cutout */}
        <ScrollReveal direction="up" delay={120}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map((m, idx) => (
              <MetricCard key={idx} m={m} uid={`cutout-metric-${idx}`} getCardStyle={getCardStyle} bgOpacity={config.cardBgOpacity} />
            ))}
          </div>
        </ScrollReveal>

        {/* 3 Dynamic Tuner-Controlled Pillar Cards */}
        <ScrollReveal direction="up" delay={200}>
          <div className="space-y-8 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.25em] font-semibold"
                  style={{
                    background: "linear-gradient(90deg, #f43f5e, #fb7185)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  METHODOLOGY
                </span>
                <h3
                  className="font-jomolhari text-2xl sm:text-3xl font-normal text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]"
                  style={{
                    textShadow: getHeaderShadow(),
                  }}
                >
                  The Founder Incubation Pathway
                </h3>
              </div>
              <span className="hidden sm:inline-block font-mono text-xs text-white/60 tracking-wider">
                Three Strategic Acceleration Sprints
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((pillar, idx) => (
                <PillarCard key={idx} pillar={pillar} idx={idx} uid={`cutout-pillar-${idx}`} getCardStyle={getCardStyle} bgOpacity={config.cardBgOpacity} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
