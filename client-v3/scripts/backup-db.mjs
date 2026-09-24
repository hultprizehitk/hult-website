import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const { MongoClient } = mongoose.mongo;

// Determine directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables from .env.local or .env
const envLocalPath = path.join(rootDir, ".env.local");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
} else if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const sourceUri = process.env.MONGODB_URI;
const targetUri = process.env.MONGODB_BACKUP;

if (!sourceUri) {
  console.error("Error: MONGODB_URI is not set in environment or .env.local");
  process.exit(1);
}

if (!targetUri) {
  console.error("Error: MONGODB_BACKUP is not set in environment or .env.local");
  process.exit(1);
}

// Parse optional CLI arguments: --db=<name> or --batch=<size>
const args = process.argv.slice(2);
const dbArg = args.find((a) => a.startsWith("--db="))?.split("=")[1];
const batchArg = parseInt(args.find((a) => a.startsWith("--batch="))?.split("=")[1] || "500", 10);
const BATCH_SIZE = isNaN(batchArg) || batchArg <= 0 ? 500 : batchArg;

async function runBackup() {
  const startTime = Date.now();
  console.log("=================================================");
  console.log("          MONGODB FULL DATABASE BACKUP           ");
  console.log("=================================================");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    console.log("\nConnecting to Source and Target MongoDB clusters...");
    await Promise.all([sourceClient.connect(), targetClient.connect()]);
    console.log("Connected successfully to both clusters.");

    // Identify DB names
    const sourceDefaultDb = sourceClient.db();
    const sourceDbName = sourceDefaultDb.databaseName || "hult-website";
    const targetDbName = dbArg || sourceDbName;

    const srcDb = sourceClient.db(sourceDbName);
    const tgtDb = targetClient.db(targetDbName);

    console.log(`Source DB  : "${sourceDbName}"`);
    console.log(`Target DB  : "${targetDbName}"`);

    // List all non-system collections
    const allCollections = await srcDb.listCollections().toArray();
    const collectionsToCopy = allCollections
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."));

    if (collectionsToCopy.length === 0) {
      console.log("\nNo collections found in source database.");
      return;
    }

    console.log(`\nFound ${collectionsToCopy.length} collection(s) to backup:`);
    collectionsToCopy.forEach((c, idx) => console.log(`  ${idx + 1}. ${c}`));
    console.log("-------------------------------------------------");

    const summary = [];

    for (const collName of collectionsToCopy) {
      const srcColl = srcDb.collection(collName);
      const tgtColl = tgtDb.collection(collName);

      const srcCount = await srcColl.countDocuments();
      console.log(`\nProcessing collection: "${collName}" (${srcCount} documents)...`);

      // 1. Fetch indexes before dropping
      let srcIndexes = [];
      try {
        srcIndexes = await srcColl.indexes();
      } catch (err) {
        console.warn(`  Warning: could not fetch indexes for "${collName}": ${err.message}`);
      }

      // 2. Drop existing target collection to guarantee a fresh, exact mirror
      try {
        await tgtColl.drop();
        console.log(`  Existing target collection "${collName}" dropped.`);
      } catch (err) {
        // Ignore "ns not found" error when dropping non-existent collection
        if (err.code !== 26) {
          console.warn(`  Notice when preparing target "${collName}": ${err.message}`);
        }
      }

      // 3. Batch copy documents
      let copiedCount = 0;
      if (srcCount > 0) {
        const cursor = srcColl.find({});
        let batch = [];

        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          batch.push(doc);

          if (batch.length >= BATCH_SIZE) {
            await tgtColl.insertMany(batch, { ordered: false });
            copiedCount += batch.length;
            process.stdout.write(`  Copied: ${copiedCount}/${srcCount} docs...\r`);
            batch = [];
          }
        }

        if (batch.length > 0) {
          await tgtColl.insertMany(batch, { ordered: false });
          copiedCount += batch.length;
        }

        console.log(`  Copied: ${copiedCount}/${srcCount} docs. Complete.`);
      } else {
        console.log(`  Collection is empty (0 docs). Initialized on target.`);
        // Ensure empty collection is created
        await tgtDb.createCollection(collName).catch(() => {});
      }

      // 4. Reconstruct custom indexes
      let indexesCreated = 0;
      const customIndexes = srcIndexes.filter((idx) => idx.name !== "_id_");
      if (customIndexes.length > 0) {
        for (const idx of customIndexes) {
          try {
            const indexKey = idx.key;
            const options = {
              name: idx.name,
              unique: Boolean(idx.unique),
              sparse: Boolean(idx.sparse),
            };
            if (idx.expireAfterSeconds !== undefined) {
              options.expireAfterSeconds = idx.expireAfterSeconds;
            }
            await tgtColl.createIndex(indexKey, options);
            indexesCreated++;
          } catch (idxErr) {
            console.warn(`  Warning creating index "${idx.name}" on "${collName}": ${idxErr.message}`);
          }
        }
        console.log(`  Restored ${indexesCreated}/${customIndexes.length} index(es).`);
      }

      // 5. Verification
      const tgtCount = await tgtColl.countDocuments();
      const isMatch = srcCount === tgtCount;

      summary.push({
        collection: collName,
        sourceDocs: srcCount,
        backupDocs: tgtCount,
        indexes: indexesCreated,
        status: isMatch ? "VERIFIED" : "MISMATCH",
      });
    }

    // Print final summary
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n=================================================");
    console.log("               BACKUP SUMMARY REPORT             ");
    console.log("=================================================");
    console.table(summary);

    const allVerified = summary.every((s) => s.status === "VERIFIED");
    if (allVerified) {
      console.log(`\nSUCCESS: All ${summary.length} collections backed up and verified in ${elapsedSec}s!`);
    } else {
      console.warn(`\nWARNING: Some collections had count mismatches. Please inspect the summary table.`);
    }
  } catch (error) {
    console.error("\nFATAL BACKUP ERROR:", error);
    process.exit(1);
  } finally {
    await Promise.all([sourceClient.close(), targetClient.close()]);
    console.log("\nDatabase connections closed.\n");
  }
}

runBackup();
