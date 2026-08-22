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

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      {/* Top Header Bar with Glass Effect */}
      <header className="relative z-20 flex w-full items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.02] rounded-full bg-white/[0.04] backdrop-blur-2xl border border-white/15 px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_1px_rgba(255,255,255,0.2)]"
        >
          <div className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image
              src="/Hult-Prize.png"
              alt="Hult Prize Logo"
              fill
              sizes="60px"
              priority
              className="object-contain drop-shadow"
            />
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 group-hover:text-white transition-colors">
            On Campus HITK 2027
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-2xl transition-all duration-300 hover:border-[#f20089]/60 hover:bg-[#f20089]/25 hover:shadow-[0_0_25px_rgba(242,0,137,0.4)] hover:scale-105 shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_1px_rgba(255,255,255,0.2)]"
        >
          <span>←</span> Back to Campus
        </Link>
      </header>

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
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow">
                {mode === "signup" ? "Create Your Account" : "Welcome Back"}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-white/70">
                {mode === "signup"
                  ? "Join the world’s largest student social entrepreneurship challenge"
                  : "Sign in to access your team dashboard and submissions"}
              </p>
            </div>

            {/* Tab Selector with Glass Frosting */}
            <div className="relative z-10 grid grid-cols-2 gap-1 rounded-2xl bg-black/35 p-1.5 backdrop-blur-2xl mb-8 border border-white/15 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]">
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
                Sign Up (Register)
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
                Log In
              </button>
            </div>

            {submitted ? (
              /* Success State */
              <div className="relative z-10 py-10 text-center animate-fadeIn">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f20089]/25 border border-[#f20089] text-2xl text-[#f20089] shadow-[0_0_30px_rgba(242,0,137,0.5)] backdrop-blur-xl">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white">
                  {mode === "signup"
                    ? "Registration Successful!"
                    : "Welcome Back!"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/75 max-w-sm mx-auto">
                  {mode === "signup"
                    ? "Your participant account has been created. A confirmation email has been dispatched with orientation details."
                    : "Successfully authenticated. Redirecting to your Hult Prize participant portal..."}
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <Link
                    href="/"
                    className="rounded-full bg-gradient-to-r from-[#f20089] to-[#d8007a] px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition-transform hover:scale-105 shadow-[0_8px_25px_rgba(242,0,137,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-white/25"
                  >
                    Go to Homepage
                  </Link>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="rounded-full border border-white/20 bg-white/[0.08] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/15"
                  >
                    Reset Form
                  </button>
                </div>
              </div>
            ) : (
              /* Glass Form */
              <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                {mode === "signup" ? (
                  <>
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Arijit Banerjee"
                        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-2xl transition-all duration-200 hover:border-white/30 focus:border-[#f20089] focus:bg-black/50 focus:ring-4 focus:ring-[#f20089]/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    {/* Email Address */}
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

                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-white/80 uppercase mb-1.5">
                        Password *
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
                  className="w-full mt-4 flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#f20089] via-[#e6007e] to-[#c4006c] py-3.5 text-sm font-bold tracking-wider text-white uppercase shadow-[0_8px_30px_rgba(242,0,137,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/25 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(242,0,137,0.65)] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
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
                    "Register for Hult Prize 2027 →"
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
                    Register Now
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
