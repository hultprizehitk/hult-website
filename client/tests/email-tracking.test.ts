import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import EmailLog from "../models/EmailLog";
import { logEmailDispatch, hasEmailBeenSent, getEmailStats } from "../lib/mail-logger";

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

async function runEmailTrackingTests() {
  loadEnv();
  console.log("\n[TEST] Running Email Tracking and Deduplication Unit Tests...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  [PASS]: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL]: ${testName}`);
      failed++;
    }
  }

  const testEventId = new mongoose.Types.ObjectId();
  const testRecipient = `track.test.${Date.now()}@heritageit.edu.in`;

  try {
    if (!process.env.MONGODB_URI) {
      console.log("  [SKIP]: MONGODB_URI not configured in client/.env. Skipping database integration tests.");
      return;
    }

    await connectDB();
    console.log("  [DB]: Connected to MongoDB successfully.");

    // Test 1: Check non-existent email before logging
    const initialCheck = await hasEmailBeenSent({
      recipientEmail: testRecipient,
      category: "event_update",
      eventId: testEventId,
    });
    assert(initialCheck === false, "hasEmailBeenSent returns false when no email has been sent");

    // Test 2: Log sent email
    const loggedEntry = await logEmailDispatch({
      recipientEmail: testRecipient,
      recipientName: "Tracking Tester",
      category: "event_update",
      eventId: testEventId,
      subject: "Test Event Announcement",
      status: "sent",
      messageId: "msg_test_12345",
      metadata: { testRun: true },
    });

    assert(Boolean(loggedEntry?._id), "logEmailDispatch creates document in MongoDB");
    assert(loggedEntry?.recipientEmail === testRecipient, "recipientEmail normalized correctly");
    assert(loggedEntry?.status === "sent", "status marked as sent");

    // Test 3: Deduplication check after logging
    const afterCheck = await hasEmailBeenSent({
      recipientEmail: testRecipient,
      category: "event_update",
      eventId: testEventId,
    });
    assert(afterCheck === true, "hasEmailBeenSent returns true after email is logged as sent");

    // Test 4: Deduplication check with different category or event should return false
    const diffCatCheck = await hasEmailBeenSent({
      recipientEmail: testRecipient,
      category: "welcome",
      eventId: testEventId,
    });
    assert(diffCatCheck === false, "hasEmailBeenSent returns false for different category");

    const diffEventCheck = await hasEmailBeenSent({
      recipientEmail: testRecipient,
      category: "event_update",
      eventId: new mongoose.Types.ObjectId(),
    });
    assert(diffEventCheck === false, "hasEmailBeenSent returns false for different eventId");

    // Test 5: Log a skipped duplicate record
    const skippedEntry = await logEmailDispatch({
      recipientEmail: testRecipient,
      recipientName: "Tracking Tester",
      category: "event_update",
      eventId: testEventId,
      subject: "Test Event Announcement",
      status: "skipped_duplicate",
      metadata: { reason: "duplicate_prevention_test" },
    });
    assert(skippedEntry?.status === "skipped_duplicate", "logEmailDispatch records skipped_duplicate status");

    // Test 6: Aggregated statistics calculation
    const stats = await getEmailStats({
      eventId: testEventId.toString(),
      category: "event_update",
    });
    assert(stats.total >= 2, "getEmailStats accurately counts total records");
    assert(stats.sent >= 1, "getEmailStats accurately counts sent records");
    assert(stats.skipped >= 1, "getEmailStats accurately counts skipped duplicate records");

    // Clean up test records
    await EmailLog.deleteMany({ recipientEmail: testRecipient });
    console.log("  [CLEANUP]: Test documents cleaned up successfully.");

  } catch (err) {
    console.error("  [ERROR]: Test run encountered unexpected error:", err);
    failed++;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log(`\n========================================`);
    console.log(`Email Tracking Tests: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runEmailTrackingTests();
