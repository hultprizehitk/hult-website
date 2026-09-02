import { EventTag } from "@/lib/constants";

export interface EventItem {
  _id: string;
  title: string;
  tag: EventTag | string;
  date: string;
  venue: string;
  description: string;
  link?: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EventFormData {
  title: string;
  tag: EventTag | string;
  date: string;
  venue: string;
  description: string;
  link: string;
  isPublished: boolean;
  order: number;
}
