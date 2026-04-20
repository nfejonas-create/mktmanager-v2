import { prisma } from '../database/prisma.client';

export class ImpersonationService {
  static async startSession(adminId: string, targetUserId: string): Promise<string> {
    // Finalizar sessões anteriores do mesmo admin
    await prisma.$queryRawUnsafe(
      'UPDATE "AdminSession" SET "endedAt" = NOW() WHERE "adminId" = $1 AND "endedAt" IS NULL',
      adminId
    );

    const id = require('crypto').randomUUID();
    await prisma.$queryRawUnsafe(
      'INSERT INTO "AdminSession" ("id", "adminId", "targetUserId", "startedAt") VALUES ($1, $2, $3, NOW())',
      id,
      adminId,
      targetUserId
    );

    return id;
  }

  static async endAllSessions(adminId: string): Promise<void> {
    await prisma.$queryRawUnsafe(
      'UPDATE "AdminSession" SET "endedAt" = NOW() WHERE "adminId" = $1 AND "endedAt" IS NULL',
      adminId
    );
  }
}
