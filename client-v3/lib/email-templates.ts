import { sendEmail, SendEmailResult } from "./mail";

export interface WelcomeEmailParams {
  name: string;
  email: string;
  department?: string;
  year?: string;
  role?: string;
}

/**
 * Returns a clean, professional branded HTML email for first-time login / account creation.
 * Uses the new EF Hult Prize logo and official support email (hultprize.heritage@gmail.com).
 */
export function getWelcomeEmailHtml({
  name,
  email,
  department = "Heritage Institute of Technology",
  year = "Undergraduate",
}: WelcomeEmailParams): string {
  const safeName = name || "Heritage Student";
  const origin = "https://www.hultprizehitk.live";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Hult Prize HITK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c0e; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #141418; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Hult & Heritage Logos -->
          <tr>
            <td style="background-color: #101014; border-bottom: 1px solid #27272a; padding: 28px 32px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                <tr>
                  <!-- New Official EF Hult Prize Logo -->
                  <td align="center" valign="middle" style="padding-right: 18px;">
                    <a href="${origin}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${origin}/ef-hult-prize-logo.png" alt="Hult Prize" width="120" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
                    </a>
                  </td>
                  <!-- Divider Line -->
                  <td valign="middle" style="padding: 0 4px;">
                    <div style="width: 1px; height: 32px; background-color: #3f3f46;"></div>
                  </td>
                  <!-- Heritage Institute of Technology Logo -->
                  <td align="center" valign="middle" style="padding-left: 18px;">
                    <a href="${origin}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${origin}/hitk-25-logo.png" alt="Heritage Institute of Technology" width="50" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
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
              
              <h1 style="margin: 0 0 18px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">
                Welcome, ${safeName}
              </h1>

              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #d4d4d8;">
                Your student account on the official <strong>Hult Prize at Heritage Institute of Technology</strong> platform has been successfully registered and activated.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.65; color: #a1a1aa;">
                You now have full access to explore upcoming on-campus events, participate in innovation challenges, and collaborate with your team.
              </p>

              <!-- Academic Profile Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a20; border: 1px solid #2e2e36; border-radius: 10px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #f20089; margin-bottom: 12px;">
                      Student Profile
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
                      <tr>
                        <td style="color: #858591; padding: 4px 0; width: 34%;">Name:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">${safeName}</td>
                      </tr>
                      <tr>
                        <td style="color: #858591; padding: 4px 0;">College Email:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">${email}</td>
                      </tr>
                      <tr>
                        <td style="color: #858591; padding: 4px 0;">Department:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">${department}</td>
                      </tr>
                      <tr>
                        <td style="color: #858591; padding: 4px 0;">Academic Year:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">${year}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${origin}/events" target="_blank" style="display: inline-block; background-color: #f20089; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 36px; border-radius: 8px; box-shadow: 0 4px 14px rgba(242, 0, 137, 0.35);">
                      Explore Events &amp; Competitions &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Sign-off -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #27272a; padding-top: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; color: #a1a1aa;">
                      Warm regards,
                    </p>
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff;">
                      Hult Prize HITK Team
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

/**
 * Dispatches the official Welcome email to a newly signed up student or first-time login.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<SendEmailResult> {
  const htmlContent = getWelcomeEmailHtml(params);
  return sendEmail({
    to: [{ email: params.email, name: params.name }],
    replyTo: { email: "hultprize.heritage@gmail.com", name: "Hult Prize HITK Support" },
    subject: `Welcome to Hult Prize HITK, ${params.name}!`,
    htmlContent,
  });
}

export interface TeamCreatedEmailParams {
  leadName: string;
  leadEmail: string;
  teamName: string;
  teamCode: string;
  eventTitle: string;
  eventId: string;
  eventDate?: string | Date;
  eventVenue?: string;
  minMembers: number;
  maxMembers: number;
  deadline?: string | Date | null;
}

export interface TeamSubmittedEmailParams {
  recipientName?: string;
  recipientEmail?: string;
  isLead?: boolean;
  leadName: string;
  leadEmail: string;
  teamName: string;
  ventureName?: string;
  eventTitle: string;
  eventId: string;
  eventDate?: string | Date;
  eventVenue?: string;
  membersCount: number;
  minMembers: number;
  maxMembers: number;
}

function escapeHtml(value?: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventDate(value?: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/**
 * Reusable branded shell (header + footer) for transactional team emails.
 */
function getHultMailShell(contentHtml: string): string {
  const origin = "https://www.hultprizehitk.live";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hult Prize HITK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c0e; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #141418; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);">

          <tr>
            <td style="background-color: #101014; border-bottom: 1px solid #27272a; padding: 28px 32px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" valign="middle" style="padding-right: 18px;">
                    <a href="${origin}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${origin}/ef-hult-prize-logo.png" alt="Hult Prize" width="120" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
                    </a>
                  </td>
                  <td valign="middle" style="padding: 0 4px;">
                    <div style="width: 1px; height: 32px; background-color: #3f3f46;"></div>
                  </td>
                  <td align="center" valign="middle" style="padding-left: 18px;">
                    <a href="${origin}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${origin}/hitk-25-logo.png" alt="Heritage Institute of Technology" width="50" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 14px; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa;">
                Heritage Institute of Technology &bull; On-Campus Program
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 36px 32px 32px 32px;">
              ${contentHtml}
            </td>
          </tr>

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

/**
 * HTML for the Team Created confirmation email (sent to the Team Lead only).
 */
export function getTeamCreatedEmailHtml(params: TeamCreatedEmailParams): string {
  const teamName = escapeHtml(params.teamName);
  const leadName = escapeHtml(params.leadName);
  const eventTitle = escapeHtml(params.eventTitle);
  const eventVenue = escapeHtml(params.eventVenue);
  const eventDate = formatEventDate(params.eventDate);
  const deadline = params.deadline ? formatEventDate(params.deadline) : "";
  const inviteNeeded = Math.max(params.minMembers - 1, 0);

  const rows = [
    ["Team Code", `<strong style="color: #f20089; font-size: 16px; letter-spacing: 2px;">${escapeHtml(params.teamCode)}</strong>`],
    ["Team Lead", leadName],
    ["Event", eventTitle],
  ];
  if (eventDate) rows.push(["Date", eventDate]);
  if (eventVenue) rows.push(["Venue", eventVenue]);

  const rowsHtml = rows
    .map(
      ([label, value]) => `
                      <tr>
                        <td style="color: #858591; padding: 4px 0; width: 34%;">${label}:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">${value}</td>
                      </tr>`
    )
    .join("\n");

  const contentHtml = `
                <h1 style="margin: 0 0 18px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">
                  Team ${teamName} created
                </h1>

                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.65; color: #a1a1aa;">
                  Registered for <strong style="color: #ffffff;">${eventTitle}</strong>. Share your invite code so teammates can join.
                </p>

                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a20; border: 1px solid #2e2e36; border-radius: 10px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 18px 22px;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
                        ${rowsHtml}
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                  ${
                    inviteNeeded > 0
                      ? `Invite <strong style="color: #ffffff;">${inviteNeeded} more member${inviteNeeded > 1 ? "s" : ""}</strong> (minimum ${params.minMembers}) to finalize registration.`
                      : `Your team meets the minimum size requirement.`
                  }${deadline ? ` Deadline: <span style="color: #f20089; font-weight: 600;">${deadline}</span>.` : ""}
                </p>

                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                  <tr>
                    <td align="center">
                      <a href="https://www.hultprizehitk.live/register" target="_blank" style="display: inline-block; background-color: #f20089; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 36px; border-radius: 8px; box-shadow: 0 4px 14px rgba(242, 0, 137, 0.35);">
                        Manage Team &rarr;
                      </a>
                    </td>
                  </tr>
                </table>`;

  return getHultMailShell(contentHtml);
}

/**
 * HTML for the Team Submitted confirmation email (sent to both Team Lead and Members).
 */
export function getTeamSubmittedEmailHtml(params: TeamSubmittedEmailParams): string {
  const teamName = escapeHtml(params.teamName);
  const leadName = escapeHtml(params.leadName);
  const recipientName = escapeHtml(params.recipientName || params.leadName);
  const eventTitle = escapeHtml(params.eventTitle);
  const eventVenue = escapeHtml(params.eventVenue || "Heritage Institute of Technology");
  const eventDate = formatEventDate(params.eventDate);
  const ventureName = escapeHtml(params.ventureName);
  const isLead = params.isLead ?? (params.recipientEmail ? params.recipientEmail.toLowerCase() === params.leadEmail.toLowerCase() : true);

  const rows = [
    ["Team", teamName],
    ["Team Lead", leadName],
    ["Venture", ventureName || "—"],
    ["Members", `${params.membersCount}/${params.maxMembers}`],
  ];
  if (eventDate) rows.push(["Event Date", eventDate]);
  if (eventVenue) rows.push(["Venue", eventVenue]);

  const rowsHtml = rows
    .map(
      ([label, value]) => `
                      <tr>
                        <td style="color: #858591; padding: 4px 0; width: 34%;">${label}:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 4px 0;">${value}</td>
                      </tr>`
    )
    .join("\n");

  const contentHtml = `
                <h1 style="margin: 0 0 18px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">
                  Registration confirmed, ${recipientName}
                </h1>

                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.65; color: #a1a1aa;">
                  ${isLead ? `Your team <strong style="color: #ffffff;">${teamName}</strong> has been officially confirmed for ${eventTitle}.` : `You are officially registered with team <strong style="color: #ffffff;">${teamName}</strong> for ${eventTitle}.`}
                </p>

                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a20; border: 1px solid #2e2e36; border-radius: 10px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 18px 22px;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
                        ${rowsHtml}
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                  Your official team registration is locked in. Show up with your team on the event date.
                </p>

                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                  <tr>
                    <td align="center">
                      <a href="https://www.hultprizehitk.live/events?event=${encodeURIComponent(params.eventId)}" target="_blank" style="display: inline-block; background-color: #f20089; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 36px; border-radius: 8px; box-shadow: 0 4px 14px rgba(242, 0, 137, 0.35);">
                        View Event &rarr;
                      </a>
                    </td>
                  </tr>
                </table>`;

  return getHultMailShell(contentHtml);
}

/**
 * Dispatches the Team Created confirmation email to the Team Lead only.
 */
export async function sendTeamCreatedEmail(params: TeamCreatedEmailParams): Promise<SendEmailResult> {
  const htmlContent = getTeamCreatedEmailHtml(params);
  return sendEmail({
    to: [{ email: params.leadEmail, name: params.leadName }],
    replyTo: { email: "hultprize.heritage@gmail.com", name: "Hult Prize HITK Support" },
    subject: `Team "${params.teamName}" created for ${params.eventTitle}`,
    htmlContent,
  });
}

/**
 * Dispatches the Team Submitted confirmation email to a recipient (leader or member).
 */
export async function sendTeamSubmittedEmail(params: TeamSubmittedEmailParams): Promise<SendEmailResult> {
  const htmlContent = getTeamSubmittedEmailHtml(params);
  const toEmail = params.recipientEmail || params.leadEmail;
  const toName = params.recipientName || params.leadName;
  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    replyTo: { email: "hultprize.heritage@gmail.com", name: "Hult Prize HITK Support" },
    subject: `Registration confirmed — ${params.teamName} · ${params.eventTitle}`,
    htmlContent,
  });
}

