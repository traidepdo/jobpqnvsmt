const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function run() {
  const resume = await prisma.resume.findFirst({
    include: { template: true }
  });
  console.log('SAMPLE_RESUME:', JSON.stringify(resume, null, 2));
  process.exit(0);
}

run();
