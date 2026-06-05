import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

console.log("DATABASE_URL inside scratch-fix:", process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning up invalid experience values...");
  
  // Set empty string and string 'null' or 'undefined' to NULL
  const result = await prisma.$executeRawUnsafe(`
    UPDATE jobs 
    SET experience = NULL 
    WHERE experience = '' OR experience = 'null' OR experience = 'undefined'
  `);
  console.log(`Updated ${result} jobs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
