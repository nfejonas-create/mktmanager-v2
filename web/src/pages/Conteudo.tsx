import { useEffect, useMemo, useState } from 'react';
import { Calendar, Copy, FileUp, Image as ImageIcon, Sparkles, Trash2, Wand2 } from 'lucide-react';
import api from '../services/api';

type Platform = 'LINKEDIN' | 'FACEBOOK';
type Tone = 'Tecnico' | 'Curiosidade' | 'Autoridade' | 'Direto' | 'Inspiracional';
type TabKey = 'generate' | 'upload' | 'analyze' | 'history';
type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'PUBLISHING';

interface SocialAccount {
  id: string;
  platform: Platform;
  accountName: string;
  isDefault: boolean;
}

interface HistoryPost {
  id: string;
  content: string;
  status: PostStatus;
  contentType: 'TEXT' | 'IMAGE' | 'TEXT_IMAGE';
  scheduledAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  mediaUrls?: string[];
  socialAccount?: {
    id: string;
    platform: Platform;
    accountName: string;
  };
}

interface AnalyzeResponse {
  score: number;
  strengths: string[];
  improvements: string[];
  rewritten: string;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'generate', label: 'Gerar Post' },
  { key: 'upload', label: 'Upload de Material' },
  { key: 'analyze', label: 'Analisar Texto' },
  { key: 'history', label: 'Histórico' }
];

const tones: Array<{ value: Tone; label: string; description: string }> = [
  { value: 'Tecnico', label: 'Técnico', description: 'Preciso e detalhado' },
  { value: 'Curiosidade', label: 'Curiosidade', description: 'Provoca atenção' },
  { value: 'Autoridade', label: 'Autoridade', description: 'Posiciona como especialista' },
  { value: 'Direto', label: 'Direto', description: 'Objetivo e comercial' },
  { value: 'Inspiracional', label: 'Inspiracional', description: 'Motiva e engaja' }
];

const imageStyles = [
  { value: 'realista', label: 'Realista' },
  { value: 'ilustrativo', label: 'Ilustrativo' },
  { value: 'criativo', label: 'Criativo' },
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' }
];

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function statusBadge(status: PostStatus) {
  return {
    DRAFT: 'bg-slate-800 text-slate-300',
    SCHEDULED: 'bg-amber-500/15 text-amber-300',
    PUBLISHED: 'bg-emerald-500/15 text-emerald-300',
    FAILED: 'bg-red-500/15 text-red-300',
    PUBLISHING: 'bg-blue-500/15 text-blue-300'
  }[status];
}

function statusLabel(status: PostStatus) {
  return {
    DRAFT: 'Rascunho',
    SCHEDULED: 'Agendado',
    PUBLISHED: 'Publicado',
    FAILED: 'Falhou',
    PUBLISHING: 'Publicando'
  }[status];
}

function imagePromptFrom(content: string, platform: Platform, style: string) {
  return `Crie um prompt visual ${style} para ${platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}, baseado neste conteúdo: ${content}`;
}

