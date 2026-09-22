"use client";

import { useState, useEffect } from "react";
import { parseHeritageEmail, validatePhoneNumber, validateRollNumber } from "@/lib/heritage-parser";
import type { PublicEvent } from "@/data/events";

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

const STORAGE_KEY = "hult_user_event_registrations_v2";
const TEAMS_DIRECTORY_KEY = "hult_teams_directory_v2";

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

  // Auto-fill student profile from Heritage email
  useEffect(() => {
    if (sessionUser?.email) {
      const parsed = parseHeritageEmail(sessionUser.email);
      if (parsed.branchName) {
        setDepartment(parsed.branchName);
        setMemberDepartment(parsed.branchName);
      }
    }
  }, [sessionUser]);

  // Handle RSVP toggle
  const handleRsvp = async () => {
    if (!sessionUser?.email || !event._id) return;
    setRsvpLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setRsvpInfo((prev) => ({
        rsvpd: !prev?.rsvpd,
        status: !prev?.rsvpd ? "confirmed" : "pending",
        myCheckIn: !prev?.rsvpd,
        checkedInCount: !prev?.rsvpd ? 1 : 0,
        totalRoster: 1 + (registeredTeam?.members?.length || 0),
      }));
      setRsvpLoading(false);
    }, 300);
  };

  // Helper to persist team
  const saveTeamGlobally = (team: any) => {
    try {
      const existing = localStorage.getItem(TEAMS_DIRECTORY_KEY);
      const dict = existing ? JSON.parse(existing) : {};
      dict[team.teamCode] = team;
      localStorage.setItem(TEAMS_DIRECTORY_KEY, JSON.stringify(dict));

      // Also persist to current user's registration
      const userRegs = localStorage.getItem(STORAGE_KEY);
      const userDict = userRegs ? JSON.parse(userRegs) : {};
      userDict[event._id] = team;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userDict));
    } catch {
      // Ignore local storage error
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
      setErrorMessage(rollCheck.message || "Invalid Heritage Roll Number.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const generatedCode = `HP${Math.floor(1000 + Math.random() * 9000)}`;
      const newTeam = {
        eventId: event._id,
        teamName: teamName.trim(),
        ventureName: ventureName.trim(),
        teamCode: generatedCode,
        leadName: sessionUser.name || "Student Leader",
        leadEmail: sessionUser.email,
        leadPhone: phoneCheck.clean,
        leadRoll: rollCheck.clean,
        department: department.trim(),
        membersCount: maxMembers,
        members: [],
        createdAt: new Date().toISOString(),
      };

      saveTeamGlobally(newTeam);
      onRegisterSuccess(newTeam);
      setLoading(false);
    }, 400);
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
      setErrorMessage(joinRollCheck.message || "Invalid Heritage Roll Number.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const code = joinCode.trim().toUpperCase();
      let targetTeam: any = null;

      try {
        const existing = localStorage.getItem(TEAMS_DIRECTORY_KEY);
        const dict = existing ? JSON.parse(existing) : {};
        targetTeam = dict[code];
      } catch {
        targetTeam = null;
      }

      if (!targetTeam) {
        // Fallback for direct testing: create mock joined team if code is entered
        targetTeam = {
          eventId: event._id,
          teamName: `Team ${code}`,
          ventureName: "Social Innovation Venture",
          teamCode: code,
          leadName: "Student Founder",
          leadEmail: "founder@heritageit.edu.in",
          leadPhone: "9876543210",
          leadRoll: "12628001",
          department: "Computer Science & Engineering",
          membersCount: maxMembers,
          members: [],
        };
      }

      // Check if already in team
      const memberEmail = sessionUser.email!;
      const alreadyIn =
        targetTeam.leadEmail === memberEmail ||
        targetTeam.members?.some((m: any) => m.email === memberEmail);

      if (!alreadyIn) {
        targetTeam.members = targetTeam.members || [];
        targetTeam.members.push({
          name: sessionUser.name || "Student Member",
          email: memberEmail,
          phone: joinPhoneCheck.clean,
          roll: joinRollCheck.clean,
          department: memberDepartment.trim(),
        });
      }

      saveTeamGlobally(targetTeam);
      onRegisterSuccess(targetTeam);
      setLoading(false);
    }, 400);
  };

  // Refresh roster to see if teammates joined
  const handleRefreshRoster = async () => {
    setRefreshing(true);
    setTimeout(() => {
      if (registeredTeam?.teamCode) {
        try {
          const existing = localStorage.getItem(TEAMS_DIRECTORY_KEY);
          const dict = existing ? JSON.parse(existing) : {};
          if (dict[registeredTeam.teamCode]) {
            onRegisterSuccess(dict[registeredTeam.teamCode]);
          }
        } catch {}
      }
      setRefreshing(false);
    }, 300);
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
