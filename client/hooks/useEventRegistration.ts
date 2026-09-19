"use client";

import { useState, useEffect } from "react";
import { parseHeritageEmail, validatePhoneNumber, validateRollNumber } from "@/lib/heritage-parser";
import type { PublicEvent } from "@/app/events/page";

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
  const fetchRsvpStatus = async () => {
    if (!registeredTeam || !event._id) return;
    try {
      const res = await fetch(`/api/events/rsvp?eventId=${event._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rsvpd) {
          const checkedInCount = data.rsvp?.checkedInMembers?.length || 0;
          const totalRoster = 1 + (registeredTeam?.members?.length || 0);
          setRsvpInfo({
            rsvpd: true,
            status: data.status,
            myCheckIn: data.myCheckIn,
            checkedInCount,
            totalRoster,
          });
        } else {
          setRsvpInfo({ rsvpd: false });
        }
      }
    } catch (err) {
      console.error("Failed to fetch RSVP status:", err);
    }
  };

  useEffect(() => {
    fetchRsvpStatus();
  }, [registeredTeam, event._id]);

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
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event._id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to RSVP.");
      }

      await fetchRsvpStatus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to RSVP.");
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
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          eventId: event._id,
          teamName: teamName.trim(),
          ventureName: ventureName.trim(),
          leadName: sessionUser.name || "Student Leader",
          leadPhone: phoneCheck.clean,
          leadRoll: rollCheck.clean,
          department: department.trim(),
          membersCount: maxMembers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create team. Please try again.");
      }

      onRegisterSuccess(data.team);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create team.");
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

    if (!joinCode.trim()) {
      setErrorMessage("Please enter the 6-character Team Invite Code.");
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
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          eventId: event._id,
          teamCode: joinCode.trim().toUpperCase(),
          phone: memberPhone.trim(),
          roll: memberRoll.trim(),
          department: memberDepartment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join team. Please verify the code.");
      }

      onRegisterSuccess(data.team);
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
      const res = await fetch(`/api/events/register?eventId=${event._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.team) {
          onRegisterSuccess(data.team);
        }
      }
    } catch (err) {
      console.error("Failed to refresh roster:", err);
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
    minMembers,
    maxMembers,
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
    rsvpInfo,
    rsvpLoading,
    loading,
    refreshing,
    errorMessage,
    setErrorMessage,
    copiedCode,
    createStep,
    setCreateStep,
    joinStep,
    setJoinStep,
    handleRsvp,
    handleCreateTeam,
    handleJoinTeam,
    handleRefreshRoster,
    handleCopyCode,
    getWhatsAppShareUrl,
    currentMembersList,
    totalJoined,
    targetCount,
    openSlotsCount,
    isTeamCriteriaMet,
  };
}
