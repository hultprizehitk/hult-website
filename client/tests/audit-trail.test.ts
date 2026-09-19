import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import AuditLog from "../models/AuditLog";
import { logAdminAction, getAuditHistory } from "../lib/audit-logger";

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

async function runAuditTests() {
  loadEnv();
  console.log("\n[TEST] Running Admin Audit Trail Unit Tests...\n");

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

  const testAdminEmail = `audit.admin.${Date.now()}@heritageit.edu.in`;
  const testTargetId = new mongoose.Types.ObjectId().toString();

  try {
    if (!process.env.MONGODB_URI) {
      console.log("  [SKIP]: MONGODB_URI not set. Skipping audit tests.");
      return;
    }

    await connectDB();
    console.log("  [DB]: Connected to MongoDB.");

    // Test 1: Log an admin action
    const entry = await logAdminAction({
      adminEmail: testAdminEmail,
      adminName: "Audit Test Admin",
      adminRole: "lead_admin",
      action: "team_status_change",
      targetType: "team",
      targetId: testTargetId,
      details: { previousStatus: "pending", newStatus: "confirmed" },
    });

    assert(Boolean(entry?._id), "logAdminAction creates document in MongoDB");
    assert(entry?.adminEmail === testAdminEmail, "adminEmail stored in lowercase");
    assert(entry?.action === "team_status_change", "action stored correctly");
    assert(entry?.targetType === "team", "targetType stored correctly");

    // Test 2: Log second action for query testing
    await logAdminAction({
      adminEmail: testAdminEmail,
      adminName: "Audit Test Admin",
      adminRole: "lead_admin",
      action: "cms_create",
      targetType: "content",
      targetId: "content_test_123",
      details: { title: "Test Flash Announcement" },
    });

    // Test 3: Query audit history filtered by adminEmail
    const history = await getAuditHistory({
      adminEmail: testAdminEmail,
    });
    assert(history.logs.length === 2, "getAuditHistory retrieves all records for admin");
    assert(history.pagination.totalCount === 2, "pagination totalCount is accurate");

    // Test 4: Filter by targetType
    const teamHistory = await getAuditHistory({
      adminEmail: testAdminEmail,
      targetType: "team",
    });
    assert(teamHistory.logs.length === 1, "getAuditHistory correctly filters by targetType");
    assert(teamHistory.logs[0].targetId === testTargetId, "retrieved log matches targetId");

    // Test 5: Clean up test entries
    await AuditLog.deleteMany({ adminEmail: testAdminEmail });
    console.log("  [CLEANUP]: Audit test documents removed from MongoDB.");

  } catch (err) {
    console.error("  [ERROR]: Audit test encountered unexpected failure:", err);
    failed++;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log(`\n========================================`);
    console.log(`Audit Trail Tests: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runAuditTests();
