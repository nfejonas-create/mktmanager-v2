import { useEffect, useMemo, useState } from 'react';
import cronstrue from 'cronstrue/i18n';
import { Facebook, Linkedin, Play, Save, Sparkles, User } from 'lucide-react';
import api from '../services/api';

type AIProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI';
type Platform = 'LINKEDIN' | 'FACEBOOK';

interface SocialAccount {
  id: string;
  platform: Platform;
  accountName: string;
  isActive?: boolean;
}

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
}

interface MeResponse {
  id: string;
  name: string;
  email: string;
}

const DEFAULT_AUTOMATION: AutomationConfig = {
  active: false,
  cronExpression: '0 9 * * *',
  timezone: 'America/Sao_Paulo',
  promptTemplate: '',
  aiProvider: 'ANTHROPIC',
  platforms: [],
  autoPublish: true
};

const CRON_PRESETS = [
  { label: 'Diário 09h', value: '0 9 * * *' },
  { label: 'Diário 18h', value: '0 18 * * *' },
  { label: '2x/dia 09h + 18h', value: '0 9,18 * * *' },
  { label: '3x/dia 09h + 13h + 18h', value: '0 9,13,18 * * *' },
  { label: 'Seg-Sex 09h', value: '0 9 * * 1-5' }
];

