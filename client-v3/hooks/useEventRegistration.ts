"use client";

import { useState, useEffect } from "react";
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

  // Create Team form inputs
  const [teamName, setTeamName] = useState("");
  const [ventureName, setVentureName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadRoll, setLeadRoll] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");

  // Join Team form inputs
  const [joinCode, setJoinCode] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRoll, setMemberRoll] = useState("");
  const [memberDepartment, setMemberDepartment] = useState("Computer Science & Engineering");

  // RSVP UI State
  const [rsvpInfo, setRsvpInfo] = useState<{
    rsvpd: boolean;
    status?: string;
    myCheckIn?: boolean;
    checkedInCount?: number;
    totalRoster?: number;
  }>({
    rsvpd: false,
    status: "pending",
    myCheckIn: false,
    checkedInCount: 0,
    totalRoster: registeredTeam ? 1 + (registeredTeam.members?.length || 0) : 1,
  });
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // General UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Step wizard state
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [joinStep, setJoinStep] = useState<1 | 2>(1);

  // Auto-fill student department from Heritage email
  useEffect(() => {
    if (sessionUser?.email) {
      const parsed = parseHeritageEmail(sessionUser.email);
      if (parsed.branchName) {
        setDepartment(parsed.branchName);
        setMemberDepartment(parsed.branchName);
      }
    }
  }, [sessionUser?.email]);

  // Read URL query params for auto-fill join code
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

  // Update roster counts on registeredTeam change
  useEffect(() => {
    if (registeredTeam) {
      const rosterCount = 1 + (registeredTeam.members?.length || 0);
      setRsvpInfo((prev) => ({
        ...prev,
        totalRoster: rosterCount,
      }));
    }
  }, [registeredTeam]);

  // Handle RSVP action (Pure Frontend UI State)
  const handleRsvp = async () => {
    if (!sessionUser?.email) return;
    setRsvpLoading(true);
    setErrorMessage(null);

    try {
      setRsvpInfo((prev) => ({
        ...prev,
        rsvpd: true,
        status: "confirmed",
        myCheckIn: true,
        checkedInCount: Math.min((prev.totalRoster || 1), (prev.checkedInCount || 0) + 1),
      }));
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle Create Team submit (Frontend UI Form Submission)
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
      const newTeam = {
        id: `team-${Date.now()}`,
        eventId: event._id,
        teamCode: "HP" + Math.random().toString(36).substring(2, 6).toUpperCase(),
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

      onRegisterSuccess(newTeam);
    } catch {
      setErrorMessage("Unable to submit team registration.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Team submit (Frontend UI Form Submission)
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
      const joinedTeam = {
        id: `team-${cleanCode}`,
        eventId: event._id,
        teamCode: cleanCode,
        teamName: `Team ${cleanCode}`,
        leadName: "Team Leader",
        leadEmail: "leader@heritageit.edu.in",
        department: memberDepartment.trim(),
        membersCount: maxMembers,
        members: [
          {
            name: sessionUser.name || "Student Member",
            email: sessionUser.email.toLowerCase(),
            department: memberDepartment.trim(),
            phone: joinPhoneCheck.clean,
            roll: joinRollCheck.clean,
            joinedAt: new Date().toISOString(),
          },
        ],
        registeredAt: new Date().toISOString(),
        status: "confirmed",
      };

      onRegisterSuccess(joinedTeam);
    } catch {
      setErrorMessage("Unable to join team with this code.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh roster action
  const handleRefreshRoster = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
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
