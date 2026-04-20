import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  History,
  Image as ImageIcon,
  Link2,
  MessageSquareQuote,
  Sparkles,
  Wand2
} from 'lucide-react';
import api from '../services/api';

type TabKey = 'generate' | 'upload' | 'analyze' | 'history';

interface SocialAccount {
  id: string;
  platform: 'LINKEDIN' | 'FACEBOOK';
  accountName: string;
  accountType: string;
  isDefault: boolean;
}

interface SavedPost {
  id: string;
  content: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  contentType: 'TEXT' | 'IMAGE' | 'TEXT_IMAGE';
  scheduledAt: string | null;
  createdAt?: string;
  socialAccount: {
    platform: 'LINKEDIN' | 'FACEBOOK';
    accountName: string;
  };
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

const tabs: Array<{ key: TabKey; label: string; icon: typeof Wand2 }> = [
  { key: 'generate', label: 'Gerar Post', icon: Wand2 },
  { key: 'upload', label: 'Upload de Material', icon: ImageIcon },
  { key: 'analyze', label: 'Analisar Texto', icon: MessageSquareQuote },
  { key: 'history', label: 'Histórico', icon: History }
];

const toneOptions = [
  { value: 'Tecnico', label: 'Técnico', description: 'Preciso e detalhado' },
  { value: 'Curiosidade', label: 'Curiosidade', description: 'Provoca reflexão' },
  { value: 'Autoridade', label: 'Autoridade', description: 'Posiciona como especialista' },
  { value: 'Direto', label: 'Direto', description: 'Objetivo e prático' },
  { value: 'Inspiracional', label: 'Inspiracional', description: 'Motiva e engaja' }
];

const contentTypes = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'IMAGE', label: 'Imagem' },
  { value: 'TEXT_IMAGE', label: 'Texto + Imagem' }
] as const;

function getStatusLabel(status: SavedPost['status']) {
  return {
    DRAFT: 'Rascunho',
    SCHEDULED: 'Agendado',
    PUBLISHING: 'Publicando',
    PUBLISHED: 'Publicado',
    FAILED: 'Falhou'
  }[status];
}

function getStatusClass(status: SavedPost['status']) {
  return {
    DRAFT: 'bg-slate-800 text-slate-300',
    SCHEDULED: 'bg-amber-500/15 text-amber-300',
    PUBLISHING: 'bg-blue-500/15 text-blue-300',
    PUBLISHED: 'bg-emerald-500/15 text-emerald-300',
    FAILED: 'bg-red-500/15 text-red-300'
  }[status];
}