export interface EventQrPassEmailParams {
  name: string;
  email: string;
  roll?: string;
  department?: string;
  eventTitle: string;
  eventId?: string;
  eventDate?: string | Date;
  eventVenue?: string;
  teamName?: string;
  teamCode?: string;
  role?: string;
  registeredAt?: string | Date;
}

/**
 * HTML for the Official Event QR Entry Pass email.
 * Styled in the exact dark branded aesthetic as the Welcome email.
 */
export function getEventQrPassEmailHtml(params: EventQrPassEmailParams): string {
  const safeName = escapeHtml(params.name || "Heritage Student");
  const eventTitle = escapeHtml(params.eventTitle);
  const eventVenue = escapeHtml(params.eventVenue || "Heritage Institute of Technology");
  const eventDate = formatEventDate(params.eventDate);
  const teamCode = escapeHtml(params.teamCode || "");
  const teamName = escapeHtml(params.teamName || "");
  const role = escapeHtml(params.role || "Participant");
  const roll = escapeHtml(params.roll || "");
  const department = escapeHtml(params.department || "Heritage Institute of Technology");
  const origin = "https://www.hultprizehitk.live";

  // Construct QR Payload (Matches scanner payload parsing in app/api/admin/teams/route.ts)
  const qrPayload = JSON.stringify({
    type: "hult_event_pass",
    event: params.eventTitle,
    teamCode: params.teamCode || "",
    name: params.name || "",
    email: params.email.trim().toLowerCase(),
    roll: params.roll ? params.roll.trim() : undefined,
    registeredAt: params.registeredAt ? String(params.registeredAt) : undefined,
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&format=png&data=${encodeURIComponent(qrPayload)}`;

  const rows: [string, string][] = [
    ["Event", eventTitle],
    ["Attendee", safeName],
    ["College Email", escapeHtml(params.email)],
  ];
  if (roll) rows.push(["College Roll No.", roll]);
  if (department) rows.push(["Department", department]);
  if (teamName) rows.push(["Team Name", teamName]);
  if (teamCode) rows.push(["Team Code", `<strong style="color: #f20089; font-size: 15px; letter-spacing: 1.5px;">${teamCode}</strong>`]);
  if (role) rows.push(["Role", role]);
  if (params.registeredAt) {
    const d = new Date(params.registeredAt);
    if (!isNaN(d.getTime())) {
      const formattedDate = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const formattedTime = d
        .toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        .toUpperCase();
      rows.push(["Registered At", `${formattedDate} &bull; ${formattedTime}`]);
    }
  }
  if (eventDate) rows.push(["Event Date", eventDate]);
  if (eventVenue) rows.push(["Venue", eventVenue]);

  const rowsHtml = rows
    .map(
      ([label, value]) => `
                      <tr>
                        <td style="color: #858591; padding: 5px 0; width: 34%;">${label}:</td>
                        <td style="color: #ffffff; font-weight: 600; padding: 5px 0;">${value}</td>
                      </tr>`
    )
    .join("\n");

  const badgeText = [teamCode, roll ? `ROLL: ${roll}` : ""].filter(Boolean).join(" &bull; ");

  const contentHtml = `
                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">
                  Official Event Entry Pass
                </h1>

                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.65; color: #d4d4d8;">
                  Hello <strong>${safeName}</strong>, your digital check-in pass for <strong style="color: #ffffff;">${eventTitle}</strong> is ready. Present the QR code below at the registration desk for venue entry.
                </p>

                <!-- High-Contrast QR Code Card -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a20; border: 1px solid #2e2e36; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                  <tr>
                    <td style="padding: 24px 20px;" align="center">
                      <div style="display: inline-block; background-color: #ffffff; padding: 14px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);">
                        <img src="${qrImageUrl}" width="220" height="220" alt="Check-In QR Pass" style="display: block; border: 0;" />
                      </div>
                      ${
                        badgeText
                          ? `<div style="margin-top: 14px; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 700; color: #f20089; letter-spacing: 2px;">${badgeText}</div>`
                          : ""
                      }
                      <div style="margin-top: 6px; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">
                        Fast-Track QR Pass &bull; Keep Ready at Entrance
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Attendee & Event Dossier -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a20; border: 1px solid #2e2e36; border-radius: 10px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 18px 22px;">
                      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #f20089; margin-bottom: 12px;">
                        Attendee &amp; Event Dossier
                      </div>
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
                        ${rowsHtml}
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Check-in Guidance Notice -->
                <div style="background-color: #14141a; border-left: 3px solid #f20089; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #a1a1aa; line-height: 1.55; margin-bottom: 28px;">
                  Keep this email accessible on your mobile phone upon arrival at <strong style="color: #ffffff;">${eventVenue}</strong>. Event coordinators will scan your QR code to record your verified check-in.
                </div>

                <!-- Action Button -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                  <tr>
                    <td align="center">
                      <a href="${origin}/events" target="_blank" style="display: inline-block; background-color: #f20089; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 36px; border-radius: 8px; box-shadow: 0 4px 14px rgba(242, 0, 137, 0.35);">
                        View Event Hub &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Sign-off -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="border-top: 1px solid #27272a; padding-top: 20px;">
                      <p style="margin: 0 0 4px 0; font-size: 14px; color: #a1a1aa;">
                        Warm regards,
                      </p>
                      <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff;">
                        Hult Prize HITK Team
                      </p>
                      <p style="margin: 2px 0 0 0; font-size: 12px; color: #71717a;">
                        Heritage Institute of Technology, Kolkata
                      </p>
                    </td>
                  </tr>
                </table>`;

  return getHultMailShell(contentHtml);
}

/**
 * Dispatches the Official Event QR Entry Pass email directly to a participant.
 */
export async function sendEventQrPassEmail(params: EventQrPassEmailParams): Promise<SendEmailResult> {
  const htmlContent = getEventQrPassEmailHtml(params);
  return sendEmail({
    to: [{ email: params.email, name: params.name }],
    replyTo: { email: "hultprize.heritage@gmail.com", name: "Hult Prize HITK Support" },
    subject: `Your Event Pass for ${params.eventTitle} — ${params.name}`,
    htmlContent,
  });
}
export interface HultAscendWhatsAppEmailParams {
  name?: string;
  email: string;
  whatsappLink?: string;
  isRegistered?: boolean;
  isForming?: boolean;
  teamName?: string;
}

/**
 * Returns a high-conversion branded HTML email inviting registered students
 * to join the official HULT ASCEND WhatsApp group and prompting incomplete/unregistered
 * participants to finalize team registration.
 */
export function getHultAscendWhatsAppEmailHtml(params: HultAscendWhatsAppEmailParams): string {
  const origin = "https://www.hultprizehitk.live";
  const whatsappUrl = params.whatsappLink || "https://chat.whatsapp.com/Id32WrxaYB81PactlzQXxl";
  const recipientName = params.name ? escapeHtml(params.name.trim()) : "Heritage Innovator";

  const contentHtml = `
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
                  We are gearing up for the on-campus event - <strong style="color: #ffffff;">HULT ASCEND : The Rise Begins</strong>. To ensure all participants, leaders, and registered students stay informed with real-time updates, schedule releases, mentoring sessions, and venue guidance, we have launched the official WhatsApp community group.
                </p>

                <!-- WhatsApp CTA Card -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161f1a; border: 1px solid #1e3a29; border-radius: 12px; margin: 24px 0; text-align: center;">
                  <tr>
                    <td style="padding: 24px 20px;" align="center">
                      <div style="font-size: 17px; font-weight: 700; color: #ffffff; margin-bottom: 16px;">
                        HULT ASCEND Official WhatsApp Group
                      </div>
                      <div>
                        <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 28px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);">
                          Join WhatsApp Group
                        </a>
                      </div>
                      <p style="margin: 14px 0 0 0; font-size: 11px; font-family: monospace; color: #a1a1aa; word-break: break-all;">
                        Direct Link: <a href="${whatsappUrl}" target="_blank" style="color: #34d399; text-decoration: underline;">${whatsappUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Registration Notice Box -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1618; border: 1px solid #3f2229; border-radius: 12px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 20px 22px;">
                      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #f20089; margin-bottom: 8px;">
                        Important: Team Registration Status
                      </div>
                      <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #e4e4e7;">
                        <strong>Haven't completed your registration yet, or is your team still forming?</strong>
                      </p>
                      <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                        If you have not registered your team for <strong style="color: #ffffff;">HULT ASCEND : The Rise Begins</strong>, or if your team is currently in the <em>Forming</em> status, you must finalize your roster and submit your team registration on the portal right away. Only verified, submitted teams are granted official digital entry passes.
                      </p>
                      <div>
                        <a href="${origin}/events" target="_blank" style="display: inline-block; background-color: #f20089; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px;">
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
                            <a href="${origin}" target="_blank" style="color: #f20089; text-decoration: none;">www.hultprizehitk.live</a>
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
                </table>`;

  return getHultMailShell(contentHtml);
}

/**
 * Dispatches the HULT ASCEND WhatsApp Community & Registration Update email to a recipient.
 */
export async function sendHultAscendWhatsAppEmail(
  params: HultAscendWhatsAppEmailParams,
  subjectPrefix?: string
): Promise<SendEmailResult> {
  const htmlContent = getHultAscendWhatsAppEmailHtml(params);
  const prefix = subjectPrefix ? `${subjectPrefix} ` : "";
  return sendEmail({
    to: [{ email: params.email, name: params.name }],
    replyTo: { email: "hultprize.heritage@gmail.com", name: "Hult Prize HITK Support" },
    subject: `${prefix}Join the Official HULT ASCEND WhatsApp Community | Hult Prize HITK`,
    htmlContent,
  });
}

export interface AdminInvitationEmailParams {
  name: string;
  email: string;
  role: "master_admin" | "lead_admin" | "junior_admin";
  appointedByName?: string;
  dashboardUrl?: string;
}

/**
 * Returns a high-energy, official onboarding email for newly appointed administrators.
 */
export function getAdminInvitationEmailHtml(params: AdminInvitationEmailParams): string {
  const safeName = params.name || "Administrator";
  const baseUrl = params.dashboardUrl || "https://admin.hultprizehitk.live";

  let roleTitle = "Administrator";
  let badgeColor = "#a855f7";
  let badgeBg = "rgba(168, 85, 247, 0.15)";
  let badgeBorder = "rgba(168, 85, 247, 0.4)";
  let roleBadge = "JUNIOR ADMINISTRATOR";
  let targetUrl = `${baseUrl}/scanner`;

  if (params.role === "master_admin") {
    roleTitle = "Master Administrator";
    badgeColor = "#f59e0b";
    badgeBg = "rgba(245, 158, 11, 0.15)";
    badgeBorder = "rgba(245, 158, 11, 0.4)";
    roleBadge = "MASTER ADMINISTRATOR";
    targetUrl = baseUrl;
  } else if (params.role === "lead_admin") {
    roleTitle = "Lead Administrator";
    badgeColor = "#38bdf8";
    badgeBg = "rgba(56, 189, 248, 0.15)";
    badgeBorder = "rgba(56, 189, 248, 0.4)";
    roleBadge = "LEAD ADMINISTRATOR";
    targetUrl = `${baseUrl}/teams`;
  } else {
    // junior_admin
    roleTitle = "Junior Administrator";
    badgeColor = "#c084fc";
    badgeBg = "rgba(192, 132, 252, 0.15)";
    badgeBorder = "rgba(192, 132, 252, 0.4)";
    roleBadge = "JUNIOR ADMINISTRATOR";
    targetUrl = `${baseUrl}/scanner`;
  }

  const contentHtml = `
    <!-- Top Alert Badge -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 9999px; padding: 6px 18px; font-size: 11px; font-weight: 800; color: ${badgeColor}; letter-spacing: 1.5px; text-transform: uppercase;">
        ${roleBadge}
      </span>
    </div>

    <!-- Main Title -->
    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #ffffff; text-align: center; line-height: 1.3;">
      Administrator Clearance Granted
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa; text-align: center;">
      Hello <strong style="color: #ffffff;">${safeName}</strong>, you have been appointed as a <strong style="color: ${badgeColor};">${roleTitle}</strong> for the Hult Prize On-Campus Program at Heritage Institute of Technology.
    </p>

    <!-- Credential Card -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a22; border: 1px solid #2e2e38; border-radius: 12px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; padding-bottom: 6px;">
                Designated College Email
              </td>
            </tr>
            <tr>
              <td style="font-size: 15px; color: #ffffff; font-weight: 600; font-family: monospace; padding-bottom: 14px;">
                ${params.email}
              </td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; padding-bottom: 6px;">
                Clearance Tier
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: 700; color: ${badgeColor};">
                ${roleTitle}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${targetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f20089 0%, #d80077 100%); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 6px 20px rgba(242, 0, 137, 0.35); letter-spacing: 0.5px;">
        Access Administrator Portal &rarr;
      </a>
    </div>

    <!-- Sign-in Instructions -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #101015; border: 1px solid #22222a; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
          <strong style="color: #ffffff;">Quick Access Guide:</strong>
          <ol style="margin: 6px 0 0 0; padding-left: 18px;">
            <li>Click the button above to access the Administrator Portal.</li>
            <li>Select <strong>Sign in with Google</strong> using your official Heritage email (<code>${params.email}</code>).</li>
            <li>Your administrative clearance will authenticate automatically.</li>
          </ol>
        </td>
      </tr>
    </table>

    <!-- Notice -->
    <p style="margin: 0 0 20px 0; font-size: 11px; line-height: 1.5; color: #71717a; text-align: center;">
      This email contains privileged administrative credentials. Please do not forward or share this communication.
    </p>

    <!-- Sign-off -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-top: 1px solid #27272a; padding-top: 18px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #a1a1aa;">
            Authorized by:
          </p>
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff;">
            Hult Prize HITK Executive Committee
          </p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #71717a;">
            Heritage Institute of Technology, Kolkata
          </p>
        </td>
      </tr>
    </table>
  `;

  return getHultMailShell(contentHtml);
}

/**
 * Dispatches the official Administrator Onboarding & Appointment email.
 */
export async function sendAdminInvitationEmail(
  params: AdminInvitationEmailParams
): Promise<SendEmailResult> {
  const roleLabel =
    params.role === "master_admin"
      ? "Master Administrator"
      : params.role === "lead_admin"
      ? "Lead Administrator"
      : "Junior Administrator";

  const htmlContent = getAdminInvitationEmailHtml(params);

  return sendEmail({
    to: [{ email: params.email, name: params.name }],
    replyTo: { email: "hultprize.heritage@gmail.com", name: "Hult Prize HITK Executive Committee" },
    subject: `[Official] Administrator Clearance Granted — ${roleLabel} | Hult Prize HITK`,
    htmlContent,
  });
}

