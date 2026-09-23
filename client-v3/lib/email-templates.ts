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
                  <!-- Hult Prize Logo -->
                  <td align="center" valign="middle" style="padding-right: 18px;">
                    <a href="${origin}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${origin}/Hult-Prize.png" alt="Hult Prize" width="120" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
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
                      Explore Events & Competitions &rarr;
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
                Need assistance? Reach us at <a href="mailto:hultprizehitk@gmail.com" style="color: #f20089; text-decoration: none;">hultprizehitk@gmail.com</a>
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
                      <img src="${origin}/Hult-Prize.png" alt="Hult Prize" width="120" style="display: block; max-height: 44px; width: auto; object-fit: contain; border: 0;" />
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
                Need assistance? Reach us at <a href="mailto:hultprizehitk@gmail.com" style="color: #f20089; text-decoration: none;">hultprizehitk@gmail.com</a>
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
 * HTML for the Team Submitted confirmation email (sent to the Team Lead only).
 */
export function getTeamSubmittedEmailHtml(params: TeamSubmittedEmailParams): string {
  const teamName = escapeHtml(params.teamName);
  const leadName = escapeHtml(params.leadName);
  const eventTitle = escapeHtml(params.eventTitle);
  const eventVenue = escapeHtml(params.eventVenue);
  const eventDate = formatEventDate(params.eventDate);
  const ventureName = escapeHtml(params.ventureName);

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
                  Registration confirmed, ${leadName}
                </h1>

                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.65; color: #a1a1aa;">
                  <strong style="color: #ffffff;">${teamName}</strong> &mdash; ${eventTitle}
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
                  Your official registration is locked in. Show up with your team on the event date.
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
    subject: `Team "${params.teamName}" created for ${params.eventTitle}`,
    htmlContent,
  });
}

/**
 * Dispatches the Team Submitted confirmation email to the Team Lead only.
 */
export async function sendTeamSubmittedEmail(params: TeamSubmittedEmailParams): Promise<SendEmailResult> {
  const htmlContent = getTeamSubmittedEmailHtml(params);
  return sendEmail({
    to: [{ email: params.leadEmail, name: params.leadName }],
    subject: `Registration confirmed — ${params.teamName} · ${params.eventTitle}`,
    htmlContent,
  });
}
