import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import sharp from 'sharp';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/database/prisma.service';

export const SUPER = { email: 'owner@test.khilona', password: 'Owner12345' };
export const STAFF = { email: 'staff@test.khilona', password: 'Staff12345' };

export async function createApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

/** Empties every table (fast, keeps the schema). */
export async function resetDatabase(prisma: PrismaService) {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function seedBasics(prisma: PrismaService) {
  await prisma.admin.createMany({
    data: [
      { name: 'Owner', email: SUPER.email, passwordHash: await bcrypt.hash(SUPER.password, 4), role: 'SUPER_ADMIN' },
      { name: 'Staff', email: STAFF.email, passwordHash: await bcrypt.hash(STAFF.password, 4), role: 'ADMIN' },
    ],
  });
  await prisma.store.create({ data: { name: 'Khilona Test', phone: '9876543210', whatsapp: '919876543210' } });
}

export async function login(app: INestApplication, creds = SUPER) {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send(creds).expect(200);
  const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('khilona_rt='));
  return { token: res.body.data.accessToken as string, cookie: cookie!.split(';')[0] };
}

/** A small valid PNG for upload tests. */
export function samplePng(width = 40, height = 30) {
  return sharp({ create: { width, height, channels: 3, background: '#E4572E' } }).png().toBuffer();
}
