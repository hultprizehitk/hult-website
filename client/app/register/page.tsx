"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AnimatedGradient from "@/components/ui/animated-gradient";

export default function RegisterPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    year: "1st Year",
    teamName: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans text-white selection:bg-[#f20089] selection:text-white flex flex-col justify-between">
      {/* 
        ========================================================================
        WebGL Aurora Animated Background (Fluid Pink & Deep Purple Swirls)
        ========================================================================
      */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 18,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        {/* Soft atmospheric vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/75" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85" />
      </div>

      {/* 
        ========================================================================
        HEADER NAVIGATION (100% Identical to Homepage: Logos Left, Nav Right, Transparent)
        ========================================================================
      */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-300 font-[family-name:var(--font-syne)] bg-transparent border-none">
        {/* Brand Logos */}
        <div className="flex items-center gap-2 sm:gap-3 transition-opacity duration-700">
          <Link href="/" className="relative aspect-[1080/659] h-7 sm:h-8 md:h-9">
            <Image
              src="/Hult-Prize.png"
              alt="Hult Prize Logo"
              fill
              sizes="(max-width: 640px) 46px, 66px"
              priority
              className="object-contain drop-shadow-md"
            />
          </Link>
          <div className="relative aspect-[1024/895] h-7 sm:h-8 md:h-9">
            <Image
              src="/hitk-25-logo.png"
              alt="Heritage Institute of Technology 25 Years Logo"
              fill
              sizes="(max-width: 640px) 40px, 56px"
              priority
              className="object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-[family-name:var(--font-syne)]">
          <Link
            href="/#about"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            About
          </Link>
          <Link
            href="/events"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            Events
          </Link>
          <Link
            href="/#challenge"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            Challenge
          </Link>
          <Link
            href="/#timeline"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            Timeline
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-[#f20089]/40 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
          >
            Register Now
          </Link>
        </nav>

        {/* Mobile Right Bar: Compact Register + Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/"
            className="rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md active:scale-95"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[52px] z-45 md:hidden bg-black/95 backdrop-blur-3xl border-b border-white/15 px-6 py-6 shadow-2xl flex flex-col gap-4 font-[family-name:var(--font-syne)] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            About
          </Link>
          <Link
            href="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Events
          </Link>
          <Link
            href="/#challenge"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Challenge
          </Link>
          <Link
            href="/#timeline"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Timeline
          </Link>
        </div>
      )}

      {/* Main Authentication Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-xl">
          {/* Glassmorphic Auth Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/25 bg-white/[0.04] p-6 sm:p-10 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl transition-all duration-500">
            {/* Top Iridescent Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Ambient Aurora Glow Spheres behind Glass */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#f20089]/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#1a0b2e]/60 blur-3xl" />

            {/* Header / Brand Title */}
            <div className="relative z-10 text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow font-[family-name:var(--font-syne)]">
                {mode === "signup" ? "OnCampus Team Registration" : "Welcome Back"}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-white/70">
                {mode === "signup"
                  ? "Register your student venture for the 2027 Hult Prize competition"
                  : "Sign in to access your team dashboard and submissions"}
              </p>
            </div>

            {/* Tab Selector with Glass Frosting */}
            <div className="relative z-10 grid grid-cols-2 gap-1 rounded-2xl bg-black/35 p-1.5 backdrop-blur-2xl mb-8 border border-white/15 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] font-[family-name:var(--font-syne)]">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setSubmitted(false);
                }}
                className={`flex items-center justify-center rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-[#f20089] to-[#d8007a] text-white shadow-[0_4px_20px_rgba(242,0,137,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-white/20 scale-[1.01]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                Team Registration
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setSubmitted(false);
                }}
                className={`flex items-center justify-center rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                  mode === "login"
                    ? "bg-gradient-to-r from-[#f20089] to-[#d8007a] text-white shadow-[0_4px_20px_rgba(242,0,137,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-white/20 scale-[1.01]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                Sign In
              </button>
            </div>

            {submitted ? (
              /* Success State */
              <div className="relative z-10 py-10 text-center animate-fadeIn font-sans">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f20089]/25 border border-[#f20089] text-2xl text-[#f20089] shadow-[0_0_30px_rgba(242,0,137,0.5)] backdrop-blur-xl">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white font-[family-name:var(--font-syne)]">
                  {mode === "signup"
                    ? "Team Registration Submitted!"
                    : "Welcome Back!"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/75 max-w-sm mx-auto">
                  {mode === "signup"
                    ? "Your team has been registered for Hult Prize HITK 2027. We have dispatched confirmation and orientation details to your email."
                    : "Successfully authenticated. Redirecting to your participant portal..."}
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <Link
                    href="/"
                    className="rounded-full bg-gradient-to-r from-[#f20089] to-[#d8007a] px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition-transform hover:scale-105 shadow-[0_8px_25px_rgba(242,0,137,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-white/25"
                  >
                    Back to Home
                  </Link>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="rounded-full border border-white/20 bg-white/[0.08] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/15 cursor-pointer"
                  >
                    Register Another Team
                  </button>
                </div>
              </div>
            ) : (
              /* Glass Form */
              <form onSubmit={handleSubmit} className="relative z-10 space-y-4 font-sans">
                {mode === "signup" ? (
                  <>
                    {/* Full Name / Team Lead */}
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                        Team Leader Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Priyanshu Sharma"
                        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                        Student College Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@heritageit.edu.in"
                        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    {/* Department & Year (Two Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                          Department *
                        </label>
                        <input
                          type="text"
                          name="department"
                          required
                          value={formData.department}
                          onChange={handleChange}
                          placeholder="e.g. CSE / IT / ECE"
                          className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                          Year of Study *
                        </label>
                        <select
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/20 bg-black/50 px-4 py-3 text-sm text-white outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Postgraduate">Postgraduate</option>
                        </select>
                      </div>
                    </div>

                    {/* Team Name / Project Title */}
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                        Team / Venture Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        placeholder="e.g. EcoGrid / TerraInnovate"
                        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                        Create Password *
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    {/* Show Password Checkbox */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="rounded border-white/30 bg-white/10 text-[#f20089] focus:ring-0"
                        />
                        <span>Show password</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Log In Form */}
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@heritageit.edu.in"
                        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase">
                          Password *
                        </label>
                        <a
                          href="#"
                          className="text-xs text-[#f20089] hover:underline"
                        >
                          Forgot Password?
                        </a>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    {/* Show Password & Remember Me */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="rounded border-white/30 bg-white/10 text-[#f20089] focus:ring-0"
                        />
                        <span>Show password</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white">
                        <input
                          type="checkbox"
                          className="rounded border-white/30 bg-white/10 text-[#f20089] focus:ring-0"
                        />
                        <span>Remember me</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Submit Button with Glass Glow Accent */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#f20089] via-[#e6007e] to-[#c4006c] py-3.5 text-sm font-bold tracking-wider text-white uppercase shadow-[0_8px_30px_rgba(242,0,137,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/25 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(242,0,137,0.65)] active:scale-[0.99] disabled:opacity-70 cursor-pointer font-[family-name:var(--font-syne)]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : mode === "signup" ? (
                    "Submit Registration for 2027 →"
                  ) : (
                    "Sign In to Account →"
                  )}
                </button>
              </form>
            )}

            {/* Footer switcher */}
            <div className="mt-8 border-t border-white/15 pt-6 text-center text-xs text-white/70">
              {mode === "signup" ? (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setSubmitted(false);
                    }}
                    className="font-bold text-[#f20089] hover:underline cursor-pointer ml-1 drop-shadow"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p>
                  Don’t have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setSubmitted(false);
                    }}
                    className="font-bold text-[#f20089] hover:underline cursor-pointer ml-1 drop-shadow"
                  >
                    Register Team
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Credits */}
      <footer className="relative z-20 py-4 text-center text-[11px] text-white/60">
        © 2027 Hult Prize at Heritage Institute of Technology. All rights reserved.
      </footer>
    </div>
  );
}
