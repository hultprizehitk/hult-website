import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    let eventData: {
      title: string;
      tag?: string;
      date?: string;
      venue?: string;
      description?: string;
      registrationStatus?: string;
      minMembers?: number;
      maxMembers?: number;
    } | null = null;

    if (id && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await connectDB();
        const doc = await Event.findById(id).lean();
        if (doc && doc.isPublished) {
          eventData = {
            title: doc.title,
            tag: doc.tag || "Flagship Event",
            date: doc.date || "Sep 30, 2026",
            venue: doc.venue || "SV Auditorium",
            description: doc.description || "",
            registrationStatus: doc.registrationStatus || "open",
            minMembers: doc.minTeamMembers || 2,
            maxMembers: doc.maxTeamMembers || 4,
          };
        }
      } catch (err) {
        console.error("Failed to fetch event for OG image:", err);
      }
    }

    const bgDark = "#0a0c14";
    const brandPink = "#f20089";
    const textMuted = "#94a3b8";

    if (eventData) {
      const isRegistrationClosed = eventData.registrationStatus === "closed";
      const isExtended = eventData.registrationStatus === "extended";

      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: bgDark,
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(242, 0, 137, 0.22), transparent 45%), radial-gradient(circle at 85% 80%, rgba(225, 29, 72, 0.18), transparent 45%)",
              padding: "60px 70px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              color: "#ffffff",
              boxSizing: "border-box",
            }}
          >
            {/* Top Bar: Brand + Tag + Status */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* Hult Prize HITK Wordmark */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#ffffff",
                  }}
                >
                  <span style={{ color: brandPink, marginRight: "8px" }}>HULT PRIZE</span>
                  <span>HITK</span>
                </div>

                {eventData.tag && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 16px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(242, 0, 137, 0.15)",
                      border: "1px solid rgba(242, 0, 137, 0.4)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#ff70c5",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {eventData.tag}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  backgroundColor: isRegistrationClosed
                    ? "rgba(244, 63, 94, 0.15)"
                    : isExtended
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(16, 185, 129, 0.15)",
                  border: isRegistrationClosed
                    ? "1px solid rgba(244, 63, 94, 0.4)"
                    : isExtended
                    ? "1px solid rgba(245, 158, 11, 0.4)"
                    : "1px solid rgba(16, 185, 129, 0.4)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isRegistrationClosed
                    ? "#fb7185"
                    : isExtended
                    ? "#fbbf24"
                    : "#34d399",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: isRegistrationClosed
                      ? "#fb7185"
                      : isExtended
                      ? "#fbbf24"
                      : "#34d399",
                  }}
                />
                <span>
                  {isRegistrationClosed
                    ? "Registrations Closed"
                    : isExtended
                    ? "Extended Deadline"
                    : "Registrations Open"}
                </span>
              </div>
            </div>

            {/* Middle: Title & Brief */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                maxWidth: "1050px",
                margin: "20px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                {eventData.title}
              </div>

              {eventData.description && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 20,
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.75)",
                  }}
                >
                  {eventData.description.length > 170
                    ? `${eventData.description.slice(0, 170)}...`
                    : eventData.description}
                </div>
              )}
            </div>

            {/* Bottom Meta Bar: Schedule + Venue + Team Roster */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              {/* Date */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 20px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: textMuted }}>
                  Date:
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginLeft: "6px" }}>
                  {eventData.date}
                </span>
              </div>

              {/* Venue */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 20px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: textMuted }}>
                  Venue:
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginLeft: "6px" }}>
                  {eventData.venue}
                </span>
              </div>

              {/* Team Size */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 20px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: textMuted }}>
                  Team:
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginLeft: "6px" }}>
                  {eventData.minMembers}–{eventData.maxMembers} Members
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  marginLeft: "auto",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              >
                Heritage Institute of Technology
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Fallback General Card (for /events without specific ID)
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: bgDark,
            backgroundImage:
              "radial-gradient(circle at 20% 25%, rgba(242, 0, 137, 0.22), transparent 50%), radial-gradient(circle at 80% 75%, rgba(225, 29, 72, 0.18), transparent 50%)",
            padding: "70px 80px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 22px",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ color: brandPink, marginRight: "10px" }}>HULT PRIZE</span>
              <span>ONCAMPUS</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              OnCampus Events &amp; Challenges
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                lineHeight: 1.5,
                color: "rgba(255, 255, 255, 0.75)",
                maxWidth: "900px",
              }}
            >
              Explore student entrepreneurship competitions, hackathons, and accelerator qualifiers at Heritage Institute of Technology.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: 16,
              color: textMuted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>Heritage Institute of Technology, Kolkata</span>
            <span style={{ color: "#ffffff", fontWeight: 700 }}>hultprizehitk.live</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG generation error:", error);
    return new Response("Failed to generate preview image", { status: 500 });
  }
}
