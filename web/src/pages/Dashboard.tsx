import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, Heart, Linkedin, RefreshCw, Users, Globe2, Link2, Facebook } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import MetricCard from '../components/MetricCard';

type ProfileLinks = {
  linkedin: string;
  facebook: string;
  site: string;
  other: string;
};

type AnalyticsSummary = {
  posts30d: number;
  views30d: number;
  likes30d: number;
  followersTotal: number;
};

type AnalyticsPoint = {
  date: string;
  views: number;
  likes: number;
  posts: number;
};

type MeResponse = {
  id: string;
  name: string;
  email: string;
  profiles?: Partial<ProfileLinks> | null;
};

const PROFILE_STORAGE_KEY = 'dashboard.profileLinks';

const emptyLinks: ProfileLinks = {
  linkedin: '',
  facebook: '',
  site: '',
  other: ''
};

const summaryFallback: AnalyticsSummary = {
  posts30d: 12,
  views30d: 1840,
  likes30d: 326,
  followersTotal: 942
};

const chartFallback: AnalyticsPoint[] = Array.from({ length: 14 }, (_, index) => ({
  date: `${String(index + 1).padStart(2, '0')}/04`,
  views: 90 + index * 14,
  likes: 18 + index * 3,
  posts: index % 3 === 0 ? 2 : 1
}));

function readLocalLinks(): ProfileLinks {
  if (typeof window === 'undefined') return emptyLinks;

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return emptyLinks;
    return { ...emptyLinks, ...(JSON.parse(raw) as Partial<ProfileLinks>) };
  } catch {
    return emptyLinks;
  }
}

function saveLocalLinks(links: ProfileLinks) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(links));
}

function ensureChartData(value: unknown): AnalyticsPoint[] {
  return Array.isArray(value) ? (value as AnalyticsPoint[]) : chartFallback;
}

function ensureSummary(value: unknown): AnalyticsSummary {
  if (!value || typeof value !== 'object') return summaryFallback;
  const data = value as Partial<AnalyticsSummary>;
  return {
    posts30d: Number(data.posts30d ?? summaryFallback.posts30d),
    views30d: Number(data.views30d ?? summaryFallback.views30d),
    likes30d: Number(data.likes30d ?? summaryFallback.likes30d),
    followersTotal: Number(data.followersTotal ?? summaryFallback.followersTotal)
  };
}

function ProfileCard({
  label,
  colorClass,
  icon,
  value,
  onChange
}: {
  label: string;
  colorClass: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>{icon}</div>
        <h2 className="text-base font-semibold text-white">{label}</h2>
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`https://${label.toLowerCase()}.com/seu-perfil`}
        className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

export default function Dashboard() {
  const [links, setLinks] = useState<ProfileLinks>(emptyLinks);
  const [summary, setSummary] = useState<AnalyticsSummary>(summaryFallback);
  const [series, setSeries] = useState<AnalyticsPoint[]>(chartFallback);
  const [loading, setLoading] = useState(true);
  const [savingLinks, setSavingLinks] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void loadDashboard();
  }, []);

  const cards = useMemo(
    () => [
      {
        key: 'linkedin' as const,
        label: 'LinkedIn',
        colorClass: 'bg-blue-600/20 text-blue-300',
        icon: <Linkedin size={18} />
      },
      {
        key: 'facebook' as const,
        label: 'Facebook',
        colorClass: 'bg-sky-900/50 text-sky-300',
        icon: <Facebook size={18} />
      },
      {
        key: 'site' as const,
        label: 'Site',
        colorClass: 'bg-slate-800 text-slate-200',
        icon: <Globe2 size={18} />
      },
      {
        key: 'other' as const,
        label: 'Outra',
        colorClass: 'bg-slate-800 text-slate-200',
        icon: <Link2 size={18} />
      }
    ],
    []
  );

  async function loadDashboard() {
    setLoading(true);
    setMessage('');

    try {
      const [meResponse, summaryResponse, analyticsResponse] = await Promise.allSettled([
        api.get<MeResponse>('/auth/me'),
        api.get('/analytics/summary'),
        api.get('/analytics', { params: { days: 14 } })
      ]);

      if (meResponse.status === 'fulfilled') {
        const merged = { ...readLocalLinks(), ...meResponse.value.data.profiles };
        setLinks(merged);
        saveLocalLinks(merged);
      } else {
        setLinks(readLocalLinks());
      }

      if (summaryResponse.status === 'fulfilled') {
        setSummary(ensureSummary(summaryResponse.value.data));
      } else {
        setSummary(summaryFallback);
      }

      if (analyticsResponse.status === 'fulfilled') {
        setSeries(ensureChartData(analyticsResponse.value.data));
      } else {
        setSeries(chartFallback);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncMetrics() {
    setMessage('');

    try {
      await api.post('/accounts/sync');
      setMessage('Sincronização de métricas iniciada.');
    } catch {
      setMessage('Sincronização ainda depende do endpoint /api/accounts/sync no backend.');
    }
  }

  async function handleSaveLinks() {
    setSavingLinks(true);
    saveLocalLinks(links);

    try {
      await api.put('/auth/me', { profiles: links });
      setMessage('Links do dashboard salvos com sucesso.');
    } catch {
      setMessage('Links salvos localmente. Backend ainda precisa expor PUT /api/auth/me com profiles.');
    } finally {
      setSavingLinks(false);
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Visão geral do desempenho e dos links principais do perfil.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSaveLinks()}
            disabled={savingLinks}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            {savingLinks ? 'Salvando...' : 'Salvar links'}
          </button>
          <button
            type="button"
            onClick={() => void handleSyncMetrics()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <RefreshCw size={16} />
            Sincronizar Métricas
          </button>
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</div> : null}

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <ProfileCard
            key={card.key}
            label={card.label}
            colorClass={card.colorClass}
            icon={card.icon}
            value={links[card.key]}
            onChange={(value) => setLinks((current) => ({ ...current, [card.key]: value }))}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard title="Posts (30d)" value={summary.posts30d} icon={<BarChart3 size={20} />} />
        <MetricCard title="Views (30d)" value={summary.views30d} icon={<Eye size={20} />} />
        <MetricCard title="Likes (30d)" value={summary.likes30d} icon={<Heart size={20} />} />
        <MetricCard title="Followers total" value={summary.followersTotal} icon={<Users size={20} />} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Desempenho últimos 14 dias</h2>
            <p className="text-sm text-slate-400">Fallback visual com mock data quando o endpoint analítico ainda não estiver disponível.</p>
          </div>
          {loading ? <span className="text-sm text-slate-500">Carregando...</span> : null}
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: 16,
                  color: '#e2e8f0'
                }}
              />
              <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="likes" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
