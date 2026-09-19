import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const name = searchParams.get("name") || "Heritage Student";
    const cert = searchParams.get("cert") || "HITK-HULT-2027-DELEGATE";
    const title = searchParams.get("title") || "Hult Prize OnCampus 2027";
    const campus = "Heritage Institute of Technology • Kolkata";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#09090b",
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(242, 0, 137, 0.25) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 40%)",
            padding: "50px 60px",
            boxSizing: "border-box",
            border: "6px solid #f20089",
            fontFamily: "sans-serif",
            color: "#ffffff",
          }}
        >
          {/* Header */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
              paddingBottom: "25px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                {title}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: "#9ca3af",
                  marginTop: "4px",
                  fontFamily: "monospace",
                }}
              >
                {campus}
              </span>
            </div>

            <div
              style={{
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                padding: "8px 20px",
                borderRadius: "999px",
                color: "#fbbf24",
                fontSize: 14,
                fontWeight: "bold",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Delegate 2027
            </div>
          </div>

          {/* Center Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              margin: "30px 0",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#9ca3af",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "12px",
                fontFamily: "monospace",
              }}
            >
              This Certificate is Proudly Awarded To
            </span>

            <span
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              {name}
            </span>

            <span
              style={{
                fontSize: 18,
                color: "#d1d5db",
                maxWidth: "780px",
                lineHeight: 1.5,
              }}
            >
              In recognition of active participation and pitch presentation at the Hult Prize OnCampus Competition.
            </span>
          </div>

          {/* Footer Serial */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              paddingTop: "20px",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#f20089",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              ID: {cert}
            </span>

            <span
              style={{
                fontSize: 14,
                color: "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              hultprizehitk.live
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate OG image: ${e.message}`, {
      status: 500,
    });
  }
}
