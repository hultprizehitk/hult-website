import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { sendEmail, Recipient } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logEmailDispatch, hasEmailBeenSent } from "@/lib/mail-logger";
import { logAdminAction } from "@/lib/audit-logger";
import { EmailCategory } from "@/models/EmailLog";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  // Rate limiting: max 5 bulk broadcasts per 10 minutes per IP
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(`admin_broadcast_${clientIp}`, {
    limit: 5,
    windowMs: 600000,
  });
  if (!rateCheck.success) {
    return NextResponse.json(
      {
        error: "Broadcast rate limit exceeded. Please wait 10 minutes before launching another bulk broadcast.",
      },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or malformed JSON payload provided." },
      { status: 400 }
    );
  }

  try {
    const {
      recipients,
      subject,
      htmlContent,
      batchSize = 50,
      delayMs = 1000,
      eventId,
      category = "broadcast",
      preventDuplicates = false,
    } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "recipients must be a non-empty array of email strings or recipient objects." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "subject is required." }, { status: 400 });
    }

    if (!htmlContent || typeof htmlContent !== "string" || !htmlContent.trim()) {
      return NextResponse.json({ error: "htmlContent is required." }, { status: 400 });
    }

    const emailCategory = (category as EmailCategory) || "broadcast";
    const strEventId = typeof eventId === "string" && eventId.trim() ? eventId.trim() : undefined;

    // Normalize recipients
    const normalizedRecipients: Recipient[] = recipients.map((r) => {
      if (typeof r === "string") return { email: r.trim() };
      return { email: r.email.trim(), ...(r.name ? { name: r.name.trim() } : {}) };
    });

    const total = normalizedRecipients.length;
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const failures: Array<{ email: string; error?: string }> = [];
    const skippedList: Array<{ email: string; reason: string }> = [];

    const numBatchSize = typeof batchSize === "number" ? batchSize : 50;
    const numDelayMs = typeof delayMs === "number" ? delayMs : 1000;
    const effectiveBatchSize = Math.max(1, Math.min(numBatchSize, 100));
    const effectiveDelay = Math.max(100, numDelayMs);

    console.log(
      `[Admin Broadcast] Starting bulk email sending to ${total} recipients in batches of ${effectiveBatchSize}... (preventDuplicates: ${Boolean(preventDuplicates)})`
    );

    for (let i = 0; i < total; i += effectiveBatchSize) {
      const chunk = normalizedRecipients.slice(i, i + effectiveBatchSize);

      const batchPromises = chunk.map(async (recipient) => {
        // Deduplication safeguard check
        if (preventDuplicates) {
          const alreadySent = await hasEmailBeenSent({
            recipientEmail: recipient.email,
            category: emailCategory,
            eventId: strEventId,
          });

          if (alreadySent) {
            skippedCount++;
            skippedList.push({
              email: recipient.email,
              reason: "Already received email for this event/category",
            });
            await logEmailDispatch({
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              category: emailCategory,
              eventId: strEventId,
              subject: subject.trim(),
              status: "skipped_duplicate",
              metadata: { skippedAt: new Date() },
            });
            return;
          }
        }

        const result = await sendEmail({
          to: [recipient],
          subject: subject.trim(),
          htmlContent,
        });

        if (result.success) {
          sentCount++;
          await logEmailDispatch({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            category: emailCategory,
            eventId: strEventId,
            subject: subject.trim(),
            status: "sent",
            messageId: result.messageId,
          });
        } else {
          failedCount++;
          failures.push({ email: recipient.email, error: result.error });
          await logEmailDispatch({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            category: emailCategory,
            eventId: strEventId,
            subject: subject.trim(),
            status: "failed",
            error: result.error,
          });
        }
      });

      await Promise.all(batchPromises);

      if (i + effectiveBatchSize < total) {
        console.log(
          `[Admin Broadcast] Completed batch ${Math.floor(i / effectiveBatchSize) + 1}. Waiting ${effectiveDelay}ms...`
        );
        await delay(effectiveDelay);
      }
    }

    console.log(
      `[Admin Broadcast Complete] Total: ${total}, Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`
    );

    await logAdminAction({
      req,
      action: "broadcast_dispatch",
      targetType: "broadcast",
      details: {
        subject: subject.trim(),
        totalRecipients: total,
        sentCount,
        failedCount,
        skippedCount,
        eventId: strEventId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        summary: {
          total,
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        failures,
        skippedList,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Admin Broadcast Error:", error);
    const message = error instanceof Error ? error.message : "Failed to execute broadcast.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
