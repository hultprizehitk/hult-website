"use client";

import React, { useState } from "react";
import {
  Radio,
  Clock,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  MapPin,
  HelpCircle,
  Send,
  BarChart3,
  Video,
  CheckCircle2,
  Zap,
  Users,
  ChevronRight,
  Filter,
} from "lucide-react";

export interface ScheduleSession {
  id: string;
  title: string;
  speaker: string;
  role: string;
  time: string;
  location: string;
  status: "live" | "upcoming" | "completed";
  category: "main_stage" | "workshop" | "keynote";
  description: string;
  attendeesCount: number;
}

export interface LiveQuestion {
  id: string;
  author: string;
  department: string;
  question: string;
  upvotes: number;
  timeAgo: string;
  userVoted?: boolean;
}

const INITIAL_SCHEDULE: ScheduleSession[] = [
  {
    id: "session-1",
    title: "Auditorium Check-In & Delegate Kit Distribution",
    speaker: "Hult HITK Organizing Committee",
    role: "Event Secretariat",
    time: "09:30 AM - 10:15 AM",
    location: "Main Auditorium Foyer",
    status: "completed",
    category: "main_stage",
    description: "Team badge verification, QR pass scan, and official OnCampus delegate packet collection.",
    attendeesCount: 142,
  },
  {
    id: "session-2",
    title: "Grand Opening Keynote: Scaling Social Impact Ventures",
    speaker: "Dr. Ananya Roy & Global Alumni",
    role: "Hult Prize Regional Mentor",
    time: "10:30 AM - 11:30 AM",
    location: "Main Auditorium - Stage 1",
    status: "live",
    category: "keynote",
    description: "Strategic framework for turning Sustainable Development Goals (SDGs) into seed-funded enterprises.",
    attendeesCount: 230,
  },
  {
    id: "session-3",
    title: "Elevator Pitch Round 1: CleanTech & HealthTech",
    speaker: "Judges Panel Alpha",
    role: "Venture Jury",
    time: "11:45 AM - 01:15 PM",
    location: "Seminar Hall B & Auditorium",
    status: "upcoming",
    category: "main_stage",
    description: "3-minute rapid pitches followed by 2-minute live Q&A defense from student founders.",
    attendeesCount: 185,
  },
  {
    id: "session-4",
    title: "Hands-on Workshop: Prototyping & Financial Unit Economics",
    speaker: "Venture Studio Mentors",
    role: "Tech & Product Leads",
    time: "02:00 PM - 03:30 PM",
    location: "Innovation Hub Lab 4",
    status: "upcoming",
    category: "workshop",
    description: "Interactive session on TAM/SAM market sizing, unit margin calculation, and MVP wireframing.",
    attendeesCount: 160,
  },
  {
    id: "session-5",
    title: "Grand Finalist Pitch & $1M Regional Qualifier Ceremony",
    speaker: "Executive Jury Board",
    role: "Hult Global Representatives",
    time: "04:30 PM - 06:00 PM",
    location: "Main Auditorium - Main Stage",
    status: "upcoming",
    category: "keynote",
    description: "Top 5 team defense, live score reveal, winner announcement, and regional qualifier trophy presentation.",
    attendeesCount: 310,
  },
];

const INITIAL_QUESTIONS: LiveQuestion[] = [
  {
    id: "q-1",
    author: "Rahul Verma",
    department: "Computer Science (3rd Yr)",
    question: "What is the criteria weightage for financial viability versus social impact metric in Round 1?",
    upvotes: 24,
    timeAgo: "8m ago",
    userVoted: false,
  },
  {
    id: "q-2",
    author: "Sreeja Das",
    department: "Electronics & Comm (4th Yr)",
    question: "Will teams get direct access to regional mentor office hours after the OnCampus finals?",
    upvotes: 19,
    timeAgo: "15m ago",
    userVoted: false,
  },
  {
    id: "q-3",
    author: "Ankan Mukhopadhyay",
    department: "Information Tech (2nd Yr)",
    question: "Are hardware prototypes required during Round 2 or are high-fidelity wireframes sufficient?",
    upvotes: 14,
    timeAgo: "22m ago",
    userVoted: false,
  },
];

