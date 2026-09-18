"use client";

import React from "react";

const timelineSteps = [
  {
    step: "01",
    title: "Team Registration & Code Pass",
    status: "Active Now",
    statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    desc: "Form your team of 2 to 5 students, generate your 6-character Team Invite Code, and share it with your co-founders.",
    date: "Current Phase",
    icon: "🔑",
  },
  {
    step: "02",
    title: "Hult Ascend Auditorium Quiz & Workshop",
    status: "Upcoming",
    statusColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    desc: "Gather in Auditorium Room 1. Scan the projected QR code to confirm physical attendance and compete in the live quiz.",
    date: "Phase 2",
    icon: "📱",
  },
  {
    step: "03",
    title: "OnCampus Championship Finale",
    status: "Upcoming",
    statusColor: "bg-white/10 text-white/60 border-white/20",
    desc: "Pitch your validated business model before a panel of venture capitalists, judges, and campus mentors.",
    date: "Phase 3",
    icon: "🏆",
  },
  {
    step: "04",
    title: "Global Regional Summits",
    status: "International",
    statusColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    desc: "Represent Heritage Institute of Technology at international regional summits across Europe, Asia, or America.",
    date: "Phase 4",
    icon: "🌍",
  },
  {
    step: "05",
    title: "Global Accelerator & UN HQ Finals",
    status: "Finals",
    statusColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    desc: "The top global finalist teams pitch at the United Nations HQ in New York for $1,000,000 USD in seed funding.",
    date: "Grand Finale",
    icon: "👑",
  },
];

export default function TimelineSection() {
  return (
    <section
      id="timeline"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-10 lg:px-16 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white bg-black font-[family-name:var(--font-google-sans)] border-t border-white/10"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-sky-300 backdrop-blur-md">
            <span>🗺️</span>
            <span>Roadmap</span>
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Roadmap to the{" "}
            <span className="bg-gradient-to-r from-sky-300 via-pink-200 to-[#f20089] bg-clip-text text-transparent">
              $1,000,000 Global Stage
            </span>
          </h2>

          <p className="text-sm sm:text-base text-white/70 font-sans font-medium">
            Follow the multi-stage journey from Heritage Institute of Technology to the United Nations HQ.
          </p>
        </div>

        {/* Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {timelineSteps.map((step, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-6 backdrop-blur-2xl hover:border-[#f20089]/60 hover:shadow-[0_15px_35px_rgba(242,0,137,0.2)] transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089]/40 to-transparent" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-white/30 group-hover:text-[#f20089] transition-colors">
                    {step.step}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${step.statusColor}`}
                  >
                    {step.status}
                  </span>
                </div>

                <div className="text-2xl">{step.icon}</div>

                <h3 className="text-base font-bold text-white group-hover:text-pink-100 transition-colors">
                  {step.title}
                </h3>

                <p className="text-xs text-white/65 leading-relaxed font-sans">
                  {step.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-white/40 uppercase">
                {step.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
