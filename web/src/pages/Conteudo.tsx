import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Copy, Pencil, Sparkles, XCircle } from 'lucide-react';
import api from '../services/api';

type Platform = 'LINKEDIN' | 'FACEBOOK';
type TabKey = 'generate' | 'pending' | 'approved' | 'published';
type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'PUBLISHING';
type Tone = 'Tecnico' | 'Curiosidade' | 'Autoridade' | 'Direto' | 'Inspiracional';

interface SocialAccount {
  id: string;
  platform: Platform;
  accountName: string;
  isDefault?: boolean;
  isActive?: boolean;
}

interface PostItem {
  id: string;
  content: string;
  status: PostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  socialAccount?: {
    id: string;
    platform: Platform;
    accountName: string;
  };
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'generate', label: 'Gerar' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'published', label: 'Publicados' }
];

const TONES: Tone[] = ['Tecnico', 'Curiosidade', 'Autoridade', 'Direto', 'Inspiracional'];

function buildDraftContent(payload: { content?: string; cta?: string; hashtags?: string[] }) {
  const chunks = [
    String(payload.content || '').trim(),
    String(payload.cta || '').trim(),
    Array.isArray(payload.hashtags) ? payload.hashtags.join(' ') : ''
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  return chunks.join('\n\n');
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sem data';
  }

  return new Date(value).toLocaleString('pt-BR');
}

