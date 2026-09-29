import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables
const envLocalPath = path.join(rootDir, ".env.local");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
} else if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const HULT_ASCEND_EVENT_ID = "6ab408ecabbcbb77e95c6d98";

async function main() {
  const isExecute = process.argv.includes("--execute");
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("Error: MONGODB_URI not found in environment variables.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log("======================================================================");
  console.log("  HULT ASCEND: CONVERT UNFINALIZED TEAMS (MIN 2 MEMBERS) TO SUBMITTED");
  console.log("======================================================================");
  console.log(`Mode: ${isExecute ? ">>> LIVE EXECUTION (WRITING TO DATABASE) <<<" : "DRY RUN (NO CHANGES APPLIED - pass --execute to apply)"}\n`);

  const unfinalizedTeams = await db.collection("teams").find({
    $or: [
      { eventId: HULT_ASCEND_EVENT_ID },
      { eventId: new mongoose.Types.ObjectId(HULT_ASCEND_EVENT_ID) }
    ],
    submissionStatus: { $ne: "submitted" }
  }).sort({ teamName: 1 }).toArray();

  console.log(`Total unfinalized teams found in Hult Ascend: ${unfinalizedTeams.length}\n`);

  const eligibleTeams = [];
  const ineligibleTeams = [];

  for (const team of unfinalizedTeams) {
    const totalMembers = 1 + (team.members ? team.members.length : 0);
    const teamInfo = {
      id: team._id,
      teamName: team.teamName,
      teamCode: team.teamCode,
      currentStatus: team.submissionStatus,
      totalMembers,
      leader: {
        name: team.lead?.name || team.leadEmail,
        email: team.leadEmail,
        roll: team.lead?.roll || "",
        department: team.lead?.department || "",
      },
      members: (team.members || []).map((m) => ({
        name: m.name,
        email: m.email,
        roll: m.roll || "",
        department: m.department || "",
      })),
    };

    if (totalMembers >= 2) {
      eligibleTeams.push(teamInfo);
    } else {
      ineligibleTeams.push(teamInfo);
    }
  }

  console.log("----------------------------------------------------------------------");
  console.log(`1. ELIGIBLE TEAMS TO CONVERT TO SUBMITTED (Total Members >= 2): ${eligibleTeams.length}`);
  console.log("----------------------------------------------------------------------");
  eligibleTeams.forEach((t, idx) => {
    console.log(`${idx + 1}. "${t.teamName}" [${t.teamCode}] — ${t.totalMembers} Members (Previous status: ${t.currentStatus})`);
    console.log(`   Leader: ${t.leader.name} (${t.leader.email})`);
    console.log(`   Teammates: ${t.members.map((m) => `${m.name} (${m.email})`).join(", ")}`);
    console.log("");
  });

  console.log("----------------------------------------------------------------------");
  console.log(`2. INELIGIBLE TEAMS (Total Members < 2 / Solo): ${ineligibleTeams.length}`);
  console.log("----------------------------------------------------------------------");
  ineligibleTeams.forEach((t, idx) => {
    console.log(`${idx + 1}. "${t.teamName}" [${t.teamCode}] — ${t.totalMembers} Member (Status: ${t.currentStatus})`);
    console.log(`   Leader: ${t.leader.name} (${t.leader.email})`);
    console.log("   REASON: Does not meet minimum requirement of 2 members.");
    console.log("");
  });

  if (isExecute) {
    console.log("----------------------------------------------------------------------");
    console.log("EXECUTING DATABASE UPDATES...");
    console.log("----------------------------------------------------------------------");

    const now = new Date();
    let updatedCount = 0;

    for (const t of eligibleTeams) {
      // 1. Update in teams collection
      const teamRes = await db.collection("teams").updateOne(
        { _id: t.id },
        {
          $set: {
            submissionStatus: "submitted",
            submittedAt: now,
            status: "confirmed",
            membersCount: t.totalMembers,
            updatedAt: now,
          },
        }
      );

      // 2. Update inside events collection embedded registeredTeams array if present
      await db.collection("events").updateOne(
        {
          _id: new mongoose.Types.ObjectId(HULT_ASCEND_EVENT_ID),
          "registeredTeams.teamCode": t.teamCode,
        },
        {
          $set: {
            "registeredTeams.$.submissionStatus": "submitted",
            "registeredTeams.$.submittedAt": now,
            "registeredTeams.$.status": "confirmed",
            "registeredTeams.$.membersCount": t.totalMembers,
          },
        }
      );

      if (teamRes.modifiedCount > 0) {
        updatedCount++;
        console.log(`  [OK] Converted: "${t.teamName}" (${t.teamCode}) -> submitted`);
      }
    }

    console.log(`\nSuccessfully converted ${updatedCount} teams to "submitted" status.`);

    // Verification check
    const finalSubmittedCount = await db.collection("teams").countDocuments({
      $or: [
        { eventId: HULT_ASCEND_EVENT_ID },
        { eventId: new mongoose.Types.ObjectId(HULT_ASCEND_EVENT_ID) }
      ],
      submissionStatus: "submitted",
    });

    console.log(`Total fully submitted teams in HULT ASCEND now: ${finalSubmittedCount}`);
  } else {
    console.log("Run with --execute to commit these changes to MongoDB.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
