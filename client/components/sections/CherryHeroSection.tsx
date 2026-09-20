"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YoutubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

const NAV = [
  { label: "About", href: "#about" },
  { label: "Events", href: "/events" },
  { label: "Challenge", href: "#challenge" },
  { label: "Timeline", href: "#timeline" },
  { label: "Team", href: "/team" },
];

// Small floating petal cutouts sampled from the transparent petal sprite sheets.
// Each cell is shown zoomed + blurred so it reads as a single soft petal / bokeh.
const PETALS = [
  { src: "/assets/homepage/05-cherry-petals-sprite-v1.png", pos: "0% 0%", left: "8%", size: 34, dur: "11s", delay: "0s", blur: 0 },
  { src: "/assets/homepage/09-cherry-petals-sprite-v2.png", pos: "80% 10%", left: "22%", size: 22, dur: "13s", delay: "-4s", blur: 0 },
  { src: "/assets/homepage/05-cherry-petals-sprite-v1.png", pos: "50% 40%", left: "38%", size: 28, dur: "12s", delay: "-7s", blur: 1 },
  { src: "/assets/homepage/09-cherry-petals-sprite-v2.png", pos: "20% 70%", left: "52%", size: 18, dur: "10s", delay: "-2s", blur: 0 },
  { src: "/assets/homepage/05-cherry-petals-sprite-v1.png", pos: "90% 80%", left: "64%", size: 30, dur: "14s", delay: "-9s", blur: 1 },
  { src: "/assets/homepage/09-cherry-petals-sprite-v2.png", pos: "40% 30%", left: "74%", size: 22, dur: "11s", delay: "-5s", blur: 0 },
  { src: "/assets/homepage/05-cherry-petals-sprite-v1.png", pos: "10% 90%", left: "86%", size: 36, dur: "15s", delay: "-3s", blur: 2 },
  { src: "/assets/homepage/09-cherry-petals-sprite-v2.png", pos: "60% 60%", left: "93%", size: 20, dur: "12s", delay: "-8s", blur: 1 },
  { src: "/assets/homepage/05-cherry-petals-sprite-v1.png", pos: "70% 20%", left: "46%", size: 16, dur: "9s", delay: "-1s", blur: 0 },
  { src: "/assets/homepage/09-cherry-petals-sprite-v2.png", pos: "30% 50%", left: "14%", size: 26, dur: "13s", delay: "-6s", blur: 1 },
  { src: "/assets/homepage/09-cherry-petals-sprite-v2.png", pos: "10% 20%", left: "30%", size: 24, dur: "12s", delay: "-10s", blur: 0 },
  { src: "/assets/homepage/05-cherry-petals-sprite-v1.png", pos: "60% 70%", left: "58%", size: 20, dur: "10s", delay: "-11s", blur: 0 },
  { src: "/assets/homepage/09-cherry-petals-sprite-v2.png", pos: "85% 45%", left: "80%", size: 28, dur: "14s", delay: "-12s", blur: 1 },
  { src: "/assets/homepage/05-cherry-petals-sprite-v1.png", pos: "25% 85%", left: "5%", size: 22, dur: "12s", delay: "-13s", blur: 1 },
];

