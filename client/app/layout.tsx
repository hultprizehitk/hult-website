import type { Metadata } from "next";
import { Montserrat, Geist, Geist_Mono, Anton, Pirata_One, Cinzel_Decorative, Rye } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const blubly = localFont({
  src: "../public/Blubly Demo.otf",
  variable: "--font-blubly",
  display: "swap",
});

const googleSans = localFont({
  src: [
    {
      path: "../public/fonts/GoogleSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/GoogleSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/GoogleSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/GoogleSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const pirataOne = Pirata_One({
  variable: "--font-pirata",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

const rye = Rye({
  variable: "--font-rye",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import SessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hultprizehitk.live"),
  title: {
    default: "Hult Prize | Heritage Institute of Technology",
    template: "%s | Hult Prize HITK",
  },
  description: "Official portal for Hult Prize OnCampus at Heritage Institute of Technology, Kolkata. Changing the world through social entrepreneurship.",
  keywords: [
    "Hult Prize",
    "Heritage Institute of Technology",
    "HITK",
    "Social Entrepreneurship",
    "OnCampus",
    "Startup Competition",
    "Kolkata",
  ],
  authors: [{ name: "Hult Prize HITK Team" }],
  openGraph: {
    title: "Hult Prize | Heritage Institute of Technology",
    description: "Official portal for Hult Prize OnCampus at Heritage Institute of Technology, Kolkata.",
    url: "https://www.hultprizehitk.live",
    siteName: "Hult Prize HITK",
    images: [
      {
        url: "/Hult-Prize.png",
        width: 1200,
        height: 630,
        alt: "Hult Prize HITK",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hult Prize | Heritage Institute of Technology",
    description: "Official portal for Hult Prize OnCampus at Heritage Institute of Technology, Kolkata.",
    images: ["/Hult-Prize.png"],
  },
  alternates: {
    canonical: "https://www.hultprizehitk.live",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${blubly.variable} ${montserrat.variable} ${anton.variable} ${googleSans.variable} ${pirataOne.variable} ${cinzelDecorative.variable} ${rye.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
