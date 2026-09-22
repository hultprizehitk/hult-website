"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Award,
  FileText,
  ShieldCheck,
  Globe,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface AdminNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Events", href: "/admin/events", icon: Calendar },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Teams", href: "/admin/teams", icon: Award },
    { label: "Content CMS", href: "/admin/content", icon: FileText },
    { label: "Admins & Logs", href: "/admin/admins", icon: ShieldCheck },
  ];

  const roleLabel = (user.role || "admin").replace("_", " ").toUpperCase();

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0d12] border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="relative h-6 w-9">
            <Image
              src="/ef-hult-prize-logo.png"
              alt="Hult Prize Logo"
              fill
              sizes="36px"
              className="object-contain"
            />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">CMS Control</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-white/70 hover:text-white rounded-lg bg-white/5 border border-white/10"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 w-64 bg-[#0a0a0f] border-r border-white/10 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-12 shrink-0">
              <Image
                src="/ef-hult-prize-logo.png"
                alt="Hult Prize Logo"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div className="h-6 w-px bg-white/15" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                Admin Command
              </span>
              <span className="text-[9px] font-mono text-white/50">Hult Prize HITK</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            Control Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin" || pathname === "/admin/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-rose-400" : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-rose-400" />}
              </Link>
            );
          })}

          <div className="pt-4 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            External Links
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Globe className="h-4 w-4 text-neutral-400" />
            <span>Public Site</span>
          </Link>
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-3 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.image ? (
                <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0 border border-white/20">
                  <Image
                    src={user.image}
                    alt={user.name || "Admin"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center font-bold text-xs text-rose-300 shrink-0">
                  {(user.name || "A")[0]}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {user.name || "Administrator"}
                </div>
                <div className="text-[10px] font-mono text-rose-400 font-semibold tracking-wider">
                  {roleLabel}
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/admin" })}
              title="Sign Out"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
