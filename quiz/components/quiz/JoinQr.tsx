"use client";

import { QRCodeSVG } from "qrcode.react";
import { useOrigin } from "@/hooks/useOrigin";
import { playPath } from "@/lib/quiz/event";

export function JoinQr({ code, size = 220 }: { code: string; size?: number }) {
  const origin = useOrigin();
  const url = `${origin}${playPath(code)}`;
  if (!origin) return <div className="rounded-3xl bg-white/5" style={{ width: size + 32, height: size + 32 }} />;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-3xl bg-white p-4 shadow-2xl shadow-white/10">
        <QRCodeSVG value={url} size={size} level="M" />
      </div>
      <p className="font-mono text-xs text-neutral-400">{url.replace(/^https?:\/\//, "")}</p>
    </div>
  );
}
