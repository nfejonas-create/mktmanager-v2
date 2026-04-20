import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

type Platform = 'LINKEDIN' | 'FACEBOOK';
type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'PUBLISHING';

interface CalendarPost {
  id: string;
  content: string;
  status: PostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  mediaUrls?: string[];
  socialAccount?: {
    platform: Platform;
    accountName: string;
  };
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function sortPosts(posts: CalendarPost[], kind: 'scheduled' | 'published' | 'draft') {
  const copy = [...posts];

  if (kind === 'scheduled') {
    return copy.sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime());
  }

  if (kind === 'published') {
    return copy.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  }

  return copy.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

function Card({
  post,
  expanded,
  onToggle
}: {
  post: CalendarPost;
  expanded: boolean;
  onToggle: () => void;
}) {
  const dateValue = post.status === 'SCHEDULED' ? post.scheduledAt : post.status === 'PUBLISHED' ? post.publishedAt : post.updatedAt;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
            {post.socialAccount?.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
          </span>
          <span className="text-xs text-slate-500">{dateValue ? new Date(dateValue).toLocaleString('pt-BR') : 'Sem data'}</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Recolher' : 'Expandir'}
        </button>
      </div>

      <p className="mt-4 text-sm text-slate-200">
        {expanded ? post.content : `${post.content.slice(0, 80)}${post.content.length > 80 ? '...' : ''}`}
      </p>

      {expanded && post.mediaUrls?.length ? (
        <div className="mt-4 space-y-2">
          {post.mediaUrls.map((url) => (
            <div key={url} className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300">
              <ImageIcon size={14} />
              {url}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AccordionSection({
  title,
  posts,
  open,
  onToggle,
  expandedCards,
  onToggleCard
}: {
  title: string;
  posts: CalendarPost[];
  open: boolean;
  onToggle: () => void;
  expandedCards: Record<string, boolean>;
  onToggleCard: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{posts.length} posts</p>
        </div>
        {open ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
      </button>

      {open ? (
        <div className="space-y-4 border-t border-slate-800 px-6 py-5">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-500">Nenhum post nesta seção.</div>
          ) : (
            posts.map((post) => (
              <Card
                key={post.id}
                post={post}
                expanded={!!expandedCards[post.id]}
                onToggle={() => onToggleCard(post.id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function Calendario() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [platform, setPlatform] = useState<'ALL' | Platform>('ALL');
  const [status, setStatus] = useState<'ALL' | PostStatus>('ALL');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    scheduled: true,
    published: true,
    draft: true
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const response = await api.get('/posts', { params: { limit: 120 } });
      setPosts(ensureArray<CalendarPost>(response.data));
    } catch {
      setPosts([]);
    }
  }

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const platformMatch = platform === 'ALL' || post.socialAccount?.platform === platform;
      const statusMatch = status === 'ALL' || post.status === status;
      return platformMatch && statusMatch;
    });
  }, [platform, posts, status]);

  const scheduled = useMemo(() => sortPosts(filtered.filter((post) => post.status === 'SCHEDULED'), 'scheduled'), [filtered]);
  const published = useMemo(() => sortPosts(filtered.filter((post) => post.status === 'PUBLISHED'), 'published'), [filtered]);
  const drafts = useMemo(() => sortPosts(filtered.filter((post) => post.status === 'DRAFT'), 'draft'), [filtered]);

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendário</h1>
          <p className="mt-2 text-sm text-slate-400">Acompanhe agendados, publicados e rascunhos em seções separadas.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value as 'ALL' | Platform)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white"
          >
            <option value="ALL">Todas plataformas</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | PostStatus)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white"
          >
            <option value="ALL">Todos status</option>
            <option value="SCHEDULED">Agendados</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Rascunhos</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-400" />
          O calendário usa os posts reais do usuário logado e preserva a ordenação da v1.
        </div>
      </div>

      <div className="space-y-4">
        <AccordionSection
          title="Agendados"
          posts={scheduled}
          open={openSections.scheduled}
          onToggle={() => setOpenSections((current) => ({ ...current, scheduled: !current.scheduled }))}
          expandedCards={expandedCards}
          onToggleCard={(id) => setExpandedCards((current) => ({ ...current, [id]: !current[id] }))}
        />
        <AccordionSection
          title="Publicados"
          posts={published}
          open={openSections.published}
          onToggle={() => setOpenSections((current) => ({ ...current, published: !current.published }))}
          expandedCards={expandedCards}
          onToggleCard={(id) => setExpandedCards((current) => ({ ...current, [id]: !current[id] }))}
        />
        <AccordionSection
          title="Rascunhos"
          posts={drafts}
          open={openSections.draft}
          onToggle={() => setOpenSections((current) => ({ ...current, draft: !current.draft }))}
          expandedCards={expandedCards}
          onToggleCard={(id) => setExpandedCards((current) => ({ ...current, [id]: !current[id] }))}
        />
      </div>
    </div>
  );
}
