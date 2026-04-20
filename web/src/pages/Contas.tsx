import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Facebook, Linkedin, Star, Trash2, UserRound } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';

interface SocialAccount {
  id: string;
  platform: 'LINKEDIN' | 'FACEBOOK';
  accountName: string;
  accountType: string;
  isDefault: boolean;
  createdAt?: string;
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export default function Contas() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const linkedInAccounts = useMemo(() => accounts.filter((account) => account.platform === 'LINKEDIN'), [accounts]);
  const facebookAccounts = useMemo(() => accounts.filter((account) => account.platform === 'FACEBOOK'), [accounts]);

  useEffect(() => {
    void fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const response = await api.get('/accounts');
      setAccounts(ensureArray<SocialAccount>(response.data));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  async function startOAuth(provider: 'linkedin' | 'facebook') {
    try {
      const response = await api.post(`/accounts/${provider}/auth`);
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error(`Error starting ${provider} auth:`, error);
      alert(`Erro ao iniciar conexão com ${provider === 'linkedin' ? 'LinkedIn' : 'Facebook'}.`);
    }
  }

  async function handleSetDefault(accountId: string, platform: 'LINKEDIN' | 'FACEBOOK') {
    try {
      await api.post(`/accounts/${accountId}/default`, { platform });
      await fetchAccounts();
    } catch (error) {
      console.error('Error setting default account:', error);
      alert('Erro ao definir conta padrão.');
    }
  }

  async function handleDelete(accountId: string) {
    if (!confirm('Tem certeza que deseja remover esta conta?')) return;

    try {
      await api.delete(`/accounts/${accountId}`);
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erro ao remover conta.');
    }
  }

  function renderAccountCard(account: SocialAccount) {
    const isLinkedIn = account.platform === 'LINKEDIN';

    return (
      <div key={account.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLinkedIn ? 'bg-blue-600' : 'bg-blue-500'}`}>
              {isLinkedIn ? <Linkedin className="w-6 h-6 text-white" /> : <Facebook className="w-6 h-6 text-white" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-white truncate">{account.accountName}</p>
                {account.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                    <Star className="w-3 h-3" />
                    Padrão
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                {isLinkedIn ? 'LinkedIn' : 'Facebook'} • {account.accountType === 'PROFILE' ? 'Perfil' : 'Página'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!account.isDefault && (
              <button
                type="button"
                onClick={() => void handleSetDefault(account.id, account.platform)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-blue-300 hover:bg-blue-600/10"
              >
                <CheckCircle className="w-4 h-4" />
                Definir padrão
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleDelete(account.id)}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Contas Sociais</h1>
        <p className="text-slate-400">
          Acesse e troque rapidamente as contas do usuário ativo: <span className="text-white font-medium">{user?.name || 'Usuário atual'}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Linkedin className="w-5 h-5 text-blue-400" />
            LinkedIn
          </div>
          <button
            type="button"
            onClick={() => void startOAuth('linkedin')}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
          >
            Conectar nova conta do LinkedIn
          </button>
          <div className="space-y-3">
            {linkedInAccounts.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma conta do LinkedIn conectada para este usuário.</p>
            ) : (
              linkedInAccounts.map(renderAccountCard)
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Facebook className="w-5 h-5 text-blue-400" />
            Facebook
          </div>
          <button
            type="button"
            onClick={() => void startOAuth('facebook')}
            className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-400"
          >
            Conectar nova página do Facebook
          </button>
          <div className="space-y-3">
            {facebookAccounts.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma página do Facebook conectada para este usuário.</p>
            ) : (
              facebookAccounts.map(renderAccountCard)
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-3">
          <UserRound className="w-5 h-5 text-emerald-400" />
          Troca rápida de usuário
        </div>
        <p className="text-sm text-slate-400">
          Use o seletor no rodapé da barra lateral para alternar entre Jonas e Niulane sem sair do sistema.
        </p>
      </div>
    </div>
  );
}
