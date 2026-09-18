import fs from "fs";
import path from "path";
import { sendEmail } from "../lib/mail";
import { getRegistrationConfirmationHtml, getWelcomeEmailHtml } from "../lib/email-templates";

function loadEnv() {
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
 * Automated Test Suite for Google Workspace Email Integration
 * Run with: npm run test:email
 */
async function runEmailTests() {
  loadEnv();
  console.log("\n🧪 Running Google Workspace Email System Integration & Unit Tests...\n");
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

  // Test 1: HTML Template Generation & Branding (Registration Confirmation)
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

  // Test 1b: Welcome Email Template Generation & Metadata
  try {
    const welcomeHtml = getWelcomeEmailHtml({
      name: "Rahul Sharma",
      email: "rahul.sharma.cse26@heritageit.edu.in",
      department: "Computer Science and Engineering",
      year: "3rd Year",
    });

    assert(welcomeHtml.includes("Rahul Sharma"), "Welcome email contains user's name");
    assert(welcomeHtml.includes("rahul.sharma.cse26@heritageit.edu.in"), "Welcome email contains user's email");
    assert(welcomeHtml.includes("Computer Science and Engineering"), "Welcome email contains department");
    assert(welcomeHtml.includes("3rd Year"), "Welcome email contains academic year");
    assert(welcomeHtml.includes("Hult-Prize.png"), "Welcome email includes Hult Prize logo");
    assert(welcomeHtml.includes("hitk-25-logo.png"), "Welcome email includes Heritage Institute of Technology logo");
    assert(welcomeHtml.includes("/events"), "Welcome email includes link to browse competitions");
    assert(!welcomeHtml.includes("Access Tier"), "Welcome email has access tier removed for clean presentation");
  } catch (err) {
    assert(false, `Welcome Email Template Generation threw error: ${err}`);
  }

  // Test 2: Missing provider credentials error handling
  try {
    const originalPass = process.env.GOOGLE_WORKSPACE_APP_PASSWORD;
    delete process.env.GOOGLE_WORKSPACE_APP_PASSWORD;

    const res = await sendEmail({
      to: ["test@example.com"],
      subject: "Test Subject",
      htmlContent: "<p>Test</p>",
    });

    assert(res.success === false, "sendEmail fails gracefully when credentials are missing");
    assert(Boolean(res.error?.includes("Google Workspace")), "Error message references missing Google Workspace credentials");

    process.env.GOOGLE_WORKSPACE_APP_PASSWORD = originalPass;
  } catch (err) {
    assert(false, `Missing credentials test threw exception: ${err}`);
  }

  // Test 3: Live Google Workspace SMTP Dispatch Test
  const pass = process.env.GOOGLE_WORKSPACE_APP_PASSWORD;
  const user = process.env.GOOGLE_WORKSPACE_EMAIL || "onboarding@hultprizehitk.live";
  const isRealPass = pass && pass.trim().length > 10;

  if (isRealPass) {
    try {
      const res = await sendEmail({
        to: [{ email: user, name: "Self Test" }],
        subject: "Automated System Integration Test",
        htmlContent: "<h1>Integration Test</h1><p>Google Workspace SMTP connection test passed.</p>",
      });

      assert(res.success === true, "Live Google Workspace SMTP call succeeds with valid credentials");
      assert(typeof res.messageId === "string", "Live Google Workspace SMTP returns valid messageId");
    } catch (err) {
      assert(false, `Live Google Workspace SMTP test failed: ${err}`);
    }
  } else {
    console.log("  ⚠️ SKIPPED: Live Google Workspace SMTP test (Add real GOOGLE_WORKSPACE_APP_PASSWORD to client/.env)");
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
