"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Users,
  Eye,
  Gavel,
  History,
  Trophy,
  LayoutGrid,
  ShieldCheck,
  LogOut,
  X,
  FileText,
  Monitor,
  FileSpreadsheet,
  Tv,
  ClipboardList,
  Undo2,
} from "lucide-react";
import { INDUSTRIES, STATES, MINIMUM_BALANCE_THRESHOLD } from "@/lib/auction-data";
import { DotPattern } from "@/components/ui/DotPattern";

interface AuctionTeam {
  teamId: string;
  teamName: string;
  teamCode: string;
  quizRank: number;
  startingBudget: number;
  currentBalance: number;
  ownedIndustries: string[];
  ownedState: string | null;
  status: "active" | "disqualified";
  disqualificationReason?: string;
}

interface AuctionLot {
  lotId: string;
  name: string;
  type: "industry" | "state";
  basePrice: number;
  status: "unsold" | "sold";
  winningTeamId?: string | null;
  winningTeamName?: string | null;
  soldPrice?: number | null;
  soldAt?: string | null;
}

interface AuctionHistoryItem {
  lotId: string;
  lotName: string;
  type: "industry" | "state";
  teamId: string;
  teamName: string;
  price: number;
  timestamp: string;
}

interface ActivityLogRow {
  _id: string;
  action: string;
  actorName: string;
  actorEmail: string;
  teamName: string;
  teamCode: string;
  lotName: string;
  amount: number | null;
  detail: string;
  createdAt: string;
}

interface SessionData {
  sessionId: string;
  currentRound: "setup" | "round1" | "intermission" | "round2" | "results";
  activeLotId: string | null;
  stageMode?: string;
  viewerMode?: "stage" | "ledger" | "matrix";
  matrixRevealed: boolean;
  teams: AuctionTeam[];
  lots: AuctionLot[];
  history: AuctionHistoryItem[];
}

