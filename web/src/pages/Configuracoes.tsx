import { useState } from 'react';
import { Plus, Save, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Configuracoes() {
  const { user, users, addUser } = useAuth();
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleAddUser() {
    const result = addUser({ name: newUserName, email: newUserEmail });

    if (!result.success) {
      setMessage(result.message || 'Erro ao adicionar usuário.');
      return;
    }

    setMessage('Usuário adicionado com sucesso.');
    setNewUserName('');
    setNewUserEmail('');
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-slate-400">Gerencie o usuário atual e prepare o sistema para crescer com mais contas.</p>
      </div>

      <div className="max-w-3xl space-y-6">
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

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Usuários do sistema</h2>
          </div>

          <div className="space-y-3">
            {users.map((systemUser) => (
              <div key={systemUser.id} className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                <div>
                  <p className="text-white font-medium">{systemUser.name}</p>
                  <p className="text-sm text-slate-400">{systemUser.email}</p>
                </div>
                <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">{systemUser.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Adicionar novo usuário</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Ex: Maria Souza"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="maria@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {message && (
            <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleAddUser}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              <Plus size={16} />
              Adicionar usuário
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Direção do v2</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Clone visual e funcional da v1 com a menor diferença possível.</li>
            <li>Multiusuário e multicontas no backend e no contexto do app.</li>
            <li>Fluxo único de conteúdo com texto, imagem e carrossel.</li>
          </ul>
          <div className="flex justify-end mt-4">
            <button className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-xl transition-colors">
              <Save size={16} />
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
