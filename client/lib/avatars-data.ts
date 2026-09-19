export interface AvatarPreset {
  id: string;
  name: string;
  roleTag: string;
  image: string;
  glowColor: string;
  badge: string;
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
  icon: "phoenix" | "crown" | "lightning" | "rocket" | "leaf" | "atom" | "sword" | "dragon";
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "visionary-ceo",
    name: "Kira",
    roleTag: "Valkyrie",
    image: "/assets/avatars/avatar-visionary-ceo.png",
    glowColor: "rgba(242, 0, 137, 0.7)",
    badge: "Kira",
  },
  {
    id: "ai-architect",
    name: "Kael",
    roleTag: "Architect",
    image: "/assets/avatars/avatar-ai-architect.png",
    glowColor: "rgba(56, 189, 248, 0.7)",
    badge: "Kael",
  },
  {
    id: "growth-strategist",
    name: "Roxie",
    roleTag: "Hacker",
    image: "/assets/avatars/avatar-growth-strategist.png",
    glowColor: "rgba(236, 72, 153, 0.7)",
    badge: "Roxie",
  },
  {
    id: "green-innovator",
    name: "Zoe",
    roleTag: "Eco",
    image: "/assets/avatars/avatar-green-innovator.png",
    glowColor: "rgba(16, 185, 129, 0.7)",
    badge: "Zoe",
  },
  {
    id: "fintech-hustler",
    name: "Leo",
    roleTag: "Strategist",
    image: "/assets/avatars/avatar-fintech-hustler.png",
    glowColor: "rgba(245, 158, 11, 0.7)",
    badge: "Leo",
  },
  {
    id: "ui-designer",
    name: "Maya",
    roleTag: "Designer",
    image: "/assets/avatars/avatar-ui-designer.png",
    glowColor: "rgba(168, 85, 247, 0.7)",
    badge: "Maya",
  },
  {
    id: "social-catalyst",
    name: "Ren",
    roleTag: "Catalyst",
    image: "/assets/avatars/avatar-social-catalyst.png",
    glowColor: "rgba(244, 63, 94, 0.7)",
    badge: "Ren",
  },
  {
    id: "deeptech-scientist",
    name: "Viktor",
    roleTag: "Scientist",
    image: "/assets/avatars/avatar-deeptech-scientist.png",
    glowColor: "rgba(129, 140, 248, 0.7)",
    badge: "Viktor",
  },
  {
    id: "aura-boy",
    name: "Nova",
    roleTag: "Aura",
    image: "/assets/avatars/aura-boy.png",
    glowColor: "rgba(242, 0, 137, 0.75)",
    badge: "Nova",
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
