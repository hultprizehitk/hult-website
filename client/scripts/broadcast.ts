import fs from "fs";
import path from "path";
import { sendEmail, Recipient } from "../lib/brevo";

// Basic dotenv reader if BREVO_API_KEY is not already loaded
function loadEnv() {
  if (process.env.BREVO_API_KEY) return;
  const envPaths = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../.env.local"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...valueParts] = trimmed.split("=");
          const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          if (key.trim() && !process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BroadcastScriptOptions {
  filePath?: string;
  recipients?: Array<string | Recipient>;
  subject: string;
  htmlContent: string;
  batchSize?: number;
  delayMs?: number;
}

export async function runBroadcast(options: BroadcastScriptOptions) {
  loadEnv();

  let recipientsList: Recipient[] = [];

  if (options.filePath) {
    const fullPath = path.resolve(process.cwd(), options.filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    const content = fs.readFileSync(fullPath, "utf-8");

    if (fullPath.endsWith(".json")) {
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : parsed.recipients;
      recipientsList = items.map((r: string | Recipient) => {
        if (typeof r === "string") return { email: r.trim() };
        return { email: r.email.trim(), ...(r.name ? { name: r.name.trim() } : {}) };
      });
    } else if (fullPath.endsWith(".csv")) {
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      recipientsList = lines.map((line) => {
        const [email, name] = line.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
        return { email, ...(name ? { name } : {}) };
      });
    } else {
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      recipientsList = lines.map((email) => ({ email: email.trim() }));
    }
  } else if (options.recipients) {
    recipientsList = options.recipients.map((r) => {
      if (typeof r === "string") return { email: r.trim() };
      return { email: r.email.trim(), ...(r.name ? { name: r.name.trim() } : {}) };
    });
  }

  if (recipientsList.length === 0) {
    console.error("❌ No recipients found to send.");
    return;
  }

  const batchSize = Math.max(1, options.batchSize || 50);
  const delayMs = Math.max(100, options.delayMs || 1000);
  const total = recipientsList.length;

  console.log(`\n🚀 Starting Hult Prize Bulk Email Broadcast`);
  console.log(`-----------------------------------------------`);
  console.log(`Subject:     ${options.subject}`);
  console.log(`Recipients:  ${total}`);
  console.log(`Batch Size:  ${batchSize}`);
  console.log(`Delay:       ${delayMs}ms`);
  console.log(`-----------------------------------------------\n`);

  let sentCount = 0;
  let failedCount = 0;
  const failures: Array<{ email: string; error?: string }> = [];

  for (let i = 0; i < total; i += batchSize) {
    const chunk = recipientsList.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(total / batchSize);

    console.log(`[Batch ${batchNum}/${totalBatches}] Processing ${chunk.length} recipients...`);

    const batchPromises = chunk.map(async (recipient) => {
      const res = await sendEmail({
        to: [recipient],
        subject: options.subject,
        htmlContent: options.htmlContent,
      });

      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
        failures.push({ email: recipient.email, error: res.error });
      }
    });

    await Promise.all(batchPromises);

    if (i + batchSize < total) {
      console.log(`⏳ Batch ${batchNum} complete. Waiting ${delayMs}ms before next batch...\n`);
      await delay(delayMs);
    }
  }

  console.log(`\n✅ Broadcast Execution Finished!`);
  console.log(`===============================================`);
  console.log(`Total Recipients: ${total}`);
  console.log(`Successfully Sent: ${sentCount}`);
  console.log(`Failed:           ${failedCount}`);
  if (failures.length > 0) {
    console.log(`\nFailures List:`, JSON.stringify(failures, null, 2));
  }
  console.log(`===============================================\n`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const file = getArg("--file");
  const subject = getArg("--subject") || "Hult Prize HITK Update";
  const htmlFile = getArg("--htmlFile");
  const htmlInline = getArg("--html");
  const batchSize = parseInt(getArg("--batchSize") || "50", 10);
  const delayMs = parseInt(getArg("--delayMs") || "1000", 10);

  let htmlContent = htmlInline || "";
  if (htmlFile && fs.existsSync(htmlFile)) {
    htmlContent = fs.readFileSync(htmlFile, "utf-8");
  }

  if (!file) {
    console.log(`
Usage: npx tsx scripts/broadcast.ts --file <recipients.csv|json|txt> --subject "Subject" --htmlFile <email.html>

Options:
  --file       Path to CSV/JSON/TXT file with recipient emails
  --subject    Email subject line
  --htmlFile   Path to HTML template file
  --html       Inline HTML content
  --batchSize  Batch size (default: 50)
  --delayMs    Delay between batches in ms (default: 1000)
    `);
    process.exit(1);
  }

  runBroadcast({
    filePath: file,
    subject,
    htmlContent: htmlContent || "<p>Hult Prize HITK Announcement</p>",
    batchSize,
    delayMs,
  }).catch((err) => {
    console.error("Broadcast failed:", err);
    process.exit(1);
  });
}
