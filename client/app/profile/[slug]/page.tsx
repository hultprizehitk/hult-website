import { redirect } from "next/navigation";

interface LegacyProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Legacy Profile Route Redirect
 * /profile is reserved for authenticated student dashboard.
 * Team member profiles are served under /team/[slug].
 * This redirects any legacy /profile/[slug] URLs directly to /team/[slug].
 */
export default async function LegacyProfileRedirect({ params }: LegacyProfilePageProps) {
  const { slug } = await params;
  redirect(`/team/${slug}`);
}
