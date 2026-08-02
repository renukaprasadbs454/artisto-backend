const { PrismaClient } = require('../node_modules/.prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.user.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true,
        profile: { select: { displayName: true, headline: true } },
      },
    });

    console.table(users.map(u => ({
      id: u.id,
      username: u.username || '<none>',
      email: u.email || '<none>',
      displayName: u.profile?.displayName || '<none>',
      headline: u.profile?.headline || '',
      role: u.role,
      suspended: u.suspended,
      createdAt: u.createdAt,
    })));
  } catch (err) {
    console.error('Failed to list users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
