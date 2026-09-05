export interface Recipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: string | Recipient | (string | Recipient)[];
  subject: string;
  htmlContent: string;
  templateId?: number;
  params?: Record<string, unknown>;
  sender?: Recipient;
  replyTo?: Recipient;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_SENDER: Recipient = {
  name: "Hult Prize HITK",
  email: "onboarding@hultprizehitk.live",
};

const DEFAULT_REPLY_TO: Recipient = {
  email: "hultprizehitk@gmail.com",
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sends a transactional email via Brevo (formerly Sendinblue) v3 API.
 * Uses process.env.BREVO_API_KEY. Never logs or commits the key.
 * Logs failures gracefully without throwing unhandled exceptions to prevent request crashes.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      const errorMsg = "[Brevo Email] BREVO_API_KEY is not configured in environment variables.";
      console.error(errorMsg);
      return { success: false, error: "BREVO_API_KEY environment variable missing" };
    }

    // Normalize recipient format to Brevo's expected schema: [{ email: "...", name?: "..." }]
    const rawTo = Array.isArray(options.to) ? options.to : [options.to];
    const toFormatted: Recipient[] = rawTo.map((item) => {
      if (typeof item === "string") {
        return { email: item.trim() };
      }
      return { email: item.email.trim(), ...(item.name ? { name: item.name.trim() } : {}) };
    });

    if (toFormatted.length === 0) {
      console.error("[Brevo Email] No valid recipients provided.");
      return { success: false, error: "No recipients provided" };
    }

    const payload: Record<string, unknown> = {
      sender: options.sender || DEFAULT_SENDER,
      to: toFormatted,
      replyTo: options.replyTo || DEFAULT_REPLY_TO,
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: stripHtml(options.htmlContent),
      tags: ["transactional"],
    };

    if (options.templateId) {
      payload.templateId = options.templateId;
    }

    if (options.params) {
      payload.params = options.params;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey.trim(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status} ${response.statusText}`;
      console.error(`[Brevo Email Error] Failed to send email to ${toFormatted.map((r) => r.email).join(", ")}:`, errorMsg);
      return { success: false, error: errorMsg };
    }

    const messageId = data?.messageId || "sent";
    console.log(`[Brevo Email Success] Sent email to ${toFormatted.map((r) => r.email).join(", ")}, messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown network/system error";
    console.error("[Brevo Email Failure] Exception thrown during email dispatch:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
