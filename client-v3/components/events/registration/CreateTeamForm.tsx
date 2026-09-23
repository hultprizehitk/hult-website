"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Phone, GraduationCap, Lock, Loader2 } from "lucide-react";

export interface CreateTeamFormData {
  teamName: string;
  ventureName: string;
  phone: string;
  roll: string;
}

export interface CreateTeamFormProps {
  createForm: CreateTeamFormData;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateTeamFormData>>;
  isPhoneSaved: boolean;
  isRollSaved: boolean;
  userName?: string | null;
  userEmail?: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreateTeamForm({
  createForm,
  setCreateForm,
  isPhoneSaved,
  isRollSaved,
  userName,
  userEmail,
  submitting,
  onBack,
  onSubmit,
}: CreateTeamFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer font-[family-name:var(--font-google-sans)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to choices</span>
        </button>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
          You will be Team Leader
        </span>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
          Team Name *
        </label>
        <input
          type="text"
          required
          placeholder="e.g. EcoInnovators"
          value={createForm.teamName}
          onChange={(e) => setCreateForm({ ...createForm, teamName: e.target.value })}
          className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-medium transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 font-bold flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-white/50" />
              <span>Contact Phone {isPhoneSaved ? "" : "*"}</span>
            </label>
            {isPhoneSaved && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                <Lock className="h-2.5 w-2.5 text-white/50" />
                <span>Saved in Profile</span>
              </span>
            )}
          </div>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            required={!isPhoneSaved}
            readOnly={isPhoneSaved}
            placeholder="10-digit mobile"
            value={createForm.phone}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                phone: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
            className={`w-full rounded-2xl border px-4 py-3 text-xs sm:text-sm font-mono transition-all outline-none ${
              isPhoneSaved
                ? "border-white/15 bg-white/[0.04] text-white/90 cursor-not-allowed select-none"
                : "border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] text-white placeholder-white/30 focus:border-[#f20089]"
            }`}
          />
          {isPhoneSaved && (
            <span className="text-[10px] text-white/40 mt-1 block">
              Can only be edited in your{" "}
              <Link href="/profile" className="text-white/70 hover:text-white underline font-mono">
                Profile →
              </Link>
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 font-bold flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3 text-white/50" />
              <span>College Roll No. {isRollSaved ? "" : "*"}</span>
            </label>
            {isRollSaved && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                <Lock className="h-2.5 w-2.5 text-white/50" />
                <span>Saved in Profile</span>
              </span>
            )}
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required={!isRollSaved}
            readOnly={isRollSaved}
            placeholder="Numbers only (e.g. 2152001)"
            value={createForm.roll}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                roll: e.target.value.replace(/\D/g, ""),
              })
            }
            className={`w-full rounded-2xl border px-4 py-3 text-xs sm:text-sm font-mono transition-all outline-none ${
              isRollSaved
                ? "border-white/15 bg-white/[0.04] text-white/90 cursor-not-allowed select-none"
                : "border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] text-white placeholder-white/30 focus:border-[#f20089]"
            }`}
          />
          {isRollSaved && (
            <span className="text-[10px] text-white/40 mt-1 block">
              Can only be edited in your{" "}
              <Link href="/profile" className="text-white/70 hover:text-white underline font-mono">
                Profile →
              </Link>
            </span>
          )}
        </div>
      </div>

      {/* Student Verified Identity Preview */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
          Leader Credentials
        </span>
        <div className="text-white font-medium text-sm font-[family-name:var(--font-google-sans)]">
          {userName}
        </div>
        <div className="text-xs text-white/50 font-mono mt-0.5">{userEmail}</div>
      </div>

      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs text-white/70 hover:text-white transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-950 font-bold px-6 py-2.5 text-xs sm:text-sm shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer font-[family-name:var(--font-google-sans)] inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Team...</span>
            </>
          ) : (
            <span>Create Team &amp; Get Code →</span>
          )}
        </button>
      </div>
    </form>
  );
}
