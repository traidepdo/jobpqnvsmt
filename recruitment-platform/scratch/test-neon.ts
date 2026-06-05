import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function test() {
  console.log("Connecting to:", process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Sending query...");
    const res = await pool.query("SELECT NOW()");
    console.log("Success! Server time:", res.rows[0]);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

test();