function summarize(text: string) {
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

export default function Conteudo() {
  const [activeTab, setActiveTab] = useState<TabKey>('generate');
  const [platform, setPlatform] = useState<Platform>('LINKEDIN');
  const [topic, setTopic] = useState('');
  const [quantity, setQuantity] = useState(3);
  const [tone, setTone] = useState<Tone>('Tecnico');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [scheduleTarget, setScheduleTarget] = useState<PostItem | null>(null);
  const [scheduleValue, setScheduleValue] = useState('');

  useEffect(() => {
    void Promise.all([loadAccounts(), loadPosts()]);
  }, []);

  const accountOptions = useMemo(
    () => accounts.filter((account) => account.isActive !== false),
    [accounts]
  );

  const pendingPosts = useMemo(
    () => posts.filter((post) => post.status === 'DRAFT'),
    [posts]
  );

  const approvedPosts = useMemo(
    () => posts.filter((post) => post.status === 'SCHEDULED' || post.status === 'PUBLISHING'),
    [posts]
  );

  const publishedPosts = useMemo(
    () => posts.filter((post) => post.status === 'PUBLISHED'),
    [posts]
  );

  function pickAccountId(targetPlatform: Platform) {
    const available = accountOptions.filter((account) => account.platform === targetPlatform);
    return available.find((account) => account.isDefault)?.id || available[0]?.id || '';
  }

  async function loadAccounts() {
    try {
      const response = await api.get('/accounts');
      const nextAccounts = Array.isArray(response.data) ? response.data : [];
      setAccounts(nextAccounts);

      const nextPlatform =
        nextAccounts.find((account: SocialAccount) => account.platform === 'LINKEDIN' && account.isActive !== false)?.platform ||
        nextAccounts.find((account: SocialAccount) => account.isActive !== false)?.platform ||
        'LINKEDIN';

      setPlatform(nextPlatform);
    } catch {
      setAccounts([]);
    }
  }

  async function loadPosts() {
    try {
      const response = await api.get('/posts', { params: { limit: 100 } });
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPosts([]);
    }
  }

  async function createDraft(content: string, targetPlatform: Platform) {
    const socialAccountId = pickAccountId(targetPlatform);

    if (!socialAccountId) {
      throw new Error(`Conecte uma conta ${targetPlatform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'} em Configurações antes de salvar rascunhos.`);
    }

    await api.post('/posts', {
      socialAccountId,
      content,
      contentType: 'TEXT',
      mediaUrls: []
    });
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setMessage('Informe o tópico/contexto antes de gerar.');
      return;
    }

    setGenerating(true);
    setMessage('');

    try {
      for (let index = 0; index < quantity; index += 1) {
        const response = await api.post('/content/generate', {
          platform,
          topic: topic.trim(),
          theme: topic.trim(),
          tone
        });

        const draftContent = buildDraftContent(response.data || {});
        if (draftContent) {
          await createDraft(draftContent, platform);
        }
      }

      await loadPosts();
      setActiveTab('pending');
      setMessage(`${quantity} posts gerados com IA e enviados para Pendentes.`);
    } catch (error) {
      console.error('Erro ao gerar posts:', error);
      setMessage(error instanceof Error ? error.message : 'Erro ao gerar posts.');
    } finally {
      setGenerating(false);
    }
  }

  async function deletePost(postId: string) {
    try {
      await api.delete(`/posts/${postId}`);
      await loadPosts();
      setMessage('Post removido.');
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      setMessage('Erro ao excluir post.');
    }
  }

  async function approvePost(post: PostItem) {
    const oneHourAhead = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await api.put(`/posts/${post.id}`, {
        content: post.content,
        contentType: 'TEXT',
        mediaUrls: [],
        scheduledAt: oneHourAhead.toISOString()
      });
      await loadPosts();
      setMessage('Post aprovado e movido para Aprovados.');
    } catch (error) {
      console.error('Erro ao aprovar post:', error);
      setMessage('Erro ao aprovar post.');
    }
  }

  async function saveEdit() {
    if (!editingPost) {
      return;
    }

    try {
      await api.put(`/posts/${editingPost.id}`, {
        content: editingContent,
        contentType: 'TEXT',
        mediaUrls: [],
        scheduledAt: editingPost.scheduledAt || undefined
      });
      setEditingPost(null);
      setEditingContent('');
      await loadPosts();
      setMessage('Post atualizado.');
    } catch (error) {
      console.error('Erro ao editar post:', error);
      setMessage('Erro ao editar post.');
    }
  }

  async function schedulePost() {
    if (!scheduleTarget || !scheduleValue) {
      return;
    }

    try {
      await api.put(`/posts/${scheduleTarget.id}`, {
        content: scheduleTarget.content,
        contentType: 'TEXT',
        mediaUrls: [],
        scheduledAt: scheduleValue
      });
      setScheduleTarget(null);
      setScheduleValue('');
      await loadPosts();
      setMessage('Post agendado com sucesso.');
    } catch (error) {
      console.error('Erro ao agendar post:', error);
      setMessage('Erro ao agendar post.');
    }
  }

  async function publishNow(postId: string) {
    try {
      await api.post(`/posts/${postId}/publish-now`);
      await loadPosts();
      setMessage('Post enviado para publicação.');
    } catch (error) {
      console.error('Erro ao publicar post:', error);
      setMessage('Erro ao publicar post.');
    }
  }

  function renderPostList(items: PostItem[], mode: 'pending' | 'approved' | 'published') {
    if (items.length === 0) {
      return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">Nenhum post nesta aba ainda.</div>;
    }

    return (
      <div className="space-y-4">
        {items.map((post) => (
          <div key={post.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {post.socialAccount?.platform === 'FACEBOOK' ? 'Facebook' : 'LinkedIn'}
                </span>
                <span className="text-xs text-slate-500">
                  {mode === 'published' ? formatDate(post.publishedAt) : formatDate(post.scheduledAt || post.updatedAt)}
                </span>
              </div>
              {post.socialAccount?.accountName ? <span className="text-xs text-slate-500">{post.socialAccount.accountName}</span> : null}
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-200">{summarize(post.content)}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(post.content)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                <Copy size={14} />
                Copiar
              </button>

              {mode === 'pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => void approvePost(post)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
                  >
                    <CheckCircle2 size={14} />
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(post);
                      setEditingContent(post.content);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleTarget(post);
                      setScheduleValue(post.scheduledAt ? post.scheduledAt.slice(0, 16) : '');
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/30 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                  >
                    <CalendarClock size={14} />
                    Agendar
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePost(post.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    <XCircle size={14} />
                    Rejeitar
                  </button>
                </>
              ) : null}

              {mode === 'approved' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(post);
                      setEditingContent(post.content);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleTarget(post);
                      setScheduleValue(post.scheduledAt ? post.scheduledAt.slice(0, 16) : '');
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/30 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                  >
                    <CalendarClock size={14} />
                    Agendar
                  </button>
                  <button
                    type="button"
                    onClick={() => void publishNow(post.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                  >
                    <Sparkles size={14} />
                    Publicar agora
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Conteúdo</h1>
        <p className="mt-2 text-sm text-slate-400">Fluxo platform-first com geração, pendência, aprovação e publicação.</p>
      </div>

      {message ? <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</div> : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-3">
              {(['LINKEDIN', 'FACEBOOK'] as Platform[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPlatform(item)}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    platform === item ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
                </button>
              ))}
            </div>

            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              rows={4}
              placeholder="Tópico/Contexto"
              className="w-full rounded-3xl border border-slate-700 bg-slate-800 px-4 py-4 text-white"
            />

            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              />
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value as Tone)}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              >
                {TONES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
              >
                <Sparkles size={16} />
                {generating ? 'Gerando...' : 'Gerar com IA'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'pending' ? renderPostList(pendingPosts, 'pending') : null}
      {activeTab === 'approved' ? renderPostList(approvedPosts, 'approved') : null}
      {activeTab === 'published' ? renderPostList(publishedPosts, 'published') : null}

      {editingPost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Editar post</h2>
            <textarea
              value={editingContent}
              onChange={(event) => setEditingContent(event.target.value)}
              rows={12}
              className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-800 px-4 py-4 text-white"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingPost(null);
                  setEditingContent('');
                }}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Salvar edição
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {scheduleTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Agendar post</h2>
            <input
              type="datetime-local"
              value={scheduleValue}
              onChange={(event) => setScheduleValue(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setScheduleTarget(null);
                  setScheduleValue('');
                }}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void schedulePost()}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Confirmar agendamento
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
