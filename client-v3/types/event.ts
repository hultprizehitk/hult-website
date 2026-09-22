import { EventTag } from "@/lib/constants";

export interface PublicEvent {
  _id: string;
  title: string;
  tag?: EventTag | string;
  date?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  description?: string;
  link?: string;
  registrationStatus?: "open" | "closed" | "extended" | "upcoming";
  registrationDeadline?: string;
  minTeamMembers?: number;
  maxTeamMembers?: number;
}
