export type TeamCategory =
  | "faculty_coordinator"
  | "cd"
  | "dcd"
  | "workshop"
  | "event_management"
  | "social_pr"
  | "photography"
  | "tech"
  | "design"
  | "judges_support";

export interface TeamMember {
  id: string;
  slug?: string; // Maps to /team/[slug] interactive 3D ID Profile
  name: string;
  role: string;
  category: TeamCategory;
  department: string;
  academicYear?: string;
  image?: string;
  bio?: string;
  socials?: {
    linkedin?: string;
    github?: string;
    instagram?: string;
    email?: string;
    portfolio?: string;
  };
  featured?: boolean;
}

export interface TeamSectionConfig {
  key: TeamCategory;
  title: string;
  subtitle: string;
  badge: string;
  accentColor: string;
  gradientClass: string;
  borderClass: string;
  description: string;
}
