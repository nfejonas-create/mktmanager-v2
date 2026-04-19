import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus,
  Calendar,
  MessageSquare,
  Heart,
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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/posts/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'SCHEDULED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Rascunho',
      'SCHEDULED': 'Agendado',
      'PUBLISHING': 'Publicando',
      'PUBLISHED': 'Publicado',
      'FAILED': 'Falhou'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...⏳</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Publicados</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalPublished || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Agendados</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalScheduled || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Falharam</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalFailed || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Posts Recentes</h2>
          <Link
            to="/conteudo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Post
          </Link>
        </div>

        <div className="divide-y divide-gray-200">
          {stats?.recentPosts?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Nenhum post encontrado. Crie seu primeiro post!
            </div>
          ) : (
            stats?.recentPosts?.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(post.status)}
                      <span className="text-sm font-medium text-gray-900">
                        {getStatusText(post.status)}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">
                        {post.socialAccount.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'} • {post.socialAccount.accountName}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {post.content}
                    </p>
                    
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      {post.scheduledAt && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(post.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                      
                      {post.status === 'PUBLISHED' && (
                        <>
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {post.likes}
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {post.comments}
                          </span>
                          <span className="flex items-center">
                            <Share2 className="w-4 h-4 mr-1" />
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
