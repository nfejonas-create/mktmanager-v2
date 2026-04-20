import { Request, Response, Router } from 'express';
import { Platform } from '@prisma/client';
import { AccountService } from './account.service';
import { OAuthService } from './oauth.service';

const router = Router();
const accountService = new AccountService();

function sendOAuthResult(
  res: Response,
  provider: 'linkedin' | 'facebook',
  success: boolean,
  payload?: unknown,
  message?: string
) {
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    const redirectUrl = new URL('/contas', frontendUrl);
    redirectUrl.searchParams.set('provider', provider);
    redirectUrl.searchParams.set('status', success ? 'success' : 'error');
    if (message) {
      redirectUrl.searchParams.set('message', message);
    }
    return res.redirect(redirectUrl.toString());
  }

  return success
    ? res.json({ success: true, account: payload })
    : res.status(500).json({ error: message || 'OAuth failed' });
}

// Get all accounts for user
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await accountService.getAccountsByUser(req.user!.id);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create account manually (for testing)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { platform, accountName, accountType, accessToken, externalId } = req.body;
    
    const account = await accountService.createAccount({
      userId: req.user!.id,
      platform,
      accountName,
      accountType,
      accessToken,
      externalId
    });
    
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Get accounts by platform
router.get('/platform/:platform', async (req: Request, res: Response) => {
  try {
    const platform = req.params.platform as Platform;
    const accounts = await accountService.getAccountsByPlatform(req.user!.id, platform);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts by platform:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// LinkedIn OAuth - Initiate
router.post('/linkedin/auth', (req: Request, res: Response) => {
  const authUrl = OAuthService.getLinkedInAuthUrl();
  res.json({ authUrl });
});

// LinkedIn OAuth - Callback
router.get('/linkedin/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    if (!OAuthService.validateLinkedInState(typeof state === 'string' ? state : undefined)) {
      return res.status(400).json({ error: 'Invalid or expired LinkedIn OAuth state' });
    }
    
    // Exchange code for token
    const tokenData = await OAuthService.exchangeLinkedInCode(code as string);
    
    // Get profile info
    const profile = await OAuthService.getLinkedInProfile(tokenData.accessToken);
    
    // Create account
    const account = await accountService.createAccount({
      userId: req.user!.id,
      platform: 'LINKEDIN',
      accountName: profile.name,
      accountType: 'PROFILE',
      accessToken: tokenData.accessToken,
      externalId: profile.id,
      expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000)
    });
    
    return sendOAuthResult(res, 'linkedin', true, account);
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return sendOAuthResult(res, 'linkedin', false, undefined, 'OAuth failed');
  }
});

// Facebook OAuth - Initiate
router.post('/facebook/auth', (req: Request, res: Response) => {
  const authUrl = OAuthService.getFacebookAuthUrl();
  res.json({ authUrl });
});

// Facebook OAuth - Callback
router.get('/facebook/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    if (!OAuthService.validateFacebookState(typeof state === 'string' ? state : undefined)) {
      return res.status(400).json({ error: 'Invalid or expired Facebook OAuth state' });
    }
    
    // Exchange code for token
    const tokenData = await OAuthService.exchangeFacebookCode(code as string);
    
    // Get pages
    const pages = await OAuthService.getFacebookPages(tokenData.accessToken);
    
    // For now, use the first page
    if (pages.length === 0) {
      return res.status(400).json({ error: 'No Facebook pages found' });
    }
    
    const page = pages[0];
    // Create account for the page
    const account = await accountService.createAccount({
      userId: req.user!.id,
      platform: 'FACEBOOK',
      accountName: page.name,
      accountType: 'PAGE',
      accessToken: page.access_token,
      externalId: page.id
    });
    
    return sendOAuthResult(res, 'facebook', true, account);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return sendOAuthResult(res, 'facebook', false, undefined, 'OAuth failed');
  }
});

// Set default account
router.post('/:id/default', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const platform = req.body.platform as Platform;
    const ownedAccount = await accountService.getOwnedAccount(id, req.user!.id);

    if (!ownedAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const account = await accountService.setDefaultAccount(req.user!.id, platform, id);
    res.json({ success: true, account });
  } catch (error) {
    console.error('Error setting default account:', error);
    res.status(500).json({ error: 'Failed to set default account' });
  }
});

// Delete account
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ownedAccount = await accountService.getOwnedAccount(id, req.user!.id);

    if (!ownedAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await accountService.deleteAccount(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export const accountRoutes = router;
