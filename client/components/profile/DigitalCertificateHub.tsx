"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import {
  Award,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  GraduationCap,
  Loader2,
} from "lucide-react";

interface DigitalCertificateHubProps {
  studentName: string;
  email: string;
  department?: string;
  registeredTeam?: {
    teamName: string;
    ventureName?: string;
    teamCode: string;
  } | null;
}

export default function DigitalCertificateHub({
  studentName,
  email,
  department = "Computer Science & Engineering",
  registeredTeam,
}: DigitalCertificateHubProps) {
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  // Generate deterministic unique certificate serial ID
  const certIdSeed = (email || "student@heritageit.edu.in").toLowerCase();
  let hash = 0;
  for (let i = 0; i < certIdSeed.length; i++) {
    hash = (hash << 5) - hash + certIdSeed.charCodeAt(i);
    hash |= 0;
  }
  const certSerial = `HITK-HULT-2027-${Math.abs(hash).toString(16).toUpperCase().padStart(6, "0")}`;

  const handleCopySerial = () => {
    navigator.clipboard.writeText(certSerial);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  const handleDownloadPNG = async () => {
    if (!certRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(certRef.current, {
        cacheBust: true,
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#09090b",
      });
      const link = document.createElement("a");
      link.download = `Hult_Prize_Certificate_${studentName.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download certificate image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLinkedInShare = () => {
    const title = encodeURIComponent("Hult Prize OnCampus Delegate 2027");
    const certUrl = encodeURIComponent(`https://hultprizehitk.live/profile?cert=${certSerial}`);
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=Hult%20Prize%20at%20Heritage%20Institute%20of%20Technology&issueYear=2027&issueMonth=9&certUrl=${certUrl}&certId=${certSerial}`;
    window.open(url, "_blank");
  };

  return (
    <section className="w-full bg-[#09090b] text-white p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#f20089]/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f20089]/20 border border-[#f20089]/50 text-[#f20089]">
              <Award className="w-3.5 h-3.5 text-[#f20089]" />
              Verified Certificate
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Your Certificate
          </h3>
        </div>

        {/* Serial Badge */}
        <div className="flex items-center gap-2 bg-[#121216] px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-mono">
          <span className="text-neutral-400">ID:</span>
          <span className="font-bold text-white tracking-wider">{certSerial}</span>
          <button
            onClick={handleCopySerial}
            className="ml-1 text-neutral-400 hover:text-[#f20089] transition-colors"
            title="Copy Serial ID"
          >
            {copiedSerial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* CERTIFICATE DISPLAY CARD */}
      <div className="mt-6">
        <div
          ref={certRef}
          id="hult-official-certificate"
          style={{ backgroundColor: "#09090b" }}
          className="relative overflow-hidden rounded-2xl border-2 border-[#f20089]/50 bg-gradient-to-br from-[#18101e] via-[#121216] to-[#09090b] p-6 sm:p-10 shadow-2xl space-y-6"
        >
          {/* Decorative Corner Framing */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#f20089]/60 pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#f20089]/60 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#f20089]/60 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#f20089]/60 pointer-events-none" />

          {/* Certificate Header Branding */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                <Image
                  src="/Hult-Prize.png"
                  alt="Hult Prize Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                  HULT PRIZE ONCAMPUS 2027
                </h4>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Heritage Institute of Technology • Kolkata
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-block whitespace-nowrap text-[10px] font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full uppercase">
                Delegate 2027
              </span>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="text-center py-4 space-y-3">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest block">
              This Certificate is Proudly Awarded To
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white bg-gradient-to-r from-white via-pink-100 to-[#f20089] bg-clip-text text-transparent">
              {studentName}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-xl mx-auto">
              In recognition of your active participation and pitch presentation at the{" "}
              <strong className="text-white font-semibold">Hult Prize OnCampus Competition</strong> at Heritage Institute of Technology.
            </p>

            {registeredTeam && (
              <div className="pt-2 flex items-center justify-center gap-3 text-xs font-mono flex-wrap">
                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-neutral-300">
                  Team: <strong className="text-white">{registeredTeam.teamName}</strong>
                </span>
                {registeredTeam.ventureName && (
                  <span className="bg-[#f20089]/15 border border-[#f20089]/30 px-3 py-1 rounded-lg text-[#f20089]">
                    Venture: <strong className="text-white">{registeredTeam.ventureName}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Certificate Signatures Footer */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <GraduationCap className="w-4 h-4 text-[#f20089]" />
              <span>{department}</span>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div className="text-center">
                <div className="w-28 border-b border-white/30 mb-1" />
                <span className="text-[10px] text-neutral-400 block font-mono">Campus Director</span>
              </div>
              <div className="text-center">
                <div className="w-28 border-b border-white/30 mb-1" />
                <span className="text-[10px] text-neutral-400 block font-mono">Faculty Coordinator</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3 flex-wrap">
        <button
          onClick={handleLinkedInShare}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/30"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share on LinkedIn
        </button>

        <button
          onClick={handleDownloadPNG}
          disabled={isDownloading}
          className="px-5 py-2.5 bg-[#f20089] hover:bg-[#d00076] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#f20089]/30"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Certificate
        </button>
      </div>
    </section>
  );
}




