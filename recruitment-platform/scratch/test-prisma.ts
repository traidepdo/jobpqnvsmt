import { prisma } from '../lib/prisma';
console.log(prisma.quiz ? 'Quiz model is loaded!' : 'Quiz model is undefined!');
process.exit(0);