export default function LiveAuditoriumHub() {
  const [activeTab, setActiveTab] = useState<"schedule" | "qa" | "poll">("schedule");
  const [filterCategory, setFilterCategory] = useState<"all" | "main_stage" | "workshop" | "keynote">("all");
  
  // Q&A State
  const [questions, setQuestions] = useState<LiveQuestion[]>(INITIAL_QUESTIONS);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [deptText, setDeptText] = useState("");
  const [submittingQ, setSubmittingQ] = useState(false);
  const [qSubmittedMessage, setQSubmittedMessage] = useState(false);

  // Poll State
  const [pollOptions, setPollOptions] = useState([
    { id: "p1", text: "Clean Energy & Renewable Storage", votes: 84, color: "bg-[#f20089]" },
    { id: "p2", text: "AI-Powered Healthcare & Diagnostics", votes: 68, color: "bg-sky-500" },
    { id: "p3", text: "Sustainable AgriTech & Circular Economy", votes: 52, color: "bg-emerald-500" },
    { id: "p4", text: "Accessible EdTech & Skilling", votes: 41, color: "bg-amber-500" },
  ]);
  const [userVotedPollId, setUserVotedPollId] = useState<string | null>(null);

  // Real-Time SSE Live Stream Subscriber
  React.useEffect(() => {
    if (typeof window === "undefined" || !("EventSource" in window)) return;
    const es = new EventSource("/api/admin/live/stream");

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "question_upvote") {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === data.payload.id ? { ...q, upvotes: data.payload.upvotes } : q
            )
          );
        } else if (data.type === "new_question") {
          setQuestions((prev) => [data.payload, ...prev]);
        } else if (data.type === "poll_vote") {
          setPollOptions((prev) =>
            prev.map((opt) =>
              opt.id === data.payload.optionId ? { ...opt, votes: data.payload.votes } : opt
            )
          );
        }
      } catch (err) {
        // Heartbeat or malformed frame
      }
    };

    return () => {
      es.close();
    };
  }, []);

  const handleUpvote = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const v = q.userVoted;
          return {
            ...q,
            upvotes: v ? q.upvotes - 1 : q.upvotes + 1,
            userVoted: !v,
          };
        }
        return q;
      })
    );
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setSubmittingQ(true);

    setTimeout(() => {
      const newQ: LiveQuestion = {
        id: `q-${Date.now()}`,
        author: authorName.trim() || "Anonymous Delegate",
        department: deptText.trim() || "Heritage Student",
        question: newQuestionText.trim(),
        upvotes: 1,
        timeAgo: "Just now",
        userVoted: true,
      };

      setQuestions((prev) => [newQ, ...prev]);
      setNewQuestionText("");
      setSubmittingQ(false);
      setQSubmittedMessage(true);
      setTimeout(() => setQSubmittedMessage(false), 3000);
    }, 400);
  };

  const handleVotePoll = (optionId: string) => {
    if (userVotedPollId === optionId) return;

    setPollOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        if (opt.id === userVotedPollId) {
          return { ...opt, votes: opt.votes - 1 };
        }
        return opt;
      })
    );
    setUserVotedPollId(optionId);
  };

  const totalPollVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);

  const filteredSchedule =
    filterCategory === "all"
      ? INITIAL_SCHEDULE
      : INITIAL_SCHEDULE.filter((s) => s.category === filterCategory);

  return (
    <section className="w-full bg-[#09090b] text-white py-10 px-4 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#f20089]/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f20089]/20 border border-[#f20089]/50 text-[#f20089]">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#f20089]" />
              LIVE STAGE
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3 text-sky-400" />
              Main Stage • Heritage HITK
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Event Schedule & Stage
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#121216] p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "schedule"
                ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Clock className="w-4 h-4" />
            Live Schedule
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "qa"
                ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Ask Question ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab("poll")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "poll"
                ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Audience Poll
          </button>
        </div>
      </div>

      {/* TAB 1: SCHEDULE TIMELINE */}
      {activeTab === "schedule" && (
        <div className="mt-8 space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs text-neutral-400 flex items-center gap-1 mr-2">
              <Filter className="w-3.5 h-3.5 text-neutral-500" /> Filter:
            </span>
            {(["all", "main_stage", "workshop", "keynote"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all whitespace-nowrap ${
                  filterCategory === cat
                    ? "bg-white/15 text-white border border-white/20 font-semibold"
                    : "bg-[#121216] text-neutral-400 border border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Timeline Cards */}
          <div className="relative border-l-2 border-white/10 ml-3 md:ml-6 space-y-6 pl-6 md:pl-8 pt-2">
            {filteredSchedule.map((session) => {
              const isLive = session.status === "live";
              const isDone = session.status === "completed";

              return (
                <div key={session.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div
                    className={`absolute -left-[31px] md:-left-[39px] top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isLive
                        ? "bg-[#f20089] border-[#f20089] ring-4 ring-[#f20089]/20"
                        : isDone
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-[#121216] border-white/30"
                    }`}
                  >
                    {isLive && <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
                    {isDone && <CheckCircle2 className="w-3 h-3 text-black font-bold" />}
                  </div>

                  {/* Card Container */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      isLive
                        ? "bg-gradient-to-r from-[#121216] via-[#1a121d] to-[#121216] border-[#f20089]/50 shadow-lg shadow-[#f20089]/10"
                        : "bg-[#121216]/80 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#f20089] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {session.time}
                        </span>
                        <span className="text-neutral-500">•</span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          {session.location}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f20089]/20 border border-[#f20089] text-[#f20089] animate-pulse">
                            <Radio className="w-3 h-3" /> LIVE NOW
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> COMPLETED
                          </span>
                        )}
                        {session.status === "upcoming" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-neutral-400">
                            UPCOMING
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#f20089] transition-colors">
                      {session.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {session.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#f20089]/20 border border-[#f20089]/40 flex items-center justify-center font-bold text-[10px] text-[#f20089]">
                          {session.speaker.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-200">{session.speaker}</span>
                          <span className="text-neutral-500 text-[11px] ml-1.5">({session.role})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-neutral-400 bg-white/5 px-2.5 py-1 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{session.attendeesCount} Attending</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE Q&A */}
      {activeTab === "qa" && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ask Question Form */}
          <div className="lg:col-span-1 bg-[#121216] p-6 rounded-2xl border border-white/10 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#f20089]" />
              <h3 className="text-base font-bold text-white">Ask a Question</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Have a question during the live session? Send it directly to the stage.
            </p>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priyanjali Sen"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Department & Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE (3rd Year)"
                  value={deptText}
                  onChange={(e) => setDeptText(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Your Question
                </label>
                <textarea
                  rows={3}
                  placeholder="Type your question for the stage..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f20089] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingQ || !newQuestionText.trim()}
                className="w-full py-2.5 px-4 bg-[#f20089] hover:bg-[#d00076] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#f20089]/25"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingQ ? "Submitting..." : "Submit Question"}
              </button>

              {qSubmittedMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Question submitted live!
                </div>
              )}
            </form>
          </div>

          {/* Question Feed List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-sm font-bold text-neutral-200">
                Top Voted Audience Questions
              </h4>
              <span className="text-xs text-neutral-500">Sorted by live upvotes</span>
            </div>

            {questions.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-[#121216] border border-white/10 hover:border-white/20 transition-all flex gap-4"
              >
                {/* Upvote Button Box */}
                <button
                  onClick={() => handleUpvote(q.id)}
                  className={`flex flex-col items-center justify-center p-2.5 min-w-[54px] rounded-xl border transition-all ${
                    q.userVoted
                      ? "bg-[#f20089]/20 border-[#f20089] text-[#f20089]"
                      : "bg-[#09090b] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 mb-1 ${q.userVoted ? "fill-[#f20089]" : ""}`} />
                  <span className="text-xs font-bold">{q.upvotes}</span>
                </button>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{q.author}</span>
                    <span className="text-[11px] text-neutral-500">{q.timeAgo}</span>
                  </div>
                  <div className="text-[11px] text-[#f20089] font-medium mb-2">
                    {q.department}
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{q.question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIENCE POLL */}
      {activeTab === "poll" && (
        <div className="mt-8 max-w-2xl mx-auto bg-[#121216] p-6 md:p-8 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-[#f20089]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#f20089]">
              Live Audience Poll
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Which social impact domain are you most excited to see today?
          </h3>
          <p className="text-xs text-neutral-400 mb-6">
            Cast your vote to support the innovation area you care about most.
          </p>

          <div className="space-y-4">
            {pollOptions.map((opt) => {
              const percent = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
              const isSelected = userVotedPollId === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleVotePoll(opt.id)}
                  className={`relative p-4 rounded-xl border cursor-pointer overflow-hidden transition-all ${
                    isSelected
                      ? "bg-[#09090b] border-[#f20089] ring-2 ring-[#f20089]/20"
                      : "bg-[#09090b] border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Visual Fill Progress Bar */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 opacity-15 ${opt.color} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />

                  <div className="relative flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-[#f20089] bg-[#f20089]"
                            : "border-neutral-500"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-xs font-semibold text-white">{opt.text}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-white">{percent}%</span>
                      <span className="text-neutral-500">({opt.votes} votes)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <span>Total Votes Cast: <strong className="text-white">{totalPollVotes}</strong></span>
            {userVotedPollId && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vote recorded on auditorium feed
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
