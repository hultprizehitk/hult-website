import { EventTag } from "@/lib/constants";

export interface TeamMemberItem {
  name: string;
  email?: string;
  department?: string;
  phone?: string;
  roll?: string;
  joinedAt?: string;
}

export interface RegisteredTeamItem {
  id: string;
  teamCode?: string;
  teamName: string;
  ventureName?: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  membersCount: number;
  department: string;
  members?: TeamMemberItem[];
  registeredAt: string;
  status: "confirmed" | "pending" | "waitlist";
}

export interface EventItem {
  _id: string;
  title: string;
  tag: EventTag | string;
  date: string;
  startDate?: string;
  endDate?: string;
  venue: string;
  description: string;
  link?: string;
  isPublished: boolean;
  order: number;
  registrationStatus?: "open" | "closed" | "extended" | "upcoming";
  registrationDeadline?: string;
  maxTeams?: number;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  registeredTeamsCount?: number;
  registeredTeams?: RegisteredTeamItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PublicEvent {
  _id: string;
  title: string;
  tag?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  description?: string;
  link?: string;
  registrationStatus?: "open" | "closed" | "extended" | "upcoming";
  registrationDeadline?: string;
  registeredTeamsCount?: number;
  maxTeams?: number;
  minTeamMembers?: number;
  maxTeamMembers?: number;
}
