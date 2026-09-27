import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import "@/models/mirror";

let server: MongoMemoryServer | null = null;

/** In-memory MongoDB for the team-sync reader (the only Mongo code left in the quiz). */
export async function startMongo(): Promise<string> {
  server = await MongoMemoryServer.create();
  const uri = `${server.getUri()}quiz-sync-test`;
  process.env.MONGODB_URI = uri;
  return uri;
}

export async function stopMongo(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
}
