export interface PublicEvent {
  _id: string;
  title: string;
  tag: string;
  date: string;
  venue: string;
  description: string;
  link?: string;
  registrationStatus: "open" | "closed" | "extended" | "upcoming";
  registrationDeadline?: string;
  minTeamMembers: number;
  maxTeamMembers: number;
  featured?: boolean;
}

export const INITIAL_EVENTS: PublicEvent[] = [
  {
    _id: "evt-pitch-2027",
    title: "Flagship OnCampus Pitch Challenge 2027",
    tag: "Flagship Competition",
    date: "November 14, 2026 • 10:00 AM IST",
    venue: "Swami Vivekananda Auditorium, Heritage Institute",
    description:
      "The premier social entrepreneurship showdown. Compete with top student innovators to pitch scalable business models aligned with the UN Sustainable Development Goals for a chance to represent Heritage at the Regional Summits.",
    registrationStatus: "open",
    registrationDeadline: "November 05, 2026",
    minTeamMembers: 3,
    maxTeamMembers: 5,
    featured: true,
  },
  {
    _id: "evt-quiz-innovation",
    title: "Global Social Impact Quiz Bowl",
    tag: "Competition",
    date: "October 22, 2026 • 2:30 PM IST",
    venue: "Seminar Hall 1, Central Block",
    description:
      "An exhilarating, fast-paced trivia challenge covering social enterprise history, sustainable innovation, global climate tech, and market-disrupting startups.",
    registrationStatus: "extended",
    registrationDeadline: "October 18, 2026",
    minTeamMembers: 2,
    maxTeamMembers: 4,
    featured: false,
  },
  {
    _id: "evt-workshop-ideation",
    title: "Idea-to-Pitch Masterclass & Design Thinking",
    tag: "Hands-on Workshop",
    date: "October 30, 2026 • 4:00 PM IST",
    venue: "Innovation Lab 3 & Hybrid Live Stream",
    description:
      "Step-by-step masterclass by industry venture capitalists and past global finalists on transforming raw campus ideas into investment-ready pitch decks and financial models.",
    registrationStatus: "open",
    registrationDeadline: "October 28, 2026",
    minTeamMembers: 1,
    maxTeamMembers: 5,
    featured: false,
  },
  {
    _id: "evt-expo-hack",
    title: "Campus Social Ventures Expo & Prototype Day",
    tag: "Exhibition",
    date: "December 04, 2026 • 11:00 AM IST",
    venue: "Central Lawn & Gallery Courtyard",
    description:
      "Showcase working prototypes, gather early campus customer validation, and connect with angel investors and mentors from across Eastern India's startup ecosystem.",
    registrationStatus: "closed",
    registrationDeadline: "September 30, 2026",
    minTeamMembers: 2,
    maxTeamMembers: 6,
    featured: false,
  },
];
