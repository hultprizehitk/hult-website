"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactFields from "./ContactFields";

export interface JoinTeamFormData {
  teamCode: string;
  phone: string;
  roll: string;
}

export interface JoinTeamFormProps {
  joinForm: JoinTeamFormData;
  setJoinForm: React.Dispatch<React.SetStateAction<JoinTeamFormData>>;
  isPhoneSaved: boolean;
  isRollSaved: boolean;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function JoinTeamForm({
  joinForm,
  setJoinForm,
  isPhoneSaved,
  isRollSaved,
  submitting,
  onBack,
  onSubmit,
}: JoinTeamFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5 text-left animate-fadeIn">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div>
        <h3 className="text-lg font-semibold text-white">Join a team</h3>
        <p className="mt-1 text-sm text-white/50">Enter the invite code from your team leader.</p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs text-white/55">Invite code</span>
        <input
          type="text"
          required
          placeholder="HULT-XXXX"
          value={joinForm.teamCode}
          onChange={(e) => setJoinForm({ ...joinForm, teamCode: e.target.value.toUpperCase() })}
          className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 font-mono text-base uppercase tracking-widest text-pink-200 placeholder:text-white/30 outline-none transition-colors focus:border-brand/60 focus:bg-white/[0.06]"
        />
      </label>

      <ContactFields
        phone={joinForm.phone}
        roll={joinForm.roll}
        onPhoneChange={(phone) => setJoinForm({ ...joinForm, phone })}
        onRollChange={(roll) => setJoinForm({ ...joinForm, roll })}
        isPhoneSaved={isPhoneSaved}
        isRollSaved={isRollSaved}
      />

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onBack}>
          Cancel
        </Button>
        <Button type="submit" variant="brand" loading={submitting}>
          Join team
        </Button>
      </div>
    </form>
  );
}
