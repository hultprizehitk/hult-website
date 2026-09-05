import fs from "fs";
import path from "path";
import { sendEmail } from "../lib/brevo";
import { getRegistrationConfirmationHtml } from "../lib/email-templates";

function loadEnv() {
  if (process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.includes("your_")) return;
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

/**
 * Automated Test Suite for Brevo Email Integration
 * Run with: npx tsx tests/email-system.test.ts
 */
async function runEmailTests() {
  loadEnv();
  console.log("\n🧪 Running Email System Integration & Unit Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  }

  // Test 1: HTML Template Generation & Branding
  try {
    const html = getRegistrationConfirmationHtml({
      name: "Test Student",
      email: "test.student@heritageit.edu.in",
      eventName: "Hult Prize HITK 2025-2026",
    });

    assert(html.includes("Test Student"), "HTML template contains participant name");
    assert(html.includes("test.student@heritageit.edu.in"), "HTML template contains participant email");
    assert(html.includes("Hult Prize HITK 2025-2026"), "HTML template contains event name");
    assert(html.includes("#e6007e"), "HTML template contains Hult Prize brand accent color");
  } catch (err) {
    assert(false, `HTML Template Generation threw error: ${err}`);
  }

  // Test 2: Brevo API missing key error handling
  try {
    const originalKey = process.env.BREVO_API_KEY;
    delete process.env.BREVO_API_KEY;

    const res = await sendEmail({
      to: ["test@example.com"],
      subject: "Test Subject",
      htmlContent: "<p>Test</p>",
    });

    assert(res.success === false, "sendEmail fails gracefully when BREVO_API_KEY is missing");
    assert(Boolean(res.error?.includes("BREVO_API_KEY")), "Error message references missing BREVO_API_KEY");

    process.env.BREVO_API_KEY = originalKey;
  } catch (err) {
    assert(false, `Missing API key test threw exception: ${err}`);
  }

  // Test 3: Live Brevo API Dispatch Test
  const apiKey = process.env.BREVO_API_KEY;
  const isRealApiKey = apiKey && apiKey.trim().length > 15 && !apiKey.includes("your_") && apiKey !== "placeholder";

  if (isRealApiKey) {
    try {
      const res = await sendEmail({
        to: [{ email: "onboarding@hultprizehitk.live", name: "Self Test" }],
        subject: "Automated System Integration Test",
        htmlContent: "<h1>Integration Test</h1><p>Brevo API connection test passed.</p>",
      });

      assert(res.success === true, "Live Brevo API call succeeds with valid BREVO_API_KEY");
      assert(typeof res.messageId === "string", "Live Brevo API returns valid messageId");
    } catch (err) {
      assert(false, `Live Brevo API test failed: ${err}`);
    }
  } else {
    console.log("  ⚠️ SKIPPED: Live Brevo API test (Add real BREVO_API_KEY to client/.env to test live dispatch)");
  }

  console.log(`\n===============================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runEmailTests().catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  });
}
