const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma['\']("UPDATE jobs SET experience_level = NULL WHERE experience_level = ''")
  .then(r => { console.log('Done:', r); return prisma['\'](); })
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1); });
