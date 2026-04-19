import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, ExternalLink, Heart, MessageSquare, Share2 } from 'lucide-react';
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
  externalId: string | null;
  externalUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  socialAccount: {
    id: string;
    platform: string;
    accountName: string;
  };
}

export default function PostDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    if (!id) return;
    
    setRefreshing(true);
    try {
      await api.get(`/analytics/posts/${id}/metrics`);
      fetchPost();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePublishNow = async () => {
    if (!id) return;
    
    try {
      await api.post(`/posts/${id}/publish-now`);
      fetchPost();
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Erro ao publicar post.');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Erro ao excluir post.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'SCHEDULED':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'FAILED':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
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

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SCHEDULED': 'bg-yellow-100 text-yellow-800',
      'PUBLISHING': 'bg-blue-100 text-blue-800',
      'PUBLISHED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...⏳</div>;
  }

  if (!post) {
    return <div className="text-center py-8 text-red-600">Post não encontrado</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Dashboard
      </Link>

      {/* Post Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(post.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
                {getStatusText(post.status)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {post.status === 'DRAFT' && (
                <button
                  onClick={handlePublishNow}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Publicar Agora
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Account Info */}
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">{post.socialAccount.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}</span>
            <span className="mx-2">•</span>
            <span>{post.socialAccount.accountName}</span>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Conteúdo</h3>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* Media */}
          {post.mediaUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Mídia</h3>
              <div className="flex space-x-2">
                {post.mediaUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Criado em:</span>
              <br />
              {format(new Date(post.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
            
            {post.scheduledAt && (
              <div>
                <span className="text-gray-500">Agendado para:</span>
                <br />
                {format(new Date(post.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            )}
            
            {post.publishedAt && (
              <div>
                <span className="text-gray-500">Publicado em:</span>
                <br />
                {format(new Date(post.publishedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            )}
          </div>

          {/* External Link */}
          {post.externalUrl && (
            <a
              href={post.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              Ver no {post.socialAccount.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
        </div>
      </div>

      {/* Metrics Card */}
      {post.status === 'PUBLISHED' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Métricas</h3>
            <button
              onClick={refreshMetrics}
              disabled={refreshing}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{post.likes}</p>
                <p className="text-sm text-gray-500">Curtidas</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{post.comments}</p>
                <p className="text-sm text-gray-500">Comentários</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Share2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{post.shares}</p>
                <p className="text-sm text-gray-500">Compartilhamentos</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}