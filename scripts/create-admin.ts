import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import readline from 'readline';

dotenv.config();

const prisma = new PrismaClient();

async function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    // Hide input by overriding output for this rl instance
    (rl as any).stdoutMuted = true;

    const _writeToOutput = (rl as any)._writeToOutput;
    (rl as any)._writeToOutput = function (stringToWrite: string) {
      if ((rl as any).stdoutMuted) {
        // do not write the actual characters (optionally write asterisks)
        (rl as any).output.write('*');
      } else {
        _writeToOutput.call(rl, stringToWrite);
      }
    };

    rl.question(question, (answer) => {
      (rl as any)._writeToOutput = _writeToOutput;
      (rl as any).stdoutMuted = false;
      rl.close();
      (rl as any).output.write('\n');
      resolve(answer.trim());
    });
  });
}

async function main() {
  const masterKey = process.env.MASTER_ADMIN_KEY;
  if (!masterKey) {
    console.error('ERROR: MASTER_ADMIN_KEY is not set in the environment. This script must only run with a server-side key.');
    process.exit(1);
  }

  console.log('This is a backend-only admin-creation tool. It requires the MASTER_ADMIN_KEY environment variable.');

  const entered = await prompt('Enter MASTER_ADMIN_KEY: ', true);
  if (entered !== masterKey) {
    console.error('ERROR: Provided key does not match server key. Aborting.');
    process.exit(1);
  }

  const email = await prompt('Admin email: ');
  const username = await prompt('Username (no spaces): ');
  const displayName = await prompt('Display name: ');
  const password = await prompt('Password: ', true);

  if (!email || !username || !password) {
    console.error('ERROR: email, username and password are required.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`ERROR: A user with email ${email} already exists (id=${existing.id}).`);
    process.exit(1);
  }

  // Hash password using Argon2 to match backend auth service
  const ARGON_TIME = Number(process.env.ARGON_TIME) || 3;
  const ARGON_MEMORY = Number(process.env.ARGON_MEMORY) || 1 << 16;
  const ARGON_PARALLELISM = Number(process.env.ARGON_PARALLELISM) || 1;
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: ARGON_TIME,
    memoryCost: ARGON_MEMORY,
    parallelism: ARGON_PARALLELISM,
  });

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      profile: {
        create: {
          displayName: displayName || username,
        },
      },
    },
  });

  console.log(`SUCCESS: Created admin user ${user.id} (${email}).`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Failed to create admin:', e);
  process.exit(1);
});
