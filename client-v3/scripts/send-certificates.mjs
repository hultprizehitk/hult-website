import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tls from "node:tls";
import mongoose from "mongoose";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

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

const ORIGIN = "https://www.hultprizehitk.live";
const EVENT_TITLE = "HULT ASCEND";
const EVENT_DATE = "30th September 2026";
const HULT_ASCEND_EVENT_ID = "6ab408ecabbcbb77e95c6d98";

const TEMPLATE_PATH = path.join(rootDir, "public/certificates/hult-ascend-certificates.png");
const OUT_DIR = path.join(__dirname, "certificates-out");

// Name fonts (files in scripts/assets), selectable with --font <key>.
// Script fonts have very different proportions, so each gets its own size and baseline.
const NAME_FONTS = {
  "gilda-display": { file: "GildaDisplay-Regular.ttf", label: "Gilda Display", maxSize: 88, baselineY: 925 },
  "alex-brush": { file: "AlexBrush-Regular.ttf", label: "Alex Brush", maxSize: 128, baselineY: 942 },
  "anastasia-script": { file: "AnastasiaScript-PersonalUse.ttf", label: "Anastasia Script", maxSize: 60, baselineY: 935 },
  "philosopher": { file: "Philosopher-Regular.ttf", label: "Philosopher", maxSize: 84, baselineY: 925 },
};
const DEFAULT_FONT = "anastasia-script";

// Certificate names keyed by email. Roster names were built from the email address, which can't hold
// spaces ("gaurav.kumardubey" -> "Gaurav Kumardubey"); sign-in now stores the real Google name instead.
const NAME_CORRECTIONS = {
  "amartya.kumarmondal.ds29@heritageit.edu.in": "Amartya Kumar Mondal",
  "gaurav.kumardubey.me29@heritageit.edu.in": "Gaurav Kumar Dubey",
  "sheikh.tazimrahman.me29@heritageit.edu.in": "Sheikh Tazim Rahman",
  "piyush.kumarsingh.me29@heritageit.edu.in": "Piyush Kumar Singh",
  "aryantiwari.cse29@heritageit.edu.in": "Aryan Tiwari",
  "anik.kumarkundu.csbs29@heritageit.edu.in": "Anik Kumar Kundu",
  "anuj.kumarchourasia.cse30@heritageit.edu.in": "Anuj Kumar Chourasia",
  "suparna.kantidey.bt29@heritageit.edu.in": "Suparna Kanti Dey",
  "raj.nandinirai.aiml29@heritageit.edu.in": "Raj Nandini Rai",
  "aditya.kumarroy.iotcs30@heritageit.edu.in": "Aditya Kumar Roy",
  "harshit.kumarrai.cse30@heritageit.edu.in": "Harshit Kumar Rai",
  "mayur.kumarjaiswal.cse30@heritageit.edu.in": "Mayur Kumar Jaiswal",
  "arit.kumardas.bt29@heritageit.edu.in": "Arit Kumar Das",
  "roshni.barighosh.bt29@heritageit.edu.in": "Roshni Bari Ghosh",
  "shaikh.junaidulhaque.cse30@heritageit.edu.in": "Shaikh Junaidul Haque",
  "soham.kumardas.cse30@heritageit.edu.in": "Soham Kumar Das",
  "sagnik.duttamazumder.ee29@heritageit.edu.in": "Sagnik Dutta Mazumder",
  "indra.pratapsaha.ee29@heritageit.edu.in": "Indra Pratap Saha",
  "abhirup.kumarbera.me29@heritageit.edu.in": "Abhirup Kumar Bera",
  "manindra.nathseth.iotcs29@heritageit.edu.in": "Manindra Nath Seth",
  "yuvraj.kumarsingh.cse29@heritageit.edu.in": "Yuvraj Kumar Singh",
  "md.faizanqamar.ds29@heritageit.edu.in": "Md Faizan Qamar",
  "prince.kumarsony.cse30@heritageit.edu.in": "Prince Kumar Sony",
  "soham.kumaryadav.cse30@heritageit.edu.in": "Soham Kumar Yadav",
  "samarth.kumargupta.cse30@heritageit.edu.in": "Samarth Kumar Gupta",
  "divyanshuraj.cse28@heritageit.edu.in": "Divyanshu Raj",
  "udayaditya.roymoulick.ds29@heritageit.edu.in": "Udayaditya Roy Moulick",
  "vikash.kumarsaw.aiml30@heritageit.edu.in": "Vikash Kumar Saw",
  "rohit.kumarshaw.ds29@heritageit.edu.in": "Rohit Kumar Shaw",
  "sudipta.kumarnayak.ece28@heritageit.edu.in": "Sudipta Kumar Nayak",
};

