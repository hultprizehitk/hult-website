"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/styles";
import ContactFields from "./ContactFields";

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
        <h3 className="text-lg font-semibold text-white">Create a team</h3>
        <p className="mt-1 text-sm text-white/50">You lead the team and get an invite code to share.</p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs text-white/55">Team name</span>
        <input
          type="text"
          required
          placeholder="e.g. EcoInnovators"
          value={createForm.teamName}
          onChange={(e) => setCreateForm({ ...createForm, teamName: e.target.value })}
          className={inputClass}
        />
      </label>

      <ContactFields
        phone={createForm.phone}
        roll={createForm.roll}
        onPhoneChange={(phone) => setCreateForm({ ...createForm, phone })}
        onRollChange={(roll) => setCreateForm({ ...createForm, roll })}
        isPhoneSaved={isPhoneSaved}
        isRollSaved={isRollSaved}
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-xs text-white/45">Team leader</p>
        <p className="mt-0.5 truncate text-sm text-white">{userName}</p>
        <p className="truncate text-xs text-white/50">{userEmail}</p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onBack}>
          Cancel
        </Button>
        <Button type="submit" variant="brand" loading={submitting}>
          Create team
        </Button>
      </div>
    </form>
  );
}
