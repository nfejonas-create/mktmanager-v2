import { PrismaClient, SocialAccount, Platform } from '@prisma/client';
import { EncryptionService } from '../../shared/security/encryption.service';

const prisma = new PrismaClient();

export interface CreateAccountData {
  userId: string;
  platform: Platform;
  accountName: string;
  accountType: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  externalId: string;
}

export class AccountService {
  async createAccount(data: CreateAccountData): Promise<SocialAccount> {
    // Encrypt tokens before saving
    const encryptedAccessToken = EncryptionService.encrypt(data.accessToken);
    const encryptedRefreshToken = data.refreshToken 
      ? EncryptionService.encrypt(data.refreshToken) 
      : null;

    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: data.userId,
        platform: data.platform,
        OR: [
          { externalId: data.externalId },
          { accountName: data.accountName }
        ]
      }
    });

    if (existingAccount) {
      return prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accountName: data.accountName,
          accountType: data.accountType,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: data.expiresAt,
          externalId: data.externalId,
          isActive: true
        }
      });
    }
    
    // If this is the first account for this platform, set as default
    const existingAccounts = await prisma.socialAccount.count({
      where: { userId: data.userId, platform: data.platform, isActive: true }
    });
    const isDefault = existingAccounts === 0;
    
    return prisma.socialAccount.create({
      data: {
        ...data,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        isDefault
      }
    });
  }
  
  async getAccountsByUser(userId: string): Promise<SocialAccount[]> {
    return prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      orderBy: [{ platform: 'asc' }, { isDefault: 'desc' }, { createdAt: 'desc' }]
    });
  }
  
  async getAccountsByPlatform(userId: string, platform: Platform): Promise<SocialAccount[]> {
    return prisma.socialAccount.findMany({
      where: { userId, platform, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
  }
  
  async getAccountById(id: string, includeDecryptedToken: boolean = false): Promise<SocialAccount | null> {
    const account = await prisma.socialAccount.findUnique({
      where: { id }
    });
    
    if (!account || !includeDecryptedToken) {
      return account;
    }
    
    // Return account with decrypted token (use with caution!)
    return {
      ...account,
      accessToken: EncryptionService.decrypt(account.accessToken),
      refreshToken: account.refreshToken ? EncryptionService.decrypt(account.refreshToken) : null
    } as SocialAccount;
  }
  
  async getDefaultAccount(userId: string, platform: Platform): Promise<SocialAccount | null> {
    return prisma.socialAccount.findFirst({
      where: { userId, platform, isDefault: true, isActive: true }
    });
  }
  
  async setDefaultAccount(userId: string, platform: Platform, accountId: string): Promise<SocialAccount> {
    const targetAccount = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId, platform, isActive: true }
    });

    if (!targetAccount) {
      throw new Error('Account not found for this user/platform');
    }

    // Remove default from other accounts of same platform
    await prisma.socialAccount.updateMany({
      where: { userId, platform, isDefault: true },
      data: { isDefault: false }
    });
    
    // Set new default
    return prisma.socialAccount.update({
      where: { id: targetAccount.id },
      data: { isDefault: true }
    });
  }
  
  async deleteAccount(id: string): Promise<void> {
    await prisma.socialAccount.update({
      where: { id },
      data: { isActive: false }
    });
  }
  
  async updateTokens(id: string, accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<SocialAccount> {
    const encryptedAccessToken = EncryptionService.encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? EncryptionService.encrypt(refreshToken) : undefined;
    
    return prisma.socialAccount.update({
      where: { id },
      data: {
        accessToken: encryptedAccessToken,
        ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
        ...(expiresAt && { expiresAt })
      }
    });
  }
}