function PetalField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="cherry-petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.dur,
            animationDelay: p.delay,
            filter: p.blur ? `blur(${p.blur}px)` : undefined,
          }}
        >
          <span
            className="block h-full w-full"
            style={{
              backgroundImage: `url(${p.src})`,
              backgroundSize: "400% 400%",
              backgroundPosition: p.pos,
              backgroundRepeat: "no-repeat",
            }}
          />
        </span>
      ))}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 pt-4 sm:px-8 md:px-12 md:pt-5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 md:gap-3">
          <Link href="/" className="relative block h-8 w-14 md:h-9 md:w-16" aria-label="Hult Prize home">
            <Image src="/Hult-Prize.png" alt="Hult Prize" fill sizes="64px" priority className="object-contain brightness-0" />
          </Link>
          <span className="h-8 w-px bg-[#2b1a1a]/25 md:h-9" />
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-display)] text-[26px] font-black leading-none text-[#2b1a1a] md:text-[30px]">
              25
            </span>
            <span className="text-[8px] font-semibold uppercase leading-[1.35] tracking-[0.18em] text-[#2b1a1a] md:text-[9px]">
              Heritage
              <br />
              Institute of Technology
            </span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:gap-9 xl:gap-11 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-[13px] font-medium tracking-wide text-[#3a2a2a] transition-colors hover:text-[#c20063]"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA cluster */}
        <div className="hidden items-center gap-4 lg:flex">
          <p className="hidden text-right font-[family-name:var(--font-script)] text-[14px] italic leading-tight text-[#2b1a1a]/55 xl:block">
            Ideas for a
            <br />
            Brighter Tomorrow
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-[#e6007a] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(230,0,122,0.35)] transition-all hover:bg-[#c20063] hover:shadow-[0_8px_28px_rgba(230,0,122,0.5)]"
          >
            Register Now
            <img src="/assets/homepage/icons/arrow-right.svg" alt="" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="grid h-11 w-11 place-items-center rounded-full bg-[#f3c4d3]/60 text-[#2b1a1a] backdrop-blur-sm lg:hidden"
        >
          <img src="/assets/homepage/icons/menu.svg" alt="" className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute inset-x-4 top-[68px] z-40 rounded-2xl bg-white/90 p-3 shadow-xl backdrop-blur-xl lg:hidden">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-[15px] font-medium text-[#2b1a1a] hover:bg-[#fbe4ec]"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#e6007a] px-4 py-3 text-[15px] font-semibold text-white"
          >
            Register Now
            <img src="/assets/homepage/icons/arrow-right.svg" alt="" className="h-4 w-4 brightness-0 invert" />
          </Link>
        </div>
      )}
    </>
  );
}

