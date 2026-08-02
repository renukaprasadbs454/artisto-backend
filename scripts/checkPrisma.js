const { PrismaClient } = require('../node_modules/.prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const results = await prisma.actorProfile.findMany({ take: 1 });
    console.log('ok', results.length);
  } catch (err) {
    console.error('err', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
