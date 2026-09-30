"use client";

import React, { Component, ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ProfileData } from "@/types";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class LanyardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("Lanyard 3D WebGL error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Dynamically import Lanyard with SSR disabled because it relies on WebGL and browser window
const DynamicLanyard = dynamic(() => import("@/components/lanyard/Lanyard"), {
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

  const fallbackUI = (
    <div className="flex h-full min-h-[300px] sm:min-h-[400px] w-full items-center justify-center p-4">
      <div className="relative h-64 w-48 rounded-3xl border border-white/20 bg-black/60 backdrop-blur-xl p-4 flex flex-col items-center justify-center shadow-2xl">
        {frontImage ? (
          <img src={frontImage} alt={profile.name} className="h-40 w-40 rounded-2xl object-cover object-top mb-3" />
        ) : (
          <div className="h-40 w-40 rounded-2xl bg-pink-500/20 flex items-center justify-center text-2xl font-bold text-pink-300 mb-3">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-bold text-white text-center truncate w-full">{profile.name}</span>
        <span className="text-[10px] text-pink-300 font-mono">{profile.designation}</span>
      </div>
    </div>
  );

  return (
    <div className={`relative w-full h-full min-h-[300px] sm:min-h-[380px] lg:min-h-[580px] flex items-center justify-center ${className}`}>
      <div className="w-full h-full">
        <LanyardErrorBoundary fallback={fallbackUI}>
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
        </LanyardErrorBoundary>
      </div>
    </div>
  );
}

