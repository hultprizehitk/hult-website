import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const googleSans = localFont({
  src: [
    { path: "./fonts/GoogleSans-Regular.ttf", weight: "400" },
    { path: "./fonts/GoogleSans-Medium.ttf", weight: "500" },
    { path: "./fonts/GoogleSans-SemiBold.ttf", weight: "600" },
    { path: "./fonts/GoogleSans-Bold.ttf", weight: "700" },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hult Prize Quiz",
  description: "Live quiz",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${googleSans.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
