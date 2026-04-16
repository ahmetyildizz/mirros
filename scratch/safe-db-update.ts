import { db } from "./lib/db";

async function safeUpdate() {
  console.log("Starting safe database update...");
  try {
    // ALTER TYPE ADD VALUE is a safe operation in PostgreSQL
    await db.$executeRawUnsafe(`ALTER TYPE "GameMode" ADD VALUE IF NOT EXISTS 'EXPOSE'`);
    console.log("SUCCESS: 'EXPOSE' added to 'GameMode' enum (or already existed).");
  } catch (err) {
    // If IF NOT EXISTS is not supported or failed for other reasons
    if (err.message.includes("already exists")) {
      console.log("INFO: 'EXPOSE' already exists in the database.");
    } else {
      console.error("ERROR during safe update:", err.message);
      process.exit(1);
    }
  } finally {
    process.exit(0);
  }
}

safeUpdate();
