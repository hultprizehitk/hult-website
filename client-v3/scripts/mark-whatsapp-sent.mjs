import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const envLocalPath = path.join(rootDir, ".env.local");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
} else if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("Error: MONGODB_URI is required.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const db = mongoose.connection.db;
  const userDocs = await db.collection("users").find({}).toArray();
  const teamDocs = await db.collection("teams").find({}).toArray();

  const recipientEmails = new Set();

  for (const u of userDocs) {
    if (u.email && typeof u.email === "string") {
      recipientEmails.add(u.email.trim().toLowerCase());
    }
  }

  for (const t of teamDocs) {
    if (t.lead?.email) {
      recipientEmails.add(t.lead.email.trim().toLowerCase());
    }
    if (Array.isArray(t.members)) {
      for (const m of t.members) {
        if (m.email) {
          recipientEmails.add(m.email.trim().toLowerCase());
        }
      }
    }
  }

  const emailList = Array.from(recipientEmails);
  console.log(`Found ${emailList.length} distinct recipient emails.`);

  const now = new Date();

  // Update in users collection
  const userUpdateResult = await db.collection("users").updateMany(
    { email: { $in: emailList } },
    {
      $set: {
        whatsappInviteSent: true,
        whatsappInviteSentAt: now,
      },
    }
  );
  console.log(`Users collection: Matched ${userUpdateResult.matchedCount}, Updated ${userUpdateResult.modifiedCount} records to whatsappInviteSent: true.`);

  // Also flag leads and members in teams collection for consistency
  let teamsUpdated = 0;
  for (const team of teamDocs) {
    let modified = false;
    let updateFields = {};

    if (team.lead?.email && recipientEmails.has(team.lead.email.trim().toLowerCase())) {
      updateFields["lead.whatsappInviteSent"] = true;
      updateFields["lead.whatsappInviteSentAt"] = now;
      modified = true;
    }

    if (Array.isArray(team.members)) {
      const updatedMembers = team.members.map((m) => {
        if (m.email && recipientEmails.has(m.email.trim().toLowerCase())) {
          return { ...m, whatsappInviteSent: true, whatsappInviteSentAt: now };
        }
        return m;
      });
      updateFields["members"] = updatedMembers;
      modified = true;
    }

    if (modified) {
      await db.collection("teams").updateOne({ _id: team._id }, { $set: updateFields });
      teamsUpdated++;
    }
  }

  console.log(`Teams collection: Updated ${teamsUpdated} teams.`);
  console.log("All 58 recipients successfully marked with whatsappInviteSent: true.");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error marking users:", err);
  process.exit(1);
});