// Name placement, measured on the 2000x1414 template: the blank line spans x 149-1051 at y 955,
// and "is awarded to" above it ends at y 828.
const NAME_MIN_FONT_SIZE = 40;
const NAME_MAX_WIDTH = 880;
const NAME_TOP_LIMIT_Y = 850;
const NAME_CENTER_X = 600;
const JPEG_QUALITY = 95;

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function certificateFileName(name) {
  const slug = name.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Hult-Ascend-Certificate-${slug || "Participant"}.jpg`;
}

async function renderCertificate(template, name, font) {
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0);

  // Shrink until the name fits on the line and its tallest letter clears "is awarded to"
  let fontSize = font.maxSize;
  ctx.font = `${fontSize}px "${font.label}"`;
  const overflows = () => {
    const m = ctx.measureText(name);
    return m.width > NAME_MAX_WIDTH || font.baselineY - m.actualBoundingBoxAscent < NAME_TOP_LIMIT_Y;
  };
  while (overflows() && fontSize > NAME_MIN_FONT_SIZE) {
    fontSize -= 2;
    ctx.font = `${fontSize}px "${font.label}"`;
  }

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name, NAME_CENTER_X, font.baselineY);

  return canvas.encode("jpeg", JPEG_QUALITY);
}

function getCertificateEmailHtml({ recipientName }) {
  const serif = "Georgia, 'Times New Roman', Times, serif";
  const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Certificate of Participation - ${escapeHtml(EVENT_TITLE)}</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    /* Dark mode for clients that support it (Apple Mail, iOS Mail, Outlook). Gmail apps auto-darken instead. */
    @media (prefers-color-scheme: dark) {
      .bg-page { background-color: #140d1a !important; }
      .bg-card { background-color: #1d1426 !important; border-color: #33263f !important; }
      .bg-accent { background-color: #a24bc4 !important; }
      .bg-footer { background-color: #180f20 !important; border-color: #33263f !important; }
      .divider { border-color: #33263f !important; }
      .t-eyebrow, .t-link { color: #d39ae6 !important; }
      .t-title, .t-strong { color: #f3eaf7 !important; }
      .t-body { color: #cfc6d8 !important; }
      .t-muted { color: #9a8fa6 !important; }
    }
  </style>
</head>
<body class="bg-page" style="margin: 0; padding: 0; background-color: #f4f1f7; font-family: ${sans}; color: #1f1a24; -webkit-font-smoothing: antialiased;">
  <table role="presentation" class="bg-page" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f1f7; padding: 40px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" class="bg-card" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e6e0ec; border-radius: 12px; overflow: hidden;">

          <!-- Accent Bar -->
          <tr>
            <td class="bg-accent" style="height: 6px; line-height: 6px; font-size: 0; background-color: #5a1a78;">&nbsp;</td>
          </tr>

          <!-- Header with Dual Logos (white badge keeps them readable in dark mode) -->
          <tr>
            <td class="divider" style="padding: 24px 40px 20px 40px; text-align: center; border-bottom: 1px solid #eee8f2;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px;">
                <tr>
                  <td align="center" valign="middle" style="padding: 10px 20px 10px 18px;">
                    <a href="${ORIGIN}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${ORIGIN}/ef-hult-prize-logo.png" alt="EF Hult Prize" height="44" style="display: block; height: 44px; width: auto; border: 0;" />
                    </a>
                  </td>
                  <td valign="middle">
                    <div style="width: 1px; height: 36px; background-color: #e6e0ec;"></div>
                  </td>
                  <td align="center" valign="middle" style="padding: 10px 18px 10px 20px;">
                    <a href="${ORIGIN}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${ORIGIN}/hitk-25-logo.png" alt="Heritage Institute of Technology" height="52" style="display: block; height: 52px; width: auto; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 36px 40px 0 40px; text-align: center;">
              <div class="t-eyebrow" style="font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #7b2a91;">
                Certificate of Participation
              </div>
              <h1 class="t-title" style="margin: 10px 0 0 0; font-family: ${serif}; font-size: 30px; font-weight: 400; color: #2b0d3b; letter-spacing: 0.5px;">
                Hult Ascend
              </h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p class="t-strong" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #1f1a24;">
                Dear ${escapeHtml(recipientName)},
              </p>
              <p class="t-body" style="margin: 0; font-size: 15px; line-height: 1.6; color: #4a4453;">
                Thank you for participating in Hult Ascend on ${escapeHtml(EVENT_DATE)}, organized by Hult Prize HITK in collaboration with IQAC-HITK. Your certificate of participation is attached to this email.
              </p>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding: 28px 40px 36px 40px;">
              <p class="t-body" style="margin: 0; font-size: 15px; line-height: 1.6; color: #4a4453;">
                Warm regards,<br />
                <span class="t-strong" style="font-weight: 600; color: #2b0d3b;">Team Hult Prize HITK</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="bg-footer" style="background-color: #faf8fc; border-top: 1px solid #eee8f2; padding: 20px 40px; text-align: center;">
              <p class="t-muted" style="margin: 0 0 4px 0; font-size: 12px; color: #8a8294;">
                Hult Prize HITK &middot; Heritage Institute of Technology, Kolkata
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a class="t-link" href="${ORIGIN}" target="_blank" style="color: #7b2a91; text-decoration: none;">hultprizehitk.live</a>
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

function wrapBase64(buf) {
  const raw = Buffer.from(buf).toString("base64");
  return raw.match(/.{1,76}/g)?.join("\r\n") || raw;
}

function sendCertificateEmail({ toAddress, subject, htmlContent, attachment }) {
  return new Promise((resolve, reject) => {
    const senderName = "Hult Prize HITK";
    const replyToAddress = "hultprize.heritage@gmail.com";

    const client = tls.connect({ host: "smtp.gmail.com", port: 465, rejectUnauthorized: true });

    let step = 0;
    let buffer = "";
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("SMTP Connection Timeout (60s)"));
    }, 60000);

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
          client.write(Buffer.from(gUser).toString("base64") + "\r\n");
        } else if (step === 3 && code === "334") {
          step = 4;
          client.write(Buffer.from(gPass.replace(/\s+/g, "")).toString("base64") + "\r\n");
        } else if (step === 4 && code === "235") {
          step = 5;
          client.write(`MAIL FROM:<${gUser}>\r\n`);
        } else if (step === 5 && code === "250") {
          step = 6;
          client.write(`RCPT TO:<${toAddress}>\r\n`);
        } else if (step === 6 && code === "250") {
          step = 7;
          client.write("DATA\r\n");
        } else if (step === 7 && code === "354") {
          step = 8;
          const boundary = `hult-cert-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
          const messageId = `<hult-cert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@hultprizehitk.live>`;
          const mime = [
            `From: "${senderName}" <${gUser}>`,
            `To: <${toAddress}>`,
            `Reply-To: <${replyToAddress}>`,
            `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
            `Message-ID: ${messageId}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: base64`,
            ``,
            wrapBase64(htmlContent),
            `--${boundary}`,
            `Content-Type: image/jpeg; name="${attachment.filename}"`,
            `Content-Disposition: attachment; filename="${attachment.filename}"`,
            `Content-Transfer-Encoding: base64`,
            ``,
            wrapBase64(attachment.content),
            `--${boundary}--`,
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

// Every checked-in lead/member of HULT ASCEND, deduped by email
async function getParticipants(db) {
  const teams = await db.collection("teams").find({
    $or: [
      { eventId: HULT_ASCEND_EVENT_ID },
      { eventId: new mongoose.Types.ObjectId(HULT_ASCEND_EVENT_ID) },
    ],
  }).toArray();

  const byEmail = new Map();
  for (const team of teams) {
    const people = [
      { person: team.lead, isLead: true },
      ...(team.members || []).map((m) => ({ person: m, isLead: false })),
    ];
    for (const { person, isLead } of people) {
      if (!person?.checkedIn) continue;
      const email = (person.email || "").trim().toLowerCase();
      const name = NAME_CORRECTIONS[email] || (person.name || "").trim();
      if (!email.includes("@") || !name || byEmail.has(email)) continue;
      byEmail.set(email, {
        name,
        email,
        isLead,
        teamId: team._id,
        teamCode: team.teamCode,
        certificateSent: Boolean(person.certificateSent),
      });
    }
  }
  return Array.from(byEmail.values());
}

async function markCertificateSent(db, p) {
  const now = new Date();
  if (p.isLead) {
    await db.collection("teams").updateOne(
      { _id: p.teamId },
      { $set: { "lead.certificateSent": true, "lead.certificateSentAt": now } }
    );
  } else {
    await db.collection("teams").updateOne(
      { _id: p.teamId, "members.email": p.email },
      { $set: { "members.$.certificateSent": true, "members.$.certificateSentAt": now } }
    );
  }
}

async function sendTo(template, font, p, toAddress, subjectPrefix = "") {
  const content = await renderCertificate(template, p.name, font);
  return sendCertificateEmail({
    toAddress,
    subject: `${subjectPrefix}Your Certificate of Participation · ${EVENT_TITLE} | Hult Prize HITK`,
    htmlContent: getCertificateEmailHtml({ recipientName: p.name }),
    attachment: { filename: certificateFileName(p.name), content },
  });
}

async function main() {
  const isBroadcast = process.argv.includes("--broadcast");
  const testIdx = process.argv.indexOf("--test");
  const testEmail = testIdx > -1 ? (process.argv[testIdx + 1] || "").trim().toLowerCase() : null;
  const onlyIdx = process.argv.indexOf("--only");
  const onlyEmail = onlyIdx > -1 ? (process.argv[onlyIdx + 1] || "").trim().toLowerCase() : null;
  const fontIdx = process.argv.indexOf("--font");
  const fontKey = fontIdx > -1 ? process.argv[fontIdx + 1] : DEFAULT_FONT;
  const font = NAME_FONTS[fontKey];
  const uri = process.env.MONGODB_URI;

  if (!font) {
    console.error(`Unknown --font "${fontKey}". Options: ${Object.keys(NAME_FONTS).join(", ")}`);
    process.exit(1);
  }

  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }
  if ((isBroadcast || testEmail !== null || onlyEmail !== null) && !gPass) {
    console.error("Error: GOOGLE_WORKSPACE_APP_PASSWORD is not set in .env.local");
    process.exit(1);
  }
  if (testEmail !== null && !testEmail.includes("@")) {
    console.error("Usage: node scripts/send-certificates.mjs --test you@example.com");
    process.exit(1);
  }

  GlobalFonts.registerFromPath(path.join(__dirname, "assets", font.file), font.label);
  const template = await loadImage(TEMPLATE_PATH);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const participants = await getParticipants(db);
  console.log(`Found ${participants.length} checked-in participants for ${EVENT_TITLE}. Name font: ${font.label}`);

  if (onlyEmail !== null) {
    // The real certificate email (no test prefix) to one participant, recorded like a broadcast send
    const p = participants.find((x) => x.email === onlyEmail);
    if (!p) {
      console.error(`${onlyEmail} is not a checked-in participant of ${EVENT_TITLE}.`);
    } else if (p.certificateSent && !process.argv.includes("--force")) {
      console.log(`${p.name} <${p.email}> was already sent a certificate. Add --force to send it again.`);
    } else {
      try {
        await sendTo(template, font, p, p.email);
        await markCertificateSent(db, p);
        console.log(`  -> Sent to ${p.name} <${p.email}>`);
      } catch (err) {
        console.error(`  -> FAILED for ${p.email}:`, err.message);
      }
    }
  } else if (testEmail !== null) {
    console.log("==========================================================");
    console.log(`  TEST MODE: SENDING ONE CERTIFICATE TO ${testEmail}`);
    console.log("==========================================================");

    // Use the tester's own certificate if they attended, else their name from users, else the first participant's
    const user = await db.collection("users").findOne({ email: testEmail });
    const sample =
      participants.find((p) => p.email === testEmail) ||
      (user?.name ? { name: user.name.trim() } : participants[0]);
    console.log(`Certificate name: ${sample.name}`);
    try {
      await sendTo(template, font, sample, testEmail, `[TEST · ${font.label}] `);
      console.log(`  -> SUCCESS! Test email sent to ${testEmail}`);
    } catch (err) {
      console.error(`  -> FAILED to send to ${testEmail}:`, err.message);
    }
  } else if (isBroadcast) {
    console.log("==========================================================");
    console.log("  BROADCAST MODE: SENDING CERTIFICATES TO ALL PARTICIPANTS");
    console.log("==========================================================");

    const pending = participants.filter((p) => !p.certificateSent);
    console.log(`Already sent: ${participants.length - pending.length} · Pending: ${pending.length}`);

    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      try {
        await sendTo(template, font, p, p.email);
        // Mark immediately so a re-run after an interruption skips this person
        await markCertificateSent(db, p);
        sentCount++;
        console.log(`[${i + 1}/${pending.length}] Sent to ${p.name} <${p.email}>`);
        // 400ms pacing between emails to be gentle on Google Workspace SMTP rate limits
        await new Promise((res) => setTimeout(res, 400));
      } catch (err) {
        failCount++;
        console.error(`[${i + 1}/${pending.length}] Failed for ${p.email}:`, err.message);
      }
    }

    console.log(`\nBroadcast summary: ${sentCount} sent, ${failCount} failed.`);
    if (failCount > 0) console.log("Re-run with --broadcast to retry only the failed ones.");
  } else {
    console.log("==========================================================");
    console.log("  PREVIEW MODE: RENDERING CERTIFICATES (NO EMAILS SENT)");
    console.log("==========================================================");

    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const p of participants) {
      const content = await renderCertificate(template, p.name, font);
      fs.writeFileSync(path.join(OUT_DIR, `${p.teamCode}-${certificateFileName(p.name)}`), content);
    }
    console.log(`Rendered ${participants.length} certificates to ${OUT_DIR}`);
    console.log("Next: --test you@example.com to send yourself one, then --broadcast to send to everyone.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
