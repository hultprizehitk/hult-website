import mongoose from "mongoose";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
const match = envFile.match(/MONGODB_URI=(.*)/);
const MONGODB_URI = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function fix() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const email = "yogesh.kumar.cse28@heritageit.edu.in";
  const result = await User.updateOne(
    { email: email },
    { $set: { name: "Yogesh Kumar" } }
  );

  console.log("Updated User record:", result);

  const TeamSchema = new mongoose.Schema({ leadEmail: String, "members.email": String });
  const Team = mongoose.models.Team || mongoose.model("Team", TeamSchema);
  const EventSchema = new mongoose.Schema({ registeredTeams: Array });
  const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

  await Team.deleteMany({
    $or: [{ leadEmail: email }, { "members.email": email }]
  });

  await Event.updateMany(
    {},
    {
      $pull: {
        registeredTeams: {
          $or: [
            { leadEmail: email },
            { "members.email": email }
          ]
        }
      }
    }
  );

  console.log("Purged test teams for clean re-registration testing");
  await mongoose.disconnect();
}

fix();
