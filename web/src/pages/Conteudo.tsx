import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Image, Wand2, Calendar } from 'lucide-react';
import api from '../api/api';

interface SocialAccount {
  id: string;
  platform: 'LINKEDIN' | 'FACEBOOK';
  accountName: string;
  accountType: string;
  isDefault: boolean;
}

export default function Conteudo() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Form state
  const [socialAccountId, setSocialAccountId] = useState('');
  const [contentType, setContentType] = useState<'TEXT' | 'IMAGE' | 'TEXT_IMAGE'>('TEXT');
  const [content, setContent] = useState('');
  const [mediaUrls] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [publishNow, setPublishNow] = useState(false);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
      // Set default account if available
      const defaultAccount = response.data.find((a: SocialAccount) => a.isDefault);
      if (defaultAccount) {
        setSocialAccountId(defaultAccount.id);
      } else if (response.data.length > 0) {
        setSocialAccountId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleGenerateContent = async () => {
    if (!topic) return;
    
    setGenerating(true);
    try {
      const account = accounts.find(a => a.id === socialAccountId);
      const response = await api.post('/content/generate', {
        topic,
        platform: account?.platform || 'LINKEDIN'
      });
      
      setContent(response.data.content);
      if (response.data.hashtags?.length > 0) {
        setContent(prev => `${prev}\n\n${response.data.hashtags.join(' ')}`);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Erro ao gerar conteúdo. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socialAccountId || !content) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/posts', {
        socialAccountId,
        content,
        contentType,
        mediaUrls,
        scheduledAt: scheduledAt || undefined,
        publishNow
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erro ao criar post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Criar Novo Post</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conta Social *
            </label>
            <select
              value={socialAccountId}
              onChange={(e) => setSocialAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione uma conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.platform === 'LINKEDIN' ? '🔗 LinkedIn' : '👤 Facebook'} - {account.accountName}
                  {account.isDefault && ' (Padrão)'}
                </option>
              ))}
            </select>
            {accounts.length === 0 && (
              <p className="mt-2 text-sm text-yellow-600">
                Nenhuma conta conectada. <a href="/accounts" className="underline">Conecte uma conta</a> primeiro.
              </p>
            )}
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Conteúdo
            </label>
            <div className="flex space-x-4">
              {[
                { value: 'TEXT', label: 'Texto', icon: Send },
                { value: 'IMAGE', label: 'Imagem', icon: Image },
                { value: 'TEXT_IMAGE', label: 'Texto + Imagem', icon: Image }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setContentType(type.value as any)}
                  className={`flex items-center px-4 py-2 rounded-md border ${
                    contentType === type.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <type.icon className="w-4 h-4 mr-2" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Content Generation */}
          <div className="bg-gray-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Wand2 className="w-4 h-4 inline mr-1" />
              Gerar com IA
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Digite um tema para gerar conteúdo..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleGenerateContent}
                disabled={!topic || generating}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {generating ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o conteúdo do seu post..."
              required
            />
          </div>

          {/* Scheduling */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="publishNow"
                checked={publishNow}
                onChange={(e) => {
                  setPublishNow(e.target.checked);
                  if (e.target.checked) {
                    setScheduledAt('');
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="publishNow" className="ml-2 text-sm text-gray-700">
                Publicar agora
              </label>
            </div>
          </div>

          {!publishNow && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Agendar para
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !socialAccountId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : publishNow ? 'Publicar Agora' : scheduledAt ? 'Agendar' : 'Salvar Rascunho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}