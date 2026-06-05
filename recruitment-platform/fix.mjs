import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const result = await prisma.$executeRawUPDATE jobs SET experience_level = NULL WHERE experience_level = '';
console.log('Fixed:', result, 'rows');
await prisma.$disconnect();
