/**
 * Creates (or resets) a SUPER_ADMIN for the admin panel, e.g. the owner's account on a new server.
 *
 *   npx tsx prisma/create-admin.ts --email owner@example.com --name "Owner" [--password "..."]
 *
 * Without --password (or ADMIN_PASSWORD) a strong random password is generated and printed once.
 */
import { config as loadEnv } from 'dotenv';
import { randomBytes } from 'node:crypto';
import { AdminRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

loadEnv({ quiet: true });
const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

/** 16 characters with upper, lower, digits and a symbol (meets the login password rule). */
function generatePassword(): string {
  const base = randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
  return `${base}Wm#${randomBytes(1)[0] % 10}`;
}

async function main() {
  const email = arg('--email')?.trim().toLowerCase();
  const name = arg('--name')?.trim() || 'Owner';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: tsx prisma/create-admin.ts --email you@example.com --name "Your name" [--password "..."]');
  const password = arg('--password') ?? process.env.ADMIN_PASSWORD ?? generatePassword();
  if (password.length < 8) throw new Error('Password must be at least 8 characters');

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    await prisma.admin.update({ where: { email }, data: { passwordHash, isActive: true, role: AdminRole.SUPER_ADMIN } });
    await prisma.adminRefreshToken.updateMany({ where: { adminId: existing.id, revokedAt: null }, data: { revokedAt: new Date() } });
    console.log(`Updated the password of ${email} (signed out everywhere).`);
  } else {
    await prisma.admin.create({ data: { email, name, passwordHash, role: AdminRole.SUPER_ADMIN } });
    console.log(`Created SUPER_ADMIN ${email}.`);
  }
  if (!arg('--password') && !process.env.ADMIN_PASSWORD) console.log(`Password: ${password}\nSave it now — it is not shown again.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
