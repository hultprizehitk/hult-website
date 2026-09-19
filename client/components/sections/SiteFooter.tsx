"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="relative w-full bg-black/40 backdrop-blur-md text-white font-[family-name:var(--font-google-sans)] overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-14 pb-10 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative aspect-[1080/659] h-8">
                <Image
                  src="/Hult-Prize.png"
                  alt="Hult Prize Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="relative aspect-[1024/895] h-8">
                <Image
                  src="/hitk-25-logo.png"
                  alt="Heritage 25 Years Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <p className="text-xs text-white/60 font-sans leading-relaxed max-w-xs">
              Hult Prize on Campus at Heritage Institute of Technology. Empowering student founders to create scalable social enterprises.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3 font-sans">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/90 font-mono">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-white transition-colors">
                  Organizing Team
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Team Registration
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Student Profile
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#f20089] transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-3 font-sans">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/90 font-mono">
              Campus Venue
            </h4>
            <div className="text-xs text-white/70 space-y-1.5 font-mono">
              <p className="font-semibold text-white">Heritage Institute of Technology</p>
              <p>Chowbaga Road, Anandapur, Kolkata, WB 700107</p>
              <p className="text-pink-300 pt-1">hultprizehitk@heritageit.edu.in</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50 font-sans">
          <p className="font-mono tabular-nums">© {new Date().getFullYear()} Hult Prize HITK. All rights reserved.</p>
          <p className="text-white/40 font-mono text-[10px] tracking-wider uppercase">
            Heritage Institute of Technology 25th Anniversary Edition
          </p>
        </div>
      </div>
    </footer>
  );
}
