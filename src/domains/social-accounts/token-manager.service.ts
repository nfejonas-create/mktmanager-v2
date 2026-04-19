import { PrismaClient, SocialAccount } from '@prisma/client';
import { OAuthService } from './oauth.service';
import { AccountService } from './account.service';

const prisma = new PrismaClient();
const accountService = new AccountService();

export class TokenManagerService {
  private static readonly TOKEN_REFRESH_DAYS = 7; // Refresh tokens 7 days before expiry
  
  async checkAndRefreshTokens(): Promise<void> {
    const accountsNeedingRefresh = await prisma.socialAccount.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: new Date(Date.now() + TokenManagerService.TOKEN_REFRESH_DAYS * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    for (const account of accountsNeedingRefresh) {
      try {
        await this.refreshToken(account);
      } catch (error) {
        console.error(`Failed to refresh token for account ${account.id}:`, error);
      }
    }
  }
  
  private async refreshToken(account: SocialAccount): Promise<void> {
    // LinkedIn doesn't support refresh tokens in the same way
    // For now, we just log that the token needs manual refresh
    if (account.platform === 'LINKEDIN') {
      console.log(`LinkedIn token for account ${account.id} expires soon. Manual re-authentication required.`);
      return;
    }
    
    // Facebook long-lived token exchange
    if (account.platform === 'FACEBOOK' && account.refreshToken) {
      try {
        // Exchange for long-lived token (valid for 60 days)
        const response = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?` +
          `grant_type=fb_exchange_token&` +
          `client_id=${process.env.FACEBOOK_APP_ID}&` +
          `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
          `fb_exchange_token=${account.refreshToken}`
        );
        
        const data = await response.json() as { access_token?: string; expires_in?: number };
        
        if (data.access_token) {
          const expiresAt = new Date(Date.now() + (data.expires_in || 5184000) * 1000);
          await accountService.updateTokens(
            account.id,
            data.access_token,
            undefined,
            expiresAt
          );
          console.log(`Refreshed Facebook token for account ${account.id}`);
        }
      } catch (error) {
        console.error(`Failed to refresh Facebook token:`, error);
      }
    }
  }
  
  startTokenRefreshScheduler(): void {
    // Check for tokens needing refresh every hour
    setInterval(() => {
      this.checkAndRefreshTokens();
    }, 60 * 60 * 1000);
    
    console.log('Token refresh scheduler started');
  }
}