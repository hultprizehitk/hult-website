"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function HeroThemeFooter() {
  return (
    <footer className="relative w-full bg-[#f4e7ec] border-t border-[#6F302B]/15 text-[#211B1C] font-[family-name:var(--font-google-sans)] overflow-hidden select-none">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-12 space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center group">
                <div className="relative h-10 w-[60px] transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/ef-hult-prize-logo.png"
                    alt="EF Hult Prize Logo"
                    fill
                    sizes="60px"
                    className="object-contain"
                  />
                </div>
              </Link>
              <div className="h-6 w-px bg-neutral-400/40 mx-1" />
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-neutral-900 leading-none">25</span>
                <div className="flex flex-col text-[8.5px] font-semibold text-neutral-800 uppercase tracking-[0.14em] leading-tight max-w-[125px]">
                  <span>Heritage</span>
                  <span>Institute of Technology</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#5c4a4e] font-sans leading-relaxed max-w-xs font-medium">
              Empowering student founders at Heritage Institute of Technology to build world-changing, market-driven social enterprises.
            </p>

            <div className="font-hult-script text-xl text-[#65535e] rotate-[-2deg]">
              From Heritage to a brighter world
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3 font-sans">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#6F302B] font-mono">
              Movement
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#4a3b3e]">
              <li>
                <Link href="#about" className="hover:text-[#e60067] transition-colors flex items-center gap-1">
                  <span>About Movement</span>
                </Link>
              </li>
              <li>
                <Link href="#events" className="hover:text-[#e60067] transition-colors flex items-center gap-1">
                  <span>Venture Events</span>
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#e60067] transition-colors flex items-center gap-1">
                  <span>Team Registration</span>
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#e60067] transition-colors flex items-center gap-1">
                  <span>All Events Directory</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Campus Venue */}
          <div className="space-y-3 font-sans">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#6F302B] font-mono">
              OnCampus Chapter
            </h4>
            <div className="text-xs text-[#4a3b3e] space-y-1.5 font-mono">
              <p className="font-bold text-[#211B1C]">Heritage Institute of Technology</p>
              <p>Chowbaga Road, Anandapur, Kolkata 700107</p>
              <p className="text-[#e60067] font-semibold pt-1">hultprizehitk@heritageit.edu.in</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#6F302B]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6F302B]/70 font-sans">
          <p className="font-mono tabular-nums">
            © {new Date().getFullYear()} Hult Prize at HITK. All rights reserved.
          </p>
          <p className="font-mono text-[10px] tracking-wider uppercase">
            Heritage Institute of Technology 25th Anniversary
          </p>
        </div>
      </div>
    </footer>
  );
}