export default function Configuracoes() {
  const [profile, setProfile] = useState<MeResponse>({ id: '', name: '', email: '' });
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [automation, setAutomation] = useState<AutomationConfig>(DEFAULT_AUTOMATION);
  const [aiApiKey, setAiApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    void Promise.all([loadProfile(), loadAccounts(), loadAutomation()]);
  }, []);

  const linkedInAccount = useMemo(() => accounts.find((account) => account.platform === 'LINKEDIN'), [accounts]);
  const facebookAccount = useMemo(() => accounts.find((account) => account.platform === 'FACEBOOK'), [accounts]);

  const activePlatforms = useMemo(
    () => Array.from(new Set(accounts.filter((account) => account.isActive !== false).map((account) => account.platform))),
    [accounts]
  );

  const humanCron = useMemo(() => {
    try {
      return cronstrue.toString(automation.cronExpression, { locale: 'pt_BR' });
    } catch {
      return 'Cron inválido';
    }
  }, [automation.cronExpression]);

  async function loadProfile() {
    try {
      const response = await api.get('/auth/me');
      setProfile(response.data);
    } catch {
      setProfile({ id: '', name: '', email: '' });
    }
  }

  async function loadAccounts() {
    try {
      const response = await api.get('/accounts');
      setAccounts(Array.isArray(response.data) ? response.data : []);
    } catch {
      setAccounts([]);
    }
  }

  async function loadAutomation() {
    try {
      const response = await api.get('/automation');
      if (response.data) {
        setAutomation(response.data);
      }
    } catch {
      setAutomation(DEFAULT_AUTOMATION);
    }
  }

  async function saveProfile() {
    try {
      await api.put('/auth/me', { name: profile.name });
      setMessage('Perfil salvo com sucesso.');
    } catch {
      setMessage('Perfil salvo localmente no frontend; backend ainda precisa expor PUT /api/auth/me.');
    }
  }

  async function connect(provider: 'linkedin' | 'facebook') {
    try {
      const response = await api.post(`/accounts/${provider}/auth`);
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch {
      setMessage(`Erro ao iniciar OAuth de ${provider}.`);
    }
  }

  async function disconnect(accountId: string) {
    try {
      await api.delete(`/accounts/${accountId}`);
      await loadAccounts();
    } catch {
      setMessage('Erro ao desconectar conta.');
    }
  }

  async function saveAutomation() {
    try {
      const response = await api.put('/automation', {
        ...automation,
        aiApiKey: aiApiKey.trim()
      });
      setAutomation(response.data);
      setAiApiKey('');
      setMessage('Automação salva com sucesso.');
    } catch {
      setMessage('Erro ao salvar automação.');
    }
  }

  async function testAutomation() {
    try {
      const response = await api.post('/automation/test');
      setPreview(response.data.previewText || '');
      setMessage('Prévia gerada com sucesso.');
    } catch {
      setMessage('Erro ao testar automação.');
    }
  }

  function togglePlatform(platform: Platform) {
    setAutomation((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform]
    }));
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="mt-2 text-sm text-slate-400">Perfil, contas sociais e automação isolados por usuário.</p>
      </div>

      {message ? <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</div> : null}

      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 text-white">
            <User size={18} className="text-blue-400" />
            <h2 className="font-semibold">Perfil</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            />
            <input
              value={profile.email}
              readOnly
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={() => void saveProfile()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-2 text-white">
              <Linkedin size={18} className="text-blue-400" />
              <h2 className="font-semibold">Conta LinkedIn</h2>
            </div>
            {linkedInAccount ? (
              <div className="mt-5">
                <p className="text-sm text-slate-300">{linkedInAccount.accountName}</p>
                <button
                  type="button"
                  onClick={() => void disconnect(linkedInAccount.id)}
                  className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void connect('linkedin')}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
              >
                Conectar LinkedIn
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-2 text-white">
              <Facebook size={18} className="text-blue-400" />
              <h2 className="font-semibold">Página Facebook</h2>
            </div>
            {facebookAccount ? (
              <div className="mt-5">
                <p className="text-sm text-slate-300">{facebookAccount.accountName}</p>
                <button
                  type="button"
                  onClick={() => void disconnect(facebookAccount.id)}
                  className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void connect('facebook')}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
              >
                Conectar Facebook
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-blue-400" />
            <h2 className="font-semibold">Automação (IA)</h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
              <span>Ativo</span>
              <input
                type="checkbox"
                checked={automation.active}
                onChange={(event) => setAutomation((current) => ({ ...current, active: event.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
              <span>Auto publicar</span>
              <input
                type="checkbox"
                checked={automation.autoPublish}
                onChange={(event) => setAutomation((current) => ({ ...current, autoPublish: event.target.checked }))}
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select
              value=""
              onChange={(event) => {
                const preset = CRON_PRESETS.find((item) => item.value === event.target.value);
                if (preset) {
                  setAutomation((current) => ({ ...current, cronExpression: preset.value }));
                }
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            >
              <option value="">Selecione um preset</option>
              {CRON_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
            <input
              value={automation.cronExpression}
              onChange={(event) => setAutomation((current) => ({ ...current, cronExpression: event.target.value }))}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            />
          </div>

          <p className="mt-2 text-sm text-slate-500">{humanCron}</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select
              value={automation.aiProvider}
              onChange={(event) => setAutomation((current) => ({ ...current, aiProvider: event.target.value as AIProvider }))}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            >
              <option value="OPENAI">OPENAI</option>
              <option value="ANTHROPIC">ANTHROPIC</option>
              <option value="GEMINI">GEMINI</option>
            </select>
            <input
              type="password"
              value={aiApiKey}
              onChange={(event) => setAiApiKey(event.target.value)}
              placeholder={automation.maskedAiApiKey || 'Digite a API key'}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            />
          </div>

          <textarea
            value={automation.promptTemplate}
            onChange={(event) => setAutomation((current) => ({ ...current, promptTemplate: event.target.value }))}
            rows={8}
            placeholder="Instruções personalizadas para a IA"
            className="mt-5 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <div className="mt-5 flex flex-wrap gap-3">
            {activePlatforms.length === 0 ? (
              <span className="text-sm text-slate-500">Conecte uma conta ativa para liberar plataformas.</span>
            ) : (
              activePlatforms.map((platform) => (
                <label key={platform} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={automation.platforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                  />
                  {platform === 'LINKEDIN' ? 'LinkedIn' : 'Facebook'}
                </label>
              ))
            )}
          </div>

          {preview ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
              <p className="mb-2 font-medium text-white">Prévia</p>
              <pre className="whitespace-pre-wrap">{preview}</pre>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => void testAutomation()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <Play size={16} />
              Testar geração agora
            </button>
            <button
              type="button"
              onClick={() => void saveAutomation()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Save size={16} />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
