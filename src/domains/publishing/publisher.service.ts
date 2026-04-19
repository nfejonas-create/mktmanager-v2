import axios from 'axios';
import { Post, SocialAccount, Platform } from '@prisma/client';
import { AccountService } from '../social-accounts/account.service';

const accountService = new AccountService();

export interface PublishResult {
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

export class PublisherService {
  async publishToLinkedIn(post: Post, account: SocialAccount): Promise<PublishResult> {
    // 1. Validar e logar (seguro)
    const accountWithToken = await accountService.getAccountById(account.id, true);
    if (!accountWithToken) {
      console.error('[LinkedIn] Conta não encontrada:', account.id);
      return { success: false, error: 'Account not found' };
    }
    
    const accessToken = (accountWithToken as any).accessToken;
    console.log(`[LinkedIn] Token obtido: ${accessToken ? 'SIM' : 'NAO'}`);
    console.log(`[LinkedIn] ExternalId: ${account.externalId}`);
    
    if (!accessToken || accessToken.length < 10) {
      console.error('[LinkedIn] Token inválido ou vazio');
      return { success: false, error: 'Token invalido ou vazio' };
    }
    
    // Para tokens mock em desenvolvimento
    if (accessToken.startsWith('mock_')) {
      console.log('[LinkedIn] Usando token mock');
      return {
        success: true,
        externalId: 'mock_post_' + Date.now(),
        externalUrl: 'https://linkedin.com/mock/post/' + Date.now()
      };
    }
    
    const fullText = post.content;
    
    // Tentativa 1: Nova API /rest/posts (igual ao v1)
    try {
      console.log('[LinkedIn] Tentativa 1: POST /rest/posts');
      const resp = await axios.post('https://api.linkedin.com/rest/posts', {
        author: 'urn:li:person:~',
        commentary: fullText,
        visibility: 'PUBLIC',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        timeout: 10000,
      });
      const postId = resp.headers['x-linkedin-id'] || resp.headers['x-restli-id'];
      console.log('[LinkedIn] Sucesso via nova API:', postId);
      return { 
        success: true, 
        externalId: postId, 
        externalUrl: `https://linkedin.com/feed/update/${postId}` 
      };
    } catch (e: any) {
      console.warn('[LinkedIn] Nova API falhou:', e?.response?.status, e?.response?.data?.message);
    }
    
    // Tentativa 2: API legada /v2/ugcPosts (igual ao v1)
    try {
      console.log('[LinkedIn] Tentativa 2: POST /v2/ugcPosts');
      let memberId: string | null = null;
      
      // Resolver memberId via userinfo ou /me
      try {
        console.log('[LinkedIn] Obtendo memberId via /v2/userinfo');
        const ui = await axios.get('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        });
        memberId = ui.data.sub;
        console.log(`[LinkedIn] MemberId obtido via userinfo: ${memberId?.substring(0, 10)}...`);
      } catch {
        console.log('[LinkedIn] Obtendo memberId via /v2/me');
        const me = await axios.get('https://api.linkedin.com/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        });
        memberId = me.data.id;
        console.log(`[LinkedIn] MemberId obtido via me: ${memberId?.substring(0, 10)}...`);
      }
      
      if (!memberId) {
        throw new Error('Nao foi possivel obter memberId');
      }
      
      const resp = await axios.post('https://api.linkedin.com/v2/ugcPosts', {
        author: `urn:li:person:${memberId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: fullText },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        timeout: 10000,
      });
      
      console.log('[LinkedIn] Sucesso via ugcPosts');
      return { 
        success: true, 
        externalId: 'published', 
        externalUrl: 'https://linkedin.com' 
      };
    } catch (e2: any) {
      const errMsg = e2?.response?.data?.message || e2?.response?.data?.error?.message || e2.message;
      console.error('[LinkedIn] ugcPosts também falhou:', e2?.response?.status, errMsg);
      return { success: false, error: errMsg };
    }
  }
  
  async publishToFacebook(post: Post, account: SocialAccount): Promise<PublishResult> {
    try {
      const accountWithToken = await accountService.getAccountById(account.id, true);
      if (!accountWithToken) {
        return { success: false, error: 'Account not found' };
      }
      
      const accessToken = (accountWithToken as any).accessToken;
      
      if (accessToken.startsWith('mock_')) {
        return {
          success: true,
          externalId: 'mock_fb_post_' + Date.now(),
          externalUrl: 'https://facebook.com/mock/post/' + Date.now()
        };
      }
      
      const pageId = account.externalId;
      const response = await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, null, {
        params: { message: post.content, access_token: accessToken },
      });
      
      const externalId = response.data.id;
      return {
        success: true,
        externalId,
        externalUrl: `https://facebook.com/${pageId}/posts/${externalId}`
      };
    } catch (error: any) {
      console.error('Facebook publish error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
  
  async publish(post: Post, account: SocialAccount): Promise<PublishResult> {
    if (account.platform === Platform.LINKEDIN) {
      return this.publishToLinkedIn(post, account);
    } else if (account.platform === Platform.FACEBOOK) {
      return this.publishToFacebook(post, account);
    }
    
    return { success: false, error: 'Unsupported platform' };
  }
}