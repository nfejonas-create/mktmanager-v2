import { useState, useEffect } from 'react';
import { Linkedin, Facebook, Star, Trash2, Plus, CheckCircle } from 'lucide-react';
import api from '../api/api';

interface SocialAccount {
  id: string;
  platform: 'LINKEDIN' | 'FACEBOOK';
  accountName: string;
  accountType: string;
  isDefault: boolean;
  createdAt: string;
}

export default function Contas() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      const response = await api.post('/accounts/linkedin/auth');
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('LinkedIn auth URL not returned');
      }
    } catch (error) {
      console.error('Error initiating LinkedIn auth:', error);
      alert('Erro ao iniciar conexao com LinkedIn.');
    }
  };

  const handleConnectFacebook = async () => {
    try {
      const response = await api.post('/accounts/facebook/auth');
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Facebook auth URL not returned');
      }
    } catch (error) {
      console.error('Error initiating Facebook auth:', error);
      alert('Erro ao iniciar conexao com Facebook.');
    }
  };

  const handleSetDefault = async (accountId: string, platform: string) => {
    try {
      await api.post(`/accounts/${accountId}/default`, { platform });
      fetchAccounts();
    } catch (error) {
      console.error('Error setting default account:', error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja remover esta conta?')) return;
    
    try {
      await api.delete(`/accounts/${accountId}`);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'LINKEDIN':
        return <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center"><Linkedin className="w-6 h-6 text-white" /></div>;
      case 'FACEBOOK':
        return <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center"><Facebook className="w-6 h-6 text-white" /></div>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Contas Sociais</h1>
        <p className="text-slate-400">Gerencie suas contas do LinkedIn e Facebook</p>
      </div>

      <div className="grid gap-6">
        {/* Connect Buttons */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Conectar Nova Conta</h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleConnectLinkedIn}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              Conectar LinkedIn
            </button>
            
            <button
              onClick={handleConnectFacebook}
              className="flex items-center gap-3 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium transition-colors"
            >
              <Facebook className="w-5 h-5" />
              Conectar Facebook
            </button>
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Contas Conectadas</h2>
          </div>

          <div className="divide-y divide-slate-800">
            {accounts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 mb-2">Nenhuma conta conectada</p>
                <p className="text-sm text-slate-500">Conecte sua primeira conta acima</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getPlatformIcon(account.platform)}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {account.accountName}
                        </p>
                        
                        {account.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400">
                            <Star className="w-3 h-3" />
                            Padrão
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-400">
                        {account.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'} • {' '}
                        {account.accountType === 'PROFILE' ? 'Perfil' : 'Página'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!account.isDefault && (
                      <button
                        onClick={() => handleSetDefault(account.id, account.platform)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Definir Padrão
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remover conta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
