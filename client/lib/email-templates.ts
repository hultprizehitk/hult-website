import { sendEmail, SendEmailResult } from "./brevo";

export interface RegistrationConfirmationParams {
  name: string;
  email: string;
  eventName?: string;
}

/**
 * Returns a styled HTML email for registration confirmation matching Hult Prize HITK branding.
 */
export function getRegistrationConfirmationHtml({
  name,
  email,
  eventName = "Hult Prize HITK 2025-2026",
}: RegistrationConfirmationParams): string {
  const safeName = name || "Participant";
  const safeEvent = eventName;
  const safeEmail = email;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed - ${safeEvent}</title>
</head>
<body style="margin:0; padding:0; background-color:#09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f4f4f5; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color:#141417; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #000000 100%); border-bottom: 2px solid #e6007e; padding: 32px 32px 24px 32px; text-align: center;">
              <h1 style="margin:0; font-size: 26px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">
                HULT PRIZE <span style="color:#e6007e;">HITK</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                Heritage Institute of Technology
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin:0 0 16px 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                Registration Confirmed! 🎉
              </h2>
              
              <p style="margin:0 0 20px 0; font-size: 15px; line-height: 1.6; color: #d4d4d8;">
                Hello <strong style="color: #ffffff;">${safeName}</strong>,
              </p>
              
              <p style="margin:0 0 24px 0; font-size: 15px; line-height: 1.6; color: #d4d4d8;">
                Welcome to <strong>${safeEvent}</strong>! Your registration has been successfully processed and confirmed. You are now officially registered for our upcoming events, workshops, and competitions.
              </p>

              <!-- Details Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1c1c21; border: 1px solid #3f3f46; border-radius: 10px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 12px; font-weight: 700; color: #e6007e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      Participant Details
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 4px 0; color: #a1a1aa; width: 120px;">Participant:</td>
                        <td style="padding: 4px 0; color: #ffffff; font-weight: 600;">${safeName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #a1a1aa;">Email:</td>
                        <td style="padding: 4px 0; color: #ffffff; font-weight: 600;">${safeEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #a1a1aa;">Event:</td>
                        <td style="padding: 4px 0; color: #ffffff; font-weight: 600;">${safeEvent}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #a1a1aa;">Status:</td>
                        <td style="padding: 4px 0; color: #22c55e; font-weight: 700;">CONFIRMED</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call To Action -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="https://www.hultprizehitk.live/portal" target="_blank" style="display: inline-block; background-color: #e6007e; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(230, 0, 126, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                      Access Student Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size: 14px; line-height: 1.5; color: #a1a1aa;">
                If you have any questions or need support, reply directly to this email or reach us at <a href="mailto:hultprizehitk@gmail.com" style="color: #e6007e; text-decoration: none;">hultprizehitk@gmail.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0d0d11; border-top: 1px solid #27272a; padding: 24px 32px; text-align: center; font-size: 12px; color: #71717a;">
              <p style="margin:0 0 6px 0;">
                &copy; ${new Date().getFullYear()} Hult Prize HITK — Heritage Institute of Technology
              </p>
              <p style="margin:0;">
                <a href="https://www.hultprizehitk.live" style="color: #a1a1aa; text-decoration: underline;">onboarding.hultprizehitk.live</a>
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
 * Helper function to trigger a registration confirmation email for a new participant.
 */
export async function sendRegistrationConfirmationEmail(
  params: RegistrationConfirmationParams
): Promise<SendEmailResult> {
  const htmlContent = getRegistrationConfirmationHtml(params);
  return sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: `Registration Confirmed: ${params.eventName || "Hult Prize HITK 2025-2026"}`,
    htmlContent,
  });
}
