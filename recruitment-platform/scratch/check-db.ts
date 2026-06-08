import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from recruitment-platform
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const { prisma } = await import('../lib/prisma.js');
  const apps = await prisma.application.findMany({
    select: {
      id: true,
      matchScore: true,
      job: { select: { title: true } },
      user: { select: { name: true } }
    }
  });
  console.log("Applications in Database:", JSON.stringify(apps, null, 2));
}

main().catch(console.error);
