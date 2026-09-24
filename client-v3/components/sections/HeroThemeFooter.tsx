"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

export default function HeroThemeFooter() {
  return (
    <footer className="relative w-full bg-[#0c0a14]/60 backdrop-blur-3xl border-t border-white/15 text-white font-[family-name:var(--font-google-sans)] overflow-hidden select-none shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      {/* Ambient glass glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[250px] bg-gradient-to-t from-rose-950/20 via-indigo-950/15 to-transparent blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-14 pb-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Col 1: Brand & Social Links */}
          <div className="md:col-span-4 lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center group">
                <div className="relative h-9 sm:h-10 w-[55px] sm:w-[60px] transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/ef-hult-prize-logo.png"
                    alt="EF Hult Prize Logo"
                    fill
                    sizes="60px"
                    className="object-contain"
                  />
                </div>
              </Link>

              <div className="h-6 w-px bg-white/20 mx-0.5" />

              {/* Heritage Institute of Technology 25th Logo */}
              <Link href="/" className="flex items-center group">
                <div className="relative aspect-[1024/895] h-9 sm:h-10 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/hitk-25-logo.png"
                    alt="Heritage Institute of Technology 25 Years Logo"
                    fill
                    sizes="60px"
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed max-w-xs font-normal">
              Empowering student founders at Heritage Institute of Technology to build world-changing, market-driven social enterprises.
            </p>

            {/* Clickable Social Icons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://www.linkedin.com/in/hult-prize-hitk-5a4b40294/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-2.5 rounded-full bg-white/5 border border-white/15 text-neutral-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition-all duration-300 shadow-sm hover:scale-110"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/hultprize.hitk/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2.5 rounded-full bg-white/5 border border-white/15 text-neutral-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition-all duration-300 shadow-sm hover:scale-110"
              >
                <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@HultPrizeFoundation"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="p-2.5 rounded-full bg-white/5 border border-white/15 text-neutral-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition-all duration-300 shadow-sm hover:scale-110"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="mailto:hultprize.heritage@gmail.com"
                aria-label="Email"
                className="p-2.5 rounded-full bg-white/5 border border-white/15 text-neutral-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition-all duration-300 shadow-sm hover:scale-110"
              >
                <Mail className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 lg:col-span-3 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-400/90 font-mono">
              Movement
            </h4>
            <ul className="space-y-2.5 text-xs font-normal text-neutral-300">
              <li>
                <Link href="#about" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>About Movement</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#events" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>Venture Events</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>Team Registration</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>All Events Directory</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Campus Venue & Google Map */}
          <div className="md:col-span-5 lg:col-span-5 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-400/90 font-mono">
              OnCampus Chapter
            </h4>

            <div className="text-xs text-neutral-300 space-y-1 font-mono">
              <p className="font-semibold text-white/90">Heritage Institute of Technology</p>
              <p>Chowbaga Road, Anandapur, Kolkata 700107</p>
              <p className="text-rose-400/90 pt-0.5">hultprize.heritage@gmail.com</p>
            </div>

            {/* Live Interactive Google Map Embed in Dark Glass Frame */}
            <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden border border-white/15 shadow-xl bg-black/40 backdrop-blur-md mt-2">
              <iframe
                title="Heritage Institute of Technology Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3685.5802283838363!2d88.41629837589998!3d22.51984293425026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0273c52e46e7f3%3A0xb30beae172d1f7b5!2sHeritage%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1711200000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full invert-[90%] hue-rotate-180 contrast-[110%] opacity-85 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <p className="font-mono tabular-nums">
            © {new Date().getFullYear()} Hult Prize at HITK. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


