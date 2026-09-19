"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Radar, UserPlus, Sparkles, Check, Search } from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars-data";

export interface RadarStudent {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  department?: string;
  avatarId?: string;
  archetype?: string;
  desiredRole?: string;
  lookingForTeam?: boolean;
  bio?: string;
}

interface CoFounderRadarProps {
  currentStudentEmail?: string;
  isTeamLeader?: boolean;
  teamCode?: string;
  teamName?: string;
}

export default function CoFounderRadar({
  currentStudentEmail,
  isTeamLeader,
  teamCode,
  teamName,
}: CoFounderRadarProps) {
  const [lookingForTeam, setLookingForTeam] = useState(false);
  const [desiredRole, setDesiredRole] = useState("CTO / Tech Lead");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [radarStudents, setRadarStudents] = useState<RadarStudent[]>([]);
  const [loadingRadar, setLoadingRadar] = useState(true);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Fetch real radar students from MongoDB
  const fetchRadarStudents = async () => {
    try {
      setLoadingRadar(true);
      const res = await fetch("/api/profile/customize?radar=true");
      if (res.ok) {
        const data = await res.json();
        setRadarStudents(data.radarStudents || []);
      }
    } catch (err) {
      console.error("Failed to fetch radar talent:", err);
    } finally {
      setLoadingRadar(false);
    }
  };

  // Fetch current student's personal radar toggle status
  useEffect(() => {
    fetch("/api/profile/customize")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLookingForTeam(Boolean(data.lookingForTeam));
          if (data.desiredRole) setDesiredRole(data.desiredRole);
          if (data.bio) setBio(data.bio);
        }
      })
      .catch((err) => console.error("Error loading profile status:", err));

    fetchRadarStudents();
  }, []);

  // Handle Save Solo Status Toggle
  const handleSaveStatus = async (newLookingStatus: boolean) => {
    setLookingForTeam(newLookingStatus);
    setSaving(true);
    setSavedSuccess(false);

    try {
      await fetch("/api/profile/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_looking_for_team",
          lookingForTeam: newLookingStatus,
          desiredRole,
          bio,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      fetchRadarStudents();
    } catch (err) {
      console.error("Failed to save radar status:", err);
    } finally {
      setSaving(false);
    }
  };

  // Filter dynamic radar students
  const filteredStudents = radarStudents.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.department && st.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.desiredRole && st.desiredRole.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRoleFilter === "all" || (st.desiredRole && st.desiredRole.includes(selectedRoleFilter));
    return matchesSearch && matchesRole;
  });

  return (
    <section className="w-full bg-[#09090b] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-1">
            <Radar className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            MATCHMAKING RADAR
          </div>
          <h3 className="text-2xl font-black text-white font-[family-name:var(--font-google-sans)]">
            Co-Founder Talent Board
          </h3>
        </div>

        {/* Solo Student Toggle Switch */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3 flex items-center gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white block">Looking for Team?</span>
            <span className="text-[10px] text-zinc-400 block font-mono">
              {lookingForTeam ? "Visible to Teams" : "Hidden from Radar"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSaveStatus(!lookingForTeam)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
              lookingForTeam ? "bg-[#f20089] justify-end" : "bg-white/20 justify-start"
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>

      {/* SOLO PROFILE SETTINGS BANNER (When student turns on "Looking for Team") */}
      {lookingForTeam && (
        <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Solo Talent Profile Active
            </span>
            {savedSuccess && (
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Preferred Startup Role</label>
              <select
                value={desiredRole}
                onChange={(e) => {
                  setDesiredRole(e.target.value);
                  handleSaveStatus(true);
                }}
                className="w-full rounded-xl border border-white/15 bg-[#121216] px-3 py-2 text-white outline-none text-xs"
              >
                <option value="CTO / Tech Lead">CTO / Tech Lead</option>
                <option value="Pitch Lead / CEO">Pitch Lead / CEO</option>
                <option value="SDG & Sustainability">SDG & Sustainability</option>
                <option value="CMO / Marketing">CMO / Marketing</option>
                <option value="UI/UX & Product">UI/UX & Product</option>
                <option value="CFO / Finance">CFO / Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Skills Micro-Note</label>
              <input
                type="text"
                placeholder="e.g. Next.js, PyTorch, Figma UI"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => handleSaveStatus(true)}
                className="w-full rounded-xl border border-white/15 bg-[#121216] px-3 py-2 text-white outline-none text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH STRIP */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121216] p-3.5 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search role, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#f20089]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "Tech", "CEO", "SDG", "UI/UX"].map((roleKey) => (
            <button
              key={roleKey}
              onClick={() => setSelectedRoleFilter(roleKey)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRoleFilter === roleKey
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-[#09090b] text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {roleKey === "all" ? "All Talent" : roleKey}
            </button>
          ))}
        </div>
      </div>

      {/* DYNAMIC RADAR TALENT CARDS (FETCHED FROM MONGODB) */}
      {loadingRadar ? (
        <div className="py-12 text-center text-xs text-zinc-500 font-mono">
          Scanning live MongoDB radar for talent...
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredStudents.map((st) => {
            const avatarPreset = AVATAR_PRESETS.find((a) => a.id === st.avatarId) || AVATAR_PRESETS[1];
            const studentId = st._id || st.id || st.email;

            return (
              <div
                key={studentId}
                className="rounded-2xl border border-white/10 bg-[#121216] p-4 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border border-white/20 shrink-0">
                    <Image
                      src={avatarPreset.image}
                      alt={st.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="object-cover h-full w-full"
                    />
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate font-[family-name:var(--font-google-sans)]">
                        {st.name}
                      </h4>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.2 rounded-full border border-purple-500/30">
                        {avatarPreset.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block truncate">{st.department || "Heritage Student"}</span>
                    <span className="text-xs font-bold text-[#f20089] block mt-1 font-mono">
                      Desired: {st.desiredRole || "Co-Founder"}
                    </span>
                  </div>
                </div>

                {st.bio && (
                  <p className="text-xs text-zinc-300 bg-[#09090b] p-2 rounded-xl border border-white/5 font-mono">
                    {st.bio}
                  </p>
                )}

                {/* Invite Action */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const text = teamCode
                        ? `Hey ${st.name}! Join my Hult Prize team *${teamName || "Venture Team"}*! Use Team Code: *${teamCode}* at https://hultprizehitk.live/events`
                        : `Hey ${st.name}! Let's form a team for the Hult Prize startup competition! Check it out: https://hultprizehitk.live/events`;
                      navigator.clipboard.writeText(text);
                      setCopiedInviteId(studentId);
                      setTimeout(() => setCopiedInviteId(null), 2500);
                    }}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    {copiedInviteId === studentId ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{copiedInviteId === studentId ? "Invite Copied!" : "Invite to Team"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dynamic Empty State - No Hardcoded Mock Cards */
        <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 bg-[#121216] p-6 space-y-2">
          <Radar className="w-8 h-8 text-zinc-600 mx-auto" />
          <span className="text-xs font-bold text-zinc-300 block font-mono">
            No Solo Talent Currently on Radar
          </span>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            Toggle "Looking for Team" above to be listed on the live co-founder talent board.
          </p>
        </div>
      )}
    </section>
  );
}
