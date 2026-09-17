import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProfileBySlug, getAllProfileSlugs, getAllProfiles } from "@/lib/profile-data";
import ProfileLanyardCard from "@/components/profile/ProfileLanyardCard";
import SiteHeader from "@/components/SiteHeader";
import AnimatedGradient from "@/components/ui/animated-gradient";

interface ProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllProfileSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  if (!profile) {
    return {
      title: "Profile Not Found | Hult Prize HITK",
    };
  }

  return {
    title: `${profile.name} - ${profile.designation} | Hult Prize HITK`,
    description: profile.quote || `${profile.name}, ${profile.designation} at Hult Prize HITK.`,
  };
}

export default async function ProfileDetailPage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  if (!profile) {
    const allProfiles = getAllProfiles();
    return (
      <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-sm text-white/60 mb-6">
            No profile found for <span className="text-[#f20089] font-mono">/profile/{slug}</span>.
          </p>
          <div className="mb-6 text-left">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Available Profiles:</p>
            <div className="flex flex-col gap-2">
              {allProfiles.map((p) => (
                <Link
                  key={p.slug}
                  href={`/profile/${p.slug}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-[#f20089] hover:bg-[#f20089]/10 transition-colors"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-white/50">{p.designation}</span>
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden flex flex-col justify-between selection:bg-[#f20089] selection:text-white">
      {/* 
        ========================================================================
        WebGL Aurora Animated Background (Fluid Pink & Deep Purple Swirls)
        Same as Login / Signup Page
        ========================================================================
      */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 18,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        {/* Soft atmospheric vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/75" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85" />
      </div>

      {/* Top Header Navbar: Same official site banner */}
      <SiteHeader />

      {/* Main Layout: Unified space without column barrier */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 py-2 flex-1 flex flex-col lg:flex-row items-center justify-between min-h-[750px] lg:min-h-[820px]">
        {/* Full-width 3D Canvas Layer spanning across the entire space so card can be dragged over text */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
          <ProfileLanyardCard profile={profile} />
        </div>

        {/* Left spacing area on desktop (card hangs here naturally) */}
        <div className="w-full lg:w-1/2 h-[420px] lg:h-auto pointer-events-none shrink-0" />

        {/* Right: Frosted Profile Card matching the user's design */}
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
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-pink-100">
                {profile.name}
              </h1>

              {/* Designation / Title */}
              <h2 className="text-base sm:text-xl font-normal tracking-[0.2em] text-white/85 font-[family-name:var(--font-cinzel)] uppercase mb-7">
                {profile.designation}
              </h2>

              {/* Quote Container Box */}
              <div className="w-full rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md p-4 sm:p-5 mb-8 flex items-center gap-4 text-left shadow-inner">
                <span className="text-3xl sm:text-4xl leading-none text-white/90 font-serif font-black select-none shrink-0">
                  &ldquo;&ldquo;
                </span>
                <p className="text-xs sm:text-sm text-white/80 italic line-clamp-3 leading-relaxed">
                  {profile.quote || "Leading innovation, social impact, and entrepreneurial change through Hult Prize OnCampus."}
                </p>
              </div>

              {/* Social Media Rounded App Icons */}
              <div className="flex items-center justify-center gap-4 sm:gap-5">
                {/* Instagram Button */}
                {profile.socialLinks?.instagram ? (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-[18px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                  >
                    <svg className="h-6 w-6 sm:h-7 sm:w-7 text-white fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                ) : (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-[18px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-lg opacity-80">
                    <svg className="h-6 w-6 sm:h-7 sm:w-7 text-white fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                )}

                {/* Snapchat Button */}
                {profile.socialLinks?.snapchat ? (
                  <a
                    href={profile.socialLinks.snapchat}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Snapchat"
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-[18px] bg-[#fffc00] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-black"
                  >
                    <svg className="h-7 w-7 sm:h-8 sm:w-8 fill-black" viewBox="0 0 24 24">
                      <path d="M12.003 2c-3.79 0-6.195 2.766-6.195 5.922 0 1.25.447 2.628.784 3.493.125.322-.055.49-.317.575-.526.17-1.46.543-1.892 1.348-.308.577-.075 1.157.391 1.433 1.05.623 2.502.43 3.018 1.127.34.46.126 1.137-.96 1.875-.365.249-.556.55-.556.883 0 .782.95 1.205 2.146 1.312.39.035.795.052 1.218.052.41 0 .805-.017 1.185-.052 1.196-.107 2.146-.53 2.146-1.312 0-.333-.19-.634-.556-.883-1.086-.738-1.3-1.415-.96-1.875.516-.697 1.968-.504 3.018-1.127.466-.276.699-.856.39-1.433-.431-.805-1.365-1.178-1.891-1.348-.262-.085-.442-.253-.317-.575.337-.865.784-2.243.784-3.493 0-3.156-2.404-5.922-6.195-5.922z" />
                    </svg>
                  </a>
                ) : (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-[18px] bg-[#fffc00] flex items-center justify-center shadow-lg text-black opacity-80">
                    <svg className="h-7 w-7 sm:h-8 sm:w-8 fill-black" viewBox="0 0 24 24">
                      <path d="M12.003 2c-3.79 0-6.195 2.766-6.195 5.922 0 1.25.447 2.628.784 3.493.125.322-.055.49-.317.575-.526.17-1.46.543-1.892 1.348-.308.577-.075 1.157.391 1.433 1.05.623 2.502.43 3.018 1.127.34.46.126 1.137-.96 1.875-.365.249-.556.55-.556.883 0 .782.95 1.205 2.146 1.312.39.035.795.052 1.218.052.41 0 .805-.017 1.185-.052 1.196-.107 2.146-.53 2.146-1.312 0-.333-.19-.634-.556-.883-1.086-.738-1.3-1.415-.96-1.875.516-.697 1.968-.504 3.018-1.127.466-.276.699-.856.39-1.433-.431-.805-1.365-1.178-1.891-1.348-.262-.085-.442-.253-.317-.575.337-.865.784-2.243.784-3.493 0-3.156-2.404-5.922-6.195-5.922z" />
                    </svg>
                  </div>
                )}

                {/* X (Twitter) Button */}
                {profile.socialLinks?.x || profile.socialLinks?.twitter ? (
                  <a
                    href={profile.socialLinks.x || profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X"
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-[18px] bg-black border border-white/20 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-white"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                ) : (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-[18px] bg-black border border-white/20 flex items-center justify-center shadow-lg text-white opacity-80">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Bottom padding */}
      <div className="py-2" />
    </main>
  );
}
