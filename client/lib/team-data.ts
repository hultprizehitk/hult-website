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

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  // 1. CAMPUS DIRECTOR (CD)
  {
    id: "cd-1",
    name: "Harsh Raj",
    role: "Campus Director",
    category: "cd",
    department: "Computer Science & Engineering (IoT & CS)",
    academicYear: "3rd Year • Class of 2028",
    bio: "Passionate about driving youth-led social impact and empowering student founders to tackle global challenges through sustainable business models.",
    featured: true,
    socials: {
      linkedin: "https://linkedin.com",
      email: "harsh.raj.iotcs28@heritageit.edu.in",
      github: "https://github.com",
      instagram: "https://instagram.com",
    },
  },

  // 2. DEPUTY CAMPUS DIRECTOR (DCD)
  {
    id: "dcd-1",
    name: "Bhoomi Ladia",
    role: "Deputy Campus Director",
    category: "dcd",
    department: "Artificial Intelligence & Machine Learning",
    academicYear: "3rd Year • Class of 2028",
    bio: "Spearheading operational excellence, team alignment, and campus engagement to ensure an unforgettable Hult Prize journey.",
    featured: true,
    socials: {
      linkedin: "https://linkedin.com",
      email: "bhoomi.ladia.aiml28@heritageit.edu.in",
      instagram: "https://instagram.com",
    },
  },

  // 3. EVENT MANAGEMENT TEAM
  {
    id: "em-1",
    name: "Aarav Mukherjee",
    role: "Event Management Lead",
    category: "event_management",
    department: "Information Technology",
    academicYear: "3rd Year • Class of 2028",
    bio: "Directing day-of-event protocols, venue setups, and judge hospitality.",
    socials: {
      linkedin: "https://linkedin.com",
      email: "aarav.m@heritageit.edu.in",
    },
  },
  {
    id: "em-2",
    name: "Priya Sengupta",
    role: "Logistics Coordinator",
    category: "event_management",
    department: "Electronics & Communication Eng.",
    academicYear: "2nd Year • Class of 2029",
    bio: "Managing scheduling, audio-visual stage flow, and participant registrations.",
    socials: {
      linkedin: "https://linkedin.com",
      email: "priya.s@heritageit.edu.in",
    },
  },
  {
    id: "em-3",
    name: "Rohan Banerjee",
    role: "Operations Coordinator",
    category: "event_management",
    department: "Computer Science & Business Systems",
    academicYear: "2nd Year • Class of 2029",
    bio: "Coordinating team briefing, crowd movement, and auditoriums operations.",
    socials: {
      linkedin: "https://linkedin.com",
    },
  },

  // 4. WORKSHOP TEAM
  {
    id: "ws-1",
    name: "Ananya Ghosh",
    role: "Workshop & Mentorship Lead",
    category: "workshop",
    department: "Computer Science & Engineering",
    academicYear: "3rd Year • Class of 2028",
    bio: "Curating hands-on masterclasses with industry entrepreneurs and mentors.",
    socials: {
      linkedin: "https://linkedin.com",
      email: "ananya.g@heritageit.edu.in",
    },
  },
  {
    id: "ws-2",
    name: "Siddharth Roy",
    role: "Speaker Relations Coordinator",
    category: "workshop",
    department: "Information Technology",
    academicYear: "2nd Year • Class of 2029",
    bio: "Connecting student founders with global startup advisors and angel investors.",
    socials: {
      linkedin: "https://linkedin.com",
    },
  },
  {
    id: "ws-3",
    name: "Ishita Chatterjee",
    role: "Ideation Facilitator",
    category: "workshop",
    department: "Electrical Engineering",
    academicYear: "2nd Year • Class of 2029",
    bio: "Guiding teams through design thinking and sustainable business model canvas.",
    socials: {
      linkedin: "https://linkedin.com",
    },
  },

  // 5. TECH TEAM
  {
    id: "tech-1",
    name: "Yogesh Kumar",
    role: "Technical Lead",
    category: "tech",
    department: "Computer Science & Engineering",
    academicYear: "3rd Year • Class of 2028",
    bio: "Architecting web infrastructure, full-stack systems, and portal security.",
    featured: true,
    socials: {
      linkedin: "https://linkedin.com",
      github: "https://github.com",
      email: "yogesh.kumar.cse28@heritageit.edu.in",
    },
  },
  {
    id: "tech-2",
    name: "Ritabrata Dey",
    role: "Full Stack Developer",
    category: "tech",
    department: "Computer Science & Engineering",
    academicYear: "2nd Year • Class of 2029",
    bio: "Building responsive interfaces, real-time rosters, and API endpoints.",
    socials: {
      linkedin: "https://linkedin.com",
      github: "https://github.com",
    },
  },
  {
    id: "tech-3",
    name: "Soumyadeep Das",
    role: "Platform & DevOps Engineer",
    category: "tech",
    department: "Information Technology",
    academicYear: "2nd Year • Class of 2029",
    bio: "Ensuring 99.9% uptime, cloud hosting, and smooth database operations.",
    socials: {
      linkedin: "https://linkedin.com",
      github: "https://github.com",
    },
  },

  // 6. DESIGN TEAM
  {
    id: "des-1",
    name: "Sagnik Dutta",
    role: "Creative & Design Lead",
    category: "design",
    department: "Applied Electronics & Instrumentation",
    academicYear: "3rd Year • Class of 2028",
    bio: "Directing the official visual aesthetics, color palettes, and cinematic creative campaigns.",
    socials: {
      linkedin: "https://linkedin.com",
      instagram: "https://instagram.com",
      portfolio: "https://behance.net",
    },
  },
  {
    id: "des-2",
    name: "Debolina Bose",
    role: "UI/UX & Brand Designer",
    category: "design",
    department: "Computer Science & Engineering",
    academicYear: "2nd Year • Class of 2029",
    bio: "Designing interactive web aesthetics, typography systems, and motion assets.",
    socials: {
      linkedin: "https://linkedin.com",
      instagram: "https://instagram.com",
    },
  },
  {
    id: "des-3",
    name: "Subham Mallick",
    role: "Motion Graphics & Media Designer",
    category: "design",
    department: "Mechanical Engineering",
    academicYear: "2nd Year • Class of 2029",
    bio: "Creating high-octane teasers, stage visual loops, and promo animations.",
    socials: {
      instagram: "https://instagram.com",
      portfolio: "https://behance.net",
    },
  },
];