export default function CherryHeroSection() {
  return (
    <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#fdeef1] text-[#2b1a1a]">
      {/* ---- Backgrounds: proper asset per breakpoint ---- */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/homepage/bg_desktop.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center lg:block"
        />
        <Image
          src="/assets/homepage/bg_mobile.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center lg:hidden"
        />
        {/* soft pink wash to blend photo into reference tone */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fff5f6]/55 via-transparent to-[#fdeef1]/30" />
      </div>

      {/* ---- Cherry branches: named assets in proper places ---- */}
      {/* Desktop top-left */}
      <div className="cherry-sway pointer-events-none absolute -left-12 -top-8 z-20 hidden w-[46vw] max-w-[720px] lg:block">
        <Image
          src="/assets/homepage/01-cherry-branch-left-v1.png"
          alt=""
          width={1774}
          height={887}
          priority
          className="h-auto w-full"
        />
      </div>
      {/* Desktop top-right */}
      <div className="cherry-sway-alt pointer-events-none absolute -right-14 -top-10 z-20 hidden w-[42vw] max-w-[660px] lg:block">
        <Image
          src="/assets/homepage/03-cherry-branch-right.png"
          alt=""
          width={1672}
          height={940}
          priority
          className="h-auto w-full"
        />
      </div>
      {/* Mobile top-left (dedicated asset) */}
      <div className="pointer-events-none absolute -left-6 -top-4 z-20 w-[70vw] max-w-[440px] lg:hidden">
        <Image
          src="/assets/homepage/branch-mobile-left.png"
          alt=""
          width={941}
          height={1672}
          priority
          className="h-auto w-full"
        />
      </div>

      {/* Soft pink halo behind right copy (desktop, per reference) */}
      <div aria-hidden className="absolute right-[-6vw] top-[24%] z-[5] hidden h-[34vw] w-[34vw] rounded-full bg-[#f5b9c8]/30 blur-2xl lg:block" />

      <Header />
      <PetalField />

      {/* Foreground bokeh blooms (soft blurred petals, per reference corners) */}
      <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-16 z-[26] hidden h-56 w-80 opacity-70 blur-[7px] lg:block">
        <img src="/assets/homepage/petal-sheet-v1.png" alt="" className="h-full w-full object-cover" style={{ objectPosition: "15% 60%" }} />
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-12 -right-14 z-[26] hidden h-60 w-[26rem] opacity-70 blur-[8px] lg:block">
        <img src="/assets/homepage/petal-sheet-v2.png" alt="" className="h-full w-full object-cover" style={{ objectPosition: "80% 55%" }} />
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 z-[26] h-44 w-64 opacity-60 blur-[6px] lg:hidden">
        <img src="/assets/homepage/petal-sheet-v2.png" alt="" className="h-full w-full object-cover" style={{ objectPosition: "80% 55%" }} />
      </div>

      {/* ---- Left rail (desktop) ---- */}
      <aside className="absolute left-8 top-[33%] z-30 hidden w-32 flex-col items-start gap-3 [text-shadow:0_1px_10px_rgba(255,240,243,0.95),0_0_22px_rgba(255,240,243,0.9)] lg:flex xl:left-12">
        <span className="block h-14 w-px bg-[#2b1a1a]/35" />
        <span className="text-[13px] font-semibold tracking-[0.2em]">01</span>
        <span className="flex flex-col items-center gap-1.5 pl-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2b1a1a]" />
          <span className="h-1 w-1 rounded-full bg-[#2b1a1a]/40" />
          <span className="h-1 w-1 rounded-full bg-[#2b1a1a]/40" />
          <span className="h-1 w-1 rounded-full bg-[#2b1a1a]/40" />
        </span>
        <span className="block h-14 w-px bg-[#2b1a1a]/35" />
        <p className="border-l border-[#2b1a1a]/35 pl-3 text-[9px] font-medium uppercase leading-[1.9] tracking-[0.28em] text-[#2b1a1a]/80">
          Young
          <br />
          Minds
          <br />
          Bigger
          <br />
          Possibilities
        </p>
      </aside>

      {/* ---- Right rail (desktop) ---- */}
      <aside className="absolute right-8 top-[30%] z-30 hidden w-44 flex-col items-end gap-5 text-right lg:flex xl:right-12">
        <p className="font-[family-name:var(--font-script)] text-[30px] leading-[1.25] text-[#2b1a1a]/75">
          People
          <br />
          Ideas
          <br />
          Impact
        </p>
        <p className="border-r border-[#2b1a1a]/35 pr-3 text-[9px] font-medium uppercase leading-[1.9] tracking-[0.28em] text-[#2b1a1a]/80">
          From
          <br />
          Heritage
          <br />
          To a brighter
          <br />
          world
        </p>
      </aside>

      {/* ---- Center composition ---- */}
      <div className="relative z-30 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 pb-28 pt-28 text-center lg:pb-24 lg:pt-32">
        {/* Mobile side micro-copy */}
        <div className="mb-5 flex w-full max-w-md items-start justify-between lg:hidden">
          <div className="flex flex-col items-start gap-2">
            <span className="block h-10 w-px bg-[#2b1a1a]/35" />
            <span className="text-[13px] font-semibold tracking-[0.15em]">01</span>
            <span className="flex flex-col items-center gap-1.5 pl-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2b1a1a]" />
              <span className="h-1 w-1 rounded-full bg-[#2b1a1a]/40" />
              <span className="h-1 w-1 rounded-full bg-[#2b1a1a]/40" />
            </span>
            <p className="border-l border-[#2b1a1a]/35 pl-2 text-left text-[8px] font-medium uppercase leading-[1.9] tracking-[0.24em] text-[#2b1a1a]/80">
              Young
              <br />
              Minds
              <br />
              Bigger
              <br />
              Possibilities
            </p>
          </div>
          <p className="border-r border-[#2b1a1a]/35 pr-2 text-right text-[8px] font-medium uppercase leading-[2] tracking-[0.3em] text-[#2b1a1a]/80">
            People
            <br />
            Ideas
            <br />
            Impact
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <span className="hidden h-px w-14 bg-[#2b1a1a]/50 sm:block lg:w-24" />
          <p className="text-[8px] font-semibold uppercase leading-relaxed tracking-[0.32em] text-[#2b1a1a] sm:text-[10px] lg:text-[11px]">
            A global movement{" "}
            <br className="sm:hidden" />
            for a better tomorrow
          </p>
          <span className="hidden h-px w-14 bg-[#2b1a1a]/50 sm:block lg:w-24" />
        </div>
        <span className="mt-2 block h-px w-24 bg-[#2b1a1a]/40 sm:hidden" />

        <h1 className="mt-3 font-[family-name:var(--font-display)] font-black leading-[0.88] tracking-tight">
          <span className="block text-[21vw] text-[#211114] sm:text-[15vw] lg:text-[10.5rem] xl:text-[10.5rem]">
            HULT
          </span>
          <span className="block bg-gradient-to-r from-[#c98a92] via-[#d81b60] to-[#f194b4] bg-clip-text text-[21vw] text-transparent sm:text-[15vw] lg:text-[10.5rem] xl:text-[10.5rem]">
            PRIZE
            <sup className="ml-1.5 align-super font-sans text-[10px] font-normal tracking-normal text-[#2b1a1a]/60 lg:text-xs">
              TM
            </sup>
          </span>
        </h1>

        <p className="mt-4 text-[9px] font-semibold uppercase leading-[2] tracking-[0.34em] text-[#2b1a1a] sm:text-[11px] lg:text-[12px]">
          Turning bold ideas
          <br />
          into a brighter tomorrow
        </p>

        <div className="mt-6 flex w-full max-w-md flex-col items-center gap-5 lg:mt-7 lg:w-auto lg:max-w-none lg:flex-row lg:gap-6">
          <Link
            href="/register"
            className="group inline-flex w-[78%] items-center justify-center gap-2.5 rounded-full bg-[#e6007a] px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(230,0,122,0.4)] transition-all hover:bg-[#c20063] sm:w-auto lg:px-9 lg:py-3 lg:text-sm"
          >
            Be the Change
            <img src="/assets/homepage/icons/arrow-right.svg" alt="" className="h-[18px] w-[18px] brightness-0 invert transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#about" className="group inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-[#2b1a1a]/40 text-[#e6007a] transition-colors group-hover:border-[#e6007a] lg:h-11 lg:w-11">
              <img src="/assets/homepage/icons/play.svg" alt="" className="h-4 w-4 translate-x-[1px]" />
            </span>
            <span className="text-[15px] font-medium text-[#2b1a1a] lg:text-[13px]">
              <span className="lg:hidden">Watch Film</span>
              <span className="hidden lg:inline">Watch Video</span>
            </span>
          </Link>
        </div>

        {/* Mobile scroll cue */}
        <div className="mt-10 flex flex-col items-center gap-2 lg:hidden">
          <img src="/assets/homepage/icons/scroll-mouse.svg" alt="" className="h-10 w-7 text-[#2b1a1a]/70" />
          <p className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.3em] text-[#2b1a1a]">
            Scroll
            <br />
            to explore
          </p>
        </div>
      </div>

      {/* ---- Bottom bar (desktop) ---- */}
      <div className="absolute inset-x-0 bottom-0 z-30 hidden items-end justify-between px-8 pb-6 lg:flex lg:px-12">
        <div className="flex items-center gap-3">
          <img src="/assets/homepage/icons/scroll-mouse.svg" alt="" className="h-11 w-7 text-[#2b1a1a]/70" />
          <p className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.28em] text-[#2b1a1a]/80">
            Scroll
            <br />
            to explore
          </p>
        </div>
        <div className="mb-2 flex items-center gap-4">
          <span className="h-px w-16 bg-[#2b1a1a]/40 lg:w-24" />
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#2b1a1a]/80 lg:text-[10px]">
            Hult Prize at Heritage Institute of Technology
          </p>
          <span className="h-px w-16 bg-[#2b1a1a]/40 lg:w-24" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 text-[#2b1a1a]/80">
            <Link href="#" aria-label="Instagram" className="grid h-7 w-7 place-items-center rounded-full border border-[#2b1a1a]/25 bg-white/30 backdrop-blur-sm transition hover:bg-white/50">
              <InstagramIcon className="h-3.5 w-3.5" />
            </Link>
            <Link href="#" aria-label="LinkedIn" className="grid h-7 w-7 place-items-center rounded-full border border-[#2b1a1a]/25 bg-white/30 backdrop-blur-sm transition hover:bg-white/50">
              <LinkedinIcon className="h-3.5 w-3.5" />
            </Link>
            <Link href="#" aria-label="YouTube" className="grid h-7 w-7 place-items-center rounded-full border border-[#2b1a1a]/25 bg-white/30 backdrop-blur-sm transition hover:bg-white/50">
              <YoutubeIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-right text-[8px] font-semibold uppercase leading-[1.8] tracking-[0.22em] text-[#2b1a1a]/80 lg:text-[9px]">
            A more inclusive
            <br />
            sustainable and thriving world
          </p>
        </div>
      </div>

      {/* Mobile handwritten note */}
      <p className="pointer-events-none absolute bottom-[19%] right-4 z-30 rotate-[-8deg] text-right font-[family-name:var(--font-script)] text-[26px] leading-[1.2] text-[#2b1a1a]/45 lg:hidden">
        Ideas
        <br />
        for a<br />
        Brighter
        <br />
        Tomorrow
      </p>
    </section>
  );
}
