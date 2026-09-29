import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tls from "node:tls";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables
const envLocalPath = path.join(rootDir, ".env.local");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
} else if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const gUser = process.env.GOOGLE_WORKSPACE_EMAIL || "onboarding@hultprizehitk.live";
const gPass = process.env.GOOGLE_WORKSPACE_APP_PASSWORD;

if (!gPass) {
  console.error("Error: GOOGLE_WORKSPACE_APP_PASSWORD is not set in .env.local");
  process.exit(1);
}

const ORIGIN = "https://www.hultprizehitk.live";
const EVENT_TITLE = "HULT ASCEND : The Rise Begins";
const EVENT_VENUE = "SV Auditorium, Heritage Institute of Technology";
const EVENT_DATE = "Wednesday, September 30 · 2:00 PM Sharp";
const HULT_ASCEND_EVENT_ID = "6ab408ecabbcbb77e95c6d98";

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPassEmailHtml({
  recipientName,
  recipientEmail,
  recipientRole,
  roll,
  department,
  teamName,
  teamCode,
  qrPayload,
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&format=png&data=${encodeURIComponent(
    qrPayload
  )}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Auditorium Entry Pass - ${escapeHtml(teamName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09080e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09080e; padding: 36px 14px;">
    <tr>
      <td align="center">
        <!-- Pass Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #120f1a; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);">

          <!-- Header with Dual Logos -->
          <tr>
            <td style="background-color: #0c0a13; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 26px 30px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" valign="middle" style="padding-right: 18px;">
                    <a href="${ORIGIN}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${ORIGIN}/ef-hult-prize-logo.png" alt="Hult Prize" width="120" style="display: block; max-height: 40px; width: auto; object-fit: contain; border: 0;" />
                    </a>
                  </td>
                  <td valign="middle" style="padding: 0 4px;">
                    <div style="width: 1px; height: 30px; background-color: rgba(255, 255, 255, 0.2);"></div>
                  </td>
                  <td align="center" valign="middle" style="padding-left: 18px;">
                    <a href="${ORIGIN}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${ORIGIN}/hitk-25-logo.png" alt="Heritage Institute of Technology" width="48" style="display: block; max-height: 40px; width: auto; object-fit: contain; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 14px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #f20089; font-family: monospace;">
                Official Auditorium Entry Pass &bull; Check-In QR
              </div>
            </td>
          </tr>

          <!-- Pass Details Header -->
          <tr>
            <td style="padding: 32px 30px 20px 30px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ${escapeHtml(recipientName)}
              </h1>

              <div style="font-size: 13px; color: #a1a1aa; margin-bottom: 12px;">
                <span style="color: #ffffff; font-weight: 600;">${escapeHtml(recipientRole)}</span> &bull; Team <strong style="color: #f20089;">${escapeHtml(teamName)}</strong>
              </div>

              <!-- Event Name & Date -->
              <div style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #ffffff; letter-spacing: -0.2px;">
                ${escapeHtml(EVENT_TITLE)}
              </div>

              <div style="margin: 0 0 22px 0; font-size: 12px; font-weight: 600; color: #f472b6; font-family: monospace; letter-spacing: 0.5px;">
                ${escapeHtml(EVENT_DATE)}
              </div>

              <!-- High Contrast QR Code Box -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto; background-color: #ffffff; padding: 14px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); border: 3px solid #ffffff;">
                <tr>
                  <td align="center">
                    <img src="${qrUrl}" alt="Check-in QR Code" width="220" height="220" style="display: block; width: 220px; height: 220px; border: 0;" />
                  </td>
                </tr>
              </table>

              <div style="margin-top: 12px; font-size: 11px; color: #71717a; font-family: monospace; letter-spacing: 1px;">
                PRESENTER PASS &bull; ENCRYPTED ROSTER KEY
              </div>
            </td>
          </tr>

          <!-- Credentials Card -->
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 18px 20px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #71717a; letter-spacing: 1px;">Team Code</div>
                    <div style="font-size: 16px; font-weight: 800; color: #f20089; font-family: monospace; letter-spacing: 1.5px;">${escapeHtml(teamCode)}</div>
                  </td>
                  <td style="padding-bottom: 12px;">
                    <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #71717a; letter-spacing: 1px;">College Roll</div>
                    <div style="font-size: 13px; font-weight: 600; color: #ffffff; font-family: monospace;">${escapeHtml(roll || "Registered")}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #71717a; letter-spacing: 1px;">Event Name</div>
                    <div style="font-size: 12px; font-weight: 700; color: #ffffff;">${escapeHtml(EVENT_TITLE)}</div>
                  </td>
                  <td style="padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #71717a; letter-spacing: 1px;">Event Date & Time</div>
                    <div style="font-size: 12px; font-weight: 600; color: #ffffff; font-family: monospace;">${escapeHtml(EVENT_DATE)}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #71717a; letter-spacing: 1px;">Venue</div>
                    <div style="font-size: 12px; font-weight: 600; color: #ffffff;">${escapeHtml(EVENT_VENUE)}</div>
                  </td>
                  <td style="padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #71717a; letter-spacing: 1px;">Reporting Time</div>
                    <div style="font-size: 12px; font-weight: 700; color: #f20089; font-family: monospace;">2:00 PM Sharp</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Check-in Instructions -->
          <tr>
            <td style="padding: 0 30px 28px 30px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 16px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #34d399; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                      Venue Desk Check-in Instructions
                    </div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.6; color: #d1d5db;">
                      <li>Present this QR code on your mobile device at the <strong>SV Auditorium entrance desk</strong> for instant check-in.</li>
                      <li>If you ever misplace this email, log into <strong>${ORIGIN}/events</strong> or <strong>${ORIGIN}/profile</strong> to view your live QR pass anytime.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Direct Website Link Button -->
          <tr>
            <td align="center" style="padding: 0 30px 32px 30px;">
              <a href="${ORIGIN}/events" target="_blank" style="display: inline-block; background-color: #ffffff; color: #0a0a0c; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);">
                View Live Pass on Website &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0c0a13; border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 22px 30px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #71717a;">
                Hult Prize at Heritage Institute of Technology &bull; Kolkata
              </p>
              <p style="margin: 0; font-size: 10px; color: #52525b; font-family: monospace;">
                Automated official credential &bull; No signature required &bull; ${new Date().toISOString().split("T")[0]}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function sendRawTlsEmail({ toAddress, recipientName, subject, htmlContent }) {
  return new Promise((resolve, reject) => {
    const user = gUser;
    const pass = gPass;
    const senderName = "Hult Prize HITK";
    const replyToAddress = "hultprizehitk@gmail.com";

    const client = tls.connect(
      {
        host: "smtp.gmail.com",
        port: 465,
        rejectUnauthorized: true,
      },
      () => {
        // Connected to Google Workspace SMTP
      }
    );

    let step = 0;
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("SMTP Connection Timeout (15s)"));
    }, 15000);

    client.on("data", (data) => {
      const responses = data.toString().split("\r\n").filter(Boolean);

      for (const line of responses) {
        const code = line.substring(0, 3);
        const isLastLine = line.charAt(3) !== "-";
        if (!isLastLine) continue;

        if (step === 0 && code === "220") {
          step = 1;
          client.write("EHLO localhost\r\n");
        } else if (step === 1 && code === "250") {
          step = 2;
          client.write("AUTH LOGIN\r\n");
        } else if (step === 2 && code === "334") {
          step = 3;
          client.write(Buffer.from(user).toString("base64") + "\r\n");
        } else if (step === 3 && code === "334") {
          step = 4;
          client.write(Buffer.from(pass.replace(/\s+/g, "")).toString("base64") + "\r\n");
        } else if (step === 4 && code === "235") {
          step = 5;
          client.write(`MAIL FROM:<${user}>\r\n`);
        } else if (step === 5 && code === "250") {
          step = 6;
          client.write(`RCPT TO:<${toAddress}>\r\n`);
        } else if (step === 6 && code === "250") {
          step = 7;
          client.write("DATA\r\n");
        } else if (step === 7 && code === "354") {
          step = 8;
          const rawBase64 = Buffer.from(htmlContent).toString("base64");
          const wrappedBase64 = rawBase64.match(/.{1,76}/g)?.join("\r\n") || rawBase64;

          const messageId = `<hult-pass-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@hultprizehitk.live>`;
          const mime = [
            `From: "${senderName}" <${user}>`,
            `To: <${toAddress}>`,
            `Reply-To: <${replyToAddress}>`,
            `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
            `Message-ID: ${messageId}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: base64`,
            ``,
            wrappedBase64,
            `.`,
            ``,
          ].join("\r\n");
          client.write(mime);
        } else if (step === 8 && code === "250") {
          clearTimeout(timeout);
          client.write("QUIT\r\n");
          resolve({ success: true, messageId: line });
        } else if (code.startsWith("4") || code.startsWith("5")) {
          clearTimeout(timeout);
          client.end();
          reject(new Error(`Google Workspace SMTP Error: ${line}`));
        }
      }
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  const isBroadcast = process.argv.includes("--broadcast");
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  if (!isBroadcast) {
    console.log("==========================================================");
    console.log("  TEST MODE: SENDING QR PASS TO HARSH & BHOOMI (CRYERRSS)");
    console.log("==========================================================");

    const team = await db.collection("teams").findOne({
      $or: [
        { teamName: { $regex: /cryer/i } },
        { teamCode: "HULT-X327" }
      ]
    });

    if (!team) {
      console.error("Team Cryerrss (HULT-X327) not found in database.");
      process.exit(1);
    }

    console.log(`Found Team: "${team.teamName}" (${team.teamCode})`);
    console.log(`Lead: ${team.lead?.name} (${team.leadEmail})`);
    console.log(`Members: ${team.members?.map(m => `${m.name} (${m.email})`).join(", ")}`);

    const targets = [
      {
        name: team.lead?.name || "Bhoomi Ladia",
        email: team.leadEmail,
        role: "Team Leader",
        roll: team.lead?.roll || "2461077",
        dept: team.lead?.department || "AI & ML",
      },
      ...(team.members || []).map(m => ({
        name: m.name,
        email: m.email,
        role: "Member",
        roll: m.roll || "2463017",
        dept: m.department || "IoT & CS",
      }))
    ];

    for (const target of targets) {
      const qrPayload = JSON.stringify({
        teamCode: team.teamCode.toUpperCase(),
        participantEmail: target.email.toLowerCase().trim(),
        roll: target.roll || "",
      });

      const html = getPassEmailHtml({
        recipientName: target.name,
        recipientEmail: target.email,
        recipientRole: target.role,
        roll: target.roll,
        department: target.dept,
        teamName: team.teamName,
        teamCode: team.teamCode,
        qrPayload,
      });

      const subject = `[OFFICIAL PASS] HULT ASCEND: 2:00 PM at SV Auditorium · Entry QR for ${target.name} (${team.teamCode})`;

      console.log(`\nDispatching test pass to: ${target.name} <${target.email}> ...`);
      try {
        const res = await sendRawTlsEmail({
          toAddress: target.email,
          recipientName: target.name,
          subject,
          htmlContent: html,
        });
        console.log(`  -> SUCCESS! Email sent to ${target.email}`);
      } catch (err) {
        console.error(`  -> FAILED to send to ${target.email}:`, err.message);
      }
    }

    console.log("\nTest pass dispatch complete. Run with --broadcast to send to all submitted teams.");
  } else {
    console.log("==========================================================");
    console.log("  BROADCAST MODE: SENDING QR PASSES TO ALL CONFIRMED TEAMS");
    console.log("==========================================================");

    const teams = await db.collection("teams").find({
      $or: [
        { eventId: HULT_ASCEND_EVENT_ID },
        { eventId: new mongoose.Types.ObjectId(HULT_ASCEND_EVENT_ID) },
      ],
      status: "confirmed",
      submissionStatus: "submitted",
    }).toArray();

    console.log(`Found ${teams.length} submitted teams for HULT ASCEND.`);

    let sentCount = 0;
    let failCount = 0;

    for (const team of teams) {
      console.log(`\nProcessing Team: ${team.teamName} (${team.teamCode})`);

      const recipients = [
        {
          name: team.lead?.name || "Team Leader",
          email: team.leadEmail,
          role: "Team Leader",
          roll: team.lead?.roll || "",
          dept: team.lead?.department || "",
        },
        ...(team.members || []).map(m => ({
          name: m.name,
          email: m.email,
          role: "Member",
          roll: m.roll || "",
          dept: m.department || "",
        }))
      ];

      for (const r of recipients) {
        const cleanEmail = (r.email || "").trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes("@")) continue;

        const qrPayload = JSON.stringify({
          teamCode: team.teamCode.toUpperCase(),
          participantEmail: cleanEmail,
          roll: r.roll || "",
        });

        const html = getPassEmailHtml({
          recipientName: r.name,
          recipientEmail: cleanEmail,
          recipientRole: r.role,
          roll: r.roll,
          department: r.dept,
          teamName: team.teamName,
          teamCode: team.teamCode,
          qrPayload,
        });

        const subject = `[OFFICIAL PASS] HULT ASCEND: 2:00 PM at SV Auditorium · Entry QR for ${r.name} (${team.teamCode})`;

        try {
          await sendRawTlsEmail({
            toAddress: cleanEmail,
            recipientName: r.name,
            subject,
            htmlContent: html,
          });
          sentCount++;
          console.log(`  -> Sent to ${r.name} <${r.email}>`);
          // 400ms pacing between emails to be gentle on Google Workspace SMTP rate limits
          await new Promise(res => setTimeout(res, 400));
        } catch (err) {
          failCount++;
          console.error(`  -> Failed for ${r.email}:`, err.message);
        }
      }
    }

    console.log(`\nBroadcast summary: ${sentCount} sent, ${failCount} failed.`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
