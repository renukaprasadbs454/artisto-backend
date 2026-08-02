import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

dotenv.config();

async function main() {
  const [,, email, password] = process.argv;
  if (!email || !password) {
    console.error('Usage: ts-node ./scripts/reset-admin-password.ts <email> <newPassword>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('No user found with that email.');
      process.exit(1);
    }

    const ARGON_TIME = Number(process.env.ARGON_TIME) || 3;
    const ARGON_MEMORY = Number(process.env.ARGON_MEMORY) || 1 << 16;
    const ARGON_PARALLELISM = Number(process.env.ARGON_PARALLELISM) || 1;

    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: ARGON_TIME,
      memoryCost: ARGON_MEMORY,
      parallelism: ARGON_PARALLELISM,
    });

    await prisma.user.update({ where: { email }, data: { passwordHash: hash, mustResetPassword: false } });
    console.log(`Password for ${email} updated successfully.`);
  } catch (e) {
    console.error('Failed to update password:', e);
    process.exit(1);
  } finally {
    await (new PrismaClient()).$disconnect();
  }
}

main();
