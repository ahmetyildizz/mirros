const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_nqx2lGwStW9M@ep-shiny-haze-alsnq0fy-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function fix() {
  const client = new Client({ connectionString });
  console.log("Connecting to database...");
  try {
    await client.connect();
    console.log("Adding 'EXPOSE' to 'GameMode' enum...");
    // ALTER TYPE ADD VALUE cannot run in a transaction, so we just run it.
    // PostgreSQL fails if value exists, so we catch the error.
    try {
      await client.query(`ALTER TYPE "GameMode" ADD VALUE 'EXPOSE'`);
      console.log("SUCCESS: 'EXPOSE' added.");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("INFO: 'EXPOSE' already exists.");
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    await client.end();
    process.exit();
  }
}

fix();
