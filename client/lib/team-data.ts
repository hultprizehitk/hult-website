import { TeamCategory, TeamMember, TeamSectionConfig } from "@/types";

export const TEAM_SECTIONS: TeamSectionConfig[] = [
  {
    key: "cd",
    title: "Campus Director",
    subtitle: "Executive Leadership",
    badge: "CD",
    accentColor: "#f20089",
    gradientClass: "from-amber-400 via-[#f20089] to-purple-600",
    borderClass: "border-amber-500/40 hover:border-[#f20089]",
    description:
      "Steering the overall strategic vision, university relations, and international liaison for Hult Prize OnCampus at Heritage Institute of Technology.",
  },
  {
    key: "dcd",
    title: "Deputy Campus Director",
    subtitle: "Executive Co-Lead",
    badge: "DCD",
    accentColor: "#00d2ff",
    gradientClass: "from-sky-400 via-blue-500 to-[#f20089]",
    borderClass: "border-sky-500/40 hover:border-sky-400",
    description:
      "Co-leading strategic planning, cross-team synchronization, and high-impact operational delivery across all sub-committees.",
  },
  {
    key: "event_management",
    title: "Event Management Team",
    subtitle: "Operations & Logistics",
    badge: "Events",
    accentColor: "#10b981",
    gradientClass: "from-emerald-400 to-teal-600",
    borderClass: "border-emerald-500/30 hover:border-emerald-400",
    description:
      "Planning, venue coordination, timeline management, jury liaison, and frictionless stage operations for the flagship OnCampus competition.",
  },
  {
    key: "workshop",
    title: "Workshop Team",
    subtitle: "Mentorship & Learning",
    badge: "Workshops",
    accentColor: "#f59e0b",
    gradientClass: "from-amber-400 to-orange-600",
    borderClass: "border-amber-500/30 hover:border-amber-400",
    description:
      "Curating specialized startup bootcamps, guest mentor masterclasses, ideation clinics, and business pitch refinement workshops.",
  },
  {
    key: "tech",
    title: "Tech Team",
    subtitle: "Platform & Engineering",
    badge: "Engineering",
    accentColor: "#38bdf8",
    gradientClass: "from-cyan-400 via-sky-500 to-indigo-600",
    borderClass: "border-sky-500/30 hover:border-sky-400",
    description:
      "Architecting the official web application, secure participant onboarding, automated identity verification, and administrative CMS.",
  },
  {
    key: "design",
    title: "Design Team",
    subtitle: "Creative & Brand Identity",
    badge: "Creative",
    accentColor: "#f20089",
    gradientClass: "from-[#f20089] via-pink-500 to-purple-600",
    borderClass: "border-[#f20089]/30 hover:border-[#f20089]",
    description:
      "Crafting the visual identity, motion graphics, promotional banners, social media aesthetics, and stage brand assets.",
  },
];

/**
 * Official team members roster.
 * Populate this array with real team member details when announced.
 */
export const INITIAL_TEAM_MEMBERS: TeamMember[] = [];
