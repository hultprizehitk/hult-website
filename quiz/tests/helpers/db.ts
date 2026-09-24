import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import "@/models/mirror";
import "@/models/quiz";

let server: MongoMemoryServer | null = null;

export async function startDb(): Promise<void> {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { dbName: "quiz-test" });
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

export async function clearDb(): Promise<void> {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function stopDb(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
}
