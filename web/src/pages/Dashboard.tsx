import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  Heart,
  MessageSquare,
  Plus,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../api/api';

interface Post {
  id: string;
  content: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  contentType: 'TEXT' | 'IMAGE' | 'TEXT_IMAGE';
  scheduledAt: string | null;
  publishedAt: string | null;
  likes: number;
  comments: number;
  shares: number;
  socialAccount: {
    platform: string;
    accountName: string;
  };
}

interface DashboardStats {
  totalPublished: number;
  totalScheduled: number;
  totalFailed: number;
  recentPosts: Post[];
}

function StatCard({
  label,
  value,
  icon,
  tone
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'green' | 'amber' | 'red';
}) {
  const tones = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    red: 'bg-red-500/15 text-red-300 border-red-500/20'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getStatusClasses(status: Post['status']) {
  return {
    DRAFT: 'bg-slate-800 text-slate-300',
    SCHEDULED: 'bg-amber-500/15 text-amber-300',
    PUBLISHING: 'bg-blue-500/15 text-blue-300',
    PUBLISHED: 'bg-emerald-500/15 text-emerald-300',
    FAILED: 'bg-red-500/15 text-red-300'
  }[status];
}

function getStatusText(status: Post['status']) {
  return {
    DRAFT: 'Rascunho',
    SCHEDULED: 'Agendado',
    PUBLISHING: 'Publicando',
    PUBLISHED: 'Publicado',
    FAILED: 'Falhou'
  }[status];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await api.get('/posts/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Visão geral de publicação, agendamento e falhas do motor novo.</p>
        </div>

        <Link
          to="/conteudo"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus size={16} />
          Novo Post
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Publicados"
          value={stats?.totalPublished || 0}
          icon={<CheckCircle2 className="w-6 h-6" />}
          tone="green"
        />
        <StatCard
          label="Agendados"
          value={stats?.totalScheduled || 0}
          icon={<Clock3 className="w-6 h-6" />}
          tone="amber"
        />
        <StatCard
          label="Falharam"
          value={stats?.totalFailed || 0}
          icon={<AlertCircle className="w-6 h-6" />}
          tone="red"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Posts Recentes</h2>
        </div>

        <div className="divide-y divide-slate-800">
          {stats?.recentPosts?.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">
              Nenhum post encontrado. Crie seu primeiro post.
            </div>
          ) : (
            stats?.recentPosts?.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="block px-6 py-5 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(post.status)}`}>
                        {getStatusText(post.status)}
                      </span>
                      <span className="text-sm text-slate-400">
                        {post.socialAccount.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'} • {post.socialAccount.accountName}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 line-clamp-3 whitespace-pre-wrap">{post.content}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {post.scheduledAt && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(post.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}

                      {post.status === 'PUBLISHED' && (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.likes}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.comments}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Share2 className="w-4 h-4" />
                            {post.shares}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
