"use client";

import { useState, useEffect, useCallback } from "react";
import { parseHeritageEmail, validatePhoneNumber, validateRollNumber } from "@/lib/heritage-parser";
import type { PublicEvent } from "@/types";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UseEventRegistrationProps {
  event: PublicEvent;
  sessionUser: SessionUser | null;
  registeredTeam: any | null;
  onRegisterSuccess: (teamData: any) => void;
}

// In-memory data structures (Zero localStorage, ready for DB hookup)
let inMemoryTeams: any[] = [];
let inMemoryRsvps: Record<string, string[]> = {};

export function useEventRegistration({
  event,
  sessionUser,
  registeredTeam,
  onRegisterSuccess,
}: UseEventRegistrationProps) {
  const minMembers = event.minTeamMembers || 3;
  const maxMembers = event.maxTeamMembers || 5;

  // Mode: "create" | "join"
  const [registrationMode, setRegistrationMode] = useState<"create" | "join">("create");

  // Create Team state
  const [teamName, setTeamName] = useState("");
  const [ventureName, setVentureName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadRoll, setLeadRoll] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");

  // Join Team state
  const [joinCode, setJoinCode] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRoll, setMemberRoll] = useState("");
  const [memberDepartment, setMemberDepartment] = useState("Computer Science & Engineering");

  // RSVP State
  const [rsvpInfo, setRsvpInfo] = useState<{
    rsvpd: boolean;
    status?: string;
    myCheckIn?: boolean;
    checkedInCount?: number;
    totalRoster?: number;
  } | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // General state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Step wizard state
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [joinStep, setJoinStep] = useState<1 | 2>(1);

  // Fetch RSVP status if user has a registered team
  const fetchRsvpStatus = useCallback(() => {
    if (!registeredTeam || !event._id || !sessionUser?.email) return;
    const eventRsvps = inMemoryRsvps[event._id] || [];
    const userRsvpd = eventRsvps.includes(sessionUser.email.toLowerCase());

    const totalRoster = 1 + (registeredTeam?.members?.length || 0);
    setRsvpInfo({
      rsvpd: userRsvpd,
      status: userRsvpd ? "confirmed" : "pending",
      myCheckIn: userRsvpd,
      checkedInCount: userRsvpd ? 1 : 0,
      totalRoster,
    });
  }, [registeredTeam, event._id, sessionUser?.email]);

  useEffect(() => {
    fetchRsvpStatus();
  }, [fetchRsvpStatus]);

  // Auto-fill student profile from Heritage email
  useEffect(() => {
    if (sessionUser?.email) {
      const parsed = parseHeritageEmail(sessionUser.email);
      if (parsed.branchName) {
        setDepartment(parsed.branchName);
        setMemberDepartment(parsed.branchName);
      }
    }
  }, [sessionUser?.email]);

  // Read URL params for auto-fill join code
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get("code");
      if (codeParam) {
        setJoinCode(codeParam.toUpperCase().trim());
        setRegistrationMode("join");
      }
    }
  }, []);

  // Handle RSVP action
  const handleRsvp = async () => {
    if (!sessionUser?.email || !event._id) return;
    setRsvpLoading(true);
    setErrorMessage(null);

    try {
      const current = inMemoryRsvps[event._id] || [];
      const email = sessionUser.email.toLowerCase();
      if (!current.includes(email)) {
        inMemoryRsvps[event._id] = [...current, email];
      }
      fetchRsvpStatus();
    } catch {
      setErrorMessage("Failed to update RSVP.");
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle Create Team submit
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sessionUser?.email) {
      setErrorMessage("Please sign in first to register.");
      return;
    }

    if (!teamName.trim()) {
      setErrorMessage("Please enter your team name.");
      return;
    }

    const phoneCheck = validatePhoneNumber(leadPhone);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.message || "Invalid 10-digit phone number.");
      return;
    }

    const rollCheck = validateRollNumber(leadRoll);
    if (!rollCheck.isValid) {
      setErrorMessage(rollCheck.message || "Invalid 7-digit Heritage Roll Number.");
      return;
    }

    setLoading(true);

    try {
      const code = "HP" + Math.random().toString(36).substring(2, 6).toUpperCase();
      const newTeam = {
        id: `team-${Date.now()}`,
        eventId: event._id,
        teamCode: code,
        teamName: teamName.trim(),
        ventureName: ventureName.trim(),
        leadName: sessionUser.name || "Student Leader",
        leadEmail: sessionUser.email.toLowerCase(),
        leadPhone: phoneCheck.clean,
        leadRoll: rollCheck.clean,
        department: department.trim(),
        membersCount: maxMembers,
        members: [],
        registeredAt: new Date().toISOString(),
        status: "confirmed",
      };

      inMemoryTeams.push(newTeam);
      onRegisterSuccess(newTeam);
    } catch {
      setErrorMessage("Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Team submit
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sessionUser?.email) {
      setErrorMessage("Please sign in first to join a team.");
      return;
    }

    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage("Please enter the Team Invite Code.");
      return;
    }

    const joinPhoneCheck = validatePhoneNumber(memberPhone);
    if (!joinPhoneCheck.isValid) {
      setErrorMessage(joinPhoneCheck.message || "Invalid 10-digit phone number.");
      return;
    }

    const joinRollCheck = validateRollNumber(memberRoll);
    if (!joinRollCheck.isValid) {
      setErrorMessage(joinRollCheck.message || "Invalid 7-digit Heritage Roll Number.");
      return;
    }

    setLoading(true);

    try {
      const teamIndex = inMemoryTeams.findIndex(
        (t) => t.teamCode?.toUpperCase() === cleanCode && t.eventId === event._id
      );

      if (teamIndex === -1) {
        throw new Error("Invalid team code for this event. Please verify the code.");
      }

      const team = inMemoryTeams[teamIndex];
      const userEmail = sessionUser.email.toLowerCase();

      if (team.leadEmail?.toLowerCase() === userEmail) {
        throw new Error("You are already the leader of this team.");
      }

      const alreadyMember = (team.members || []).some(
        (m: any) => m.email?.toLowerCase() === userEmail
      );
      if (alreadyMember) {
        throw new Error("You are already a member of this team.");
      }

      if ((team.members || []).length + 1 >= (team.membersCount || maxMembers)) {
        throw new Error("This team has already reached its maximum member limit.");
      }

      const newMember = {
        name: sessionUser.name || "Student Member",
        email: userEmail,
        department: memberDepartment.trim(),
        phone: joinPhoneCheck.clean,
        roll: joinRollCheck.clean,
        joinedAt: new Date().toISOString(),
      };

      team.members = [...(team.members || []), newMember];
      inMemoryTeams[teamIndex] = team;

      onRegisterSuccess(team);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to join team.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh roster to see if teammates joined
  const handleRefreshRoster = async () => {
    setRefreshing(true);
    try {
      if (!registeredTeam) return;
      const updated = inMemoryTeams.find(
        (t) => t.id === registeredTeam.id || t.teamCode === registeredTeam.teamCode
      );
      if (updated) {
        onRegisterSuccess(updated);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Copy code to clipboard helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // WhatsApp share link generator
  const getWhatsAppShareUrl = (team: any) => {
    const inviteUrl = `https://hultprizehitk.live/events?event=${event._id}&code=${team.teamCode}`;
    const text = `Hey! Join my Hult Prize team *${team.teamName}* for the event *${event.title}* at Heritage Institute.\n\nOpen this link: ${inviteUrl}\nOr select "Join Existing Team" and enter Team Code: *${team.teamCode}*`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Compute roster counts
  const currentMembersList = registeredTeam ? registeredTeam.members || [] : [];
  const totalJoined = registeredTeam ? 1 + currentMembersList.length : 0;
  const targetCount = registeredTeam ? registeredTeam.membersCount || maxMembers : maxMembers;
  const openSlotsCount = Math.max(0, targetCount - totalJoined);
  const isTeamCriteriaMet = totalJoined >= minMembers;

  return {
    registrationMode,
    setRegistrationMode,
    teamName,
    setTeamName,
    ventureName,
    setVentureName,
    leadPhone,
    setLeadPhone,
    leadRoll,
    setLeadRoll,
    department,
    setDepartment,
    joinCode,
    setJoinCode,
    memberPhone,
    setMemberPhone,
    memberRoll,
    setMemberRoll,
    memberDepartment,
    setMemberDepartment,
    loading,
    refreshing,
    errorMessage,
    setErrorMessage,
    copiedCode,
    createStep,
    setCreateStep,
    joinStep,
    setJoinStep,
    handleCreateTeam,
    handleJoinTeam,
    handleRefreshRoster,
    handleCopyCode,
    getWhatsAppShareUrl,
    minMembers,
    maxMembers,
    currentMembersList,
    totalJoined,
    targetCount,
    openSlotsCount,
    isTeamCriteriaMet,
    rsvpInfo,
    rsvpLoading,
    handleRsvp,
  };
}
