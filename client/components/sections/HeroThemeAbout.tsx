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

interface MetricItem { index: string; value: string; label: string; sublabel: string; icon: React.ElementType; }
interface PillarItem { step: string; tag: string; title: string; desc: string; icon: React.ElementType; }

// ─── Metric Card with SVG stencil cutout ─────────────────────────────────────
function MetricCard({ m, uid, getCardStyle, bgOpacity }: {
  m: MetricItem; uid: string; getCardStyle: (n?: number) => React.CSSProperties; bgOpacity: number;
}) {
  const { cardRef, titleRef, cardSize, titlePos } = useCutout();
  const Icon = m.icon;
  const alpha = bgOpacity > 0 ? bgOpacity : 0.24;
  return (
    <div ref={cardRef} style={{ ...getCardStyle(0), backdropFilter: "none", WebkitBackdropFilter: "none" }} className="group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 ${cardSize.width} ${cardSize.height}`} width="100%" height="100%" style={{ borderRadius: "1rem" }}>
        <defs>
          <mask id={uid} maskUnits="userSpaceOnUse" x="0" y="0" width={cardSize.width} height={cardSize.height}>
            <rect x="0" y="0" width={cardSize.width} height={cardSize.height} fill="white" rx="16" ry="16" />
            <text x={titlePos.x} y={titlePos.y} fill="black" fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">{m.value}</text>
          </mask>
        </defs>
        <rect x="0" y="0" width={cardSize.width} height={cardSize.height} rx="16" ry="16" fill={`rgba(255,255,255,${alpha})`} mask={`url(#${uid})`} />
        <text x={titlePos.x} y={titlePos.y} fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" strokeLinejoin="round" mask={`url(#${uid})`} fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">{m.value}</text>
      </svg>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm"><Icon className="h-5 w-5" /></div>
          <span className="font-mono text-xs font-semibold text-neutral-600 tracking-widest">{m.index}</span>
        </div>
        <div className="space-y-1">
          <div ref={titleRef as React.RefObject<HTMLDivElement>} className="font-jomolhari text-2xl sm:text-4xl font-bold tracking-tight opacity-0 pointer-events-none select-none">{m.value}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-900" style={{ textShadow: "0 0 1px rgba(255,255,255,0.9)" }}>{m.label}</div>
          <div className="text-[11px] font-medium text-neutral-800" style={{ textShadow: "0 0 1px rgba(255,255,255,0.9)" }}>{m.sublabel}</div>
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
  return (
    <div ref={cardRef} style={{ ...getCardStyle(0), backdropFilter: "none", WebkitBackdropFilter: "none" }} className="group relative min-h-[300px] sm:min-h-[380px] md:min-h-[420px] overflow-hidden rounded-3xl border p-6 sm:p-8 md:p-10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 ${cardSize.width} ${cardSize.height}`} width="100%" height="100%" style={{ borderRadius: "1.5rem" }}>
        <defs>
          <mask id={uid} maskUnits="userSpaceOnUse" x="0" y="0" width={cardSize.width} height={cardSize.height}>
            <rect x="0" y="0" width={cardSize.width} height={cardSize.height} fill="white" rx="24" ry="24" />
            <text x={titlePos.x} y={titlePos.y} fill="black" fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">{pillar.title}</text>
          </mask>
        </defs>
        <rect x="0" y="0" width={cardSize.width} height={cardSize.height} rx="24" ry="24" fill={`rgba(255,255,255,${alpha})`} mask={`url(#${uid})`} />
        <text x={titlePos.x} y={titlePos.y} fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" strokeLinejoin="round" mask={`url(#${uid})`} fontFamily="var(--font-jomolhari)" fontWeight="700" fontSize={titlePos.fontSize} dominantBaseline="hanging">{pillar.title}</text>
      </svg>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60">
          <span className="font-mono text-[11px] font-bold text-neutral-900 tracking-widest">PHASE {pillar.step}</span>
          <span className="rounded-full border border-neutral-300 px-3 py-0.5 text-[9px] font-mono uppercase tracking-widest text-neutral-800 font-semibold">{pillar.tag}</span>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"><Icon className="h-6 w-6" /></div>
      </div>
      <div className="relative z-10 space-y-3 pt-6 pb-2">
        <h3 ref={titleRef as React.RefObject<HTMLHeadingElement>} className="font-jomolhari text-2xl sm:text-3xl font-bold tracking-tight leading-snug opacity-0 pointer-events-none select-none">{pillar.title}</h3>
        <p className="text-xs sm:text-sm text-neutral-900 leading-relaxed font-sans font-semibold" style={{ textShadow: "0 0 1px rgba(255,255,255,0.9)" }}>{pillar.desc}</p>
        <div className="pt-4 flex items-center gap-2 text-[10.5px] font-mono font-semibold text-neutral-900">
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
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-transparent text-neutral-900"
    >
      {/* ========================================================= */}
      {/* ATMOSPHERIC BACKGROUND ACCENTS                            */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Editorial Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-neutral-200">
            <div className="max-w-2xl space-y-3">
              <h2
                className="font-jomolhari text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-neutral-900 leading-[1.05]"
                style={{
                  textShadow: getHeaderShadow(),
                }}
              >
                Catalyzing Student Founders For A Brighter World
              </h2>
            </div>

            <div className="max-w-md space-y-2">
              <p
                className="text-xs sm:text-sm font-semibold text-neutral-900 leading-relaxed"
                style={{
                  textShadow: "0 0 1px rgba(255,255,255,0.9)",
                }}
              >
                The world's premier student social entrepreneurship incubator at Heritage Institute of Technology, turning bold ideas into scalable, investment-ready enterprises.
              </p>
              <div className="font-hult-script text-2xl text-neutral-700 rotate-[-2deg]">
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
                    background: "linear-gradient(90deg, #be123c, #9f1239)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  METHODOLOGY
                </span>
                <h3
                  className="font-jomolhari text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight"
                  style={{
                    textShadow: getHeaderShadow(),
                  }}
                >
                  The Founder Incubation Pathway
                </h3>
              </div>
              <span className="hidden sm:inline-block font-mono text-xs text-neutral-600 tracking-wider">
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