export default function Conteudo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('generate');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [socialAccountId, setSocialAccountId] = useState('');
  const [generatePlatform, setGeneratePlatform] = useState<'LINKEDIN' | 'FACEBOOK'>('LINKEDIN');
  const [contentType, setContentType] = useState<'TEXT' | 'IMAGE' | 'TEXT_IMAGE'>('TEXT');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Tecnico');
  const [content, setContent] = useState('');
  const [visualStyle, setVisualStyle] = useState<'single' | 'carousel'>('single');
  const [imageStyle, setImageStyle] = useState('Profissional');
  const [imagePrompt, setImagePrompt] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [publishNow, setPublishNow] = useState(false);

  useEffect(() => {
    void fetchAccounts();
    void fetchPosts();
  }, []);

  async function fetchAccounts() {
    try {
      const response = await api.get('/accounts');
      const fetchedAccounts = ensureArray<SocialAccount>(response.data);
      setAccounts(fetchedAccounts);

      const defaultAccount = fetchedAccounts.find((account) => account.isDefault) || fetchedAccounts[0];
      if (defaultAccount) {
        setSocialAccountId(defaultAccount.id);
        setGeneratePlatform(defaultAccount.platform);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }

  async function fetchPosts() {
    setLoadingHistory(true);
    try {
      const response = await api.get('/posts', { params: { limit: 12 } });
      setPosts(ensureArray<SavedPost>(response.data));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleGenerateContent() {
    if (!topic) return;

    setGenerating(true);
    try {
      const response = await api.post('/content/generate', {
        topic,
        platform: generatePlatform,
        tone
      });

      const nextContent = response.data.content || '';
      const hashtags = response.data.hashtags?.length ? `\n\n${response.data.hashtags.join(' ')}` : '';
      setContent(`${nextContent}${hashtags}`.trim());
      setImagePrompt(buildImagePrompt(`${nextContent}${hashtags}`.trim(), visualStyle, imageStyle));
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Erro ao gerar conteúdo. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!socialAccountId || !content.trim()) {
      alert('Preencha a conta social e o conteúdo do post.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/posts', {
        socialAccountId,
        content,
        contentType,
        mediaUrls: [],
        scheduledAt: scheduledAt || undefined,
        publishNow
      });

      await fetchPosts();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erro ao criar post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function publishPostNow(postId: string) {
    setPublishingId(postId);
    try {
      await api.post(`/posts/${postId}/publish-now`);
      await fetchPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Erro ao enviar post para publicação.');
    } finally {
      setPublishingId(null);
    }
  }

  function buildImagePrompt(baseContent: string, mode: 'single' | 'carousel', style: string) {
    const normalized = baseContent.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    if (mode === 'carousel') {
      return `Crie um carrossel para LinkedIn/Facebook no estilo ${style}. Slide 1 com gancho forte, slides 2 a 5 com desenvolvimento em tópicos claros, último slide com CTA. Base do conteúdo: ${normalized}`;
    }

    return `Crie uma imagem social no estilo ${style}, com visual profissional e editorial, baseada neste conteúdo: ${normalized}`;
  }

  function refreshImagePrompt() {
    setImagePrompt(buildImagePrompt(content, visualStyle, imageStyle));
  }

  async function copyImagePrompt() {
    if (!imagePrompt) return;
    await navigator.clipboard.writeText(imagePrompt);
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Conteúdo</h1>
        <p className="text-slate-400">Fluxo principal de geração, rascunho e agendamento, agora com múltiplas contas.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors ${
              activeTab === key
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Configurar Post</h2>
              <p className="text-sm text-slate-400">Experiência inspirada na v1, preservando o motor novo do v2.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Conta social para salvar/publicar</label>
                <select
                  value={socialAccountId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSocialAccountId(nextId);
                    const nextAccount = accounts.find((account) => account.id === nextId);
                    if (nextAccount) {
                      setGeneratePlatform(nextAccount.platform);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'} • {account.accountName}
                      {account.isDefault ? ' (Padrão)' : ''}
                    </option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p className="mt-2 text-sm text-amber-300">
                    Nenhuma conta conectada. Você ainda pode gerar conteúdo por plataforma e conectar a conta depois em <Link to="/contas" className="underline">Contas</Link>.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de conteúdo</label>
                <div className="grid grid-cols-3 gap-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setContentType(type.value)}
                      className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                        contentType === type.value
                          ? 'border-blue-500 bg-blue-600/15 text-blue-300'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Plataforma para gerar</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'LINKEDIN', label: 'LinkedIn' },
                  { value: 'FACEBOOK', label: 'Facebook' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setGeneratePlatform(item.value as 'LINKEDIN' | 'FACEBOOK')}
                    className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                      generatePlatform === item.value
                        ? 'border-blue-500 bg-blue-600/15 text-blue-300'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Essa escolha define a formatação da geração. Não depende da conta estar conectada.
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Tema do post</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Como usar LinkedIn para atrair clientes"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-3">Tom da postagem</label>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {toneOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTone(item.value)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      tone === item.value
                        ? 'border-blue-500 bg-blue-600/15'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-400" />
                    Gerar com IA
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Gera no formato correto de {generatePlatform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}, mesmo sem conta conectada.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={!topic || generating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Wand2 size={16} />
                  {generating ? 'Gerando...' : 'Gerar Post'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Conteúdo</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="O texto gerado ou escrito manualmente aparece aqui."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
                    <ImageIcon size={16} className="text-purple-400" />
                    Gerador de imagem e carrossel
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Usa o conteúdo gerado para montar o prompt visual.</p>
                </div>
                <button
                  type="button"
                  onClick={refreshImagePrompt}
                  disabled={!content.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  <ImageIcon size={16} />
                  Gerar prompt visual
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Formato visual</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'single', label: 'Imagem única' },
                      { value: 'carousel', label: 'Carrossel' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setVisualStyle(item.value as 'single' | 'carousel')}
                        className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                          visualStyle === item.value
                            ? 'border-purple-500 bg-purple-600/15 text-purple-300'
                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Estilo</label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Profissional">Profissional</option>
                    <option value="Minimalista">Minimalista</option>
                    <option value="Impacto">Impacto</option>
                    <option value="Editorial">Editorial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Prompt gerado</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={4}
                  placeholder="O prompt da imagem ou do carrossel aparece aqui."
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void copyImagePrompt()}
                    disabled={!imagePrompt}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Copy size={15} />
                    Copiar prompt
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Agendar para</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={publishNow}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <label className="inline-flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => {
                    setPublishNow(e.target.checked);
                    if (e.target.checked) {
                      setScheduledAt('');
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                Publicar agora
              </label>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !socialAccountId || !content.trim()}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : publishNow ? 'Publicar Agora' : scheduledAt ? 'Agendar Post' : 'Salvar Rascunho'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CheckCircle2 size={18} className="text-emerald-400" />
                Checklist rápido
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                  Gere primeiro por plataforma. Só selecione conta quando quiser salvar/publicar.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                  Gere o texto com IA e ajuste manualmente antes de publicar.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                  Use agendamento quando quiser validar o scheduler sem depender de ação manual.
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Link2 size={18} className="text-blue-400" />
                Situação visual
              </div>
              <p className="text-sm text-slate-400">
                Esta tela já segue a estrutura da v1: tema escuro, abas, bloco de configuração e cards de tom.
              </p>
              <p className="text-sm text-slate-400">
                Upload de material, análise de texto e refinamentos gráficos ainda entram na próxima rodada.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
          <h2 className="text-xl font-semibold text-white">Upload de Material</h2>
          <p className="text-slate-400">
            A casca da v1 já foi preservada aqui, mas o fluxo avançado de upload ainda não foi religado no v2.
          </p>
          <p className="text-sm text-amber-300">
            Próximo passo: portar o fluxo operacional da v1 sem puxar a bagunça estrutural antiga.
          </p>
        </div>
      )}

      {activeTab === 'analyze' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
          <h2 className="text-xl font-semibold text-white">Analisar Texto</h2>
          <p className="text-slate-400">
            O visual da v1 foi mantido, mas a análise avançada ainda está pendente de religação no motor do v2.
          </p>
          <p className="text-sm text-amber-300">
            Nesta rodada eu foquei em geração, histórico e agendamento, que são os pontos mais críticos.
          </p>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Histórico</h2>
              <p className="text-sm text-slate-400">Rascunhos, agendados e publicados recentes.</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchPosts()}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Atualizar
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {loadingHistory ? (
              <div className="px-6 py-8 text-slate-400">Carregando histórico...</div>
            ) : posts.length === 0 ? (
              <div className="px-6 py-8 text-slate-400">Nenhum post salvo ainda.</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="px-6 py-5 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(post.status)}`}>
                        {getStatusLabel(post.status)}
                      </span>
                      <span className="text-sm text-slate-400">
                        {post.socialAccount.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'} • {post.socialAccount.accountName}
                      </span>
                    </div>

                    {post.status !== 'PUBLISHED' && (
                      <button
                        type="button"
                        onClick={() => void publishPostNow(post.id)}
                        disabled={publishingId === post.id}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {publishingId === post.id ? 'Enviando...' : 'Publicar agora'}
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-4">{post.content}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <FileText size={13} />
                      {post.contentType}
                    </span>
                    {post.scheduledAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(post.scheduledAt).toLocaleString('pt-BR')}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={13} />
                      {post.createdAt ? new Date(post.createdAt).toLocaleString('pt-BR') : 'Recente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
