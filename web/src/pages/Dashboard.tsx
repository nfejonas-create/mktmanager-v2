import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import MetricCard from '../components/MetricCard';

type Platform = 'LINKEDIN' | 'FACEBOOK';

interface SocialAccount {
  id: string;
  platform: Platform;
  accountName: string;
  externalId: string;
  isActive?: boolean;
}

interface MetricsPoint {
  date: string;
  impressions: number;
  engagement: number;
}

interface MetricsResponse {
  current: {
    followers: number;
    impressions: number;
    engagement: number;
    reach: number;
  };
  chart14d: MetricsPoint[];
}

const EMPTY_METRICS: MetricsResponse = {
  current: {
    followers: 0,
    impressions: 0,
    engagement: 0,
    reach: 0
  },
  chart14d: []
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

function calculateDelta(points: MetricsPoint[], key: 'impressions' | 'engagement') {
  if (points.length < 2) {
    return undefined;
  }

  const first = points[0][key];
  const last = points[points.length - 1][key];

  if (first === 0) {
    return last === 0 ? '0%' : '+100%';
  }

  const delta = ((last - first) / Math.abs(first)) * 100;
  const signal = delta > 0 ? '+' : '';
  return `${signal}${delta.toFixed(1)}%`;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void loadDashboard();
  }, []);

  const linkedInAccount = useMemo(
    () => accounts.find((account) => account.platform === 'LINKEDIN' && account.isActive !== false) || null,
    [accounts]
  );

  const chartData = useMemo(
    () =>
      metrics.chart14d.map((item) => ({
        ...item,
        shortDate: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      })),
    [metrics.chart14d]
  );

  async function loadDashboard() {
    setLoading(true);
    setMessage('');

    try {
      const accountsResponse = await api.get('/accounts');
      const nextAccounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
      setAccounts(nextAccounts);

      const account = nextAccounts.find((item: SocialAccount) => item.platform === 'LINKEDIN' && item.isActive !== false);
      if (!account) {
        setMetrics(EMPTY_METRICS);
        return;
      }

      const metricsResponse = await api.get(`/metrics/linkedin/${account.id}`);
      setMetrics(metricsResponse.data || EMPTY_METRICS);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setMetrics(EMPTY_METRICS);
      setMessage('Erro ao carregar métricas do LinkedIn.');
    } finally {
      setLoading(false);
    }
  }

  async function syncMetrics() {
    if (!linkedInAccount) {
      return;
    }

    setSyncing(true);
    setMessage('');

    try {
      const response = await api.post(`/metrics/linkedin/${linkedInAccount.id}/sync`);
      setMetrics(response.data || EMPTY_METRICS);
      setMessage('Métricas sincronizadas com sucesso.');
    } catch (error) {
      console.error('Erro ao sincronizar métricas:', error);
      setMessage('Erro ao sincronizar métricas do LinkedIn.');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-300">Carregando métricas...</div>
      </div>
    );
  }

  if (!linkedInAccount) {
    return (
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Métricas reais do LinkedIn com histórico de 14 dias.</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-xl font-semibold text-white">Conecte sua conta LinkedIn em Configurações</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            O dashboard agora usa métricas reais da conta LinkedIn do usuário autenticado. Vá em Configurações, salve o token manualmente e volte aqui para sincronizar seguidores, impressões, engajamento e alcance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Conta ativa: {linkedInAccount.accountName}</p>
        </div>
        <button
          type="button"
          onClick={() => void syncMetrics()}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Métricas'}
        </button>
      </div>

      {message ? <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</div> : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard title="Seguidores" value={formatNumber(metrics.current.followers)} icon={<Users size={20} />} />
        <MetricCard
          title="Impressões (30d)"
          value={formatNumber(metrics.current.impressions)}
          delta={calculateDelta(metrics.chart14d, 'impressions')}
          icon={<BarChart3 size={20} />}
        />
        <MetricCard
          title="Engajamento (30d)"
          value={metrics.current.engagement.toFixed(2)}
          delta={calculateDelta(metrics.chart14d, 'engagement')}
          icon={<TrendingUp size={20} />}
        />
        <MetricCard title="Alcance (30d)" value={formatNumber(metrics.current.reach)} icon={<Activity size={20} />} />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Desempenho dos últimos 14 dias</h2>
          <p className="mt-1 text-sm text-slate-400">Impressões e engajamento capturados diretamente da API do LinkedIn.</p>
        </div>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="shortDate" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: 18,
                  color: '#e2e8f0'
                }}
              />
              <Line type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="engagement" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
