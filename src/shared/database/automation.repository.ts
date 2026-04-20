import { randomUUID } from 'crypto';
import { prisma } from './prisma.client';
import type { AutomationConfigRecord } from '../../domains/automation/automation.types';

export async function findAutomationConfigByUserId(userId: string): Promise<AutomationConfigRecord | null> {
  const rows = await prisma.$queryRawUnsafe<AutomationConfigRecord[]>(
    `SELECT "id", "userId", "active", "cronExpression", "timezone", "promptTemplate", "aiProvider",
            "aiApiKeyEncrypted", "platforms", "autoPublish", "lastRunAt", "nextRunAt", "createdAt", "updatedAt"
     FROM "AutomationConfig"
     WHERE "userId" = $1
     LIMIT 1`,
    userId
  );

  return rows[0] || null;
}

export async function findAutomationConfigByIdAndUserId(id: string, userId: string): Promise<AutomationConfigRecord | null> {
  const rows = await prisma.$queryRawUnsafe<AutomationConfigRecord[]>(
    `SELECT "id", "userId", "active", "cronExpression", "timezone", "promptTemplate", "aiProvider",
            "aiApiKeyEncrypted", "platforms", "autoPublish", "lastRunAt", "nextRunAt", "createdAt", "updatedAt"
     FROM "AutomationConfig"
     WHERE "id" = $1 AND "userId" = $2
     LIMIT 1`,
    id,
    userId
  );

  return rows[0] || null;
}

export async function listDueAutomationConfigs(now: Date): Promise<Array<Pick<AutomationConfigRecord, 'id' | 'userId' | 'cronExpression' | 'timezone'>>> {
  return prisma.$queryRawUnsafe(
    `SELECT "id", "userId", "cronExpression", "timezone"
     FROM "AutomationConfig"
     WHERE "active" = true AND "nextRunAt" <= $1`,
    now
  );
}

export async function saveAutomationConfig(data: {
  userId: string;
  active: boolean;
  cronExpression: string;
  timezone: string;
  promptTemplate: string;
  aiProvider: string;
  aiApiKeyEncrypted: string;
  platforms: string[];
  autoPublish: boolean;
  nextRunAt: Date | null;
}): Promise<AutomationConfigRecord> {
  const existing = await findAutomationConfigByUserId(data.userId);

  if (existing) {
    const rows = await prisma.$queryRawUnsafe<AutomationConfigRecord[]>(
      `UPDATE "AutomationConfig"
       SET "active" = $1,
           "cronExpression" = $2,
           "timezone" = $3,
           "promptTemplate" = $4,
           "aiProvider" = $5,
           "aiApiKeyEncrypted" = $6,
           "platforms" = $7,
           "autoPublish" = $8,
           "nextRunAt" = $9,
           "updatedAt" = NOW()
       WHERE "userId" = $10
       RETURNING "id", "userId", "active", "cronExpression", "timezone", "promptTemplate", "aiProvider",
                 "aiApiKeyEncrypted", "platforms", "autoPublish", "lastRunAt", "nextRunAt", "createdAt", "updatedAt"`,
      data.active,
      data.cronExpression,
      data.timezone,
      data.promptTemplate,
      data.aiProvider,
      data.aiApiKeyEncrypted,
      data.platforms,
      data.autoPublish,
      data.nextRunAt,
      data.userId
    );

    return rows[0];
  }

  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<AutomationConfigRecord[]>(
    `INSERT INTO "AutomationConfig"
      ("id", "userId", "active", "cronExpression", "timezone", "promptTemplate", "aiProvider",
       "aiApiKeyEncrypted", "platforms", "autoPublish", "nextRunAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
     RETURNING "id", "userId", "active", "cronExpression", "timezone", "promptTemplate", "aiProvider",
               "aiApiKeyEncrypted", "platforms", "autoPublish", "lastRunAt", "nextRunAt", "createdAt", "updatedAt"`,
    id,
    data.userId,
    data.active,
    data.cronExpression,
    data.timezone,
    data.promptTemplate,
    data.aiProvider,
    data.aiApiKeyEncrypted,
    data.platforms,
    data.autoPublish,
    data.nextRunAt
  );

  return rows[0];
}

export async function markAutomationRun(data: {
  id: string;
  userId: string;
  lastRunAt: Date;
  nextRunAt: Date | null;
}) {
  await prisma.$executeRawUnsafe(
    `UPDATE "AutomationConfig"
     SET "lastRunAt" = $1, "nextRunAt" = $2, "updatedAt" = NOW()
     WHERE "id" = $3 AND "userId" = $4`,
    data.lastRunAt,
    data.nextRunAt,
    data.id,
    data.userId
  );
}
