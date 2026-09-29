import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hult Prize HITK — Tourism & Industry Auction",
  description: "Live stage auction console, projector viewer, and results engine for Hult Prize HITK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090b10] text-slate-100 antialiased selection:bg-[#e4007f] selection:text-white">
        {children}
      </body>
    </html>
  );
}
