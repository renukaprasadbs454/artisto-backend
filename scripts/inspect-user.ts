import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

async function main() {
  const [, , email] = process.argv;
  if (!email) {
    console.error('Usage: ts-node ./scripts/inspect-user.ts <email>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found for email:', email);
    } else {
      console.log('User:', {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        suspended: user.suspended,
        mustResetPassword: (user as any).mustResetPassword,
        passwordHash: user.passwordHash?.slice(0, 60) + '...'
      });
    }
  } catch (e) {
    console.error('Error querying user:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
