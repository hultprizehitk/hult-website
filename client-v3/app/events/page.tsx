import type { Metadata, ResolvingMetadata } from "next";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import EventsClientPage from "./EventsClientPage";
import type { PublicEvent } from "@/types";

export type { PublicEvent };

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const rawEvent = searchParams?.event;
  const eventId = typeof rawEvent === "string" ? rawEvent : Array.isArray(rawEvent) ? rawEvent[0] : undefined;

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const baseUrl = host ? `${proto}://${host}` : "https://www.hultprizehitk.live";

  if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
    try {
      await connectDB();
      const event = await Event.findOne({ _id: eventId, isPublished: true }).lean();

      if (event) {
        const title = `${event.title} | Hult Prize HITK`;
        const description =
          event.description?.slice(0, 160) ||
          "Explore and register for social entrepreneurship events hosted by Hult Prize at Heritage Institute of Technology.";
        const ogUrl = `${baseUrl}/events?event=${event._id}`;
        const ogImageUrl = `${baseUrl}/og-landing.png`;

        return {
          title,
          description,
          openGraph: {
            title: event.title,
            description,
            url: ogUrl,
            siteName: "Hult Prize HITK",
            locale: "en_US",
            type: "website",
            images: [
              {
                url: ogImageUrl,
                secureUrl: ogImageUrl,
                width: 1200,
                height: 630,
                type: "image/png",
                alt: event.title,
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title: event.title,
            description,
            images: [ogImageUrl],
          },
        };
      }
    } catch (err) {
      console.error("Failed to generate event metadata for OpenGraph:", err);
    }
  }

  // Default metadata for /events
  const defaultOgImage = `${baseUrl}/og-landing.png`;
  return {
    title: "Events | Hult Prize HITK",
    description:
      "Explore on-campus entrepreneurship competitions, hackathons, and challenges hosted by Hult Prize at Heritage Institute of Technology.",
    openGraph: {
      title: "Events & Challenges | Hult Prize HITK",
      description:
        "Explore on-campus entrepreneurship competitions, hackathons, and challenges hosted by Hult Prize at Heritage Institute of Technology.",
      url: `${baseUrl}/events`,
      siteName: "Hult Prize HITK",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: defaultOgImage,
          secureUrl: defaultOgImage,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: "Hult Prize HITK Events",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Events & Challenges | Hult Prize HITK",
      description:
        "Explore on-campus entrepreneurship competitions, hackathons, and challenges hosted by Hult Prize at Heritage Institute of Technology.",
      images: [defaultOgImage],
    },
  };
}

export default async function EventsPage(props: Props) {
  const searchParams = await props.searchParams;
  const rawEvent = searchParams?.event;
  const eventId = typeof rawEvent === "string" ? rawEvent : Array.isArray(rawEvent) ? rawEvent[0] : null;

  return <EventsClientPage initialEventId={eventId} />;
}