const ACTIVITY_STYLE: Record<string, { label: string; cls: string }> = {
  allot: { label: "SOLD", cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  revoke: { label: "UNDONE", cls: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
  disqualify: { label: "DQ", cls: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
  reinstate: { label: "BACK", cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  init: { label: "RESET", cls: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  reauction_reopen: {
    label: "REOPEN",
    cls: "text-purple-300 bg-purple-500/10 border-purple-500/30",
  },
};

export default function AdminPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [adminUser, setAdminUser] = useState<{
    name: string;
    email: string;
    role: "master_admin" | "lead_admin";
  } | null>(null);

  const [showLedger, setShowLedger] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activity, setActivity] = useState<ActivityLogRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"allotment" | "teams" | "setup">("allotment");
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [salePrice, setSalePrice] = useState<number>(0);
  const [lotSearch, setLotSearch] = useState<string>("");
  const [lotFilter, setLotFilter] = useState<"all" | "industries" | "states" | "unsold">("all");

  const [customTeams, setCustomTeams] = useState<
    { teamName: string; teamCode: string; quizRank: number }[]
  >([]);

  const checkAdminAuth = async () => {
    try {
      const res = await fetch("/api/auction/auth/session");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setAdminUser(data.user);
      } else {
        window.location.href = "/login?callbackUrl=/admin";
      }
    } catch {
      window.location.href = "/login?callbackUrl=/admin";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auction/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const loadSession = async () => {
    try {
      const res = await fetch("/api/auction/session");
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        if (customTeams.length === 0 && data.session.teams?.length > 0) {
          setCustomTeams(
            data.session.teams.map((t: AuctionTeam) => ({
              teamName: t.teamName,
              teamCode: t.teamCode,
              quizRank: t.quizRank,
            }))
          );
        }
      }
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
    loadSession();
    const interval = setInterval(loadSession, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedLotId && session) {
      const lot = session.lots.find((l) => l.lotId === selectedLotId);
      if (lot) {
        setSalePrice(lot.basePrice);
      }
    }
  }, [selectedLotId]);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleAllot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !selectedTeamId || salePrice <= 0) {
      setErrorMessage("Select an item, team, and hammer price.");
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auction/allot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: selectedLotId,
          teamId: selectedTeamId,
          price: Number(salePrice),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setSelectedLotId(null);
        setSelectedTeamId("");
        setSalePrice(0);
        await loadSession();
        // Item is sold: stays in theatrical sold state on Viewer until Admin explicitly changes screen
      } else {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewerModeChange = async (mode: "stage" | "ledger" | "matrix") => {
    try {
      const res = await fetch("/api/auction/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerMode: mode }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Viewer screen set to: ${mode.toUpperCase()}`);
        await loadSession();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRevoke = async (lotId: string) => {
    if (!confirm("Revoke this sale? Funds will be restored.")) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/auction/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        await loadSession();
      } else {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStageControl = async (lotId: string | null, stageMode?: string) => {
    try {
      const res = await fetch("/api/auction/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId, stageMode, viewerMode: "stage" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(lotId ? "Item sent to Stage" : "Stage cleared to Standby");
        await loadSession();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRoundChange = async (round: string) => {
    try {
      const res = await fetch("/api/auction/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Phase: ${round}`);
        await loadSession();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleMatrixToggle = async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/auction/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrixRevealed: !session.matrixRevealed }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Matrix: ${!session.matrixRevealed ? "VISIBLE" : "HIDDEN"}`);
        await loadSession();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleToggleDQ = async (teamId: string, currentStatus: string) => {
    const action = currentStatus === "disqualified" ? "reinstate" : "disqualify";
    const promptReason =
      action === "disqualify" ? prompt("Disqualification reason:", "Rule violation") : "";

    if (action === "disqualify" && promptReason === null) return;

    try {
      const res = await fetch("/api/auction/disqualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action, reason: promptReason }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        await loadSession();
      } else {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleInitSession = async () => {
    if (!confirm("Reset all balances and lots to start?")) return;
    setActionLoading(true);
    try {
      const payload: any = {};
      if (customTeams.length > 0) {
        payload.teams = customTeams.map((t, idx) => ({
          teamId: `team-${idx + 1}`,
          teamName: t.teamName,
          teamCode: t.teamCode,
          quizRank: t.quizRank,
        }));
      }

      const res = await fetch("/api/auction/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Auction initialized");
        await loadSession();
      } else {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportRegisteredTeams = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/auction/teams-source");
      const data = await res.json();
      if (data.success && data.teams?.length > 0) {
        const top10 = data.teams.slice(0, 10).map((t: any, idx: number) => ({
          teamName: t.name || `Team ${idx + 1}`,
          teamCode: t.code || `T0${idx + 1}`,
          quizRank: idx + 1,
        }));
        setCustomTeams(top10);
        setSuccessMessage(`Loaded ${top10.length} teams`);
      } else {
        setErrorMessage("No registered teams found");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await fetch("/api/auction/logs");
      const data = await res.json();
      if (data.success) {
        setActivity(data.logs || []);
      } else {
        setErrorMessage(data.error || "Could not load activity log");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (showActivity) loadActivity();
  }, [showActivity]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] text-white/40 font-mono text-xs">
        <RefreshCw className="size-4 animate-spin text-[#f20089] mr-2" />
        <span>CONNECTING...</span>
      </div>
    );
  }

  const selectedLot = session?.lots.find((l) => l.lotId === selectedLotId);
  const selectedTeam = session?.teams.find((t) => t.teamId === selectedTeamId);

  let budgetWarning: string | null = null;
  let isBudgetViolation = false;
  let isStateViolation = false;

  if (selectedTeam && salePrice > 0) {
    if (salePrice > selectedTeam.currentBalance) {
      budgetWarning = `Exceeds balance (₹${selectedTeam.currentBalance} Cr)`;
      isBudgetViolation = true;
    } else {
      const projectedBalance = selectedTeam.currentBalance - salePrice;
      if (projectedBalance < MINIMUM_BALANCE_THRESHOLD) {
        budgetWarning = `Leaves team with ₹${projectedBalance} Cr (< ₹35 Cr reserve)`;
      }
    }

    if (selectedLot?.type === "state" && selectedTeam.ownedState) {
      isStateViolation = true;
    }
  }

  const filteredLots = (session?.lots || []).filter((lot) => {
    const matchesSearch = lot.name.toLowerCase().includes(lotSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (lotFilter === "industries") return lot.type === "industry";
    if (lotFilter === "states") return lot.type === "state";
    if (lotFilter === "unsold") return lot.status === "unsold";
    return true;
  });

  const currentViewerMode: "stage" | "ledger" | "matrix" =
    session?.viewerMode ||
    (session?.stageMode === "matrix" ? "matrix" : session?.stageMode === "board" ? "ledger" : "stage");
  const activeStageLot = session?.lots.find((l) => l.lotId === session?.activeLotId);

  return (
    <div className="relative min-h-screen bg-[#000000] text-white p-6 md:p-8 font-['Helvetica',Arial,sans-serif] overflow-hidden">
      <DotPattern className="text-white/[0.03]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-black text-[#f20089] px-2 py-0.5 rounded bg-white/[0.05] border border-white/10">
              CONSOLE
            </span>
            <div className="flex items-center gap-2 font-mono text-xs text-white/50">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="uppercase">{session?.currentRound}</span>
            </div>

            {adminUser && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-[11px]">
                <ShieldCheck className="size-3.5 text-[#f20089]" />
                <span className="text-white/90 font-bold truncate max-w-[150px]">{adminUser.name}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#f20089]/20 text-[#f20089] font-bold">
                  {adminUser.role === "master_admin" ? "Master" : "Lead"}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-white/40 hover:text-rose-400 ml-1 cursor-pointer transition-colors"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Special Option: Manage Viewer Mode */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0e0e12] border border-white/15 shadow-inner">
              <div className="hidden xl:flex items-center gap-1.5 px-2 font-mono text-[10px] text-white/40 uppercase tracking-widest">
                <Tv className="size-3 text-[#f20089]" />
                <span>Screen:</span>
              </div>

              {/* 1. Blank / Item when selected to stage */}
              <button
                type="button"
                onClick={() => handleViewerModeChange("stage")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  currentViewerMode === "stage"
                    ? "bg-[#f20089] text-white shadow-md shadow-[#f20089]/30"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
                title="1. Stage Mode: Blank stage, or item spotlight when selected to stage, or sold reveal"
              >
                <Monitor className="size-3.5" />
                <span>1. Stage / Item</span>
                {currentViewerMode === "stage" && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-black/50 text-white font-mono">
                    {session?.stageMode === "sold"
                      ? "SOLD"
                      : activeStageLot
                      ? activeStageLot.name.slice(0, 8)
                      : "BLANK"}
                  </span>
                )}
              </button>

              {/* 2. Ledger */}
              <button
                type="button"
                onClick={() => handleViewerModeChange("ledger")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  currentViewerMode === "ledger"
                    ? "bg-[#f20089] text-white shadow-md shadow-[#f20089]/30"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
                title="2. Ledger: 10-team financial balances and reserve standings"
              >
                <FileSpreadsheet className="size-3.5" />
                <span>2. Ledger</span>
              </button>

              {/* 3. Matrix */}
              <button
                type="button"
                onClick={() => handleViewerModeChange("matrix")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  currentViewerMode === "matrix"
                    ? "bg-[#f20089] text-white shadow-md shadow-[#f20089]/30"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
                title="3. Matrix: Geographic and synergy asset matrix"
              >
                <LayoutGrid className="size-3.5" />
                <span>3. Matrix</span>
              </button>
            </div>

            {/* Clear Stage Button if Lot is currently Active */}
            {activeStageLot && (
              <button
                type="button"
                onClick={() => handleStageControl(null)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:border-white/20 flex items-center gap-1 cursor-pointer transition-all"
                title="Clear item from stage to show Blank Stage on viewer"
              >
                <X className="size-3 text-rose-400" />
                <span className="hidden sm:inline">Clear Stage</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowActivity(true)}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#0e0e12] hover:bg-white/[0.08] text-xs font-mono font-semibold text-white/90 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ClipboardList className="size-3.5 text-amber-400" />
              <span>Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLedger(true)}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#0e0e12] hover:bg-white/[0.08] text-xs font-mono font-semibold text-white/90 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <History className="size-3.5 text-[#f20089]" />
              <span>Ledger</span>
              {session?.history?.length ? (
                <span className="px-1.5 py-0.2 rounded-full bg-[#f20089]/20 text-[#f20089] text-[10px] font-bold">
                  {session.history.length}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setShowMatrix(true)}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#0e0e12] hover:bg-white/[0.08] text-xs font-mono font-semibold text-white/90 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LayoutGrid className="size-3.5 text-blue-400" />
              <span>Matrix</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                {session?.teams?.length || 10}
              </span>
            </button>

            <Link
              href="/viewer"
              target="_blank"
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-white text-black hover:bg-white/90 flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="size-3.5" />
              <span>Viewer</span>
            </Link>

            <Link
              href="/results"
              target="_blank"
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#f20089] text-white hover:bg-[#d00075] flex items-center gap-1.5 transition-all"
            >
              <Trophy className="size-3.5" />
              <span>Results</span>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono text-xs flex items-center gap-2">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Phase Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-[#0e0e12]">
          <span className="font-mono text-xs text-white/40 uppercase">Phase:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "setup", label: "Setup" },
              { id: "round1", label: "Round 1" },
              { id: "intermission", label: "Intermission" },
              { id: "round2", label: "Round 2" },
              { id: "results", label: "Results" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoundChange(r.id)}
                className={`px-3 py-1 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
                  session?.currentRound === r.id
                    ? "bg-[#f20089] text-white"
                    : "bg-white/[0.04] text-white/40 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 gap-6 font-mono text-xs uppercase font-bold">
          <button
            onClick={() => setActiveTab("allotment")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 ${
              activeTab === "allotment"
                ? "border-[#f20089] text-white"
                : "border-transparent text-white/40 hover:text-white"
            }`}
          >
            <Gavel className="size-3.5" />
            <span>Live Floor</span>
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 ${
              activeTab === "teams"
                ? "border-[#f20089] text-white"
                : "border-transparent text-white/40 hover:text-white"
            }`}
          >
            <Users className="size-3.5" />
            <span>10 Teams</span>
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 ${
              activeTab === "setup"
                ? "border-[#f20089] text-white"
                : "border-transparent text-white/40 hover:text-white"
            }`}
          >
            <RefreshCw className="size-3.5" />
            <span>Setup</span>
          </button>
        </div>

        {/* TAB 1: ALLOTMENT */}
        {activeTab === "allotment" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Lots */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={lotSearch}
                    onChange={(e) => setLotSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-[#0e0e12] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f20089]"
                  />
                </div>
                <div className="flex gap-1 bg-[#0e0e12] p-1 rounded-xl border border-white/10 font-mono text-[11px]">
                  {(["all", "industries", "states", "unsold"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLotFilter(filter)}
                      className={`px-2.5 py-0.5 rounded-lg uppercase ${
                        lotFilter === filter
                          ? "bg-white/15 text-white font-bold"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredLots.map((lot) => {
                  const isSelected = selectedLotId === lot.lotId;
                  const isSpotlight = session?.activeLotId === lot.lotId;
                  const isSold = lot.status === "sold";

                  return (
                    <div
                      key={lot.lotId}
                      onClick={() => setSelectedLotId(lot.lotId)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? "border-[#f20089] bg-[#f20089]/10"
                          : isSold
                          ? "border-white/5 bg-[#0e0e12]/40 opacity-70"
                          : "border-white/10 bg-[#0e0e12] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              lot.type === "industry"
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {lot.type}
                          </span>
                          <h3 className="font-bold text-sm text-white mt-1">{lot.name}</h3>
                        </div>

                        <span className="font-mono text-xs font-black text-emerald-400 shrink-0">
                          ₹{lot.basePrice} Cr
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5 font-mono">
                        {isSold ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-amber-400 text-[11px] font-bold truncate max-w-[140px]">
                              {lot.winningTeamName}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                              ₹{lot.soldPrice} Cr
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-white/30 text-[10px]">UNSOLD</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStageControl(isSpotlight ? null : lot.lotId);
                              }}
                              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all ${
                                isSpotlight
                                  ? "bg-[#f20089]/20 border-[#f20089]/40 text-[#f20089]"
                                  : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white"
                              }`}
                            >
                              <Flame className="size-2.5" />
                              <span>{isSpotlight ? "Stage" : "To Stage"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 cols: Record Hammer Price */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-3xl border border-white/10 bg-[#0e0e12] space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Record Sale
                  </span>
                  {selectedLot && (
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">
                      Base: ₹{selectedLot.basePrice} Cr
                    </span>
                  )}
                </div>

                {selectedLot && selectedLot.status === "sold" ? (
                  <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-4 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{selectedLot.name}</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        ALLOTTED
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/10 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-white/40">Winning Team:</span>
                        <strong className="text-amber-400 font-bold">{selectedLot.winningTeamName}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40">Hammer Price:</span>
                        <strong className="text-emerald-400 font-black">₹{selectedLot.soldPrice} Cr</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40">Base Price:</span>
                        <span className="text-white/60">₹{selectedLot.basePrice} Cr</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRevoke(selectedLot.lotId)}
                      className="w-full py-2.5 rounded-xl font-bold font-mono text-xs uppercase bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Revoke Sale (Restore Funds)</span>
                    </button>
                  </div>
                ) : selectedLot ? (
                  <form onSubmit={handleAllot} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{selectedLot.name}</span>
                      <span className="font-mono text-xs text-white/50 uppercase">{selectedLot.type}</span>
                    </div>

                    {/* 1-Click Team Grid */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-white/50 uppercase">Team</span>
                        {selectedTeam && (
                          <span className="text-[#f20089] font-bold">
                            #{selectedTeam.quizRank} {selectedTeam.teamName} (₹{selectedTeam.currentBalance} Cr)
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {session?.teams.map((team) => {
                          const isSelected = selectedTeamId === team.teamId;
                          const isDQ = team.status === "disqualified";
                          return (
                            <button
                              key={team.teamId}
                              type="button"
                              disabled={isDQ}
                              onClick={() => setSelectedTeamId(team.teamId)}
                              className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs ${
                                isSelected
                                  ? "border-[#f20089] bg-[#f20089]/20 text-white"
                                  : isDQ
                                  ? "border-white/5 bg-black/40 text-white/30 cursor-not-allowed"
                                  : "border-white/10 bg-black text-white/80 hover:border-white/20"
                              }`}
                            >
                              <div className="min-w-0 pr-1 truncate font-mono">
                                <span className="font-bold truncate text-[11px] block">{team.teamName}</span>
                                <span className="text-[9px] text-white/40">#{team.quizRank}</span>
                              </div>
                              <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0">
                                ₹{team.currentBalance} Cr
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-white/50 uppercase">Hammer Price</span>
                        <span className="text-emerald-400 font-bold">₹{salePrice} Cr</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={salePrice}
                        onChange={(e) => setSalePrice(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#f20089]"
                        required
                      />

                      <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSalePrice(selectedLot.basePrice)}
                          className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-white/70"
                        >
                          Base (₹{selectedLot.basePrice} Cr)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSalePrice((p) => p + 5)}
                          className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-white/70"
                        >
                          +5 Cr
                        </button>
                        <button
                          type="button"
                          onClick={() => setSalePrice((p) => p + 10)}
                          className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-white/70"
                        >
                          +10 Cr
                        </button>
                        <button
                          type="button"
                          onClick={() => setSalePrice((p) => p + 20)}
                          className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-white/70"
                        >
                          +20 Cr
                        </button>
                      </div>
                    </div>

                    {/* Warnings */}
                    {isStateViolation && (
                      <div className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono text-xs">
                        Violation: Team already owns a State.
                      </div>
                    )}
                    {budgetWarning && (
                      <div
                        className={`p-2.5 rounded-xl border font-mono text-xs ${
                          isBudgetViolation
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {budgetWarning}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={actionLoading || isBudgetViolation || isStateViolation}
                      className="w-full py-2.5 rounded-xl font-bold font-mono text-xs uppercase bg-[#f20089] hover:bg-[#d00075] disabled:opacity-50 text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {actionLoading ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                      <span>Confirm Sale</span>
                    </button>
                  </form>
                ) : (
                  <div className="py-8 text-center text-white/30 font-mono text-xs">
                    Select an item on the left.
                  </div>
                )}
              </div>

              {/* Quick Ledger trigger */}
              <div className="p-3.5 rounded-2xl border border-white/10 bg-[#0e0e12] flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2 text-white/60">
                  <History className="size-4 text-[#f20089]" />
                  <span>Ledger: <strong className="text-white">{session?.history?.length || 0}</strong> lots sold</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLedger(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#f20089] text-[11px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Show Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEAMS */}
        {activeTab === "teams" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session?.teams.map((team) => {
              const isBelowReserve = team.currentBalance < MINIMUM_BALANCE_THRESHOLD;
              const isCritical = team.currentBalance <= 45 && !isBelowReserve;
              const safeBidCeiling = Math.max(0, team.currentBalance - MINIMUM_BALANCE_THRESHOLD);
              const stateObj = team.ownedState ? STATES.find((s) => s.id === team.ownedState) : null;

              return (
                <div
                  key={team.teamId}
                  className={`p-3.5 rounded-2xl border ${
                    team.status === "disqualified"
                      ? "border-rose-500/40 bg-rose-950/10 opacity-70"
                      : "border-white/10 bg-[#0e0e12]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
                        <span>#{team.quizRank}</span>
                        <span>&bull;</span>
                        <span>{team.teamCode}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white mt-0.5">{team.teamName}</h3>
                    </div>

                    <button
                      onClick={() => handleToggleDQ(team.teamId, team.status)}
                      className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${
                        team.status === "disqualified"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      }`}
                    >
                      {team.status === "disqualified" ? "Reinstate" : "DQ"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-white/5 font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block">Balance</span>
                      <span
                        className={`text-base font-black ${
                          isBelowReserve || team.status === "disqualified"
                            ? "text-rose-400"
                            : isCritical
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        ₹{team.currentBalance} Cr
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block">Safe Max</span>
                      <span className="text-base font-bold text-white/80">₹{safeBidCeiling} Cr</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/40">State: <strong className="text-blue-400">{stateObj?.name || "None"}</strong></span>
                    <span className="text-white/40">Industries: <strong className="text-purple-300">{team.ownedIndustries?.length || 0}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SETUP */}
        {activeTab === "setup" && (
          <div className="max-w-2xl space-y-4">
            <div className="p-5 rounded-3xl border border-white/10 bg-[#0e0e12] space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-mono text-xs font-bold text-white uppercase">Roster Setup</span>
                <button
                  type="button"
                  onClick={handleImportRegisteredTeams}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.05] text-white font-mono text-[10px] uppercase"
                >
                  Import DB
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {customTeams.map((team, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-black border border-white/10">
                    <span className="w-10 text-[#f20089] font-bold">#{team.quizRank}</span>
                    <input
                      type="text"
                      value={team.teamName}
                      onChange={(e) => {
                        const copy = [...customTeams];
                        copy[idx].teamName = e.target.value;
                        setCustomTeams(copy);
                      }}
                      className="flex-1 bg-[#0e0e12] border border-white/10 rounded px-2 py-1 text-white"
                    />
                    <input
                      type="text"
                      value={team.teamCode}
                      onChange={(e) => {
                        const copy = [...customTeams];
                        copy[idx].teamCode = e.target.value;
                        setCustomTeams(copy);
                      }}
                      className="w-20 bg-[#0e0e12] border border-white/10 rounded px-2 py-1 text-white"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleInitSession}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all mt-2"
              >
                Reset Auction Ledger
              </button>
            </div>
          </div>
        )}

        {/* MODAL 1: SHOW LEDGER */}
        {showLedger && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0e0e12] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden font-sans">
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-[#f20089] uppercase tracking-wider font-bold">
                    <History className="size-4" />
                    <span>Transaction Ledger</span>
                  </div>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    {session?.history?.length || 0} Lots Sold &bull; Total Value: ₹
                    {(session?.history || []).reduce((acc, h) => acc + (h.price || 0), 0)} Cr
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLedger(false)}
                  className="p-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {session?.history && session.history.length > 0 ? (
                  session.history.map((hist, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-black border border-white/5 flex items-center justify-between font-mono text-xs hover:border-white/10 transition-colors"
                    >
                      <div className="space-y-0.5 truncate pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{hist.lotName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                              hist.type === "state"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-purple-500/20 text-purple-300"
                            }`}
                          >
                            {hist.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/40 flex items-center gap-2">
                          <span className="text-white/80">{hist.teamName}</span>
                          <span>&bull;</span>
                          <span className="text-emerald-400 font-bold">₹{hist.price} Cr</span>
                          <span>&bull;</span>
                          <span>{new Date(hist.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevoke(hist.lotId)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] uppercase font-bold shrink-0 cursor-pointer transition-colors"
                      >
                        Undo Sale
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-white/30 font-mono text-xs">
                    No transactions recorded yet.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowLedger(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: ACTIVITY LOG (permanent audit trail) */}
        {showActivity && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#0e0e12] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden font-sans">
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-amber-400 uppercase tracking-wider font-bold">
                    <ClipboardList className="size-4" />
                    <span>Activity Log</span>
                  </div>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    {activity.length} recorded action{activity.length === 1 ? "" : "s"} &bull; survives
                    resets and undos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadActivity}
                    disabled={activityLoading}
                    className="p-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`size-4 ${activityLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowActivity(false)}
                    className="p-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activity.length > 0 ? (
                  activity.map((row) => {
                    const meta = ACTIVITY_STYLE[row.action] || {
                      label: row.action.replace("reauction_", "").toUpperCase().slice(0, 8),
                      cls: "text-white/60 bg-white/[0.04] border-white/10",
                    };
                    return (
                      <div
                        key={row._id}
                        className="p-3 rounded-2xl bg-black border border-white/5 font-mono text-xs flex items-start gap-3"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded border font-bold text-[9px] shrink-0 ${meta.cls}`}
                        >
                          {meta.label}
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-white/80">{row.detail}</p>
                          <p className="text-[10px] text-white/30">
                            {row.actorName}
                            {row.actorEmail ? ` \u00b7 ${row.actorEmail}` : " \u00b7 unverified session"}
                          </p>
                        </div>

                        {row.action === "revoke" ? (
                          <span className="shrink-0 font-mono text-[9px] uppercase text-white/20 flex items-center gap-1">
                            <Undo2 className="size-2.5" />
                            restorable
                          </span>
                        ) : row.amount != null ? (
                          <span className="shrink-0 text-emerald-400 font-bold">
                            Rs {row.amount} Cr
                          </span>
                        ) : null}

                        <span className="shrink-0 text-[10px] text-white/30">
                          {new Date(row.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-white/30 font-mono text-xs">
                    No activity recorded yet.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowActivity(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: SHOW MATRIX */}
        {showMatrix && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[88vh] bg-[#0e0e12] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-blue-400 uppercase tracking-wider font-bold">
                    <LayoutGrid className="size-4" />
                    <span>Financial &amp; Asset Matrix</span>
                  </div>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    10-Team Live Balances &bull; Safe Ceiling: Max Bid = Balance - ₹{MINIMUM_BALANCE_THRESHOLD} Cr
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMatrixToggle}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                      session?.matrixRevealed
                        ? "bg-[#f20089]/20 border-[#f20089]/40 text-[#f20089]"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    <Eye className="size-3.5" />
                    <span>Projector: {session?.matrixRevealed ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMatrix(false)}
                    className="p-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {session?.teams.map((team) => {
                    const isBelowReserve = team.currentBalance < MINIMUM_BALANCE_THRESHOLD;
                    const isCritical = team.currentBalance <= 45 && !isBelowReserve;
                    const safeBidCeiling = Math.max(0, team.currentBalance - MINIMUM_BALANCE_THRESHOLD);
                    const stateObj = team.ownedState ? STATES.find((s) => s.id === team.ownedState) : null;

                    return (
                      <div
                        key={team.teamId}
                        className={`p-3.5 rounded-2xl border ${
                          team.status === "disqualified"
                            ? "border-rose-500/40 bg-rose-950/10 opacity-70"
                            : "border-white/10 bg-black"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
                              <span>#{team.quizRank}</span>
                              <span>&bull;</span>
                              <span>{team.teamCode}</span>
                            </div>
                            <h3 className="font-bold text-sm text-white mt-0.5">{team.teamName}</h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleDQ(team.teamId, team.status)}
                            className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold uppercase cursor-pointer ${
                              team.status === "disqualified"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            }`}
                          >
                            {team.status === "disqualified" ? "Reinstate" : "DQ"}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-white/5 font-mono">
                          <div>
                            <span className="text-[10px] uppercase text-white/40 block">Balance</span>
                            <span
                              className={`text-base font-black ${
                                isBelowReserve || team.status === "disqualified"
                                  ? "text-rose-400"
                                  : isCritical
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              ₹{team.currentBalance} Cr
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-white/40 block">Safe Max</span>
                            <span className="text-base font-bold text-white/80">₹{safeBidCeiling} Cr</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between font-mono text-[11px]">
                          <span className="text-white/40">
                            State: <strong className="text-blue-400">{stateObj?.name || "None"}</strong>
                          </span>
                          <span className="text-white/40">
                            Industries: <strong className="text-purple-300">{team.ownedIndustries?.length || 0}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowMatrix(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Close Matrix
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
