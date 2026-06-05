import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 5,
});

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
