export type TeamCategory =
  | "cd"
  | "dcd"
  | "event_management"
  | "workshop"
  | "tech"
  | "design";

export interface TeamMember {
  id: string;
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
