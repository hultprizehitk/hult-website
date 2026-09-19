import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import EmailLog from "../models/EmailLog";

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

async function inspectDb() {
  loadEnv();
  console.log("\n[INSPECT] Connecting to MongoDB to inspect collections and indexes...\n");

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    console.error("[ERROR] MongoDB connection db handle is null.");
    process.exit(1);
  }

  // 1. List collections
  const collections = await db.listCollections().toArray();
  console.log("Existing Collections in Database:");
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(` - ${col.name} (${count} documents)`);
  }

  // 2. Inspect EmailLog collection & indexes
  console.log("\nInspecting EmailLog Collection:");
  const collectionName = EmailLog.collection.collectionName;
  console.log(`Collection Name: ${collectionName}`);

  // Ensure indexes are synchronized
  await EmailLog.syncIndexes();
  const indexes = await EmailLog.collection.indexes();
  console.log("Indexes on EmailLog:");
  for (const idx of indexes) {
    console.log(` - Name: ${idx.name}, Keys: ${JSON.stringify(idx.key)}`);
  }

  // 3. Count documents in EmailLog
  const count = await EmailLog.countDocuments();
  console.log(`\nTotal records in ${collectionName}: ${count}`);

  // 4. Sample latest 5 documents if any exist
  const latestLogs = await EmailLog.find().sort({ sentAt: -1 }).limit(5).lean();
  console.log("\nLatest EmailLog Records:");
  if (latestLogs.length === 0) {
    console.log(" (Collection is currently empty because automated unit tests cleaned up their temporary test records)");
  } else {
    for (const log of latestLogs) {
      console.log(` - [${log.status}] ${log.recipientEmail} | Category: ${log.category} | Subject: "${log.subject}" | At: ${log.sentAt}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n[INSPECT COMPLETE]\n");
}

inspectDb().catch((err) => {
  console.error("Inspection error:", err);
  process.exit(1);
});
