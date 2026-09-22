export interface ProfileSocialLinks {
  instagram?: string;
  linkedin?: string;
  snapchat?: string; // or sc
  github?: string;
  x?: string;
  twitter?: string;
  email?: string;
  portfolio?: string;
}

export interface ProfileData {
  slug: string; // URL path segment e.g. "bhoomi-ladia", "harsh-raj"
  name: string;
  designation: string;
  quote?: string;
  image: string; // URL or path in public folder e.g. "/team/bhoomi.jpg"
  department?: string;
  academicYear?: string;
  bio?: string;
  socialLinks: ProfileSocialLinks;
  /**
   * Optional custom assets for the 3D Lanyard ID Card
   */
  lanyard?: {
    frontImage?: string;
    backImage?: string;
    lanyardImage?: string;
    themeColor?: string;
  };
}
