import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Facebook, Linkedin, Save, Trash2 } from 'lucide-react';
import api from '../services/api';

type Platform = 'LINKEDIN' | 'FACEBOOK';
type AIProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI';

interface SocialAccount {
  id: string;
  platform: Platform;
  accountName: string;
  externalId: string;
  isActive?: boolean;
}

interface AutomationConfig {
  id: string;
  active: boolean;
  cronExpression: string;
  timezone: string;
  promptTemplate: string;
  aiProvider: AIProvider;
  platforms: Platform[];
  autoPublish: boolean;
  hasAiApiKey?: boolean;
  maskedAiApiKey?: string;
}

const EMPTY_LINKEDIN_FORM = {
  accessToken: '',
  externalId: '',
  displayName: ''
};

const EMPTY_FACEBOOK_FORM = {
  accessToken: '',
  externalId: '',
  displayName: ''
};

export default function Configuracoes() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [automation, setAutomation] = useState<AutomationConfig | null>(null);
  const [savedPrompt, setSavedPrompt] = useState('');
  const [instructionsDraft, setInstructionsDraft] = useState('');
  const [linkedinForm, setLinkedinForm] = useState(EMPTY_LINKEDIN_FORM);
  const [facebookForm, setFacebookForm] = useState(EMPTY_FACEBOOK_FORM);
  const [message, setMessage] = useState('');
  const [savingLinkedIn, setSavingLinkedIn] = useState(false);
  const [savingFacebook, setSavingFacebook] = useState(false);
  const [savingInstructions, setSavingInstructions] = useState(false);

  useEffect(() => {
    void Promise.all([loadAccounts(), loadAutomation()]);
  }, []);

  const linkedInAccount = useMemo(
    () => accounts.find((account) => account.platform === 'LINKEDIN' && account.isActive !== false) || null,
    [accounts]
  );

  const facebookAccount = useMemo(
    () => accounts.find((account) => account.platform === 'FACEBOOK' && account.isActive !== false) || null,
    [accounts]
  );

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
      const nextAutomation = response.data || null;
      setAutomation(nextAutomation);
      setSavedPrompt(nextAutomation?.promptTemplate || '');
      setInstructionsDraft('');
    } catch {
      setAutomation(null);
      setSavedPrompt('');
    }
  }

  async function saveManualAccount(platform: 'linkedin' | 'facebook') {
    const form = platform === 'linkedin' ? linkedinForm : facebookForm;
    const setSaving = platform === 'linkedin' ? setSavingLinkedIn : setSavingFacebook;
    const resetForm = platform === 'linkedin' ? () => setLinkedinForm(EMPTY_LINKEDIN_FORM) : () => setFacebookForm(EMPTY_FACEBOOK_FORM);

    if (!form.accessToken.trim() || !form.externalId.trim() || !form.displayName.trim()) {
      setMessage('Preencha token, ID e nome antes de salvar.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await api.put('/accounts/manual', {
        platform,
        accessToken: form.accessToken.trim(),
        externalId: form.externalId.trim(),
        displayName: form.displayName.trim()
      });

      resetForm();
      await loadAccounts();
      setMessage(`${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} salvo com sucesso.`);
    } catch (error) {
      console.error(`Erro ao salvar ${platform}:`, error);
      setMessage(`Erro ao salvar ${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}.`);
    } finally {
      setSaving(false);
    }
  }

  async function disconnectAccount(accountId: string) {
    try {
      await api.delete(`/accounts/${accountId}`);
      await loadAccounts();
      setMessage('Conta desconectada com sucesso.');
    } catch (error) {
      console.error('Erro ao desconectar conta:', error);
      setMessage('Erro ao desconectar conta.');
    }
  }

  async function replaceInstructions() {
    const nextPrompt = instructionsDraft.trim();

    if (!nextPrompt) {
      setMessage('Cole novas instruções antes de substituir.');
      return;
    }

    if (!automation) {
      setMessage('Configure a automação primeiro para salvar instruções.');
      return;
    }

    setSavingInstructions(true);
    setMessage('');

    try {
      await api.put('/automation', {
        active: automation.active,
        cronExpression: automation.cronExpression,
        timezone: automation.timezone,
        promptTemplate: nextPrompt,
        aiProvider: automation.aiProvider,
        platforms: automation.platforms,
        autoPublish: automation.autoPublish,
        aiApiKey: ''
      });

      await loadAutomation();
      setMessage('Instruções substituídas com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar instruções:', error);
      setMessage('Erro ao substituir instruções.');
    } finally {
      setSavingInstructions(false);
    }
  }

  function renderConnectedCard(account: SocialAccount | null, label: string, icon: ReactNode) {
    if (!account) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">{icon}</div>
            <div>
              <p className="text-sm font-medium text-emerald-200">✓ Conectado como {account.accountName}</p>
              <p className="text-xs text-emerald-100/70">{label}: {account.externalId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void disconnectAccount(account.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            <Trash2 size={14} />
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="mt-2 text-sm text-slate-400">Conexão manual das contas sociais e instruções da IA por usuário.</p>
      </div>

      {message ? <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</div> : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/15 p-3 text-blue-300">
            <Linkedin size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Conectar LinkedIn</h2>
            <p className="text-sm text-slate-400">Salve o token manualmente para publicar e puxar métricas reais.</p>
          </div>
        </div>

        {renderConnectedCard(linkedInAccount, 'Member ID', <Linkedin size={16} />)}

        <div className="mt-5 grid gap-4">
          <input
            type="password"
            value={linkedinForm.accessToken}
            onChange={(event) => setLinkedinForm((current) => ({ ...current, accessToken: event.target.value }))}
            placeholder="Access Token"
            className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
          <input
            value={linkedinForm.externalId}
            onChange={(event) => setLinkedinForm((current) => ({ ...current, externalId: event.target.value }))}
            placeholder="Member ID (numérico, ex: 123456789)"
            className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
          <input
            value={linkedinForm.displayName}
            onChange={(event) => setLinkedinForm((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="Nome para exibição"
            className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
        </div>

        <button
          type="button"
          onClick={() => void saveManualAccount('linkedin')}
          disabled={savingLinkedIn}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          <Save size={16} />
          {savingLinkedIn ? 'Salvando...' : 'Salvar LinkedIn'}
        </button>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/15 p-3 text-blue-300">
            <Facebook size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Conectar Facebook</h2>
            <p className="text-sm text-slate-400">Use o Page Access Token e o Page ID que pertencem à página correta.</p>
          </div>
        </div>

        {renderConnectedCard(facebookAccount, 'Page ID', <Facebook size={16} />)}

        <div className="mt-5 grid gap-4">
          <input
            type="password"
            value={facebookForm.accessToken}
            onChange={(event) => setFacebookForm((current) => ({ ...current, accessToken: event.target.value }))}
            placeholder="Page Access Token"
            className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
          <input
            value={facebookForm.externalId}
            onChange={(event) => setFacebookForm((current) => ({ ...current, externalId: event.target.value }))}
            placeholder="Page ID"
            className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
          <input
            value={facebookForm.displayName}
            onChange={(event) => setFacebookForm((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="Nome da Página"
            className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
        </div>

        <button
          type="button"
          onClick={() => void saveManualAccount('facebook')}
          disabled={savingFacebook}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          <Save size={16} />
          {savingFacebook ? 'Salvando...' : 'Salvar Facebook'}
        </button>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">Instruções para a IA Geradora</h2>
          <p className="mt-1 text-sm text-slate-400">Substitua o prompt salvo sem mexer em auth, JWT ou criptografia.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Instruções salvas:</label>
          <div className="min-h-[180px] rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-sm leading-6 text-slate-300">
            {savedPrompt || 'Nenhuma instrução salva ainda.'}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">Novas instruções</label>
          <textarea
            value={instructionsDraft}
            onChange={(event) => setInstructionsDraft(event.target.value)}
            rows={8}
            placeholder="Cole novas instruções aqui..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
        </div>

        <button
          type="button"
          onClick={() => void replaceInstructions()}
          disabled={savingInstructions}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          <Save size={16} />
          {savingInstructions ? 'Salvando...' : 'Substituir Instruções'}
        </button>
      </section>
    </div>
  );
}
