import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProfileBySlug, getAllProfileSlugs, getAllProfiles } from "@/lib/profile-data";
import ProfileLanyardCard from "@/components/profile/ProfileLanyardCard";
import SiteHeader from "@/components/SiteHeader";
import AnimatedGradient from "@/components/ui/animated-gradient";

interface TeamDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllProfileSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TeamDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  if (!profile) {
    return {
      title: "Team Member Not Found | Hult Prize HITK",
    };
  }

  return {
    title: `${profile.name} - ${profile.designation} | Hult Prize HITK Team`,
    description: profile.quote || `${profile.name}, ${profile.designation} at Hult Prize HITK Organizing Committee.`,
  };
}

export default async function TeamMemberDetailPage({ params }: TeamDetailPageProps) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  if (!profile) {
    const allProfiles = getAllProfiles();
    return (
      <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-bold mb-2 font-[family-name:var(--font-google-sans)]">Team Member Not Found</h1>
          <p className="text-sm text-white/60 mb-6">
            No profile found for <span className="text-[#f20089] font-mono">/team/{slug}</span>.
          </p>
          {allProfiles.length > 0 && (
            <div className="mb-6 text-left">
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 font-mono">Available Team Members:</p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {allProfiles.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/team/${p.slug}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-[#f20089] hover:bg-[#f20089]/10 transition-colors"
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs text-white/50">{p.designation}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Link
            href="/team"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f20089] to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#f20089]/30 hover:scale-105 transition-all font-[family-name:var(--font-google-sans)]"
          >
            ← Back to Organizing Committee
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden flex flex-col justify-between selection:bg-[#f20089] selection:text-white">
      {/* 
        WebGL Aurora Animated Background (Fluid Pink & Deep Purple Swirls)
      */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 18,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/75" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85" />
      </div>

      {/* Top Header Navbar */}
      <SiteHeader />

      {/* Sub-header navigation breadcrumb */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/team"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-1.5 text-xs font-semibold text-white/90 hover:text-white backdrop-blur-md transition-all shadow-sm group"
        >
          <span className="text-pink-400 group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to Organizing Committee</span>
        </Link>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-[11px] font-mono text-pink-300">
          <span>🪪</span>
          <span>Interactive 3D ID Badge</span>
        </span>
      </div>

      {/* Main Layout: Unified 3D lanyard space and frosted info card */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 py-2 flex-1 flex flex-col lg:flex-row items-center justify-between min-h-[750px] lg:min-h-[820px]">
        {/* Full-width 3D Canvas Layer */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
          <ProfileLanyardCard profile={profile} />
        </div>

        {/* Left spacing area on desktop (card hangs here naturally) */}
        <div className="w-full lg:w-1/2 h-[420px] lg:h-auto pointer-events-none shrink-0" />

        {/* Right: Frosted Profile Card */}
        <div className="relative z-10 w-full lg:w-1/2 flex justify-center lg:justify-end py-6 pointer-events-auto">
          <div className="w-full max-w-lg rounded-[36px] border border-white/10 bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-black/70 p-7 sm:p-10 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center text-center">
            {/* Subtle top inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-[#f20089]/60 to-transparent blur-sm pointer-events-none" />

            {/* Card Header: Logos row */}
            <div className="w-full flex items-center justify-between mb-8 px-1">
              {/* Left logo marks */}
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-sm sm:text-base tracking-tighter italic text-white/90">
                  EF
                </span>
                <div className="h-4 w-px bg-white/20" />
                <div className="relative aspect-[1024/895] h-5 sm:h-6 opacity-90">
                  <Image
                    src="/hitk-25-logo.png"
                    alt="Heritage Crest"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Right Hult Prize logo */}
              <div className="relative aspect-[1080/659] h-6 sm:h-7 opacity-95">
                <Image
                  src="/Hult-Prize.png"
                  alt="Hult Prize Logo"
                  fill
                  sizes="60px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Name */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-pink-100 font-[family-name:var(--font-google-sans)]">
              {profile.name}
            </h1>

            {/* Designation / Title */}
            <h2 className="text-base sm:text-lg font-normal tracking-[0.2em] text-pink-300/90 font-[family-name:var(--font-cinzel)] uppercase mb-3">
              {profile.designation}
            </h2>

            {/* Department / Academic Year tags */}
            {(profile.department || profile.academicYear) && (
              <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
                {profile.department && (
                  <span className="rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-[11px] text-white/70">
                    {profile.department}
                  </span>
                )}
                {profile.academicYear && (
                  <span className="rounded-full bg-[#f20089]/15 border border-[#f20089]/30 px-3 py-1 text-[11px] font-mono text-pink-300">
                    🎓 {profile.academicYear}
                  </span>
                )}
              </div>
            )}

            {/* Quote Container Box */}
            <div className="w-full rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md p-4 sm:p-5 mb-8 flex items-center gap-4 text-left shadow-inner">
              <span className="text-3xl sm:text-4xl leading-none text-white/90 font-serif font-black select-none shrink-0">
                &ldquo;&ldquo;
              </span>
              <p className="text-xs sm:text-sm text-white/80 italic line-clamp-3 leading-relaxed font-sans">
                {profile.quote || "Leading innovation, social impact, and entrepreneurial change through Hult Prize OnCampus."}
              </p>
            </div>

            {/* Social Media Rounded App Icons */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap mb-4">
              {/* LinkedIn Button */}
              {profile.socialLinks?.linkedin && (
                <a
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${profile.name} LinkedIn`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-[16px] bg-[#0077b5] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-white"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
              )}

              {/* Instagram Button */}
              {profile.socialLinks?.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${profile.name} Instagram`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-[16px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-white"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}

              {/* Snapchat Button */}
              {profile.socialLinks?.snapchat && (
                <a
                  href={profile.socialLinks.snapchat}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${profile.name} Snapchat`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-[16px] bg-[#fffc00] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-black"
                >
                  <svg className="h-6 w-6 sm:h-7 sm:w-7 fill-black" viewBox="0 0 24 24">
                    <path d="M12.003 2c-3.79 0-6.195 2.766-6.195 5.922 0 1.25.447 2.628.784 3.493.125.322-.055.49-.317.575-.526.17-1.46.543-1.892 1.348-.308.577-.075 1.157.391 1.433 1.05.623 2.502.43 3.018 1.127.34.46.126 1.137-.96 1.875-.365.249-.556.55-.556.883 0 .782.95 1.205 2.146 1.312.39.035.795.052 1.218.052.41 0 .805-.017 1.185-.052 1.196-.107 2.146-.53 2.146-1.312 0-.333-.19-.634-.556-.883-1.086-.738-1.3-1.415-.96-1.875.516-.697 1.968-.504 3.018-1.127.466-.276.699-.856.39-1.433-.431-.805-1.365-1.178-1.891-1.348-.262-.085-.442-.253-.317-.575.337-.865.784-2.243.784-3.493 0-3.156-2.404-5.922-6.195-5.922z" />
                  </svg>
                </a>
              )}

              {/* GitHub Button */}
              {profile.socialLinks?.github && (
                <a
                  href={profile.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${profile.name} GitHub`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-[16px] bg-[#24292e] border border-white/10 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-white"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </a>
              )}

              {/* X (Twitter) Button */}
              {(profile.socialLinks?.x || profile.socialLinks?.twitter) && (
                <a
                  href={profile.socialLinks.x || profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${profile.name} X`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-[16px] bg-black border border-white/20 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-white"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}

              {/* Email Button */}
              {profile.socialLinks?.email && (
                <a
                  href={`mailto:${profile.socialLinks.email}`}
                  aria-label={`Email ${profile.name}`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-[16px] bg-[#f20089]/20 hover:bg-[#f20089]/35 border border-[#f20089]/50 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-white"
                >
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </a>
              )}
            </div>

            {/* Back to team button in card */}
            <div className="pt-2 border-t border-white/5 w-full mt-2">
              <Link
                href="/team"
                className="text-xs text-white/50 hover:text-white transition-colors inline-flex items-center gap-1 font-medium"
              >
                <span>← All Organizing Committee Members</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="py-2" />
    </main>
  );
}
