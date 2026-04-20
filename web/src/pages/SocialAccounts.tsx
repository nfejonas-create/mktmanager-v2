import { useState, useEffect } from 'react';
import { Linkedin, Facebook, Star, Trash2 } from 'lucide-react';
import api from '../services/api';

interface SocialAccount {
  id: string;
  platform: 'LINKEDIN' | 'FACEBOOK';
  accountName: string;
  accountType: string;
  isDefault: boolean;
  createdAt: string;
}

export default function SocialAccounts() {
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
      await api.post('/accounts/linkedin/auth');
      // In production, redirect to LinkedIn OAuth
      // For now, simulate success
      alert('Em produção, isso redirecionaria para o OAuth do LinkedIn');
    } catch (error) {
      console.error('Error initiating LinkedIn auth:', error);
    }
  };

  const handleConnectFacebook = async () => {
    try {
      await api.post('/accounts/facebook/auth');
      alert('Em produção, isso redirecionaria para o OAuth do Facebook');
    } catch (error) {
      console.error('Error initiating Facebook auth:', error);
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
        return <Linkedin className="w-6 h-6 text-blue-700" />;
      case 'FACEBOOK':
        return <Facebook className="w-6 h-6 text-blue-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...⏳</div>;
  }

  return (
    <div className="space-y-6">
      {/* Connect Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Conectar Nova Conta</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleConnectLinkedIn}
            className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
          >
            <Linkedin className="w-5 h-5 mr-2" />
            Conectar LinkedIn
          </button>
          
          <button
            onClick={handleConnectFacebook}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Facebook className="w-5 h-5 mr-2" />
            Conectar Facebook
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Contas Conectadas</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {accounts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Nenhuma conta conectada. Conecte sua primeira conta acima!
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {account.accountName}
                      </p>
                      {account.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {account.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'} • {account.accountType === 'PROFILE' ? 'Perfil' : 'Página'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!account.isDefault && (
                    <button
                      onClick={() => handleSetDefault(account.id, account.platform)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Definir como Padrão
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-red-600 hover:text-red-800"
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
  );
}
