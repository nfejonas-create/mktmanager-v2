import { useEffect, useMemo, useState } from 'react';
import cronstrue from 'cronstrue/i18n';
import { Loader2, Save, Shield, Sparkles, Play } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type AIProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI';
type Platform = 'LINKEDIN' | 'FACEBOOK';

interface AutomationConfig {
  active: boolean;
  cronExpression: string;
  timezone: string;
  promptTemplate: string;
  aiProvider: AIProvider;
  hasAiApiKey?: boolean;
  maskedAiApiKey?: string;
  platforms: Platform[];
  autoPublish: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

interface SocialAccount {
  id: string;
  platform: Platform;
  isActive?: boolean;
}

const CRON_PRESETS = [
  { label: 'Diariamente 09h', cronExpression: '0 9 * * *' },
  { label: 'Diariamente 18h', cronExpression: '0 18 * * *' },
  { label: '2x por dia (09h e 18h)', cronExpression: '0 9,18 * * *' },
  { label: '3x por dia (09h, 12h e 18h)', cronExpression: '0 9,12,18 * * *' },
  { label: 'Seg-Sex 09h', cronExpression: '0 9 * * 1-5' }
];

const DEFAULT_CONFIG: AutomationConfig = {
  active: false,
  cronExpression: '0 9 * * *',
  timezone: 'America/Sao_Paulo',
  promptTemplate: '',
  aiProvider: 'ANTHROPIC',
  platforms: [],
  autoPublish: true
};

function toErrorMessage(error: unknown, fallback: string) {
  return typeof error === 'object' && error !== null && 'response' in error
    ? ((error as any).response?.data?.error as string | undefined) || fallback
    : fallback;
}

export default function Configuracoes() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [aiApiKey, setAiApiKey] = useState('');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    void Promise.all([fetchConfig(), fetchAccounts()]);
  }, []);

  async function fetchConfig() {
    try {
      const response = await api.get('/automation');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Error fetching automation config:', error);
    }
  }

  async function fetchAccounts() {
    try {
      const response = await api.get('/accounts');
      const allAccounts = Array.isArray(response.data) ? response.data : [];
      setAccounts(allAccounts.filter((account: SocialAccount) => account.isActive !== false));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    }
  }

  const availablePlatforms = useMemo<Platform[]>(() => {
    return Array.from(new Set(accounts.map((account) => account.platform))) as Platform[];
  }, [accounts]);

  const humanCron = useMemo(() => {
    try {
      return cronstrue.toString(config.cronExpression, { locale: 'pt_BR' });
    } catch {
      return 'Cron inválido';
    }
  }, [config.cronExpression]);

  function togglePlatform(platform: Platform) {
    setConfig((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((value) => value !== platform)
        : [...current.platforms, platform]
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const response = await api.put('/automation', {
        ...config,
        aiApiKey: aiApiKey.trim()
      });
      setConfig(response.data);
      setAiApiKey('');
      setMessage('Automação salva com sucesso.');
    } catch (error) {
      setMessage(toErrorMessage(error, 'Erro ao salvar automação.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage('');

    try {
      const response = await api.post('/automation/test');
      setPreviewText(response.data.previewText || '');
      setMessage('Prévia gerada com sucesso.');
    } catch (error) {
      setMessage(toErrorMessage(error, 'Erro ao testar automação.'));
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-slate-400">Gerencie suas preferências, segurança e automação isolada por usuário.</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Perfil ativo</h2>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-white font-medium">{user?.name || 'Usuário atual'}</p>
              <p className="text-slate-400 text-sm">{user?.email || 'Sem email'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Segurança e preferências</h2>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <p>Seu acesso usa email, senha e token JWT.</p>
            <p>As contas sociais, os posts e a automação ficam isolados por usuário.</p>
            <p>As chaves da IA ficam criptografadas no backend com AES-256-GCM.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Automação</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3 text-sm text-slate-200">
              <span>Automação ativa</span>
              <input
                type="checkbox"
                checked={config.active}
                onChange={(event) => setConfig((current) => ({ ...current, active: event.target.checked }))}
              />
            </label>

            <label className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3 text-sm text-slate-200">
              <span>Publicar automaticamente</span>
              <input
                type="checkbox"
                checked={config.autoPublish}
                onChange={(event) => setConfig((current) => ({ ...current, autoPublish: event.target.checked }))}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Preset de agenda</label>
              <select
                value=""
                onChange={(event) => {
                  const selected = CRON_PRESETS.find((preset) => preset.cronExpression === event.target.value);
                  if (selected) {
                    setConfig((current) => ({ ...current, cronExpression: selected.cronExpression }));
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
              >
                <option value="">Escolher preset...</option>
                {CRON_PRESETS.map((preset) => (
                  <option key={preset.cronExpression} value={preset.cronExpression}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Expressão cron</label>
              <input
                value={config.cronExpression}
                onChange={(event) => setConfig((current) => ({ ...current, cronExpression: event.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
              />
              <p className="text-xs text-slate-500 mt-2">{humanCron}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
              <input
                value={config.timezone}
                onChange={(event) => setConfig((current) => ({ ...current, timezone: event.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Provedor de IA</label>
              <select
                value={config.aiProvider}
                onChange={(event) => setConfig((current) => ({ ...current, aiProvider: event.target.value as AIProvider }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
              >
                <option value="OPENAI">OpenAI</option>
                <option value="ANTHROPIC">Anthropic</option>
                <option value="GEMINI">Gemini</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">API key da IA</label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(event) => setAiApiKey(event.target.value)}
              placeholder={config.maskedAiApiKey || 'Cole a chave da IA'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
            />
            {config.hasAiApiKey && !aiApiKey && (
              <p className="text-xs text-slate-500 mt-2">Chave atual salva: {config.maskedAiApiKey}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prompt template</label>
            <textarea
              value={config.promptTemplate}
              onChange={(event) => setConfig((current) => ({ ...current, promptTemplate: event.target.value }))}
              rows={8}
              placeholder="Escreva um post para {{publico}} sobre {{assunto}} no tom {{tom}}"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Plataformas</label>
            <div className="flex flex-wrap gap-3">
              {availablePlatforms.length === 0 ? (
                <p className="text-sm text-slate-500">Conecte uma conta ativa em Contas para habilitar automação por plataforma.</p>
              ) : (
                availablePlatforms.map((platform) => (
                  <label key={platform} className="flex items-center gap-2 rounded-xl bg-slate-800/70 px-4 py-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={config.platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                    />
                    {platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
                  </label>
                ))
              )}
            </div>
          </div>

          {(config.lastRunAt || config.nextRunAt) && (
            <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-300">
              <div className="rounded-xl bg-slate-800/70 px-4 py-3">
                <p className="text-slate-500 mb-1">Última execução</p>
                <p>{config.lastRunAt ? new Date(config.lastRunAt).toLocaleString('pt-BR') : 'Nunca'}</p>
              </div>
              <div className="rounded-xl bg-slate-800/70 px-4 py-3">
                <p className="text-slate-500 mb-1">Próxima execução</p>
                <p>{config.nextRunAt ? new Date(config.nextRunAt).toLocaleString('pt-BR') : 'Não agendada'}</p>
              </div>
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          )}

          {previewText && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-4">
              <p className="text-sm font-medium text-violet-200 mb-2">Prévia da geração</p>
              <pre className="whitespace-pre-wrap text-sm text-slate-100">{previewText}</pre>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={testing}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Testar geração agora
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
