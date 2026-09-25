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
const adminEmailsRaw = process.env.ADMIN_EMAILS || "";

if (!gPass) {
  console.error("Error: GOOGLE_WORKSPACE_APP_PASSWORD is not set in .env.local");
  process.exit(1);
}

const WHATSAPP_LINK = "https://chat.whatsapp.com/Id32WrxaYB81PactlzQXxl";
const ORIGIN = "https://www.hultprizehitk.live";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getHultAscendWhatsAppEmailHtml({ name, email }) {
  const recipientName = name ? escapeHtml(name.trim()) : "Heritage Innovator";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join the Official HULT ASCEND WhatsApp Community</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c0e; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Outer Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #141418; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);">

          <!-- Header with Dual Logos -->
          <tr>
            <td style="background-color: #101014; border-bottom: 1px solid #27272a; padding: 28px 32px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" valign="middle" style="padding-right: 18px;">
                    <a href="${ORIGIN}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${ORIGIN}/ef-hult-prize-logo.png" alt="Hult Prize" width="120" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
                    </a>
                  </td>
                  <td valign="middle" style="padding: 0 4px;">
                    <div style="width: 1px; height: 32px; background-color: #3f3f46;"></div>
                  </td>
                  <td align="center" valign="middle" style="padding-left: 18px;">
                    <a href="${ORIGIN}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${ORIGIN}/hitk-25-logo.png" alt="Heritage Institute of Technology" width="50" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 14px; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa;">
                Heritage Institute of Technology &bull; On-Campus Program
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 32px 32px;">

              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #10b981; margin-bottom: 10px;">
                Official Community Announcement
              </div>

              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                Join the Official HULT ASCEND WhatsApp Community
              </h1>

              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.65; color: #e4e4e7;">
                Hello <strong>${recipientName}</strong>,
              </p>

              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.65; color: #d4d4d8;">
                We are gearing up for the on-campus event - <strong style="color: #ffffff;">HULT ASCEND : The Rise Begins</strong>. To ensure all participants, team leaders, and registered students receive immediate updates, schedule releases, mentoring announcements, and venue guidance, we have launched the official WhatsApp community group.
              </p>

              <!-- WhatsApp CTA Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161f1a; border: 1px solid #1e3a29; border-radius: 12px; margin: 24px 0; text-align: center;">
                <tr>
                  <td style="padding: 24px 20px;" align="center">
                    <div style="font-size: 17px; font-weight: 700; color: #ffffff; margin-bottom: 16px;">
                      HULT ASCEND Official WhatsApp Group
                    </div>
                    <div>
                      <a href="${WHATSAPP_LINK}" target="_blank" style="display: inline-block; background-color: #25D366; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 28px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);">
                        Join WhatsApp Group
                      </a>
                    </div>
                    <p style="margin: 14px 0 0 0; font-size: 11px; font-family: monospace; color: #a1a1aa; word-break: break-all;">
                      Direct Link: <a href="${WHATSAPP_LINK}" target="_blank" style="color: #34d399; text-decoration: underline;">${WHATSAPP_LINK}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Registration Status Advisory Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1618; border: 1px solid #3f2229; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #f20089; margin-bottom: 8px;">
                      Important: Team Registration Notice
                    </div>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #e4e4e7;">
                      <strong>Haven't completed your registration yet, or is your team still forming?</strong>
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                      If you have not registered your team for <strong style="color: #ffffff;">HULT ASCEND : The Rise Begins</strong>, or if your team is currently in the <em>Forming</em> status, you must finalize your roster and submit your team registration on the portal right away. Only verified, submitted teams are granted official digital QR entry passes.
                    </p>
                    <div>
                      <a href="${ORIGIN}/events" target="_blank" style="display: inline-block; background-color: #f20089; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px;">
                        Register / Complete Team Submission
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Event Details Summary -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181d; border: 1px solid #27272a; border-radius: 10px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 1.6;">
                      <tr>
                        <td style="color: #71717a; padding: 4px 0; width: 34%;">Event:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">HULT ASCEND : The Rise Begins</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; padding: 4px 0;">Institution:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">Heritage Institute of Technology, Kolkata</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; padding: 4px 0;">Official Portal:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">
                          <a href="${ORIGIN}" target="_blank" style="color: #f20089; text-decoration: none;">www.hultprizehitk.live</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #71717a;">
                For any questions regarding team formation, registration status, or technical assistance, reply directly to this email or reach us at <a href="mailto:hultprize.heritage@gmail.com" style="color: #a1a1aa; text-decoration: underline;">hultprize.heritage@gmail.com</a>.
              </p>

              <!-- Sign-off -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #27272a; padding-top: 18px;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; color: #a1a1aa;">
                      Warm regards,
                    </p>
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff;">
                      Hult Prize HITK Organizing Committee
                    </p>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #71717a;">
                      Heritage Institute of Technology, Kolkata
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0d0d10; border-top: 1px solid #222226; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #71717a;">
                &copy; ${new Date().getFullYear()} Hult Prize HITK &bull; Heritage Institute of Technology
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                Need assistance? Reach us at <a href="mailto:hultprize.heritage@gmail.com" style="color: #f20089; text-decoration: none;">hultprize.heritage@gmail.com</a>
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

function sendGoogleWorkspaceSmtp({
  user,
  pass,
  senderName,
  toAddress,
  replyToAddress,
  subject,
  htmlContent,
}) {
  return new Promise((resolve, reject) => {
    const client = tls.connect({ port: 465, host: "smtp.gmail.com" });
    let step = 0;
    let buffer = "";

    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("Google Workspace SMTP connection timed out after 15s"));
    }, 15000);

    client.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
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

          const messageId = `<hult-ascend-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@hultprizehitk.live>`;
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

  if (!isBroadcast) {
    console.log("=== SENDING DRAFT TEST TO ADMINS (HARSH & BHOOMI) ===");

    // Parse admins from environment
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // Target Harsh and Bhoomi specifically
    const harshEmail = adminEmails.find((e) => e.includes("harsh")) || "harsh.raj.iotcs28@heritageit.edu.in";
    const bhoomiEmail = adminEmails.find((e) => e.includes("bhoomi")) || "bhoomi.ladia.aiml28@heritageit.edu.in";

    const targetAdmins = [
      { name: "Harsh Raj", email: harshEmail },
      { name: "Bhoomi Ladia", email: bhoomiEmail },
    ];

    console.log(`Target Admin Recipients:`, targetAdmins.map((a) => `${a.name} <${a.email}>`));

    for (const admin of targetAdmins) {
      console.log(`Dispatching original email to ${admin.name} (${admin.email})...`);
      const html = getHultAscendWhatsAppEmailHtml({
        name: admin.name,
        email: admin.email,
      });

      try {
        const result = await sendGoogleWorkspaceSmtp({
          user: gUser,
          pass: gPass,
          senderName: "Hult Prize HITK",
          toAddress: admin.email,
          replyToAddress: "hultprize.heritage@gmail.com",
          subject: "Official Announcement: Join HULT ASCEND WhatsApp Community | Hult Prize HITK",
          htmlContent: html,
        });
        console.log(`SUCCESS -> Sent to ${admin.email}:`, result.messageId);
      } catch (err) {
        console.error(`FAILED -> Could not send to ${admin.email}:`, err.message);
      }
    }

    console.log("\nDraft dispatch process completed.");
    console.log("Once Harsh and Bhoomi have reviewed and approved, run with --broadcast to send to all registered users.");
    process.exit(0);
  }

  // Broadcast Mode (Only executed when explicitly requested with --broadcast)
  console.log("=== BROADCAST MODE: DISPATCHING TO ALL REGISTERED USERS ===");
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Error: MONGODB_URI is required for broadcast mode.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  // Fetch all unique user emails from users and teams collections
  const userDocs = await mongoose.connection.db.collection("users").find({}).toArray();
  const teamDocs = await mongoose.connection.db.collection("teams").find({}).toArray();

  const recipientMap = new Map();

  for (const u of userDocs) {
    if (u.email && typeof u.email === "string") {
      const em = u.email.trim().toLowerCase();
      if (!recipientMap.has(em)) {
        recipientMap.set(em, { name: u.name || "", email: em });
      }
    }
  }

  for (const t of teamDocs) {
    if (t.lead && t.lead.email) {
      const em = t.lead.email.trim().toLowerCase();
      if (!recipientMap.has(em)) {
        recipientMap.set(em, { name: t.lead.name || "", email: em });
      }
    }
    if (Array.isArray(t.members)) {
      for (const m of t.members) {
        if (m.email) {
          const em = m.email.trim().toLowerCase();
          if (!recipientMap.has(em)) {
            recipientMap.set(em, { name: m.name || "", email: em });
          }
        }
      }
    }
  }

  const allRecipients = Array.from(recipientMap.values());
  console.log(`Found ${allRecipients.length} total distinct registered users.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allRecipients.length; i++) {
    const r = allRecipients[i];
    console.log(`[${i + 1}/${allRecipients.length}] Sending to ${r.email}...`);
    const html = getHultAscendWhatsAppEmailHtml({
      name: r.name,
      email: r.email,
    });

    try {
      await sendGoogleWorkspaceSmtp({
        user: gUser,
        pass: gPass,
        senderName: "Hult Prize HITK",
        toAddress: r.email,
        replyToAddress: "hultprize.heritage@gmail.com",
        subject: "Official Announcement: Join HULT ASCEND WhatsApp Community | Hult Prize HITK",
        htmlContent: html,
      });
      console.log(`[${i + 1}/${allRecipients.length}] SUCCESS -> ${r.email}`);
      successCount++;
    } catch (err) {
      console.error(`[${i + 1}/${allRecipients.length}] FAILED -> ${r.email}:`, err.message);
      failCount++;
    }

    // Rate-limit pause to ensure high inbox delivery
    await new Promise((res) => setTimeout(res, 500));
  }

  console.log(`\n=== BROADCAST FINISHED ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
