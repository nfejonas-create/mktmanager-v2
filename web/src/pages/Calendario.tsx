import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock3, Send } from 'lucide-react';
import api from '../api/api';

type Post = {
  id: string;
  content: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  contentType: 'TEXT' | 'IMAGE' | 'TEXT_IMAGE';
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  socialAccount?: {
    platform: 'LINKEDIN' | 'FACEBOOK';
    accountName: string;
  };
};

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Calendario() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const response = await api.get('/posts', { params: { limit: 100 } });
      const data = ensureArray<Post>(response.data);
      const sorted = [...data].sort((a, b) => {
        const order = (post: Post) => (post.status === 'SCHEDULED' ? 0 : post.status === 'PUBLISHED' ? 1 : 2);
        if (order(a) !== order(b)) return order(a) - order(b);

        if (a.status === 'SCHEDULED') {
          return new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime();
        }

        if (a.status === 'PUBLISHED') {
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        }

        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setPosts(sorted);
    } catch (error) {
      console.error('Error loading calendar posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const platform = post.socialAccount?.platform?.toLowerCase() || '';
      const platformMatches = filterPlatform === 'all' || platform === filterPlatform;
      const statusMatches = filterStatus === 'all' || post.status.toLowerCase() === filterStatus;
      return platformMatches && statusMatches;
    });
  }, [posts, filterPlatform, filterStatus]);

  const scheduled = filtered.filter((post) => post.status === 'SCHEDULED');
  const published = filtered.filter((post) => post.status === 'PUBLISHED');
  const drafts = filtered.filter((post) => post.status === 'DRAFT');

  function PostCard({ post }: { post: Post }) {
    const isOpen = !!expanded[post.id];
    const platform = post.socialAccount?.platform === 'LINKEDIN' ? '💼 LinkedIn' : '📘 Facebook';

    return (
      <div
        className={`rounded-xl border p-4 space-y-2 ${
          post.status === 'PUBLISHED'
            ? 'border-emerald-800 bg-emerald-900/10'
            : post.status === 'SCHEDULED'
            ? 'border-amber-700 bg-amber-900/10'
            : 'border-slate-700 bg-slate-800'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              post.socialAccount?.platform === 'LINKEDIN' ? 'bg-blue-900 text-blue-300' : 'bg-indigo-900 text-indigo-300'
            }`}
          >
            {platform}
          </span>
          <span
            className={`text-xs flex items-center gap-1 font-medium ${
              post.status === 'PUBLISHED'
                ? 'text-emerald-400'
                : post.status === 'SCHEDULED'
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            {post.status === 'PUBLISHED' ? (
              <>
                <Send size={10} /> Publicado
              </>
            ) : post.status === 'SCHEDULED' ? (
              <>
                <Clock3 size={10} /> Agendado
              </>
            ) : (
              'Rascunho'
            )}
          </span>
        </div>

        {post.status === 'SCHEDULED' && post.scheduledAt && (
          <p className="text-amber-300 text-xs font-semibold flex items-center gap-1">
            <Clock3 size={11} /> {formatDateTime(post.scheduledAt)}
          </p>
        )}

        {post.status === 'PUBLISHED' && post.publishedAt && (
          <p className="text-emerald-300 text-xs font-semibold flex items-center gap-1">
            <Send size={11} /> {formatDateTime(post.publishedAt)}
          </p>
        )}

        <div className={`transition-all ${isOpen ? 'max-h-96 overflow-y-auto' : 'max-h-20 overflow-hidden'}`}>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{post.content}</p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => ({ ...prev, [post.id]: !isOpen }))}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          {isOpen ? (
            <>
              <ChevronUp size={12} /> Recolher
            </>
          ) : (
            <>
              <ChevronDown size={12} /> Ver completo
            </>
          )}
        </button>
      </div>
    );
  }

  function Section({ title, items, color }: { title: string; items: Post[]; color: string }) {
    if (items.length === 0) return null;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className={`font-semibold mb-4 flex items-center gap-2 ${color}`}>
          <Calendar size={16} /> {title}
          <span className="ml-auto text-xs text-slate-500 font-normal">{items.length} posts</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendário</h1>
          <p className="text-slate-400 text-sm">Agendados: mais próximo primeiro • Publicados: mais recente primeiro</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">Todas plataformas</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">Todos status</option>
            <option value="scheduled">Agendados</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <Calendar size={40} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-500">Nenhum post encontrado.</p>
        </div>
      ) : (
        <>
          <Section title="Agendados — do mais próximo ao mais distante" items={scheduled} color="text-amber-400" />
          <Section title="Publicados — do mais recente ao mais antigo" items={published} color="text-emerald-400" />
          <Section title="Rascunhos" items={drafts} color="text-slate-400" />
        </>
      )}
    </div>
  );
}
