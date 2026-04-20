import { prisma } from './prisma.client';
import { randomUUID } from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
    'SELECT "id", "email", "passwordHash", "name", "createdAt", "updatedAt" FROM "User" WHERE "id" = $1 LIMIT 1',
    id
  );

  return rows[0] || null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
    'SELECT "id", "email", "passwordHash", "name", "createdAt", "updatedAt" FROM "User" WHERE "email" = $1 LIMIT 1',
    email
  );

  return rows[0] || null;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<UserRecord> {
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
    `INSERT INTO "User" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING "id", "email", "passwordHash", "name", "createdAt", "updatedAt"`,
    id,
    data.email,
    data.passwordHash,
    data.name
  );

  return rows[0];
}