export default function Conteudo() {
  const [activeTab, setActiveTab] = useState<TabKey>('generate');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [history, setHistory] = useState<HistoryPost[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [platform, setPlatform] = useState<Platform>('LINKEDIN');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('Tecnico');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [generatedCta, setGeneratedCta] = useState('');
  const [imageStyle, setImageStyle] = useState('realista');
  const [imagePrompt, setImagePrompt] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPlatform, setUploadPlatform] = useState<Platform>('LINKEDIN');
  const [uploadTone, setUploadTone] = useState<Tone>('Tecnico');
  const [uploadQuantity, setUploadQuantity] = useState(3);
  const [readyImport, setReadyImport] = useState('');

  const [analysisInput, setAnalysisInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);

  const [historyPlatform, setHistoryPlatform] = useState<'ALL' | Platform>('ALL');
  const [historyStatus, setHistoryStatus] = useState<'ALL' | PostStatus>('ALL');
  const [scheduleTarget, setScheduleTarget] = useState<HistoryPost | null>(null);
  const [scheduleValue, setScheduleValue] = useState('');

  useEffect(() => {
    void Promise.all([loadAccounts(), loadHistory()]);
  }, []);

  const connectedPlatforms = useMemo(
    () => Array.from(new Set(accounts.map((account) => account.platform))),
    [accounts]
  );

  const filteredHistory = useMemo(() => {
    return history.filter((post) => {
      const platformMatch = historyPlatform === 'ALL' || post.socialAccount?.platform === historyPlatform;
      const statusMatch = historyStatus === 'ALL' || post.status === historyStatus;
      return platformMatch && statusMatch;
    });
  }, [history, historyPlatform, historyStatus]);

  function pickAccountId(targetPlatform: Platform) {
    const samePlatform = accounts.filter((account) => account.platform === targetPlatform);
    return samePlatform.find((account) => account.isDefault)?.id || samePlatform[0]?.id || '';
  }

  async function loadAccounts() {
    try {
      const response = await api.get('/accounts');
      const nextAccounts = ensureArray<SocialAccount>(response.data);
      setAccounts(nextAccounts);
      if (nextAccounts.length > 0) {
        setPlatform(nextAccounts[0].platform);
        setUploadPlatform(nextAccounts[0].platform);
      }
    } catch {
      setAccounts([]);
    }
  }

  async function loadHistory() {
    try {
      const response = await api.get('/posts', { params: { limit: 100 } });
      setHistory(ensureArray<HistoryPost>(response.data));
    } catch {
      setHistory([]);
    }
  }

  async function handleGenerate() {
    setMessage('');

    try {
      const response = await api.post('/content/generate', {
        topic,
        theme: topic,
        platform,
        tone
      });

      const content = String(response.data.content || '');
      setGeneratedContent(content);
      setGeneratedCta(String(response.data.cta || ''));
      setGeneratedHashtags(ensureArray<string>(response.data.hashtags));
    } catch {
      setMessage('Erro ao gerar conteúdo.');
    }
  }

  async function saveDraft(content: string, targetPlatform: Platform) {
    const socialAccountId = pickAccountId(targetPlatform);

    if (!socialAccountId) {
      setMessage('Conecte uma conta da plataforma escolhida para salvar rascunhos.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/posts', {
        socialAccountId,
        content,
        contentType: 'TEXT',
        mediaUrls: []
      });
      setMessage('Rascunho salvo com sucesso.');
      await loadHistory();
    } catch {
      setMessage('Erro ao salvar rascunho.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadGenerate() {
    if (!selectedFile) {
      setMessage('Escolha um arquivo para analisar.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('platform', uploadPlatform);
    formData.append('quantity', String(uploadQuantity));
    formData.append('tone', uploadTone);

    try {
      const response = await api.upload('/content/upload-material', formData);
      const generatedPosts = ensureArray<{ content: string }>(response.data?.posts ?? response.data);
      for (const item of generatedPosts) {
        if (item.content) {
          await saveDraft(item.content, uploadPlatform);
        }
      }
      setMessage(`${generatedPosts.length} rascunhos gerados a partir do material.`);
    } catch {
      setMessage('Endpoint /api/content/upload-material ainda não está disponível no backend.');
    }
  }

  async function handleImportReadyPost() {
    if (!readyImport.trim()) return;
    await saveDraft(readyImport.trim(), uploadPlatform);
    setReadyImport('');
  }

  async function handleAnalyze() {
    try {
      const response = await api.post('/content/analyze', {
        text: analysisInput
      });
      setAnalysisResult(response.data);
    } catch {
      setMessage('Endpoint /api/content/analyze ainda não está disponível no backend.');
    }
  }

  async function handleDelete(postId: string) {
    try {
      await api.delete(`/posts/${postId}`);
      await loadHistory();
    } catch {
      setMessage('Erro ao excluir post.');
    }
  }

  async function handlePublish(post: HistoryPost) {
    if (post.status === 'DRAFT') {
      setScheduleTarget(post);
      return;
    }

    try {
      await api.post(`/posts/${post.id}/publish-now`);
      await loadHistory();
    } catch {
      setMessage('Erro ao publicar post.');
    }
  }

  async function confirmSchedule() {
    if (!scheduleTarget || !scheduleValue) return;

    try {
      await api.put(`/posts/${scheduleTarget.id}`, {
        scheduledAt: scheduleValue,
        status: 'SCHEDULED'
      });
      setScheduleTarget(null);
      setScheduleValue('');
      await loadHistory();
    } catch {
      setMessage('Erro ao agendar rascunho.');
    }
  }

  async function handleGenerateWeek() {
    try {
      await api.post('/content/generate-week');
      setMessage('Semana gerada com sucesso.');
      await loadHistory();
    } catch {
      setMessage('Endpoint /api/content/generate-week ainda não está disponível no backend.');
    }
  }

  async function handleScheduleBatch() {
    try {
      await api.post('/posts/schedule-batch', {
        dates: [],
        status: 'DRAFT'
      });
    } catch {
      setMessage('Endpoint /api/posts/schedule-batch ainda não está disponível no backend.');
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Conteúdo</h1>
        <p className="mt-2 text-sm text-slate-400">Mesma lógica funcional da v1, agora usando o backend JWT do v2.</p>
      </div>

      {message ? <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</div> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Plataforma</label>
                  <select
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value as Platform)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                  >
                    {connectedPlatforms.map((item) => (
                      <option key={item} value={item}>
                        {item === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Tema</label>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Ex: Como captar leads no LinkedIn"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm text-slate-400">Tom</label>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {tones.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTone(item.value)}
                      className={`rounded-2xl border p-4 text-left ${
                        tone === item.value ? 'border-blue-500 bg-blue-600/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleGenerate()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
              >
                <Sparkles size={16} />
                Gerar com IA
              </button>

              <div>
                <label className="mb-2 block text-sm text-slate-400">Preview editável</label>
                <textarea
                  value={generatedContent}
                  onChange={(event) => setGeneratedContent(event.target.value)}
                  rows={12}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                />
                {generatedCta ? <p className="mt-3 text-sm text-slate-300"><strong>CTA:</strong> {generatedCta}</p> : null}
                {generatedHashtags.length > 0 ? (
                  <p className="mt-2 text-sm text-slate-400">{generatedHashtags.join(' ')}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center gap-2 text-white">
                  <ImageIcon size={18} className="text-blue-400" />
                  <h2 className="font-semibold">Gerador de prompt de imagem</h2>
                </div>
                <div className="mt-4 space-y-4">
                  <select
                    value={imageStyle}
                    onChange={(event) => setImageStyle(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                  >
                    {imageStyles.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setImagePrompt(imagePromptFrom(generatedContent, platform, imageStyle))}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white hover:bg-slate-700"
                  >
                    <Wand2 size={16} />
                    Gerar prompt
                  </button>
                  <textarea
                    value={imagePrompt}
                    onChange={(event) => setImagePrompt(event.target.value)}
                    rows={8}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(imagePrompt)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    <Copy size={16} />
                    Copiar
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={saving || !generatedContent.trim()}
                onClick={() => void saveDraft(generatedContent, platform)}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Salvar rascunho
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'upload' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">Arquivo</label>
                <input
                  type="file"
                  accept=".pdf,.txt,image/*"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <select
                  value={uploadPlatform}
                  onChange={(event) => setUploadPlatform(event.target.value as Platform)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                >
                  {connectedPlatforms.map((item) => (
                    <option key={item} value={item}>
                      {item === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={uploadQuantity}
                  onChange={(event) => setUploadQuantity(Number(event.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                />
                <select
                  value={uploadTone}
                  onChange={(event) => setUploadTone(event.target.value as Tone)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                >
                  {tones.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => void handleUploadGenerate()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
              >
                <FileUp size={16} />
                Analisar e gerar
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="font-semibold text-white">Importar post pronto</h2>
              <textarea
                value={readyImport}
                onChange={(event) => setReadyImport(event.target.value)}
                rows={12}
                placeholder="Cole aqui um post pronto para virar rascunho."
                className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              />
              <button
                type="button"
                onClick={() => void handleImportReadyPost()}
                className="mt-4 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
              >
                Importar post pronto
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'analyze' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <textarea
                value={analysisInput}
                onChange={(event) => setAnalysisInput(event.target.value)}
                rows={16}
                placeholder="Cole o texto aqui para analisar."
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              />
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
              >
                Analisar
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Score</p>
                <p className="mt-3 text-5xl font-bold text-white">{analysisResult?.score ?? '-'}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h2 className="font-semibold text-white">Pontos fortes</h2>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {analysisResult?.strengths?.map((item) => <li key={item}>• {item}</li>) || <li>Sem análise ainda.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h2 className="font-semibold text-white">Melhorias</h2>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {analysisResult?.improvements?.map((item) => <li key={item}>• {item}</li>) || <li>Sem análise ainda.</li>}
                  </ul>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h2 className="font-semibold text-white">Versão reescrita</h2>
                <textarea
                  readOnly
                  value={analysisResult?.rewritten || ''}
                  rows={8}
                  className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!analysisResult?.rewritten) return;
                    setGeneratedContent(analysisResult.rewritten);
                    setActiveTab('generate');
                  }}
                  className="mt-4 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Usar esta versão
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'history' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Histórico</h2>
              <p className="text-sm text-slate-400">Rascunhos, agendados e publicados do usuário autenticado.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleGenerateWeek()}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Gerar semana
              </button>
              <button
                type="button"
                onClick={() => void handleScheduleBatch()}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Agendar rascunhos
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <select
              value={historyPlatform}
              onChange={(event) => setHistoryPlatform(event.target.value as 'ALL' | Platform)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            >
              <option value="ALL">Todas plataformas</option>
              {connectedPlatforms.map((item) => (
                <option key={item} value={item}>
                  {item === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
                </option>
              ))}
            </select>
            <select
              value={historyStatus}
              onChange={(event) => setHistoryStatus(event.target.value as 'ALL' | PostStatus)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            >
              <option value="ALL">Todos status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="SCHEDULED">Agendado</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="FAILED">Falhou</option>
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {filteredHistory.map((post) => (
              <div key={post.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                      {post.socialAccount?.platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs ${statusBadge(post.status)}`}>{statusLabel(post.status)}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {post.scheduledAt || post.publishedAt || post.updatedAt
                      ? new Date(post.scheduledAt || post.publishedAt || post.updatedAt || '').toLocaleString('pt-BR')
                      : 'Sem data'}
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm text-slate-200">{post.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(post.content)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    <Copy size={14} />
                    Copiar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePublish(post)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                  >
                    <Calendar size={14} />
                    Publicar-Agendar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(post.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {scheduleTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Agendar rascunho</h2>
            <input
              type="datetime-local"
              value={scheduleValue}
              onChange={(event) => setScheduleValue(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setScheduleTarget(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmSchedule()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
