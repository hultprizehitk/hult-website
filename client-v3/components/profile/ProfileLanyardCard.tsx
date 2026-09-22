"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ProfileData } from "@/types";

// Dynamically import Lanyard with SSR disabled because it relies on WebGL and browser window
const DynamicLanyard = dynamic(() => import("@/components/Lanyard"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[300px] sm:min-h-[400px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f20089] border-t-transparent" />
      </div>
    </div>
  ),
});

interface ProfileLanyardCardProps {
  profile: ProfileData;
  className?: string;
}

export default function ProfileLanyardCard({ profile, className = "" }: ProfileLanyardCardProps) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Use member image if valid, or /Hult-Prize.png as fallback for front
  const frontImage =
    profile.image && profile.image !== "/team/placeholder.png"
      ? profile.image
      : "/Hult-Prize.png";
  const backImage = "/Hult-Prize.png";
  const lanyardImage = "/assets/lanyard/lanyard.png";

  return (
    <div className={`relative w-full h-full min-h-[300px] sm:min-h-[380px] lg:min-h-[580px] flex items-center justify-center ${className}`}>
      <div className="w-full h-full">
        <DynamicLanyard
          position={[0, 0, 19]}
          gravity={[0, -40, 0]}
          fov={20}
          transparent={true}
          frontImage={frontImage}
          backImage={backImage}
          lanyardImage={lanyardImage}
          lanyardWidth={isMobile ? 1.2 : 1.5}
          cardScale={isMobile ? 2.5 : 3.85}
          anchorX={isMobile ? 0 : -2.75}
        />
      </div>
    </div>
  );
}
