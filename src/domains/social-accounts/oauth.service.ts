import axios from 'axios';
import { Platform } from '@prisma/client';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const FACEBOOK_API_URL = 'https://graph.facebook.com/v18.0';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const linkedInStates = new Map<string, number>();
const facebookStates = new Map<string, number>();

export class OAuthService {
  private static cleanupExpiredStates(store: Map<string, number>) {
    const now = Date.now();
    for (const [state, createdAt] of store.entries()) {
      if (now - createdAt > OAUTH_STATE_TTL_MS) {
        store.delete(state);
      }
    }
  }

  private static issueState(store: Map<string, number>): string {
    this.cleanupExpiredStates(store);
    const state = Math.random().toString(36).slice(2, 12);
    store.set(state, Date.now());
    return state;
  }

  private static consumeState(store: Map<string, number>, state?: string): boolean {
    this.cleanupExpiredStates(store);
    if (!state || !store.has(state)) {
      return false;
    }

    store.delete(state);
    return true;
  }

  // LinkedIn OAuth
  static getLinkedInAuthUrl(): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    const state = this.issueState(linkedInStates);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      redirect_uri: redirectUri!,
      state: state,
      scope: 'openid profile w_member_social'
    });
    
    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
  }

  static validateLinkedInState(state?: string): boolean {
    return this.consumeState(linkedInStates, state);
  }
  
  static async exchangeLinkedInCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    // For development with mock tokens, return mock data
    if (process.env.LINKEDIN_CLIENT_ID === 'mock_linkedin_client_id') {
      return {
        accessToken: 'mock_linkedin_access_token_' + Date.now(),
        expiresIn: 5184000 // 60 days
      };
    }
    
    const response = await axios.post(LINKEDIN_TOKEN_URL, null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI
      }
    });
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }
  
  static async getLinkedInProfile(accessToken: string): Promise<{
    id: string;
    name: string;
    email?: string;
  }> {
    // For development with mock tokens
    if (accessToken.startsWith('mock_')) {
      return {
        id: 'mock_linkedin_user_' + Date.now(),
        name: 'Mock LinkedIn User',
        email: 'mock@example.com'
      };
    }
    
    const response = await axios.get(`${LINKEDIN_API_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    return {
      id: response.data.sub,
      name: response.data.name,
      email: response.data.email
    };
  }
  
  // Facebook OAuth
  static getFacebookAuthUrl(): string {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    const state = this.issueState(facebookStates);
    
    const params = new URLSearchParams({
      client_id: appId!,
      redirect_uri: redirectUri!,
      state: state,
      scope: 'pages_manage_posts,pages_read_engagement,publish_to_groups'
    });
    
    return `${FACEBOOK_AUTH_URL}?${params.toString()}`;
  }

  static validateFacebookState(state?: string): boolean {
    return this.consumeState(facebookStates, state);
  }
  
  static async exchangeFacebookCode(code: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    // For development with mock tokens
    if (process.env.FACEBOOK_APP_ID === 'mock_facebook_app_id') {
      return {
        accessToken: 'mock_facebook_access_token_' + Date.now(),
        expiresIn: 5184000
      };
    }
    
    const response = await axios.get(FACEBOOK_TOKEN_URL, {
      params: {
        code,
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI
      }
    });
    
    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }
  
  static async getFacebookPages(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    access_token: string;
  }>> {
    // For development with mock tokens
    if (accessToken.startsWith('mock_')) {
      return [{
        id: 'mock_page_' + Date.now(),
        name: 'Mock Facebook Page',
        access_token: 'mock_page_token_' + Date.now()
      }];
    }
    
    const response = await axios.get(`${FACEBOOK_API_URL}/me/accounts`, {
      params: { access_token: accessToken }
    });
    
    return response.data.data;
  }
}
