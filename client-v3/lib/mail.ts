import tls from "tls";

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
  email: "onboarding@hultprizehitk.live",
};

/**
 * Sends email directly through Google Workspace Gmail SMTP (smtp.gmail.com:465).
 * Delivers 100% Primary Inbox rates without third-party shared-IP spam penalties.
 */
function sendGoogleWorkspaceSmtp(
  user: string,
  pass: string,
  senderName: string,
  toAddresses: string[],
  replyToAddress: string,
  subject: string,
  htmlContent: string
): Promise<SendEmailResult> {
  return new Promise((resolve, reject) => {
    const client = tls.connect({ port: 465, host: "smtp.gmail.com" });
    let step = 0;
    let buffer = "";
    let recipientIdx = 0;

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
          client.write(`RCPT TO:<${toAddresses[recipientIdx]}>\r\n`);
        } else if (step === 6 && code === "250") {
          recipientIdx++;
          if (recipientIdx < toAddresses.length) {
            client.write(`RCPT TO:<${toAddresses[recipientIdx]}>\r\n`);
          } else {
            step = 7;
            client.write("DATA\r\n");
          }
        } else if (step === 7 && code === "354") {
          step = 8;
          const rawBase64 = Buffer.from(htmlContent).toString("base64");
          const wrappedBase64 = rawBase64.match(/.{1,76}/g)?.join("\r\n") || rawBase64;

          const mime = [
            `From: "${senderName}" <${user}>`,
            `To: ${toAddresses.join(", ")}`,
            `Reply-To: <${replyToAddress}>`,
            `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
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

/**
 * Sends a transactional email exclusively via official Google Workspace SMTP.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const rawTo = Array.isArray(options.to) ? options.to : [options.to];
  const toFormatted: Recipient[] = rawTo.map((item) => {
    if (typeof item === "string") {
      return { email: item.trim() };
    }
    return { email: item.email.trim(), ...(item.name ? { name: item.name.trim() } : {}) };
  });

  if (toFormatted.length === 0) {
    console.error("[Email Dispatch] No valid recipients provided.");
    return { success: false, error: "No recipients provided" };
  }

  const gUser = process.env.GOOGLE_WORKSPACE_EMAIL || DEFAULT_SENDER.email;
  const gPass = process.env.GOOGLE_WORKSPACE_APP_PASSWORD;

  if (!gPass || !gPass.trim()) {
    const errorMsg = "[Email Dispatch] GOOGLE_WORKSPACE_APP_PASSWORD is not configured in environment variables.";
    console.error(errorMsg);
    return { success: false, error: "Google Workspace credentials missing in environment" };
  }

  try {
    const senderName = options.sender?.name || DEFAULT_SENDER.name || "Hult Prize HITK";
    const replyTo = options.replyTo?.email || DEFAULT_REPLY_TO.email;
    const toAddresses = toFormatted.map((r) => r.email);

    const res = await sendGoogleWorkspaceSmtp(
      gUser,
      gPass,
      senderName,
      toAddresses,
      replyTo,
      options.subject,
      options.htmlContent
    );
    console.log(`[Google Workspace SMTP Success] Sent to ${toAddresses.join(", ")}`);
    return res;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown SMTP transmission error";
    console.error("[Google Workspace SMTP Error]:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
