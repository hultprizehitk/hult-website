import { ProfileData } from "@/types";

/**
 * Team Profile Records
 * Add or modify team member profiles below.
 * Each entry maps directly to /profile/[slug] (e.g. /profile/bhoomi-ladia)
 */
export const PROFILES_DATA: Record<string, ProfileData> = {
  "bhoomi-ladia": {
    slug: "bhoomi-ladia",
    name: "Bhoomi Ladia",
    designation: "Deputy Campus Director",
    quote: "Empowering visionary student entrepreneurs to solve the world's most pressing challenges.",
    image: "/team/bhoomi.jpg",
    department: "Computer Science & Engineering",
    academicYear: "Final Year",
    bio: "Passionate about building communities, driving high-impact social entrepreneurship, and bringing Hult Prize to new heights at Heritage Institute of Technology.",
    socialLinks: {
      linkedin: "https://linkedin.com/in/bhoomi-ladia",
      instagram: "https://instagram.com/bhoomi_ladia",
      snapchat: "https://snapchat.com/add/bhoomi_ladia",
      github: "https://github.com/bhoomi-ladia",
      x: "https://x.com/bhoomi_ladia",
      email: "bhoomi@hultprizehitk.com",
    },
    lanyard: {
      frontImage: "/team/bhoomi.jpg",
      backImage: "/Hult-Prize.png",
      lanyardImage: "/assets/lanyard/lanyard.png",
      themeColor: "#f20089",
    },
  },
  "harsh-raj": {
    slug: "harsh-raj",
    name: "Harsh Raj",
    designation: "Technical Lead",
    quote: "Transforming ambitious ideas into scalable, beautiful digital experiences.",
    image: "/team/harsh.jpg",
    department: "Information Technology",
    academicYear: "Final Year",
    bio: "Full-stack developer and tech enthusiast spearheading digital platforms, architecture, and technology initiatives for Hult Prize HITK.",
    socialLinks: {
      linkedin: "https://linkedin.com/in/harsh-raj",
      instagram: "https://instagram.com/harsh_raj",
      snapchat: "https://snapchat.com/add/harsh_raj",
      github: "https://github.com/harsh-raj",
      x: "https://x.com/harsh_raj",
      email: "harsh@hultprizehitk.com",
    },
    lanyard: {
      frontImage: "/team/harsh.jpg",
      backImage: "/Hult-Prize.png",
      lanyardImage: "/assets/lanyard/lanyard.png",
      themeColor: "#00d2ff",
    },
  },
};

/**
 * Retrieve a single profile by its URL slug.
 */
export function getProfileBySlug(slug: string): ProfileData | undefined {
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().trim();
  return PROFILES_DATA[normalizedSlug];
}

/**
 * Retrieve all registered profile data objects.
 */
export function getAllProfiles(): ProfileData[] {
  return Object.values(PROFILES_DATA);
}

/**
 * Retrieve all registered profile slugs for static generation or sitemaps.
 */
export function getAllProfileSlugs(): string[] {
  return Object.keys(PROFILES_DATA);
}
