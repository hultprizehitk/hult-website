export interface AvatarPreset {
  id: string;
  name: string;
  roleTag: string;
  image: string;
  glowColor: string;
  badge: string;
  description: string;
}

export interface CrestPreset {
  id: string;
  name: string;
  image: string;
  themeColor: string;
  tagline: string;
}

export interface CustomTeamBadge {
  shape: "shield" | "banner" | "hexagon" | "diamond" | "crown";
  primaryColor: string;
  accentColor: string;
  pattern: "stripes" | "hex" | "starburst" | "diagonal" | "gradient";
  icon: "phoenix" | "crown" | "lightning" | "rocket" | "leaf" | "atom" | "sword" | "diamond";
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "visionary-ceo",
    name: "The Visionary CEO",
    roleTag: "Pitch Lead / CEO",
    image: "/assets/avatars/avatar-visionary-ceo.png",
    glowColor: "rgba(242, 0, 137, 0.6)",
    badge: "👑 Visionary Leader",
    description: "Master storyteller, pitch defender, and strategic team captain.",
  },
  {
    id: "ai-architect",
    name: "The AI & Tech Architect",
    roleTag: "CTO / Tech Lead",
    image: "/assets/avatars/avatar-ai-architect.png",
    glowColor: "rgba(56, 189, 248, 0.6)",
    badge: "⚡ Tech Architect",
    description: "Deep learning engineer, full-stack builder, and system architect.",
  },
  {
    id: "growth-strategist",
    name: "Growth Strategist",
    roleTag: "CMO / Marketing",
    image: "/assets/avatars/avatar-growth-strategist.png",
    glowColor: "rgba(236, 72, 153, 0.6)",
    badge: "📈 Growth Hacker",
    description: "User acquisition expert, viral campaign strategist, and brand lead.",
  },
  {
    id: "green-innovator",
    name: "CleanTech Innovator",
    roleTag: "SDG & Sustainability",
    image: "/assets/avatars/avatar-green-innovator.png",
    glowColor: "rgba(16, 185, 129, 0.6)",
    badge: "🌿 Bio Specialist",
    description: "Eco-system engineer, circular economy builder, and SDG specialist.",
  },
  {
    id: "fintech-hustler",
    name: "FinTech Strategist",
    roleTag: "CFO / Finance",
    image: "/assets/avatars/avatar-fintech-hustler.png",
    glowColor: "rgba(245, 158, 11, 0.6)",
    badge: "🪙 Financial Lead",
    description: "Unit economics wizard, TAM/SAM sizing lead, and valuation hacker.",
  },
  {
    id: "ui-designer",
    name: "Visual Storyteller",
    roleTag: "UI/UX & Product",
    image: "/assets/avatars/avatar-ui-designer.png",
    glowColor: "rgba(168, 85, 247, 0.6)",
    badge: "🎨 Product Designer",
    description: "3D visualizer, UX architect, and slide deck aesthetic lead.",
  },
  {
    id: "social-catalyst",
    name: "Social Impact Champion",
    roleTag: "Community Lead",
    image: "/assets/avatars/avatar-social-catalyst.png",
    glowColor: "rgba(244, 63, 94, 0.6)",
    badge: "❤️ Impact Catalyst",
    description: "Grassroots researcher, field tester, and social impact champion.",
  },
  {
    id: "deeptech-scientist",
    name: "DeepTech Scientist",
    roleTag: "R&D Specialist",
    image: "/assets/avatars/avatar-deeptech-scientist.png",
    glowColor: "rgba(129, 140, 248, 0.6)",
    badge: "🔬 R&D Researcher",
    description: "Hardware developer, lab scientist, and patent researcher.",
  },
  {
    id: "aura-boy",
    name: "Aura Innovator",
    roleTag: "Venture Scout",
    image: "/assets/avatars/aura-boy.png",
    glowColor: "rgba(242, 0, 137, 0.7)",
    badge: "✨ Aura Founder",
    description: "High-energy venture scout and competitive pitch finalist.",
  },
];

export const CREST_PRESETS: CrestPreset[] = [
  {
    id: "crest-phoenix",
    name: "Phoenix Guild Crest",
    image: "/assets/crests/crest-phoenix.png",
    themeColor: "#f20089",
    tagline: "Resilient Social Founders",
  },
  {
    id: "crest-cyber-shield",
    name: "Cyber Shield Guild",
    image: "/assets/crests/crest-cyber-shield.png",
    themeColor: "#38bdf8",
    tagline: "DeepTech & AI Defense",
  },
  {
    id: "crest-gaia-leaf",
    name: "Gaia Impact Crest",
    image: "/assets/crests/crest-gaia-leaf.png",
    themeColor: "#10b981",
    tagline: "Clean Sustainability League",
  },
  {
    id: "crest-nexus-crown",
    name: "Nexus Leader Crown",
    image: "/assets/crests/crest-nexus-crown.png",
    themeColor: "#f59e0b",
    tagline: "UN HQ Global Champions",
  },
];
