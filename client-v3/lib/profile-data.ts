import { ProfileData } from "@/types";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";

/**
 * Team Profile Records
 * Add or customize team member profiles below.
 * Each entry maps directly to /team/[slug] (e.g. /team/bhoomi-ladia)
 */
export const PROFILES_DATA: Record<string, ProfileData> = {
  "pratyush-sarkar": {
    slug: "pratyush-sarkar",
    name: "Pratyush Sarkar",
    designation: "Campus Director",
    quote: "Steering the overall strategic vision, university relations, and international liaison for Hult Prize OnCampus at Heritage Institute of Technology.",
    image: "/team/placeholder.png",
    department: "Executive Directorship",
    academicYear: "Final Year",
    bio: "Steering the overall strategic vision, university relations, and international liaison for Hult Prize OnCampus at Heritage Institute of Technology.",
    socialLinks: {
      linkedin: "https://linkedin.com/in/pratyush-sarkar",
      email: "pratyush@hultprizehitk.com",
    },
    lanyard: {
      frontImage: "/team/placeholder.png",
      backImage: "/Hult-Prize.png",
      lanyardImage: "/assets/lanyard/lanyard.png",
      themeColor: "#f59e0b",
    },
  },
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
  "jhalak-dutta": {
    slug: "jhalak-dutta",
    name: "Prof. Jhalak Dutta",
    designation: "Faculty Coordinator",
    quote: "Fostering academic excellence, student innovation, and guiding young minds to create sustainable global impact through social entrepreneurship.",
    image: "/team/placeholder.png",
    department: "Computer Science & Engineering (CSE)",
    academicYear: "Faculty Coordinator",
    bio: "Assistant Professor in the Department of Computer Science & Engineering at Heritage Institute of Technology. Serving as the official Faculty Coordinator for Hult Prize OnCampus at HITK, actively mentoring student innovators, researchers, and entrepreneurial ventures.",
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/jhalak-dutta",
      email: "jhalak.dutta@heritageit.edu",
    },
    lanyard: {
      frontImage: "/team/placeholder.png",
      backImage: "/Hult-Prize.png",
      lanyardImage: "/assets/lanyard/lanyard.png",
      themeColor: "#00d2ff",
    },
  },
};

/**
 * Retrieve a single profile by its URL slug.
 * Checks PROFILES_DATA first, then falls back to INITIAL_TEAM_MEMBERS.
 */
export function getProfileBySlug(slug: string): ProfileData | undefined {
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().trim();
  if (PROFILES_DATA[normalizedSlug]) {
    return PROFILES_DATA[normalizedSlug];
  }

  // Auto-generate profile from INITIAL_TEAM_MEMBERS in team-data.ts
  const member = INITIAL_TEAM_MEMBERS.find(
    (m) =>
      (m.slug && m.slug.toLowerCase().trim() === normalizedSlug) ||
      m.id.toLowerCase().trim() === normalizedSlug
  );

  if (member) {
    return {
      slug: member.slug || member.id,
      name: member.name,
      designation: member.role,
      quote:
        member.bio ||
        "Leading innovation, social impact, and entrepreneurial change through Hult Prize OnCampus.",
      image: member.image || "/team/placeholder.png",
      department: member.department,
      academicYear: member.academicYear,
      bio: member.bio,
      socialLinks: {
        linkedin: member.socials?.linkedin,
        github: member.socials?.github,
        instagram: member.socials?.instagram,
        email: member.socials?.email,
        portfolio: member.socials?.portfolio,
      },
      lanyard: {
        frontImage: member.image || "/team/placeholder.png",
        backImage: "/Hult-Prize.png",
        lanyardImage: "/assets/lanyard/lanyard.png",
        themeColor: "#f20089",
      },
    };
  }

  return undefined;
}

/**
 * Retrieve all registered profile data objects.
 */
export function getAllProfiles(): ProfileData[] {
  const profilesMap = new Map<string, ProfileData>();

  // Add explicitly configured profiles
  for (const [slug, p] of Object.entries(PROFILES_DATA)) {
    profilesMap.set(slug, p);
  }

  // Add members from INITIAL_TEAM_MEMBERS that aren't already registered
  for (const m of INITIAL_TEAM_MEMBERS) {
    const slug = (m.slug || m.id).toLowerCase().trim();
    if (!profilesMap.has(slug)) {
      const generated = getProfileBySlug(slug);
      if (generated) profilesMap.set(slug, generated);
    }
  }

  return Array.from(profilesMap.values());
}

/**
 * Retrieve all registered profile slugs for static generation or sitemaps.
 */
export function getAllProfileSlugs(): string[] {
  const slugs = new Set<string>();
  for (const s of Object.keys(PROFILES_DATA)) slugs.add(s);
  for (const m of INITIAL_TEAM_MEMBERS) {
    if (m.slug) slugs.add(m.slug.toLowerCase().trim());
    else if (m.id) slugs.add(m.id.toLowerCase().trim());
  }
  return Array.from(slugs);
}
