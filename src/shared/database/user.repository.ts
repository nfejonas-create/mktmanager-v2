import { prisma } from './prisma.client';
import { randomUUID } from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
    'SELECT "id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt" FROM "User" WHERE "id" = $1 LIMIT 1',
    id
  );

  return rows[0] || null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
    'SELECT "id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt" FROM "User" WHERE "email" = $1 LIMIT 1',
    email
  );

  return rows[0] || null;
}

export async function findAllUsers(): Promise<UserRecord[]> {
  return prisma.$queryRawUnsafe<UserRecord[]>(
    'SELECT "id", "email", "name", "role", "isActive", "createdAt", "updatedAt" FROM "User" ORDER BY "createdAt" DESC'
  );
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  role?: string;
}): Promise<UserRecord> {
  const id = randomUUID();
  const role = data.role || 'USER';
  const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
    `INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING "id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt"`,
    id,
    data.email,
    data.passwordHash,
    data.name,
    role
  );

  return rows[0];
}

export async function updateUser(id: string, data: {
  name?: string;
  email?: string;
  isActive?: boolean;
  role?: string;
}): Promise<UserRecord> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { setClauses.push(`"name" = $${idx++}`); values.push(data.name); }
  if (data.email !== undefined) { setClauses.push(`"email" = $${idx++}`); values.push(data.email); }
  if (data.isActive !== undefined) { setClauses.push(`"isActive" = $${idx++}`); values.push(data.isActive); }
  if (data.role !== undefined) { setClauses.push(`"role" = $${idx++}`); values.push(data.role); }

  setClauses.push(`"updatedAt" = NOW()`);
  values.push(id);

  const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
    `UPDATE "User" SET ${setClauses.join(', ')} WHERE "id" = $${idx} RETURNING "id", "email", "name", "role", "isActive", "createdAt", "updatedAt"`,
    ...values
  );

  return rows[0];
}

export async function softDeleteUser(id: string): Promise<void> {
  await prisma.$queryRawUnsafe(
    'UPDATE "User" SET "isActive" = false, "updatedAt" = NOW() WHERE "id" = $1',
    id
  );
}

export async function countAdmins(): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<[{ count: string }]>(
    'SELECT COUNT(*) as count FROM "User" WHERE "role" = \'ADMIN\' AND "isActive" = true'
  );
  return parseInt(rows[0].count, 10);
}
