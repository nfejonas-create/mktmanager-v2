import 'dotenv/config';
import { prisma } from '../src/shared/database/prisma.client';
import { EncryptionService } from '../src/shared/security/encryption.service';

async function migrateTokens() {
  const accounts = await prisma.socialAccount.findMany();
  let migrated = 0;

  for (const account of accounts) {
    const updates: { accessToken?: string; refreshToken?: string | null } = {};

    if (!account.accessToken.startsWith('v2:')) {
      const plaintext = EncryptionService.decrypt(account.accessToken);
      updates.accessToken = EncryptionService.encrypt(plaintext);
    }

    if (account.refreshToken && !account.refreshToken.startsWith('v2:')) {
      const plaintext = EncryptionService.decrypt(account.refreshToken);
      updates.refreshToken = EncryptionService.encrypt(plaintext);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: updates
      });
      migrated += 1;
    }
  }

  console.log(`Token migration complete. Accounts updated: ${migrated}`);
}

migrateTokens()
  .catch((error) => {
    console.error('Token migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
