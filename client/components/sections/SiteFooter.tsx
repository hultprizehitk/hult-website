"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="relative w-full bg-[#05000a]/80 backdrop-blur-2xl text-white border-t border-white/10 font-[family-name:var(--font-google-sans)] overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
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
              <div className="relative h-14 w-14 shrink-0">
                <Image
                  src="/assets/bento/community-chat-sphere.png"
                  alt="3D Community Sphere"
                  width={56}
                  height={56}
                  unoptimized
                  className="object-contain drop-shadow-[0_6px_18px_rgba(242,0,137,0.6)] hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            <p className="text-xs text-white/60 font-sans leading-relaxed">
              Hult Prize on Campus at Heritage Institute of Technology. Empowering student founders to create scalable social enterprises.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3 font-sans">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Movement
                </a>
              </li>
              <li>
                <a href="#challenge" className="hover:text-white transition-colors">
                  UN SDG Challenge
                </a>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Events Series & Ascend
                </Link>
              </li>
              <li>
                <a href="#timeline" className="hover:text-white transition-colors">
                  Competition Roadmap
                </a>
              </li>
              <li>
                <Link href="/team" className="hover:text-white transition-colors">
                  Organizing Committee
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div className="space-y-3 font-sans">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Portals
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Team Registration Studio
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/events/checkin" className="hover:text-white transition-colors">
                  Auditorium Check-In Scanner
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#f20089] transition-colors">
                  Admin Management Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="space-y-3 font-sans">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
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
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50 font-sans">
          <p>© {new Date().getFullYear()} Hult Prize HITK. All rights reserved.</p>
          <p className="text-white/40">
            Heritage Institute of Technology 25th Anniversary Edition
          </p>
        </div>
      </div>
    </footer>
  );
}
